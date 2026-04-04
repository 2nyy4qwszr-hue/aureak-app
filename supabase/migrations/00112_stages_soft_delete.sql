-- =============================================================================
-- Migration 00112 : Ajout deleted_at sur la table stages
-- La table stages (créée en 00041, étendue en 00048) manquait la colonne
-- de soft-delete, ce qui provoquait une erreur 400 dans listStages().
-- =============================================================================

ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index partiel pour filtrer efficacement les stages non supprimés
CREATE INDEX IF NOT EXISTS idx_stages_not_deleted
  ON stages(tenant_id, start_date DESC)
  WHERE deleted_at IS NULL;
