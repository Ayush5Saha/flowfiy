import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditAction =
  | "org.created"
  | "org.updated"
  | "integration.connected"
  | "integration.disconnected"
  | "lead_list.created"
  | "lead_list.generation_started"
  | "lead_list.import_started"
  | "lead_request.confirmed"
  | "credits.topup"
  | "campaign.created"
  | "campaign.sent"
  | "billing.upgraded"
  | "billing.cancelled"
  | "referral.reward_applied"
  | "referral.month_refunded"
  | "support.bug_report";

export async function createAuditLog({
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
}: {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: { organizationId, userId, action, resourceType, resourceId, metadata },
    });
  } catch {
    // Audit logging should never throw — log to stderr but don't break the request
    console.error("[audit] Failed to write audit log:", action);
  }
}
