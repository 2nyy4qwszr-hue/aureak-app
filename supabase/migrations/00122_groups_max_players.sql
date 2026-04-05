-- Story 56.6 — Indicateur de capacité groupe
-- Ajout colonne max_players sur la table groups
-- Valeur par défaut : 20 joueurs (appliquée aux groupes existants)

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 20;

COMMENT ON COLUMN groups.max_players IS
  'Capacité maximale du groupe en nb joueurs (Story 56.6). Seuils : < 80% neutre, 80–99% orange, 100% rouge, > 100% rouge vif.';
