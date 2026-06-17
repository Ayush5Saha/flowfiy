import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { planForRequest, estimateForPlan } from "@/lib/lead-requests";
import { getWallet } from "@/lib/credits/service";

const schema = z.object({
  answers: z.array(z.object({ id: z.string(), question: z.string(), answer: z.string() })).min(1),
});

// POST /api/lead-requests/[id]/clarify — submit answers and re-plan.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const organizationId = membership.organizationId;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers" }, { status: 400 });

  const lr = await prisma.leadRequest.findFirst({ where: { id, organizationId } });
  if (!lr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prev = (lr.clarifications ?? {}) as { answers?: { question: string; answer: string }[]; round?: number; desiredLeads?: number };
  const answers = [...(prev.answers ?? []), ...parsed.data.answers.map((a) => ({ question: a.question, answer: a.answer }))];
  const round = (prev.round ?? 0) + 1;
  const desiredLeads = prev.desiredLeads;

  let decision;
  try {
    decision = await planForRequest({ organizationId, rawQuery: lr.rawQuery, clarifications: answers, round, desiredLeads });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "planner error" }, { status: 502 });
  }

  if (decision.status === "needs_clarification") {
    await prisma.leadRequest.update({
      where: { id: lr.id },
      data: { status: "CLARIFYING", clarifications: { answers, round, questions: decision.questions, desiredLeads } as never },
    });
    return NextResponse.json({ id: lr.id, status: "needs_clarification", questions: decision.questions });
  }

  const estimate = estimateForPlan(decision.plan);
  const wallet = await getWallet(organizationId);
  await prisma.leadRequest.update({
    where: { id: lr.id },
    data: {
      status: "PLANNED",
      plan: decision.plan as never,
      leadType: decision.plan.leadType,
      estimatedCredits: estimate,
      clarifications: { answers, round, desiredLeads } as never,
    },
  });
  return NextResponse.json({ id: lr.id, status: "planned", plan: decision.plan, estimate, balance: wallet.balance });
}
