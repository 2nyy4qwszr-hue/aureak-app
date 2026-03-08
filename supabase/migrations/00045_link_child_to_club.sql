-- =============================================================================
-- Migration 00041 : Liaison child_directory → club_directory
-- Ajoute club_directory_id FK sur child_directory
-- puis auto-matche les enfants via correspondance exacte (insensible à la casse)
-- sur current_club TEXT ↔ club_directory.nom
-- =============================================================================

-- 1. Ajoute la colonne FK (nullable — pas tous les clubs sont dans l'annuaire)
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS club_directory_id UUID REFERENCES club_directory(id);

CREATE INDEX IF NOT EXISTS idx_child_directory_club
  ON child_directory(club_directory_id)
  WHERE club_directory_id IS NOT NULL AND deleted_at IS NULL;

-- 2. Auto-match : current_club TEXT → club_directory.id via égalité exacte ci
--    Sécurisé : LIMIT 1 évite les doublons de nom. Idempotent (WHERE club_directory_id IS NULL).
UPDATE child_directory cd
SET    club_directory_id = (
  SELECT cl.id
  FROM   club_directory cl
  WHERE  cl.tenant_id   = cd.tenant_id
    AND  lower(trim(cl.nom)) = lower(trim(cd.current_club))
    AND  cl.deleted_at IS NULL
  LIMIT 1
)
WHERE  cd.current_club       IS NOT NULL
  AND  cd.club_directory_id  IS NULL
  AND  cd.deleted_at         IS NULL;
