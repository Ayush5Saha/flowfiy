import { NextResponse } from "next/server";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { getWallet, getLedger } from "@/lib/credits/service";

// GET /api/credits — wallet balance + recent ledger.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });

  const [wallet, ledger] = await Promise.all([
    getWallet(membership.organizationId),
    getLedger(membership.organizationId, 50),
  ]);

  return NextResponse.json({
    balance: wallet.balance,
    held: wallet.held,
    ledger: ledger.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount,
      balanceAfter: e.balanceAfter,
      costUsd: e.costUsd ? Number(e.costUsd) : null,
      refType: e.refType,
      createdAt: e.createdAt,
    })),
  });
}
