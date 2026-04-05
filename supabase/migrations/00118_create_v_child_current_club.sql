-- Migration 00118 — Story 49-7 : Vue v_child_current_club
-- Calcule automatiquement le club de la saison courante pour chaque joueur
-- depuis child_directory_history, en joignant sur academy_seasons (is_current=true).
-- La vue est complémentaire à v_child_academy_status et n'écrase jamais current_club.
-- Idempotente : CREATE OR REPLACE VIEW.

CREATE OR REPLACE VIEW v_child_current_club AS
WITH effective_season AS (
  SELECT DISTINCT ON (tenant_id)
    id        AS season_id,
    tenant_id,
    label     AS saison_label
  FROM academy_seasons
  WHERE is_current = true
  ORDER BY tenant_id, start_date DESC
)
SELECT
  h.child_id,
  h.tenant_id,
  h.saison,
  h.club_nom,
  h.club_directory_id,
  cd.nom AS club_nom_annuaire
FROM child_directory_history h
JOIN effective_season es
  ON es.tenant_id   = h.tenant_id
 AND es.saison_label = h.saison
LEFT JOIN club_directory cd
  ON cd.id = h.club_directory_id;
