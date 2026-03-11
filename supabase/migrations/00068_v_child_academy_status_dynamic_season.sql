-- =============================================================================
-- Migration 00068 : Saison académie dynamique — v_child_academy_status
-- =============================================================================
-- PROBLÈME : la vue précédente se base sur `is_current = true` (flag manuel).
--            Si personne ne met à jour ce flag en début de saison, tous les
--            académiciens apparaissent comme ANCIEN.
-- SOLUTION : calcul automatique de la saison effective par tenant, avec
--            priorité : is_current DESC → date courante ∈ [start,end] DESC
--                       → start_date DESC (la plus récente).
--
-- Aucun changement TypeScript, API, ni frontend requis.
-- La colonne `current_season_label` reste présente avec le même nom.
-- =============================================================================

CREATE OR REPLACE VIEW v_child_academy_status AS
WITH

-- ── Saison effective par tenant ───────────────────────────────────────────────
-- Ordre de priorité :
--  1. is_current = true (flag manuel explicite)
--  2. CURRENT_DATE compris dans [start_date, end_date]  (détection automatique)
--  3. start_date DESC  (la saison la plus récente comme fallback)
effective_season AS (
  SELECT DISTINCT ON (tenant_id)
    tenant_id,
    id    AS season_id,
    label AS season_label
  FROM  academy_seasons
  ORDER BY
    tenant_id,
    is_current                                              DESC,
    (CURRENT_DATE BETWEEN start_date AND end_date)         DESC,
    start_date                                             DESC
),

-- ── Statistiques académie par enfant ─────────────────────────────────────────
academy_stats AS (
  SELECT
    m.child_id,
    m.tenant_id,
    COUNT(DISTINCT m.season_id)                            AS total_seasons,
    -- Compare l'adhésion de l'enfant à la saison effective (pas au flag is_current)
    BOOL_OR(m.season_id = es.season_id)                   AS in_current_season,
    MIN(s.label)                                           AS first_season_label,
    MAX(s.label)                                           AS last_season_label
  FROM  child_academy_memberships m
  JOIN  academy_seasons  s  ON s.id         = m.season_id
                            AND s.tenant_id  = m.tenant_id
  JOIN  effective_season es  ON es.tenant_id = m.tenant_id
  GROUP BY m.child_id, m.tenant_id
),

-- ── Statistiques stages par enfant ───────────────────────────────────────────
stage_stats AS (
  SELECT
    p.child_id,
    p.tenant_id,
    COUNT(DISTINCT p.stage_id)                             AS total_stages,
    MIN(st.name)                                           AS first_stage_name,
    MAX(st.name)                                           AS last_stage_name,
    MIN(st.start_date)                                     AS first_stage_date,
    MAX(st.start_date)                                     AS last_stage_date
  FROM  child_stage_participations p
  JOIN  stages st ON st.id        = p.stage_id
                  AND st.tenant_id = p.tenant_id
  WHERE p.participation_status <> 'cancelled'
  GROUP BY p.child_id, p.tenant_id
)

SELECT
  c.id                                                     AS child_id,
  c.tenant_id,
  c.display_name,
  COALESCE(a.total_seasons,     0)                         AS total_academy_seasons,
  COALESCE(a.in_current_season, false)                     AS in_current_season,
  a.first_season_label,
  a.last_season_label,
  -- Nom de la saison courante calculée dynamiquement
  es.season_label                                          AS current_season_label,
  COALESCE(ss.total_stages,     0)                         AS total_stages,
  ss.first_stage_name,
  ss.last_stage_name,
  ss.first_stage_date,
  ss.last_stage_date,
  CASE
    WHEN COALESCE(a.in_current_season, false) AND COALESCE(a.total_seasons, 0) = 1
      THEN 'NOUVEAU_ACADÉMICIEN'
    WHEN COALESCE(a.in_current_season, false)
      THEN 'ACADÉMICIEN'
    WHEN COALESCE(a.total_seasons, 0) > 0
      THEN 'ANCIEN'
    WHEN COALESCE(ss.total_stages, 0) > 0
      THEN 'STAGE_UNIQUEMENT'
    ELSE 'PROSPECT'
  END                                                      AS computed_status
FROM  child_directory c
LEFT JOIN academy_stats    a  ON a.child_id   = c.id AND a.tenant_id  = c.tenant_id
LEFT JOIN stage_stats      ss ON ss.child_id  = c.id AND ss.tenant_id = c.tenant_id
LEFT JOIN effective_season es ON es.tenant_id = c.tenant_id
WHERE c.deleted_at IS NULL;
