-- Story 20.4 — Position index fixe (1–25) par bloc dans la grille thèmes 5×5
-- Permet aux admins d'assigner un slot précis à chaque thème dans la grille.

ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS position_index INTEGER
  CONSTRAINT chk_themes_position_index CHECK (position_index BETWEEN 1 AND 25);

-- Index UNIQUE partiel : un seul thème COURANT par position dans chaque bloc.
-- Contraintes :
--   - group_id IS NOT NULL : thèmes sans bloc non contraints entre eux
--   - position_index IS NOT NULL : thèmes sans position non contraints
--   - is_current = true : les anciennes versions (is_current = false) peuvent
--     conserver leur position_index sans conflits lors du versionning
CREATE UNIQUE INDEX IF NOT EXISTS uq_themes_group_position
  ON themes (group_id, position_index)
  WHERE group_id IS NOT NULL AND position_index IS NOT NULL AND is_current = true;
