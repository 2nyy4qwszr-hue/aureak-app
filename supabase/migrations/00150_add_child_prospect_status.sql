-- Story 89.1 — Statut prospect sur child_directory (gardiens)
-- Enum distinct de `prospect_status` (clubs pipeline Story 88.2)

-- 1. Créer l'enum (idempotent)
DO $$ BEGIN
  CREATE TYPE child_prospect_status AS ENUM (
    'identified',
    'contacted',
    'trial_scheduled',
    'trial_done',
    'converted',
    'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter la colonne (idempotent)
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS prospect_status child_prospect_status NULL DEFAULT NULL;

-- 3. Index pour filtre rapide
CREATE INDEX IF NOT EXISTS idx_child_directory_prospect_status
  ON child_directory (prospect_status)
  WHERE prospect_status IS NOT NULL AND deleted_at IS NULL;
