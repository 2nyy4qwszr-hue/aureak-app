-- Migration 00061 : is_transient flag sur groups
-- Marque les groupes auto-créés pour les séances ponctuelles.
-- Ces groupes sont exclus de tous les sélecteurs UI (is_transient = false WHERE).
-- Non-breaking : DEFAULT false → tous les groupes existants restent groupes réels.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS is_transient BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN groups.is_transient IS
  'true = groupe technique auto-créé pour une séance ponctuelle — exclu de tous les sélecteurs UI';
