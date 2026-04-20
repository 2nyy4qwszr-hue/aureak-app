-- Epic 89 — Story 89.6 (suite)
--
-- Index sur `prospect_status = 'candidat'` extrait de la migration 00155 car
-- PostgreSQL interdit l'usage d'une nouvelle valeur d'enum dans la même
-- transaction que son ALTER TYPE ADD VALUE.
--
-- Prérequis : migration 00155 doit avoir été appliquée et commitée pour que
-- la valeur 'candidat' soit disponible.

CREATE INDEX IF NOT EXISTS idx_child_directory_candidat
  ON child_directory(tenant_id)
  WHERE deleted_at IS NULL AND prospect_status = 'candidat';
