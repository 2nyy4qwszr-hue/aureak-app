-- Migration 00113 : Vue v_club_gardien_stats
-- Compteur de gardiens réels (hors prospects, avec participation) par club
-- Story 48.2 — Bug fix : vue manquante dans supabase/migrations/ (racine)
-- Source : aureak/supabase/_archive/migrations/00080_v_club_gardien_stats.sql

-- Index de performance sur club_id (couvert par la PK, mais explicite pour clarté)
CREATE INDEX IF NOT EXISTS idx_club_child_links_club_id
  ON club_directory_child_links (club_id);

-- Vue : nombre de gardiens réels par club
-- Note : club_directory_child_links n'a pas de RLS activé.
-- tenant_id inclus dans GROUP BY pour permettre un filtrage explicite par tenant côté API.
-- Les club_id étant des UUID globalement uniques (FK sur club_directory), le risque
-- de pollution cross-tenant est minimal en pratique — mais tenant_id reste obligatoire
-- pour une isolation correcte.
CREATE OR REPLACE VIEW v_club_gardien_stats AS
SELECT
  l.club_id,
  l.tenant_id,
  COUNT(DISTINCT l.child_id) AS gardien_count
FROM club_directory_child_links l
INNER JOIN v_child_academy_status s ON s.child_id = l.child_id
WHERE
  s.computed_status IS DISTINCT FROM 'PROSPECT'
  AND (s.total_academy_seasons > 0 OR s.total_stages > 0)
GROUP BY l.club_id, l.tenant_id;

COMMENT ON VIEW v_club_gardien_stats IS
  'Nombre de gardiens réels (hors prospects, avec au moins 1 participation académie ou stage) liés à chaque club de l''annuaire. Groupé par (club_id, tenant_id) pour isolation multi-tenant.';
