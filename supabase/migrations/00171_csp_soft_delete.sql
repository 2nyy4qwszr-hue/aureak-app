-- Migration 00171 — Soft-delete sur child_stage_participations
-- Story 105.2 : la gestion des participants stage doit pouvoir "retirer" un
-- gardien sans suppression physique (cf. règle absolue Aureak "soft-delete
-- uniquement"). On ajoute deleted_at + on remplace la contrainte unique pour
-- autoriser la ré-inscription après un retrait.

ALTER TABLE child_stage_participations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN child_stage_participations.deleted_at IS
  'Soft-delete : NULL = inscrit, valeur = retiré. La ligne est conservée pour
   audit et permettre une ré-inscription par UPDATE deleted_at = NULL.';

-- Remplace la contrainte unique (tenant_id, child_id, stage_id) par un index
-- partiel sur les inscriptions actives uniquement, pour autoriser une ré-inscription
-- après soft-delete.
ALTER TABLE child_stage_participations
  DROP CONSTRAINT IF EXISTS uq_child_stage;

CREATE UNIQUE INDEX IF NOT EXISTS uq_child_stage_active
  ON child_stage_participations (tenant_id, child_id, stage_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_csp_deleted_at
  ON child_stage_participations (deleted_at)
  WHERE deleted_at IS NOT NULL;
