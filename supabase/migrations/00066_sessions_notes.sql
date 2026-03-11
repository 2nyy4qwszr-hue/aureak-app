-- Story 19.5 — Champ notes libre sur les séances (commentaire admin)
-- Optionnel, nullable, sans impact sur les séances existantes

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
