-- Story 89.3 — Table scout_evaluations pour noter les gardiens prospects
-- FK vers child_directory (gardiens) et profiles (scouts)

CREATE TABLE IF NOT EXISTS scout_evaluations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  scout_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes      TEXT,
  criteria   JSONB NOT NULL DEFAULT '{}'::jsonb,
  tenant_id  UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_scout_evaluations_child_id  ON scout_evaluations(child_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_scout_evaluations_scout_id  ON scout_evaluations(scout_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_scout_evaluations_tenant_id ON scout_evaluations(tenant_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE scout_evaluations ENABLE ROW LEVEL SECURITY;

-- Admin + scout : lecture
CREATE POLICY scout_evaluations_select ON scout_evaluations
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'scout', 'coach'))
    )
  );

-- Admin + scout : insertion
CREATE POLICY scout_evaluations_insert ON scout_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'scout'))
  );

-- Admin + scout : mise à jour (soft-delete)
CREATE POLICY scout_evaluations_update ON scout_evaluations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'scout'))
  );
