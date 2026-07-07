import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getWallet } from "@/lib/credits/service";
import { FOUNDER_CREDITS_PER_LEAD } from "@/lib/credits/rates";
import { CREDIT_VALUE_INR } from "@/lib/credits/rates";
import { isFounderEnrichmentEligible } from "@/lib/founder-enrichment";
import { founderEnrichmentEnabled } from "@/integrations/linkedin-founder";

const schema = z.object({
  organizationId: z.string().uuid(),
  // Omit for a whole-list (bulk) quote; pass IDs for a specific selection.
  leadIds: z.array(z.string().uuid()).max(1000).optional(),
});

// POST /api/leads/[listId]/enrich-founders/quote
// Returns how many leads are eligible and how many credits enriching them could
// cost (worst case — every founder found). No mutation, no credit hold.
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

  const eligibleLeads = leads.filter(isFounderEnrichmentEligible).length;
  const creditsPerLead = FOUNDER_CREDITS_PER_LEAD;
  const maxCredits = eligibleLeads * creditsPerLead;
  const wallet = await getWallet(organizationId);

  return NextResponse.json({
    eligibleLeads,
    creditsPerLead,
    maxCredits,
    maxInr: maxCredits * CREDIT_VALUE_INR,
    balance: wallet.balance,
    sufficient: wallet.balance >= maxCredits,
    // How many the current balance could cover, if short.
    affordableLeads: Math.min(eligibleLeads, Math.floor(wallet.balance / Math.max(creditsPerLead, 1))),
  });
}
