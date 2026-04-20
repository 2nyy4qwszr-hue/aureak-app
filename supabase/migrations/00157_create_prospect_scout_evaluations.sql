-- Epic 89 — Story 89.2 : Note + évaluation rapide scout sur gardien prospect
-- Table dédiée aux observations terrain des scouts (commercial/admin) sur des
-- gardiens prospects. Distincte de `evaluations` (coach, pipeline pédagogique).

-- 1. Enum contexte d'observation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scout_observation_context') THEN
    CREATE TYPE scout_observation_context AS ENUM (
      'match',              -- observation en match officiel
      'tournoi',             -- observation en tournoi
      'entrainement_club',   -- observation à l'entraînement de son club actuel
      'autre'                -- libre (stage, sélection, vidéo…)
    );
  END IF;
END $$;

-- 2. Table prospect_scout_evaluations
CREATE TABLE IF NOT EXISTS prospect_scout_evaluations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id),
  child_id             UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  evaluator_id         UUID        NOT NULL REFERENCES auth.users(id),

  -- Évaluation
  rating_stars         SMALLINT    NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
  comment              TEXT,
  observation_context  scout_observation_context,
  observation_date     DATE,

  -- Timestamps + soft-delete
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- 3. Index de lecture
CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_child
  ON prospect_scout_evaluations(child_id, observation_date DESC NULLS LAST, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_tenant
  ON prospect_scout_evaluations(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_evaluator
  ON prospect_scout_evaluations(evaluator_id)
  WHERE deleted_at IS NULL;

-- 4. RLS — isolation tenant + gate 24h pour update
ALTER TABLE prospect_scout_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pse_select ON prospect_scout_evaluations;
CREATE POLICY pse_select
  ON prospect_scout_evaluations FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS pse_insert ON prospect_scout_evaluations;
CREATE POLICY pse_insert
  ON prospect_scout_evaluations FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND evaluator_id = auth.uid()
  );

-- UPDATE = édition (auteur, < 24h) OU soft-delete admin (deleted_at)
-- La policy autorise l'UPDATE au tenant ; la gate 24h se joue côté WITH CHECK et côté client.
-- Un admin contourne la fenêtre pour soft-delete uniquement (enforced côté api-client : deleteScoutEvaluation n'envoie QUE deleted_at).
DROP POLICY IF EXISTS pse_update ON prospect_scout_evaluations;
CREATE POLICY pse_update
  ON prospect_scout_evaluations FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      -- Cas 1 : auteur dans la fenêtre 24h — édition libre
      (evaluator_id = auth.uid() AND created_at > now() - interval '24 hours')
      -- Cas 2 : n'importe qui du tenant passe uniquement deleted_at (soft-delete)
      -- Note : on ne peut pas restreindre à un rôle spécifique côté RLS facilement ici
      -- sans helper. On s'appuie sur la validation côté api-client (deleteScoutEvaluation).
      OR deleted_at IS NOT NULL
    )
  );

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_prospect_scout_evals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pse_updated_at ON prospect_scout_evaluations;
CREATE TRIGGER trg_pse_updated_at
  BEFORE UPDATE ON prospect_scout_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_prospect_scout_evals_updated_at();

COMMENT ON TABLE prospect_scout_evaluations IS
  'Story 89.2 — observations terrain des scouts (commercial/admin) sur gardiens prospects. Distincte de `evaluations` (coach pipeline pédagogique).';
