-- Migration 00154 — Règles d'attribution commerciale
-- Story 88.4 — Table attribution_rules + colonne attribution_result sur club_prospects

-- ── Table attribution_rules ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attribution_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name   TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  conditions  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  percentages JSONB       NOT NULL DEFAULT '{"qualifier": 50, "closer": 50}'::jsonb,
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- Partial unique index : un seul défaut par tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_attribution_rules_one_default_per_tenant
  ON attribution_rules (tenant_id) WHERE is_default = true AND deleted_at IS NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trg_attribution_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_attribution_rules_updated_at ON attribution_rules;
CREATE TRIGGER set_attribution_rules_updated_at
  BEFORE UPDATE ON attribution_rules
  FOR EACH ROW EXECUTE FUNCTION trg_attribution_rules_updated_at();

-- ── RLS admin only ────────────────────────────────────────────────────────────

ALTER TABLE attribution_rules ENABLE ROW LEVEL SECURITY;

DO $rls$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attribution_rules' AND policyname = 'admin_select_attribution_rules'
  ) THEN
    EXECUTE $p$
      CREATE POLICY admin_select_attribution_rules ON attribution_rules
        FOR SELECT
        USING (
          (auth.jwt() ->> 'user_role') = 'admin'
          AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attribution_rules' AND policyname = 'admin_insert_attribution_rules'
  ) THEN
    EXECUTE $p$
      CREATE POLICY admin_insert_attribution_rules ON attribution_rules
        FOR INSERT
        WITH CHECK (
          (auth.jwt() ->> 'user_role') = 'admin'
          AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attribution_rules' AND policyname = 'admin_update_attribution_rules'
  ) THEN
    EXECUTE $p$
      CREATE POLICY admin_update_attribution_rules ON attribution_rules
        FOR UPDATE
        USING (
          (auth.jwt() ->> 'user_role') = 'admin'
          AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
        WITH CHECK (
          (auth.jwt() ->> 'user_role') = 'admin'
          AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    $p$;
  END IF;
END;
$rls$;

-- ── Seed : règle par défaut "Standard 50/50" ─────────────────────────────────

INSERT INTO attribution_rules (tenant_id, rule_name, description, conditions, percentages, is_default)
SELECT t.id, 'Standard 50/50', 'Répartition égale entre le qualificateur et le closer', '{}'::jsonb, '{"qualifier": 50, "closer": 50}'::jsonb, true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM attribution_rules ar WHERE ar.tenant_id = t.id AND ar.is_default = true AND ar.deleted_at IS NULL
);

-- ── Colonne attribution_result sur club_prospects ─────────────────────────────

DO $col$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_prospects' AND column_name = 'attribution_result'
  ) THEN
    ALTER TABLE club_prospects ADD COLUMN attribution_result JSONB;
  END IF;
END;
$col$;
