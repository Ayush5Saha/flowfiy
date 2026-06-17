import Anthropic from "@anthropic-ai/sdk";

/**
 * Provider-agnostic LLM client.
 *
 * The whole pipeline calls `client.messages.create({...})` in Anthropic's
 * message shape and reads `response.content[0].text` (plus tool_use blocks in
 * the legacy orchestrator). This interface mirrors exactly that subset so we
 * can swap Anthropic for OpenRouter without touching the agents.
 */

export type LLMContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface LLMResponse {
  content: LLMContentBlock[];
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

/** System prompt: a plain string or Anthropic-style text blocks (with cache_control). */
export type LLMSystem =
  | string
  | Array<{ type: "text"; text: string; cache_control?: unknown }>;

export interface LLMMessage {
  role: "user" | "assistant";
  content: unknown; // string (agents) or content-block array (orchestrator)
}

export interface LLMTool {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
}

export interface LLMCreateParams {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: LLMSystem;
  messages: LLMMessage[];
  tools?: LLMTool[];
}

export interface LLMClient {
  messages: { create(params: LLMCreateParams): Promise<LLMResponse> };
}

// ─── Anthropic adapter ──────────────────────────────────────────────────────
// Thin pass-through — the Anthropic SDK already returns the shape we read.

export class AnthropicLLMClient implements LLMClient {
  constructor(private readonly anthropic: Anthropic) {}

  readonly messages = {
    create: async (params: LLMCreateParams): Promise<LLMResponse> => {
      const res = await this.anthropic.messages.create(
        params as unknown as Anthropic.MessageCreateParamsNonStreaming
      );
      return res as unknown as LLMResponse;
    },
  };
}

// ─── OpenRouter adapter (OpenAI-compatible) ───────────────────────────────────

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

/**
 * How long to wait before retrying a 429, derived from OpenRouter's rate-limit
 * headers (free models cap ~20 req/min). Clamped to [1s, 15s] with jitter so
 * concurrent worker jobs don't all retry in lockstep.
 */
function rateLimitWaitMs(headers: Headers): number {
  let waitMs = 5000;
  const reset = Number(headers.get("x-ratelimit-reset")); // epoch ms
  if (Number.isFinite(reset) && reset > 0) {
    const delta = reset - Date.now();
    if (delta > 0) waitMs = delta;
  }
  const retryAfter = Number(headers.get("retry-after")); // seconds
  if (Number.isFinite(retryAfter) && retryAfter > 0) waitMs = retryAfter * 1000;
  return Math.min(Math.max(waitMs, 1000), 15000) + Math.floor(Math.random() * 1000);
}

function flattenSystem(system?: LLMSystem): string {
  if (!system) return "";
  if (typeof system === "string") return system;
  // Drop Anthropic-only cache_control; concatenate the text blocks.
  return system.map((b) => b.text).join("\n\n");
}

function toOpenAIMessages(params: LLMCreateParams): OpenAIMessage[] {
  const out: OpenAIMessage[] = [];
  const sys = flattenSystem(params.system);
  if (sys) out.push({ role: "system", content: sys });

  for (const m of params.messages) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content });
      continue;
    }
    if (!Array.isArray(m.content)) continue;

    // Content-block array (legacy orchestrator tool flow). Best-effort mapping.
    const textParts: string[] = [];
    const toolCalls: NonNullable<OpenAIMessage["tool_calls"]> = [];
    for (const block of m.content as Array<Record<string, unknown>>) {
      const type = block.type as string;
      if (type === "text" && typeof block.text === "string") {
        textParts.push(block.text);
      } else if (type === "tool_use") {
        toolCalls.push({
          id: String(block.id ?? ""),
          type: "function",
          function: {
            name: String(block.name ?? ""),
            arguments: JSON.stringify(block.input ?? {}),
          },
        });
      } else if (type === "tool_result") {
        const c = block.content;
        out.push({
          role: "tool",
          tool_call_id: String(block.tool_use_id ?? ""),
          content: typeof c === "string" ? c : JSON.stringify(c ?? ""),
        });
      }
    }
    if (m.role === "assistant" && toolCalls.length) {
      out.push({ role: "assistant", content: textParts.join("\n") || null, tool_calls: toolCalls });
    } else if (textParts.length) {
      out.push({ role: m.role, content: textParts.join("\n") });
    }
  }
  return out;
}

function toOpenAITools(tools?: LLMTool[]) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema ?? {} },
  }));
}

interface OpenRouterChoice {
  message?: { content?: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> };
  finish_reason?: string;
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

export class OpenRouterLLMClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(opts: { apiKey: string; model: string }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model;
  }

