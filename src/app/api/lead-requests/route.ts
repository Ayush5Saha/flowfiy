import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { planForRequest, estimateForPlan } from "@/lib/lead-requests";
import { getWallet } from "@/lib/credits/service";

const schema = z.object({
  rawQuery: z.string().min(3).max(500),
  leadCount: z.number().int().min(5).max(500).optional(),
});

// POST /api/lead-requests — create an NL request and run the planner.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const organizationId = membership.organizationId;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please describe the leads you want." }, { status: 400 });

  const profile = await prisma.businessProfile.findUnique({ where: { organizationId } });
  if (!profile) {
    return NextResponse.json({ error: "Set up your business profile first.", missingProfile: true }, { status: 422 });
  }

  const lr = await prisma.leadRequest.create({
    data: { organizationId, rawQuery: parsed.data.rawQuery, status: "DRAFTING" },
  });

  const desiredLeads = parsed.data.leadCount;

  let decision;
  try {
    decision = await planForRequest({ organizationId, rawQuery: parsed.data.rawQuery, round: 0, desiredLeads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "planner error";
    // Surface the real cause in the server log. A *thrown* planner error is almost
    // always infrastructure/config (missing or invalid API key, provider down, bad
    // model output) — genuinely ambiguous requests come back as needs_clarification,
    // not an exception. So don't tell the user to "rephrase" a config error.
    console.error("[lead-requests] planner failed:", msg);
    await prisma.leadRequest.update({
      where: { id: lr.id },
      data: { status: "FAILED", error: msg },
    });
    const configError = /not configured|api[ _-]?key|unauthor|forbidden|quota|rate.?limit|\b(401|403|429|500|503)\b|timeout|fetch failed|econn|enotfound/i.test(msg);
    return NextResponse.json(
      {
        error: configError
          ? "The lead planner is temporarily unavailable — please try again in a moment."
          : "Couldn't plan that request — try rephrasing.",
      },
      { status: 502 }
    );
  }

  if (decision.status === "needs_clarification") {
    await prisma.leadRequest.update({
      where: { id: lr.id },
      data: { status: "CLARIFYING", clarifications: { questions: decision.questions, round: 0, desiredLeads } as never },
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
    },
  });
  return NextResponse.json({ id: lr.id, status: "planned", plan: decision.plan, estimate, balance: wallet.balance });
}
