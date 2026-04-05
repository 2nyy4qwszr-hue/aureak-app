-- Story 58-2 — Schéma tactique JSON sur situations pédagogiques
ALTER TABLE methodology_situations
  ADD COLUMN IF NOT EXISTS diagram_json JSONB NULL;

COMMENT ON COLUMN methodology_situations.diagram_json IS
  'Schéma tactique sérialisé (DiagramData) — joueurs + flèches en coordonnées % terrain';
