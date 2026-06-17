/**
 * Prospeo — verified B2B email resolution.
 *
 * Used only when a B2B lead is missing an email and the request needs one.
 * Platform-owned key (PROSPEO_API_KEY); metered into run COGS as ENRICH_RATES.prospeo.
 */

const PROSPEO_BASE = "https://api.prospeo.io";

export interface ProspeoEmailResult {
  email: string | null;
  verified: boolean;
}

export class ProspeoClient {
  constructor(private readonly apiKey: string) {}

  /** Resolve an email from a name + company domain. Returns null on miss/error. */
  async findEmail(params: {
    firstName: string;
    lastName?: string;
    domain: string;
  }): Promise<ProspeoEmailResult> {
    try {
      const res = await fetch(`${PROSPEO_BASE}/email-finder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-KEY": this.apiKey },
        body: JSON.stringify({
          first_name: params.firstName,
          last_name: params.lastName ?? "",
          company: params.domain,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return { email: null, verified: false };
      const data = (await res.json()) as {
        error?: boolean;
        response?: { email?: string; email_status?: string };
      };
      const email = data.response?.email ?? null;
      if (data.error || !email) return { email: null, verified: false };
      return { email, verified: (data.response?.email_status ?? "").toUpperCase() === "VALID" };
    } catch {
      return { email: null, verified: false };
    }
  }

  async checkAccount(): Promise<{ ok: boolean; remainingCredits?: number }> {
    try {
      const res = await fetch(`${PROSPEO_BASE}/account-information`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-KEY": this.apiKey },
        body: "{}",
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return { ok: false };
      const data = (await res.json()) as { response?: { remaining_credits?: number } };
      return { ok: true, remainingCredits: data.response?.remaining_credits };
    } catch {
      return { ok: false };
    }
  }
}

/** Platform Prospeo client from env, or null if not configured. */
export function getProspeoClient(): ProspeoClient | null {
  const key = process.env.PROSPEO_API_KEY;
  return key ? new ProspeoClient(key) : null;
}
