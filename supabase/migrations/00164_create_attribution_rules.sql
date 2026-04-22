-- Epic 88 — Story 88.4 : Règles d'attribution commerciale configurables
-- Règles % partage crédit entre commerciaux (qualifier/closer) + seed "Standard 50/50".
-- Utilisées à la conversion d'un prospect pour suggérer la rémunération.

-- 1. Table attribution_rules
CREATE TABLE IF NOT EXISTS attribution_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  rule_name   TEXT NOT NULL,
  description TEXT,
  conditions  JSONB NOT NULL DEFAULT '{}'::jsonb,
  percentages JSONB NOT NULL DEFAULT '{"qualifier": 50, "closer": 50}'::jsonb,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- Un seul défaut actif par tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_attribution_rules_default_per_tenant
  ON attribution_rules(tenant_id)
  WHERE is_default = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_attribution_rules_tenant
  ON attribution_rules(tenant_id)
  WHERE deleted_at IS NULL;

-- 2. Colonne attribution_result sur club_prospects (résultat final conversion)
ALTER TABLE club_prospects
  ADD COLUMN IF NOT EXISTS attribution_result JSONB;

COMMENT ON COLUMN club_prospects.attribution_result IS
  'JSONB {"ruleId": uuid, "commercials": [{"id": uuid, "displayName": str, "percentage": number}]} — rempli à la conversion (story 88.4).';

-- 3. RLS admin-only
ALTER TABLE attribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY attribution_rules_select
  ON attribution_rules FOR SELECT
  USING (
    deleted_at IS NULL
    AND tenant_id = public.current_tenant_id_with_fallback()
    AND public.current_user_role_with_fallback() = 'admin'
  );

CREATE POLICY attribution_rules_insert
  ON attribution_rules FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id_with_fallback()
    AND public.current_user_role_with_fallback() = 'admin'
  );

CREATE POLICY attribution_rules_update
  ON attribution_rules FOR UPDATE
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND public.current_user_role_with_fallback() = 'admin'
  );

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION update_attribution_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attribution_rules_updated_at ON attribution_rules;
CREATE TRIGGER trg_attribution_rules_updated_at
  BEFORE UPDATE ON attribution_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_attribution_rules_updated_at();

-- 5. Seed : "Standard 50/50" par défaut pour chaque tenant existant
INSERT INTO attribution_rules (tenant_id, rule_name, description, percentages, is_default)
SELECT
  t.id,
  'Standard 50/50',
  'Règle par défaut — partage équitable entre qualifier (identification + premier contact) et closer (conclusion).',
  '{"qualifier": 50, "closer": 50}'::jsonb,
  TRUE
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM attribution_rules ar
  WHERE ar.tenant_id = t.id AND ar.is_default = TRUE AND ar.deleted_at IS NULL
);

COMMENT ON TABLE attribution_rules IS
  'Règles d''attribution commerciale (story 88.4). Un seul is_default=true par tenant. percentages JSONB permet évolution vers N rôles.';
