import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getClaudeClient } from "@/ai/client";

const schema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20).default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { leadId, organizationId, message, history } = parsed.data;

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return new Response("Forbidden", { status: 403 });

  // Fetch lead + research + outreach copy + business profile
  const [lead, businessProfile] = await Promise.all([
    prisma.lead.findFirst({
      where: { id: leadId, organizationId },
      include: {
        research: true,
        outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.businessProfile.findUnique({ where: { organizationId } }),
  ]);

  if (!lead) return new Response("Lead not found", { status: 404 });

  // Build context block
  const analysis = (lead.research?.companyAnalysis ?? {}) as Record<string, unknown>;
  const outreachCopy = lead.outreachCopies?.[0];

  const context = `
## Lead: ${lead.firstName ?? ""} ${lead.lastName ?? ""}
- Title: ${lead.title ?? "unknown"}
- Company: ${lead.companyName ?? "unknown"}
- Website: ${lead.companyWebsite ?? "not provided"}
- Industry: ${lead.industry ?? "unknown"}
- Company size: ${lead.companySize ?? "unknown"}
- Email: ${lead.email ?? "not available"}
- Qualification score: ${lead.qualificationScore ?? "not scored"}/100

## Company Research
${lead.research?.opportunityAngle ? `Opportunity angle: ${lead.research.opportunityAngle}` : ""}
${lead.research?.painPointMatch ? `Pain point match: ${lead.research.painPointMatch}` : ""}
${lead.research?.personalizationNotes ? `Personalization notes: ${lead.research.personalizationNotes}` : ""}
${typeof analysis.fitAssessment === "string" ? `Fit assessment: ${analysis.fitAssessment}` : ""}
${Array.isArray(analysis.acquisitionGaps) ? `Growth gaps: ${(analysis.acquisitionGaps as string[]).join("; ")}` : ""}
${typeof analysis.summary === "string" ? `Company summary: ${analysis.summary}` : ""}

## Generated Outreach Copy
${outreachCopy ? `Subject: ${outreachCopy.subjectLine ?? ""}
Body: ${outreachCopy.body}
Follow-up 1: ${outreachCopy.followUp1 ?? "none"}
Follow-up 2: ${outreachCopy.followUp2 ?? "none"}` : "No outreach copy generated yet."}

## Your Business Profile
Company: ${businessProfile?.companyName ?? "unknown"}
Service: ${businessProfile?.serviceOffered ?? "not set"}
Offer positioning: ${businessProfile?.offerPositioning ?? "not set"}
Target ICP: ${businessProfile?.icpDescription ?? "not set"}
`.trim();

  const systemPrompt = `You are an AI sales research assistant embedded in Flowfiy. You help the user analyze and strategize around a specific sales lead.

You have deep context about this lead, their company, and the user's business. Use this context to give specific, actionable advice — not generic sales tips.

When asked to rewrite emails or copy, output clean text ready to paste, not markdown code blocks.
When asked for strategic advice, be direct and concise. No filler.

LEAD & COMPANY CONTEXT:
${context}`;

  const claude = await getClaudeClient(organizationId);

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await claude.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user", content: message },
          ],
          stream: true,
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Claude API error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
