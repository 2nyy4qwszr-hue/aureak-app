-- =============================================================================
-- Migration 00011 : Extend profiles — champs enfant
-- Ajoute les colonnes spécifiques au rôle 'child' sur la table profiles existante.
-- Utilisé sur la base de production (ADD COLUMN IF NOT EXISTS = idempotent).
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes      TEXT,
  ADD COLUMN IF NOT EXISTS birth_date          DATE,
  ADD COLUMN IF NOT EXISTS gender              TEXT,
  ADD COLUMN IF NOT EXISTS strong_foot         TEXT,
  ADD COLUMN IF NOT EXISTS age_category        TEXT,
  ADD COLUMN IF NOT EXISTS current_club        TEXT,
  ADD COLUMN IF NOT EXISTS parent_first_name   TEXT,
  ADD COLUMN IF NOT EXISTS parent_last_name    TEXT,
  ADD COLUMN IF NOT EXISTS parent_email        TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone        TEXT,
  ADD COLUMN IF NOT EXISTS parent2_first_name  TEXT,
  ADD COLUMN IF NOT EXISTS parent2_last_name   TEXT,
  ADD COLUMN IF NOT EXISTS parent2_email       TEXT,
  ADD COLUMN IF NOT EXISTS parent2_phone       TEXT;

-- Commentaires pour la lisibilité du schéma
COMMENT ON COLUMN profiles.phone              IS 'Téléphone (tous rôles)';
COMMENT ON COLUMN profiles.internal_notes     IS 'Notes internes admin/coach';
COMMENT ON COLUMN profiles.birth_date         IS 'Date de naissance (child)';
COMMENT ON COLUMN profiles.gender             IS 'Genre : male | female | other (child)';
COMMENT ON COLUMN profiles.strong_foot        IS 'Pied fort : right | left | both (child)';
COMMENT ON COLUMN profiles.age_category       IS 'Catégorie d''âge football : Foot à 5 | Foot à 8 | Foot à 11 | Senior (child)';
COMMENT ON COLUMN profiles.current_club       IS 'Club actuel (child)';
COMMENT ON COLUMN profiles.parent_first_name  IS 'Prénom parent 1 (child)';
COMMENT ON COLUMN profiles.parent_last_name   IS 'Nom parent 1 (child)';
COMMENT ON COLUMN profiles.parent_email       IS 'Email parent 1 (child)';
COMMENT ON COLUMN profiles.parent_phone       IS 'Téléphone parent 1 (child)';
COMMENT ON COLUMN profiles.parent2_first_name IS 'Prénom parent 2 (child)';
COMMENT ON COLUMN profiles.parent2_last_name  IS 'Nom parent 2 (child)';
COMMENT ON COLUMN profiles.parent2_email      IS 'Email parent 2 (child)';
COMMENT ON COLUMN profiles.parent2_phone      IS 'Téléphone parent 2 (child)';
