import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { getWallet } from "@/lib/credits/service";

/**
 * Gate for the public "describe your leads" input. The client sends what the
 * visitor typed and we return where they should go next:
 *   unauthenticated      → sign in
 *   no_org               → finish onboarding
 *   no_subscription      → subscribe (billing)
 *   insufficient_credits → top up (billing)
 *   ready                → open the composer and run
 * The query itself is carried client-side (localStorage) and prefilled in the
 * composer — we only decide the route here.
 */
const schema = z.object({
  rawQuery: z.string().max(500).optional(),
  leadCount: z.number().int().min(5).max(500).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const leadCount = parsed.success ? parsed.data.leadCount ?? 100 : 100;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ status: "unauthenticated" });

  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ status: "no_org" });

  const { organization } = membership;
  const subscriptionActive =
    organization.plan !== "FREE" && organization.subscriptionStatus === "active";
  if (!subscriptionActive) {
    return NextResponse.json({ status: "no_subscription" });
  }

  const wallet = await getWallet(organization.id);
  // Rough pre-plan estimate: marketing promises ~2 leads/credit. The exact cost
  // is reconciled on the run; this only decides whether to send them to top-up.
  const needed = Math.max(1, Math.ceil(leadCount / 2));
  if (wallet.balance < needed) {
    return NextResponse.json({
      status: "insufficient_credits",
      balance: wallet.balance,
      needed,
    });
  }

  return NextResponse.json({ status: "ready", balance: wallet.balance });
}
