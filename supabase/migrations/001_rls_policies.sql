-- ============================================================
-- Row Level Security Policies
-- Run this in Supabase SQL editor after Prisma migrations
-- ============================================================

-- Helper function: get org id for current user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id::uuid
  FROM organization_members
  WHERE user_id = auth.uid()::text
  LIMIT 1;
$$;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── organizations ────────────────────────────────────────────────────────────

CREATE POLICY "Users can view their own org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Owners can update their org"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role = 'OWNER'
    )
  );

-- Insert allowed during onboarding via service role only
CREATE POLICY "Service role can insert orgs"
  ON organizations FOR INSERT
  WITH CHECK (true); -- restricted at app layer, service role bypasses RLS

-- ─── organization_members ─────────────────────────────────────────────────────

CREATE POLICY "Members can view their org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Owners/admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('OWNER', 'ADMIN')
    )
  );

-- ─── business_profiles ───────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD business profile"
  ON business_profiles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── integrations ─────────────────────────────────────────────────────────────

CREATE POLICY "Org members can view integrations"
  ON integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Owners/admins can manage integrations"
  ON integrations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('OWNER', 'ADMIN')
    )
  );

-- ─── lead_lists ───────────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD lead lists"
  ON lead_lists FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── leads ───────────────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD leads"
  ON leads FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── lead_research ───────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD lead research"
  ON lead_research FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── outreach_copies ──────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD outreach copies"
  ON outreach_copies FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── campaigns ───────────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD campaigns"
  ON campaigns FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- ─── campaign_leads ───────────────────────────────────────────────────────────

CREATE POLICY "Org members can CRUD campaign leads"
  ON campaign_leads FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()::text
      )
    )
  );

-- ─── usage_events ─────────────────────────────────────────────────────────────

CREATE POLICY "Org members can view usage events"
  ON usage_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- Workers insert via service role (bypasses RLS)

-- ─── audit_logs ───────────────────────────────────────────────────────────────

CREATE POLICY "Org owners/admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('OWNER', 'ADMIN')
    )
  );

-- ─── prompt_templates (public read, service write) ────────────────────────────

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read prompt templates"
  ON prompt_templates FOR SELECT
  TO authenticated
  USING (true);
