-- Story 11.3 — Partenariats clubs
-- Note : enum nommé partnership_access_level pour éviter conflit avec clubs.access_level (Story 2.5)

CREATE TYPE partnership_access_level AS ENUM (
  'read_catalogue',
  'read_bronze',
  'read_silver',
  'full_read'
);

CREATE TABLE club_partnerships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  partner_name      TEXT NOT NULL,
  partner_tenant_id UUID REFERENCES tenants(id),
  access_level      partnership_access_level NOT NULL DEFAULT 'read_catalogue',
  active_from       DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until      DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON club_partnerships
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_manage" ON club_partnerships
  FOR ALL USING (current_user_role() = 'admin');

-- Journal des accès partenaires
CREATE TABLE club_access_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES club_partnerships(id),
  accessor_id    UUID NOT NULL REFERENCES profiles(user_id),
  resource_type  TEXT NOT NULL,
  resource_id    UUID NOT NULL,
  accessed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON club_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_partnerships cp
      WHERE cp.id = club_access_logs.partnership_id AND cp.tenant_id = current_tenant_id()
    )
  );
CREATE POLICY "insert_rpc" ON club_access_logs
  FOR INSERT WITH CHECK (accessor_id = auth.uid());

-- RPC log_partner_access
CREATE OR REPLACE FUNCTION log_partner_access(
  p_resource_type TEXT,
  p_resource_id   UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO club_access_logs (partnership_id, accessor_id, resource_type, resource_id)
  SELECT cp.id, auth.uid(), p_resource_type, p_resource_id
  FROM clubs c
  JOIN club_partnerships cp ON cp.partner_tenant_id = c.tenant_id
  WHERE c.user_id = auth.uid()
    AND cp.active_from <= CURRENT_DATE
    AND (cp.active_until IS NULL OR cp.active_until >= CURRENT_DATE)
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION log_partner_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_partner_access TO authenticated;

-- Policy RLS pour role='club' sur thèmes
CREATE POLICY "club_partner_access_themes" ON themes
  FOR SELECT USING (
    current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM clubs c
      JOIN club_partnerships cp ON cp.partner_tenant_id = c.tenant_id
      WHERE c.user_id = auth.uid()
        AND cp.tenant_id = themes.tenant_id
        AND cp.active_from <= CURRENT_DATE
        AND (cp.active_until IS NULL OR cp.active_until >= CURRENT_DATE)
        AND cp.access_level IN ('read_bronze','read_silver','full_read')
    )
  );

CREATE POLICY "club_partner_access_situations" ON situations
  FOR SELECT USING (
    current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM clubs c
      JOIN club_partnerships cp ON cp.partner_tenant_id = c.tenant_id
      WHERE c.user_id = auth.uid()
        AND cp.tenant_id = situations.tenant_id
        AND cp.active_from <= CURRENT_DATE
        AND (cp.active_until IS NULL OR cp.active_until >= CURRENT_DATE)
        AND cp.access_level IN ('read_bronze','read_silver','full_read')
    )
  );
