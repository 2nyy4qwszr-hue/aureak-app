-- Migration 00073 — Séparation nom/prénom pour child_directory
-- Story 18.5 — display_name conservé comme fallback pour les joueurs importés depuis Notion
-- sans nom/prenom séparés.

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS nom    TEXT,
  ADD COLUMN IF NOT EXISTS prenom TEXT;

COMMENT ON COLUMN child_directory.nom    IS 'Nom de famille (MAJUSCULES à l''affichage)';
COMMENT ON COLUMN child_directory.prenom IS 'Prénom (première lettre majuscule)';
