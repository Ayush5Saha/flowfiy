import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { reserveGenerationQuota } from "@/lib/usage";
import { generationRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getLeadDiscoveryQueue } from "@/workers/queues";

const schema = z.object({
  organizationId: z.string().uuid(),
  listName: z.string().min(2).max(100),
  listDescription: z.string().max(500).optional(),
  leadsPerRun: z.number().min(5).max(50).default(25),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 5 generation triggers per minute per user
  const { success } = await generationRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait before generating again." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, listName, listDescription, leadsPerRun } = parsed.data;

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Atomically reserve quota — prevents race condition where concurrent requests
  // all pass a read-only check before any increment runs.
  const { allowed, remaining, limit } = await reserveGenerationQuota(organizationId, leadsPerRun);
  if (!allowed) {
    return NextResponse.json(
      { error: "Generation limit reached", limit, remaining: 0 },
      { status: 402 }
    );
  }

  // Verify required integrations — need Apollo OR Apify for lead discovery.
  // Apollo gives richer data and is preferred. Apify uses the leads-finder actor which also provides validated emails.
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      type: { in: ["APOLLO", "APIFY"] },
      status: "CONNECTED",
    },
  });

  const connected = new Set(integrations.map((i) => i.type));
  const hasApollo = connected.has("APOLLO");
  const hasApify = connected.has("APIFY");

  if (!hasApollo && !hasApify) {
    return NextResponse.json(
      {
        error:
          "No lead source connected. Connect Apollo (recommended) or Apify (free alternative with validated emails) in the Integrations page to generate leads.",
        missingIntegration: true,
      },
      { status: 422 }
    );
  }

  // Verify business profile
  const profile = await prisma.businessProfile.findUnique({ where: { organizationId } });
  if (!profile) {
    return NextResponse.json({ error: "Business profile not configured" }, { status: 422 });
  }

  // Create lead list
  const leadList = await prisma.leadList.create({
    data: {
      organizationId,
      name: listName,
      description: listDescription,
      status: "QUEUED",
      jobStatus: "queued",
    },
  });

  // Enqueue to Architecture 3 pipeline (lead-discovery → research → qualification → personalization)
  await getLeadDiscoveryQueue().add(
    "lead-discovery",
    {
      organizationId,
      leadListId: leadList.id,
      leadsPerRun,
      mode: hasApollo ? "apollo" : "apify",
    },
    { jobId: leadList.id }
  );

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "lead_list.generation_started",
    resourceType: "lead_list",
    resourceId: leadList.id,
    metadata: { listName, leadsPerRun },
  });

  return NextResponse.json({ leadList, remaining: remaining - leadsPerRun }, { status: 201 });
}
