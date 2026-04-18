-- Story 90.1 — Pipeline entraîneurs : coach_prospects + enum 4 étapes + RLS + index + trigger

-- 1. Enum coach_prospect_status (4 valeurs pipeline recrutement)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_prospect_status') THEN
    CREATE TYPE coach_prospect_status AS ENUM (
      'identified',
      'contacted',
      'interview',
      'recruited'
    );
  END IF;
END $$;

-- 2. Table coach_prospects
CREATE TABLE IF NOT EXISTS coach_prospects (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  name                  TEXT        NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  status                coach_prospect_status NOT NULL DEFAULT 'identified',
  experience_years      INT,
  diplomas              TEXT[],
  assigned_manager_id   UUID        REFERENCES auth.users(id),
  source                TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_coach_prospects_tenant_status
  ON coach_prospects(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coach_prospects_manager
  ON coach_prospects(assigned_manager_id)
  WHERE deleted_at IS NULL;

-- 4. RLS enable
ALTER TABLE coach_prospects ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- SELECT : admin et manager voient tout le tenant, coach lecture seule
CREATE POLICY coach_prospects_select ON coach_prospects FOR SELECT USING (
  deleted_at IS NULL
  AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') IN ('admin', 'commercial')
    OR assigned_manager_id = auth.uid()
    OR (auth.jwt() ->> 'role') = 'coach'
  )
);

-- INSERT : admin ou manager
CREATE POLICY coach_prospects_insert ON coach_prospects FOR INSERT WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') IN ('admin', 'commercial')
    OR assigned_manager_id = auth.uid()
  )
);

-- UPDATE : admin ou manager assigné
CREATE POLICY coach_prospects_update ON coach_prospects FOR UPDATE USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') IN ('admin', 'commercial')
    OR assigned_manager_id = auth.uid()
  )
);

-- 6. Trigger updated_at
CREATE OR REPLACE FUNCTION update_coach_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coach_prospects_updated_at ON coach_prospects;
CREATE TRIGGER trg_coach_prospects_updated_at
  BEFORE UPDATE ON coach_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_prospects_updated_at();
