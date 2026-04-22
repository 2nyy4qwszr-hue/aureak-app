-- Epic 96 — Story 96.1 : Lier club_prospects à club_directory (anti-doublon)
-- Ajoute une FK nullable vers l'annuaire + un index partiel unique pour empêcher
-- les doublons applicatifs (1 prospect actif par club de l'annuaire par tenant).

-- 1. Colonne FK
ALTER TABLE club_prospects
  ADD COLUMN IF NOT EXISTS club_directory_id UUID
    REFERENCES club_directory(id) ON DELETE SET NULL;

COMMENT ON COLUMN club_prospects.club_directory_id IS
  'Lien vers l''annuaire (club_directory). NULL = club hors annuaire ou prospect créé avant 00166 (non rétro-backfillé).';

-- 2. Unique index partiel : un seul prospect actif par club par tenant
-- "Actif" = non supprimé ET pas en terminaison (converti/perdu).
CREATE UNIQUE INDEX IF NOT EXISTS uq_club_prospects_active_directory
  ON club_prospects(tenant_id, club_directory_id)
  WHERE deleted_at IS NULL
    AND status NOT IN ('converti', 'perdu')
    AND club_directory_id IS NOT NULL;

-- 3. Index non-unique pour la vue inverse (prospects d'un club donné)
CREATE INDEX IF NOT EXISTS idx_club_prospects_directory
  ON club_prospects(club_directory_id)
  WHERE deleted_at IS NULL;
