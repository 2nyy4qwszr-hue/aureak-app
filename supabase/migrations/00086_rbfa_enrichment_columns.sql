-- Migration 00086 — Colonnes RBFA sur club_directory
-- Story 28-3 — Prérequis pour l'import de logos depuis rbfa.be
-- (Les numéros 00081/00082 planifiés en 28-1 ont été pris par d'autres stories)

ALTER TABLE club_directory
  ADD COLUMN IF NOT EXISTS rbfa_id          TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_url         TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_logo_url    TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_confidence  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS rbfa_status      TEXT DEFAULT 'pending'
                             CONSTRAINT club_directory_rbfa_status_check
                             CHECK (rbfa_status IN ('pending','matched','rejected','skipped')),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN club_directory.rbfa_id          IS 'Identifiant interne RBFA du club (extrait de l''URL)';
COMMENT ON COLUMN club_directory.rbfa_url         IS 'URL de la fiche club sur rbfa.be';
COMMENT ON COLUMN club_directory.rbfa_logo_url    IS 'URL source du logo sur le CDN RBFA (référence uniquement, pas stocké)';
COMMENT ON COLUMN club_directory.rbfa_confidence  IS 'Score de matching RBFA 0–100';
COMMENT ON COLUMN club_directory.rbfa_status      IS 'Statut du matching RBFA : pending | matched | rejected | skipped';
COMMENT ON COLUMN club_directory.last_verified_at IS 'Date du dernier passage du job de sync RBFA';

-- Index pour les requêtes batch (filtre sur rbfa_status)
CREATE INDEX IF NOT EXISTS idx_club_directory_rbfa_status
  ON club_directory(tenant_id, rbfa_status)
  WHERE deleted_at IS NULL;
