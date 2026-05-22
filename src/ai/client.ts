import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import type { RunMode } from "@/ai/config";

export type { RunMode };

let _centralClient: Anthropic | null = null;

function getCentralClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  if (!_centralClient) {
    _centralClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _centralClient;
}

/** Used by non-org callers (reply classifier in follow-up scheduler) */
export function getClaudeClient(): Anthropic {
  return getCentralClient();
}

/**
 * Returns the correct Claude client + run mode for an organization.
 * - CENTRAL mode: uses Flowfiy's env key with full optimizations
 * - BYOK mode: uses the org's stored key with natural Claude defaults
 */
export async function getClaudeClientForOrg(
  organizationId: string
): Promise<{ client: Anthropic; mode: RunMode }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { apiMode: true, plan: true },
  });

  // FREE and INDIE plans are BYOK-only regardless of stored apiMode
  const byokOnly = org.plan === "FREE" || org.plan === "INDIE";
  const effectiveMode: RunMode = (byokOnly || org.apiMode === "BYOK") ? "BYOK" : "CENTRAL";

  if (effectiveMode === "BYOK") {
    const integration = await prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "CLAUDE" } },
      select: { status: true, encryptedCredentials: true },
    });

    if (!integration || integration.status !== "CONNECTED") {
      throw new Error(
        "Claude API key not connected. Please add your Anthropic API key in Settings → Integrations."
      );
    }

    const { apiKey } = decryptCredentials(integration.encryptedCredentials) as { apiKey: string };
    if (!apiKey) throw new Error("Stored Claude API key is invalid.");

    return { client: new Anthropic({ apiKey }), mode: "BYOK" };
  }

  return { client: getCentralClient(), mode: "CENTRAL" };
}
