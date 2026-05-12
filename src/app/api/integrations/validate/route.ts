import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import Anthropic from "@anthropic-ai/sdk";

const schema = z.object({
  type: z.enum(["CLAUDE", "APOLLO", "APIFY", "CALENDLY"]),
  credentials: z.record(z.string()),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { type, credentials } = parsed.data;

  try {
    switch (type) {
      case "CLAUDE": {
        const client = new Anthropic({ apiKey: credentials.apiKey });
        await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
        return NextResponse.json({ valid: true, message: "Claude API key is valid" });
      }

      case "APOLLO": {
        const client = new ApolloClient(credentials.apiKey);
        const valid = await client.validateKey();
        return valid
          ? NextResponse.json({ valid: true, message: "Apollo API key is valid" })
          : NextResponse.json({ valid: false, message: "Invalid Apollo API key" }, { status: 422 });
      }

      case "APIFY": {
        const client = new ApifyClient(credentials.apiKey);
        const valid = await client.validateKey();
        return valid
          ? NextResponse.json({ valid: true, message: "Apify API key is valid" })
          : NextResponse.json({ valid: false, message: "Invalid Apify API key" }, { status: 422 });
      }

      case "CALENDLY": {
        const res = await fetch("https://api.calendly.com/users/me", {
          headers: { Authorization: `Bearer ${credentials.apiKey}` },
        });
        if (!res.ok) {
          return NextResponse.json({ valid: false, message: "Invalid Calendly token" }, { status: 422 });
        }
        const data = await res.json() as { resource?: { scheduling_url?: string } };
        return NextResponse.json({
          valid: true,
          message: "Calendly connected",
          schedulingUrl: data.resource?.scheduling_url,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ valid: false, message }, { status: 422 });
  }
}
