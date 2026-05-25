import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { reserveGenerationQuota } from "@/lib/usage";
import { createAuditLog } from "@/lib/audit";
import { getLeadDiscoveryQueue } from "@/workers/queues";

const leadRowSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  title: z.string().optional(),
  companyName: z.string().min(1),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

const importSchema = z.object({
  organizationId: z.string().uuid(),
  listName: z.string().min(2).max(100),
  listDescription: z.string().max(500).optional(),
  leads: z.array(leadRowSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, listName, listDescription, leads } = parsed.data;

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Atomically reserve quota (same serializable-transaction guard as /generate)
  const { allowed, remaining, limit } = await reserveGenerationQuota(organizationId, leads.length);
  if (!allowed) {
    return NextResponse.json(
      { error: "Generation limit reached", limit, remaining: 0 },
      { status: 402 }
    );
  }

  // Claude is managed centrally by Flowfiy — no per-org key check needed

  // Require business profile (needed for ICP analysis + qualification)
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
      totalLeads: leads.length,
    },
  });

  // Bulk-create lead records from CSV data
  await prisma.lead.createMany({
    data: leads.map((row) => ({
      leadListId: leadList.id,
      organizationId,
      firstName: row.firstName || null,
      lastName: row.lastName || null,
      email: row.email || null,
      title: row.title || null,
      companyName: row.companyName,
      companyWebsite: row.companyWebsite || null,
      companySize: row.companySize || null,
      industry: row.industry || null,
      linkedinUrl: row.linkedinUrl || null,
      source: "csv",
      status: "RESEARCHING", // pipeline expects RESEARCHING — qualification skips other statuses
    })),
  });

  // Enqueue to Architecture 3 pipeline in import mode (skips discovery, fans out research jobs)
  await getLeadDiscoveryQueue().add(
    "lead-discovery",
    {
      organizationId,
      leadListId: leadList.id,
      leadsPerRun: leads.length,
      mode: "import",
    },
    { jobId: leadList.id }
  );

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "lead_list.import_started",
    resourceType: "lead_list",
    resourceId: leadList.id,
    metadata: { listName, leadCount: leads.length },
  });

  return NextResponse.json({ leadList, remaining: remaining - leads.length }, { status: 201 });
}