  readonly messages = {
    create: async (params: LLMCreateParams): Promise<LLMResponse> => {
      // Ignore the incoming Claude model id — always use the org's chosen model.
      const body: Record<string, unknown> = {
        model: this.model,
        max_tokens: params.max_tokens,
        messages: toOpenAIMessages(params),
      };
      if (params.temperature !== undefined) body.temperature = params.temperature;
      const tools = toOpenAITools(params.tools);
      if (tools) body.tools = tools;

      // Retry transient rate limits (free OpenRouter models cap ~20 req/min)
      // before giving up — smooths bursts from the worker's parallel stages.
      let res: Response | null = null;
      const MAX_TRIES = 3;
      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://flowfiy.com",
            "X-Title": "Flowfiy",
          },
          body: JSON.stringify(body),
          // Fail fast if a (often slow/rate-limited free) model hangs, so the
          // worker job errors and retries instead of blocking for minutes.
          signal: AbortSignal.timeout(90_000),
        });
        if (res.status === 429 && attempt < MAX_TRIES) {
          const waitMs = rateLimitWaitMs(res.headers);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        break;
      }
      if (!res) throw new Error("OpenRouter request failed to send");

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const hint = res.status === 429
          ? " — free models are rate-limited; add OpenRouter credits or switch to a paid/managed model."
          : "";
        throw new Error(`OpenRouter API error ${res.status}: ${errText.slice(0, 200)}${hint}`);
      }

      const data = (await res.json()) as OpenRouterResponse;
      if (data.error) throw new Error(`OpenRouter error: ${data.error.message ?? "unknown"}`);

      const choice = data.choices?.[0];
      const msg = choice?.message ?? {};
      const content: LLMContentBlock[] = [];

      if (typeof msg.content === "string" && msg.content.length > 0) {
        content.push({ type: "text", text: msg.content });
      }
      if (Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
          } catch {
            input = {};
          }
          content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
        }
      }
      // Guard: if a model returns no content at all, surface an empty text block
      // so the caller's JSON extraction throws a clear error rather than crashing.
      if (content.length === 0) content.push({ type: "text", text: "" });

      const finish = choice?.finish_reason;
      const stop_reason =
        finish === "tool_calls" ? "tool_use" : finish === "length" ? "max_tokens" : "end_turn";

      return {
        content,
        stop_reason,
        usage: {
          input_tokens: data.usage?.prompt_tokens ?? 0,
          output_tokens: data.usage?.completion_tokens ?? 0,
        },
      };
    },
  };
}

// ─── Gemini adapter (Google Generative Language REST API) ─────────────────────
//
// Centralized provider for the whole pipeline. Maps Anthropic-style messages +
// tool-use to Gemini's `generateContent` (contents / systemInstruction /
// functionDeclarations) and back to the LLMResponse shape the agents read.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}
interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string };
}

/** Anthropic-style messages → Gemini contents. Resolves tool_use_id → name so
 *  tool results round-trip as functionResponse (Gemini keys on name, not id). */
function toGeminiContents(messages: LLMMessage[]): GeminiContent[] {
  const idToName = new Map<string, string>();
  for (const m of messages) {
    if (!Array.isArray(m.content)) continue;
    for (const b of m.content as Array<Record<string, unknown>>) {
      if (b.type === "tool_use" && b.id && b.name) idToName.set(String(b.id), String(b.name));
    }
  }

  const out: GeminiContent[] = [];
  for (const m of messages) {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
    if (typeof m.content === "string") {
      out.push({ role, parts: [{ text: m.content }] });
      continue;
    }
    if (!Array.isArray(m.content)) continue;

    const parts: GeminiPart[] = [];
    for (const b of m.content as Array<Record<string, unknown>>) {
      const type = b.type as string;
      if (type === "text" && typeof b.text === "string") {
        parts.push({ text: b.text });
      } else if (type === "tool_use") {
        parts.push({ functionCall: { name: String(b.name ?? ""), args: (b.input as Record<string, unknown>) ?? {} } });
      } else if (type === "tool_result") {
        const name = idToName.get(String(b.tool_use_id)) ?? "tool";
        const c = b.content;
        let response: Record<string, unknown>;
        if (typeof c === "string") {
          try { response = JSON.parse(c) as Record<string, unknown>; }
          catch { response = { result: c }; }
        } else {
          response = (c as Record<string, unknown>) ?? {};
        }
        parts.push({ functionResponse: { name, response } });
      }
    }
    if (parts.length) out.push({ role, parts });
  }
  return out;
}

function toGeminiTools(tools?: LLMTool[]) {
  if (!tools?.length) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema ?? { type: "object", properties: {} },
      })),
    },
  ];
}

export class GeminiLLMClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(opts: { apiKey: string; model: string }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model;
  }

  readonly messages = {
    create: async (params: LLMCreateParams): Promise<LLMResponse> => {
      const body: Record<string, unknown> = {
        contents: toGeminiContents(params.messages),
        generationConfig: {
          maxOutputTokens: params.max_tokens,
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        },
      };
      const sys = flattenSystem(params.system);
      if (sys) body.systemInstruction = { parts: [{ text: sys }] };
      const tools = toGeminiTools(params.tools);
      if (tools) body.tools = tools;

      const url = `${GEMINI_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

      // Retry transient 429/503 (rate limit / model warmup) with backoff + jitter.
      let res: Response | null = null;
      const MAX_TRIES = 3;
      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(90_000),
        });
        if ((res.status === 429 || res.status === 503) && attempt < MAX_TRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt + Math.floor(Math.random() * 500)));
          continue;
        }
        break;
      }
      if (!res) throw new Error("Gemini request failed to send");

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = (await res.json()) as GeminiResponse;
      if (data.error) throw new Error(`Gemini error: ${data.error.message ?? "unknown"}`);

      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const content: LLMContentBlock[] = [];
      let hasToolCall = false;
      parts.forEach((p, i) => {
        if (typeof p.text === "string" && p.text.length > 0) {
          content.push({ type: "text", text: p.text });
        } else if (p.functionCall) {
          hasToolCall = true;
          content.push({
            type: "tool_use",
            id: `call_${p.functionCall.name}_${i}`,
            name: p.functionCall.name,
            input: p.functionCall.args ?? {},
          });
        }
      });
      if (content.length === 0) content.push({ type: "text", text: "" });

      const finish = data.candidates?.[0]?.finishReason;
      const stop_reason = hasToolCall ? "tool_use" : finish === "MAX_TOKENS" ? "max_tokens" : "end_turn";

      return {
        content,
        stop_reason,
        usage: {
          input_tokens: data.usageMetadata?.promptTokenCount ?? 0,
          output_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    },
  };
}
