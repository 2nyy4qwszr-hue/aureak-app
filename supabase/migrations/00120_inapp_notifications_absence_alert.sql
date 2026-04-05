-- Migration 00120 — Alertes absence pattern (Story 54-7)
-- Ajoute la colonne payload JSONB à inapp_notifications pour les alertes absence
-- et étend le CHECK type pour inclure 'absence_alert'.

-- 1. Colonne payload JSONB nullable
ALTER TABLE inapp_notifications
  ADD COLUMN IF NOT EXISTS payload JSONB;

-- 2. Étendre le CHECK de la colonne type pour accepter 'absence_alert'
-- PostgreSQL ne supporte pas ALTER CONSTRAINT; on doit recréer la contrainte.
ALTER TABLE inapp_notifications
  DROP CONSTRAINT IF EXISTS inapp_notifications_type_check;

ALTER TABLE inapp_notifications
  ADD CONSTRAINT inapp_notifications_type_check
  CHECK (type IN ('info', 'warning', 'success', 'error', 'absence_alert'));

COMMENT ON COLUMN inapp_notifications.payload IS
  'Story 54-7 — Données structurées de l''alerte (ex: { childId, childName, absenceCount, groupId, groupName })';
