-- Migration 00075 — Contact direct du joueur (email + téléphone)
-- Story 18.7 — Fiche joueur redesign : champs email et tel propres au joueur
-- email : adresse email du joueur (≠ emails parents)
-- tel   : téléphone du joueur (facultatif, ados/adultes)

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS tel   TEXT;

COMMENT ON COLUMN child_directory.email IS 'Email direct du joueur (distinct des emails parents)';
COMMENT ON COLUMN child_directory.tel   IS 'Téléphone du joueur (facultatif)';
