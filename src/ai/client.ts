import Anthropic from "@anthropic-ai/sdk";
import { decryptCredentials } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export async function getClaudeClient(organizationId: string): Promise<Anthropic> {
  const integration = await prisma.integration.findUnique({
    where: {
      organizationId_type: { organizationId, type: "CLAUDE" },
    },
    select: { encryptedCredentials: true, status: true },
  });

  if (!integration || integration.status !== "CONNECTED") {
    throw new Error("Claude API key not connected for this organization");
  }

  const { apiKey } = decryptCredentials(integration.encryptedCredentials);
  if (!apiKey) throw new Error("Invalid Claude credentials");

  return new Anthropic({ apiKey });
}
