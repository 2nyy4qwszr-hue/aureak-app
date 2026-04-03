-- Migration 00081 : Enrichissement RBFA — colonnes de matching sur club_directory
-- Story 28-1 — RBFA enrichissement clubs

-- ── Colonnes RBFA sur club_directory ────────────────────────────────────────

ALTER TABLE club_directory
  ADD COLUMN rbfa_id           TEXT          NULL,
  ADD COLUMN rbfa_url          TEXT          NULL,
  ADD COLUMN rbfa_logo_url     TEXT          NULL,
  ADD COLUMN rbfa_confidence   NUMERIC(5, 2) NULL,
  ADD COLUMN rbfa_status       TEXT          NOT NULL DEFAULT 'pending'
                               CHECK (rbfa_status IN ('pending', 'matched', 'rejected', 'skipped')),
  ADD COLUMN last_verified_at  TIMESTAMPTZ   NULL;

COMMENT ON COLUMN club_directory.rbfa_id
  IS 'Identifiant interne RBFA extrait de l''URL de la fiche club (ex: "123").';
COMMENT ON COLUMN club_directory.rbfa_url
  IS 'URL directe de la fiche club sur rbfa.be.';
COMMENT ON COLUMN club_directory.rbfa_logo_url
  IS 'URL source du logo sur les serveurs RBFA (référence uniquement — ne pas afficher directement côté client).';
COMMENT ON COLUMN club_directory.rbfa_confidence
  IS 'Score de matching 0–100 calculé par l''algorithme club-matching.';
COMMENT ON COLUMN club_directory.rbfa_status
  IS 'pending = non traité / matched = import auto validé / rejected = rejeté (score faible) / skipped = aucun résultat RBFA.';
COMMENT ON COLUMN club_directory.last_verified_at
  IS 'Date du dernier passage du job syncMissingClubLogos pour ce club.';

-- ── Index batch ───────────────────────────────────────────────────────────────
-- Utilisé par syncMissingClubLogos pour sélectionner les clubs à traiter

CREATE INDEX idx_club_directory_rbfa_status
  ON club_directory (tenant_id, rbfa_status)
  WHERE deleted_at IS NULL;
