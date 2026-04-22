-- Epic 90 — Story 90.1 : Pipeline prospection entraîneurs (4 étapes + perdu)
-- Table coach_prospects : autonome (séparée de profiles des coachs actifs).
-- La FK recommended_by_coach_id est ajoutée dès maintenant (préparation Story 90.2).

-- 1. Enum coach_prospect_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_prospect_status') THEN
    CREATE TYPE coach_prospect_status AS ENUM (
      'identifie',
      'info_envoyee',
      'en_formation',
      'actif',
      'perdu'
    );
  END IF;
END $$;

-- 2. Table coach_prospects
CREATE TABLE IF NOT EXISTS coach_prospects (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  first_name                TEXT NOT NULL,
  last_name                 TEXT NOT NULL,
  email                     TEXT,
  phone                     TEXT,
  city                      TEXT,
  status                    coach_prospect_status NOT NULL DEFAULT 'identifie',
  current_club              TEXT,
  specialite                TEXT,
  assigned_commercial_id    UUID REFERENCES auth.users(id),
  recommended_by_coach_id   UUID REFERENCES profiles(user_id),
  source                    TEXT,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coach_prospects_tenant_status
  ON coach_prospects(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coach_prospects_assigned_commercial
  ON coach_prospects(assigned_commercial_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coach_prospects_recommended_by
  ON coach_prospects(recommended_by_coach_id)
  WHERE deleted_at IS NULL;

-- 3. RLS
ALTER TABLE coach_prospects ENABLE ROW LEVEL SECURITY;

-- SELECT : admin tenant + commercial assigné + coach recommendeur
CREATE POLICY coach_prospects_select
  ON coach_prospects FOR SELECT
  USING (
    deleted_at IS NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR assigned_commercial_id = auth.uid()
      OR recommended_by_coach_id = auth.uid()
    )
  );

-- INSERT : admin OU commercial (sur son propre tenant) OU coach (recommandation, story 90-2)
CREATE POLICY coach_prospects_insert
  ON coach_prospects FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR (current_user_role() = 'commercial' AND (assigned_commercial_id = auth.uid() OR assigned_commercial_id IS NULL))
      OR (current_user_role() = 'coach' AND recommended_by_coach_id = auth.uid())
    )
  );

-- UPDATE : admin OU commercial assigné
CREATE POLICY coach_prospects_update
  ON coach_prospects FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR assigned_commercial_id = auth.uid()
    )
  );

-- 4. Trigger updated_at
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

-- 5. Comments
COMMENT ON TABLE coach_prospects IS 'Pipeline prospection entraîneurs (Epic 90). Table autonome — un prospect peut devenir coach actif sans suppression de la ligne (historique pipeline conservé).';
COMMENT ON COLUMN coach_prospects.status IS 'identifie → info_envoyee → en_formation → actif (4 étapes) + perdu (dead end).';
COMMENT ON COLUMN coach_prospects.recommended_by_coach_id IS 'FK profiles(user_id) — coach interne ayant recommandé ce prospect (Story 90.2).';
COMMENT ON COLUMN coach_prospects.specialite IS 'Format libre (ex. "gardiens U13", "analyse vidéo"). Suggestions UI à venir.';
