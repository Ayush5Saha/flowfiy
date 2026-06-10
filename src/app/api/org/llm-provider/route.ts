// PATCH /api/org/llm-provider
// Body: { provider: "ANTHROPIC" | "OPENROUTER", model?: string }
//
// Sets the BYOK LLM provider for the org. When provider is OPENROUTER, `model`
// is the OpenRouter slug to use for every agent (curated or custom). The
// OpenRouter API *key* is stored separately via /api/integrations.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OPENROUTER_MODEL } from "@/ai/config";

const schema = z.object({
  provider: z.enum(["ANTHROPIC", "OPENROUTER"]),
  model: z.string().trim().min(1).max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, role: true },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { provider, model } = parsed.data;

  await prisma.organization.update({
    where: { id: member.organizationId },
    data: {
      llmProvider: provider,
      // Only set a model when on OpenRouter; fall back to the default slug.
      ...(provider === "OPENROUTER"
        ? { openRouterModel: model || DEFAULT_OPENROUTER_MODEL }
        : {}),
    },
  });

  return NextResponse.json({
    success: true,
    provider,
    ...(provider === "OPENROUTER" ? { model: model || DEFAULT_OPENROUTER_MODEL } : {}),
  });
}
