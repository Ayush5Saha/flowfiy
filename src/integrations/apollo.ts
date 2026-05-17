export interface ApolloSearchParams {
  jobTitles: string[];
  industries: string[];
  companySizes: string[];
  geographies?: string[];
  perPage?: number;
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
      api_key: this.apiKey,
      per_page: params.perPage ?? 25,
      person_titles: params.jobTitles,
      // Pass industry keywords as free-text labels (Apollo v1 mixed_people accepts string labels)
      organization_industry_tag_ids: params.industries?.length ? params.industries : undefined,
      organization_num_employees_ranges: params.companySizes,
      contact_email_status: ["verified", "likely_to_engage"],
    };

    if (params.geographies?.length) {
      body.person_locations = params.geographies;
    }

    const res = await fetch(`${this.baseUrl}/mixed_people/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${this.baseUrl}/users/me?api_key=${this.apiKey}`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
