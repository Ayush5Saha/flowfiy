/**
 * creditService — the ONLY place that mutates credit wallets.
 *
 * Flow per run (see plan §J): estimate → reserve(HOLD) → run → reconcile
 * (CONSUME actual + RELEASE remainder). All mutations run in Serializable
 * transactions (with a small retry on write-conflict) so concurrent runs and
 * webhooks can never race the balance.
 *
 * Accounting model:
 *   balance = spendable credits
 *   held    = reserved credits (already moved out of balance), pending a run
 *   HOLD:    balance -= c, held += c
 *   CONSUME: held -= actual            (the real spend; balance unchanged)
 *   RELEASE: held -= unused, balance += unused
 *   PURCHASE/GRANT/REFUND/ADJUST: balance += credits
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { creditsForCostUsd, LEADS_PER_CREDIT_ESTIMATE, type LeadType } from "./rates";

export interface WalletState {
  balance: number;
  held: number;
}

export interface LedgerRef {
  refType?: string;
  refId?: string;
  metadata?: Prisma.InputJsonValue;
}

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

/** Run a transaction at Serializable isolation, retrying on write-conflict (P2034). */
async function serializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, SERIALIZABLE);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if ((code === "P2034" || code === "40001") && attempt < 3) continue;
      throw err;
    }
  }
}

/** Read the wallet, lazily creating it at zero on first access. */
export async function getWallet(organizationId: string): Promise<WalletState> {
  const w = await prisma.creditWallet.upsert({
    where: { organizationId },
    create: { organizationId },
    update: {},
    select: { balance: true, held: true },
  });
  return { balance: w.balance, held: w.held };
}

/** Estimate the credits to HOLD before a run (heuristic — not the charge). */
export function estimateCredits(leadType: LeadType, expectedQualified: number): number {
  const per = LEADS_PER_CREDIT_ESTIMATE[leadType] ?? LEADS_PER_CREDIT_ESTIMATE.B2B;
  return Math.max(1, Math.ceil(expectedQualified / per));
}

/** Add credits to a wallet (PURCHASE / GRANT / REFUND / positive ADJUST). */
export async function creditGrant(
  organizationId: string,
  credits: number,
  type: "PURCHASE" | "GRANT" | "REFUND" | "ADJUST",
  ref: LedgerRef = {}
): Promise<number> {
  if (credits <= 0) return (await getWallet(organizationId)).balance;
  return serializable(async (tx) => {
    const wallet = await tx.creditWallet.upsert({
      where: { organizationId },
      create: { organizationId, balance: credits },
      update: { balance: { increment: credits } },
      select: { balance: true },
    });
    await tx.creditLedger.create({
      data: {
        organizationId,
        type,
        amount: credits,
        balanceAfter: wallet.balance,
        refType: ref.refType ?? null,
        refId: ref.refId ?? null,
        metadata: ref.metadata,
      },
    });
    return wallet.balance;
  });
}

/**
 * Reserve credits for a run. Moves `credits` from balance → held and writes a
 * HOLD ledger row. Returns { ok: false } without mutating if balance is short.
 */
export async function reserveCredits(
  organizationId: string,
  credits: number,
  ref: LedgerRef = {}
): Promise<{ ok: boolean; balance: number; held: number }> {
  return serializable(async (tx) => {
    const wallet = await tx.creditWallet.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
      select: { balance: true, held: true },
    });
    if (credits <= 0) return { ok: true, balance: wallet.balance, held: wallet.held };
    if (wallet.balance < credits) return { ok: false, balance: wallet.balance, held: wallet.held };

    const updated = await tx.creditWallet.update({
      where: { organizationId },
      data: { balance: { decrement: credits }, held: { increment: credits } },
      select: { balance: true, held: true },
    });
    await tx.creditLedger.create({
      data: {
        organizationId,
        type: "HOLD",
        amount: -credits,
        balanceAfter: updated.balance,
        refType: ref.refType ?? null,
        refId: ref.refId ?? null,
        metadata: ref.metadata,
      },
    });
    return { ok: true, balance: updated.balance, held: updated.held };
  });
}

/**
 * Reconcile a finished run. Charges actual COGS (clamped to the reserved hold,
 * so the user is never billed above the approved ceiling) and releases the rest.
 * Pass totalCostUsd = 0 to release the whole hold (cancel / empty / failed run).
 */
export async function reconcileRun(
  organizationId: string,
  args: { reservedCredits: number; totalCostUsd: number; ref: LedgerRef }
): Promise<{ consumed: number; released: number; balance: number }> {
  const actual = Math.min(creditsForCostUsd(args.totalCostUsd), args.reservedCredits);
  const released = args.reservedCredits - actual;

  return serializable(async (tx) => {
    const wallet = await tx.creditWallet.update({
      where: { organizationId },
      data: { held: { decrement: args.reservedCredits }, balance: { increment: released } },
      select: { balance: true },
    });
    if (actual > 0) {
      await tx.creditLedger.create({
        data: {
          organizationId,
          type: "CONSUME",
          amount: -actual,
          balanceAfter: wallet.balance,
          costUsd: new Prisma.Decimal(args.totalCostUsd.toFixed(6)),
          refType: args.ref.refType ?? null,
          refId: args.ref.refId ?? null,
          metadata: args.ref.metadata,
        },
      });
    }
    if (released > 0) {
      await tx.creditLedger.create({
        data: {
          organizationId,
          type: "RELEASE",
          amount: released,
          balanceAfter: wallet.balance,
          refType: args.ref.refType ?? null,
          refId: args.ref.refId ?? null,
        },
      });
    }
    return { consumed: actual, released, balance: wallet.balance };
  });
}

/** Release a whole hold without charging (cancel / failed / empty run). */
export async function releaseHold(
  organizationId: string,
  reservedCredits: number,
  ref: LedgerRef = {}
): Promise<{ released: number; balance: number }> {
  const r = await reconcileRun(organizationId, { reservedCredits, totalCostUsd: 0, ref });
  return { released: r.released, balance: r.balance };
}

/**
 * Idempotent credit grant keyed on a gateway payment/session/invoice id.
 * Returns false (no-op) if a grant for this (refType, refId) already exists —
 * guards webhook retries from double-crediting. Used for plan-cycle grants and
 * one-time top-ups.
 */
export async function grantCreditsOnce(
  organizationId: string,
  credits: number,
  refType: string,
  refId: string
): Promise<boolean> {
  const existing = await prisma.creditLedger.findFirst({
    where: { organizationId, refType, refId, type: { in: ["PURCHASE", "GRANT"] } },
    select: { id: true },
  });
  if (existing) return false;
  await creditGrant(organizationId, credits, "PURCHASE", { refType, refId });
  return true;
}

/** Recent ledger entries for the wallet UI. */
export async function getLedger(organizationId: string, limit = 50) {
  return prisma.creditLedger.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
