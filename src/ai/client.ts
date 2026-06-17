import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import type { RunMode, AgentTask } from "@/ai/config";
import { DEFAULT_OPENROUTER_MODEL, TASK_MODELS } from "@/ai/config";
import { AnthropicLLMClient, OpenRouterLLMClient, GeminiLLMClient, type LLMClient } from "@/ai/llm";

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

/**
 * Centralized LLM client for the pipeline — always platform-owned Gemini, keyed
 * by task (per-task model from TASK_MODELS). This replaces the per-org BYOK
 * resolver in the NL pipeline. The Anthropic client remains as a fallback seam
 * (wired live in a later phase); launch is Gemini-only.
 *
 * Returns the same { client, mode } shape as getClaudeClientForOrg so the
 * 4-stage processors swap with a one-line change.
 */
export function getCentralLLMClient(task: AgentTask): { client: LLMClient; mode: RunMode } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. The pipeline now runs on centralized Gemini."
    );
  }
  return { client: new GeminiLLMClient({ apiKey, model: TASK_MODELS[task] }), mode: "CENTRAL" };
}

/**
 * Used by non-org callers — always central Claude. Returns the raw Anthropic
 * instance because some callers (leads/chat) need streaming, which the
 * provider-agnostic LLMClient interface intentionally does not model. Callers
 * that drive an agent should wrap this in `new AnthropicLLMClient(...)`.
 */
export function getClaudeClient(): Anthropic {
  return getCentralClient();
}

/**
 * Returns the correct LLM client + run mode for an organization.
 * - CENTRAL mode: Flowfiy's env Claude key with full optimizations
 * - BYOK + ANTHROPIC: the org's stored Claude key
 * - BYOK + OPENROUTER: the org's stored OpenRouter key + chosen model
 */
export async function getClaudeClientForOrg(
  organizationId: string
): Promise<{ client: LLMClient; mode: RunMode }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { apiMode: true, plan: true, llmProvider: true, openRouterModel: true },
  });

  // FREE and INDIE plans are BYOK-only regardless of stored apiMode
  const byokOnly = org.plan === "FREE" || org.plan === "INDIE";
  const effectiveMode: RunMode = (byokOnly || org.apiMode === "BYOK") ? "BYOK" : "CENTRAL";

  if (effectiveMode === "BYOK") {
    // ── OpenRouter provider ──────────────────────────────────────────────────
    if (org.llmProvider === "OPENROUTER") {
      const integration = await prisma.integration.findUnique({
        where: { organizationId_type: { organizationId, type: "OPENROUTER" } },
        select: { status: true, encryptedCredentials: true },
      });

      if (!integration || integration.status !== "CONNECTED") {
        throw new Error(
          "OpenRouter API key not connected. Please add your OpenRouter API key in Settings → Integrations."
        );
      }

      const { apiKey } = decryptCredentials(integration.encryptedCredentials) as { apiKey: string };
      if (!apiKey) throw new Error("Stored OpenRouter API key is invalid.");

      const model = org.openRouterModel || DEFAULT_OPENROUTER_MODEL;
      return { client: new OpenRouterLLMClient({ apiKey, model }), mode: "BYOK" };
    }

    // ── Anthropic provider (default) ─────────────────────────────────────────
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

    return { client: new AnthropicLLMClient(new Anthropic({ apiKey })), mode: "BYOK" };
  }

  return { client: new AnthropicLLMClient(getCentralClient()), mode: "CENTRAL" };
}
