export interface ApolloSearchParams {
  jobTitles: string[];
  industries: string[];
  companySizes: string[];
  geographies?: string[];
  perPage?: number;
  /** 1-based result page. Apollo masks most emails on page 1; advancing the page
   *  surfaces a different slice of contacts (incl. other already-unlocked emails),
   *  which is what lets top-up rounds find genuinely NEW leads. */
  page?: number;
}

export interface ApolloContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  organization?: {
    name: string;
    websiteUrl?: string;
    industry?: string;
    employeeCount?: number;
    linkedinUrl?: string;
  };
}

export class ApolloClient {
  private apiKey: string;
  private baseUrl = "https://api.apollo.io/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPeople(params: ApolloSearchParams): Promise<ApolloContact[]> {
    const body: Record<string, unknown> = {
      // Apollo caps per_page at 100; clamp so a large candidate target doesn't 400.
      per_page: Math.min(Math.max(params.perPage ?? 25, 1), 100),
      page: Math.max(params.page ?? 1, 1),
      person_titles: params.jobTitles,
      // Apollo v1 mixed_people/search uses q_organization_keyword_tags for free-text
      // industry matching. organization_industry_tag_ids requires numeric IDs and
      // silently ignores string labels, so we use keyword tags instead.
      q_organization_keyword_tags: params.industries?.length ? params.industries : undefined,
      organization_num_employees_ranges: params.companySizes,
      contact_email_status: ["verified", "likely_to_engage"],
    };

    if (params.geographies?.length) {
      body.person_locations = params.geographies;
    }

    const res = await fetch(`${this.baseUrl}/mixed_people/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        // Apollo requires the API key in the X-Api-Key header. Passing it via
        // query/body params has not been supported since September 2024.
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Apollo API error ${res.status}: ${error}`);
    }

    const data = await res.json() as { people?: ApolloContact[]; contacts?: ApolloContact[] };
    const people = data.people ?? data.contacts ?? [];

    return people.map((p) => ({
      id: p.id,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      title: p.title ?? "",
      email: p.email,
      linkedinUrl: p.linkedinUrl,
      organization: p.organization
        ? {
            name: p.organization.name,
            websiteUrl: p.organization.websiteUrl,
            industry: p.organization.industry,
            employeeCount: p.organization.employeeCount,
            linkedinUrl: p.organization.linkedinUrl,
          }
        : undefined,
    }));
  }

  async validateKey(): Promise<boolean> {
    try {
      // Apollo's dedicated key health-check endpoint. The key must be sent in
      // the X-Api-Key header — query/body api_key was dropped in Sept 2024.
      const res = await fetch("https://api.apollo.io/v1/auth/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": this.apiKey,
        },
      });
      if (!res.ok) return false;
      // Health endpoint returns { is_logged_in: true, ... } on a valid key.
      const data = (await res.json().catch(() => null)) as { is_logged_in?: boolean } | null;
      return data?.is_logged_in !== false;
    } catch {
      return false;
    }
  }
}
