-- Story 57-2 — Capacité maximale par implantation
ALTER TABLE implantations
  ADD COLUMN IF NOT EXISTS max_players INT NULL;

COMMENT ON COLUMN implantations.max_players IS
  'Capacité maximale de joueurs simultanés sur ce site (NULL = illimitée)';
