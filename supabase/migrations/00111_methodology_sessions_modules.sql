-- Migration 00111 — Ajout colonne modules JSONB sur methodology_sessions
-- Story 43.3 — Modules structurés dans un entraînement Goal & Player

ALTER TABLE methodology_sessions
  ADD COLUMN IF NOT EXISTS modules JSONB;

COMMENT ON COLUMN methodology_sessions.modules IS
  'Modules structurés Goal & Player. Format: [{num: 1, titre: "...", range: "1-5"}, ...]';
