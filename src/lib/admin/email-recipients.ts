/**
 * Recipient segmentation for admin bulk email. Conditions are expressed over
 * Organization subscription state (which exists today — no dependency on the
 * credit tables), then resolved to member emails via Supabase auth.
 */
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import type { Prisma } from "@prisma/client";

export type Segment =
  | "all"
  | "no_subscription"
  | "active_subscription"
  | "free_plan"
  | "payment_failed";

export const SEGMENTS: { key: Segment; label: string; description: string }[] = [
  { key: "all", label: "All users", description: "Everyone with an account" },
  { key: "no_subscription", label: "No active subscription", description: "Free plan or subscription not active — your upgrade audience" },
  { key: "active_subscription", label: "Active subscribers", description: "Paying customers on an active plan" },
  { key: "free_plan", label: "On the Free plan", description: "Accounts that never subscribed" },
  { key: "payment_failed", label: "Payment failed / halted", description: "Subscriptions with a failed or halted payment — win-back" },
];

export const SEGMENT_KEYS = SEGMENTS.map((s) => s.key) as [Segment, ...Segment[]];

export interface Recipient {
  email: string;
  name: string;
}

function nameOf(u: { email?: string | null; user_metadata?: Record<string, unknown> | null }): string {
  const m = u.user_metadata ?? {};
  const full = (m.full_name ?? m.name) as string | undefined;
  if (full) return full;
  return (u.email ?? "").split("@")[0] || "there";
}

function segmentWhere(segment: Exclude<Segment, "all">): Prisma.OrganizationWhereInput {
  switch (segment) {
    case "no_subscription":
      return { OR: [{ plan: "FREE" }, { subscriptionStatus: null }, { subscriptionStatus: { not: "active" } }] };
    case "active_subscription":
      return { plan: { not: "FREE" }, subscriptionStatus: "active" };
    case "free_plan":
      return { plan: "FREE" };
    case "payment_failed":
      return { subscriptionStatus: { in: ["payment_failed", "halted"] } };
  }
}

/** Resolve the de-duplicated recipient list for a segment. */
export async function resolveRecipients(segment: Segment): Promise<Recipient[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  if (segment === "all") {
    const seen = new Set<string>();
    const out: Recipient[] = [];
    for (const u of users) {
      if (u.email && !seen.has(u.email)) {
        seen.add(u.email);
        out.push({ email: u.email, name: nameOf(u) });
      }
    }
    return out;
  }

  const byId = new Map(users.map((u) => [u.id, u]));
  const orgs = await prisma.organization.findMany({
    where: segmentWhere(segment),
    select: { id: true },
  });
  if (orgs.length === 0) return [];

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: { in: orgs.map((o) => o.id) } },
    select: { userId: true },
  });

  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const m of members) {
    const u = byId.get(m.userId);
    if (u?.email && !seen.has(u.email)) {
      seen.add(u.email);
      out.push({ email: u.email, name: nameOf(u) });
    }
  }
  return out;
}
