import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getWallet } from "@/lib/credits/service";
import { getLeadFounderEnrichmentQueue } from "@/workers/queues";
import { FOUNDER_CREDITS_PER_LEAD } from "@/lib/credits/rates";
import { isFounderEnrichmentEligible } from "@/lib/founder-enrichment";
import { founderEnrichmentEnabled } from "@/integrations/linkedin-founder";
import { appendLog } from "@/lib/job-logs";

const schema = z.object({
  organizationId: z.string().uuid(),
  // Omit to enrich every eligible lead in the list (bulk); pass IDs for a subset.
  leadIds: z.array(z.string().uuid()).max(1000).optional(),
});

// POST /api/leads/[listId]/enrich-founders
// Buys founder emails for the eligible leads. The client MUST show the credit
// quote and get user confirmation before calling this. We gate on balance ≥
// worst-case cost, then enqueue one on-demand job per lead; each job charges
// FOUNDER_CREDITS_PER_LEAD credits only if it actually finds a founder email.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  const { organizationId, leadIds } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!founderEnrichmentEnabled()) {
    return NextResponse.json({ error: "unavailable", message: "Founder enrichment is currently unavailable." }, { status: 503 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      leadListId: listId,
      organizationId,
      ...(leadIds && leadIds.length ? { id: { in: leadIds } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      companyName: true,
      research: { select: { researchMetadata: true } },
    },
  });

  const eligible = leads.filter(isFounderEnrichmentEligible);
  if (eligible.length === 0) {
    return NextResponse.json(
      { error: "none_eligible", message: "No leads need a founder email (already enriched, or already have a decision-maker contact)." },
      { status: 422 }
    );
  }

  const creditsPerLead = FOUNDER_CREDITS_PER_LEAD;
  const maxCredits = eligible.length * creditsPerLead;
  const wallet = await getWallet(organizationId);
  if (wallet.balance < maxCredits) {
    return NextResponse.json(
      {
        error: "insufficient_credits",
        message: `Enriching ${eligible.length} ${eligible.length === 1 ? "lead" : "leads"} needs up to ${maxCredits} credits, but you have ${wallet.balance}. Top up to continue.`,
        needed: maxCredits,
        balance: wallet.balance,
      },
      { status: 402 }
    );
  }

  // Enqueue one on-demand job per eligible lead. Stable jobId dedupes a lead that
  // already has a job in flight; the credit price is locked into the job here so a
  // later rate change can't re-price an in-flight batch.
  const queue = getLeadFounderEnrichmentQueue();
  await Promise.all(
    eligible.map((l) =>
      queue.add(
        "lead-founder-enrichment",
        { organizationId, leadListId: listId, leadId: l.id, creditsPerLead },
        { jobId: `ondemand-founder-${l.id}` }
      )
    )
  );

  await appendLog(
    listId,
    `🔎 Finding founder emails for ${eligible.length} ${eligible.length === 1 ? "company" : "companies"} (up to ${maxCredits} credits, charged only for founders found)…`,
    "tool"
  ).catch(() => null);

  return NextResponse.json({
    enqueued: eligible.length,
    creditsPerLead,
    maxCredits,
    skipped: leads.length - eligible.length,
  });
}
