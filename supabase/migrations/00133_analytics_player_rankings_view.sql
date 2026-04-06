-- Migration 00133 : Vue classement joueurs pour analytics (Story 60.6)
-- Vue v_player_attendance_ranking : classement par taux de présence
-- weekly_delta : stub à 0 (enrichissement LAG window dans itération future)

-- ── Vue présence ranking ──────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_player_attendance_ranking AS
WITH ranked AS (
  SELECT
    cd.id                                                                          AS child_id,
    cd.display_name,
    g.name                                                                         AS group_name,
    ROUND(
      AVG(CASE WHEN a.status = 'present' THEN 100.0 ELSE 0 END)::numeric,
      1
    )                                                                              AS attendance_rate,
    ROW_NUMBER() OVER (
      ORDER BY AVG(CASE WHEN a.status = 'present' THEN 100.0 ELSE 0 END) DESC
    )                                                                              AS rank
  FROM child_directory cd
  JOIN group_members gm    ON gm.child_id = cd.id
  JOIN groups g             ON g.id = gm.group_id AND g.is_transient = false
  JOIN sessions s           ON s.group_id = g.id AND s.deleted_at IS NULL
  JOIN attendances a ON a.session_id = s.id AND a.child_id = cd.id
  WHERE cd.deleted_at IS NULL
  GROUP BY cd.id, cd.display_name, g.name
)
SELECT
  child_id,
  display_name,
  group_name,
  attendance_rate  AS value,
  rank,
  0                AS weekly_delta
FROM ranked;

-- ── Vue XP ranking (basé sur count évaluations si xp_ledger non disponible) ───

CREATE OR REPLACE VIEW v_player_xp_ranking AS
WITH xp_totals AS (
  SELECT
    p.user_id                                                                        AS child_id,
    p.display_name,
    COALESCE(g.name, 'Sans groupe')                                               AS group_name,
    COALESCE(SUM(xl.xp_delta), 0)::numeric                                            AS total_xp,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(SUM(xl.xp_delta), 0) DESC
    )                                                                              AS rank
  FROM profiles p
  LEFT JOIN group_members gm ON gm.child_id = p.user_id
  LEFT JOIN groups g          ON g.id = gm.group_id AND g.is_transient = false
  LEFT JOIN xp_ledger xl      ON xl.child_id = p.user_id
  WHERE p.user_role = 'child'
  GROUP BY p.user_id, p.display_name, g.name
)
SELECT
  child_id,
  display_name,
  group_name,
  total_xp         AS value,
  rank,
  0                AS weekly_delta
FROM xp_totals;

-- ── Commentaires ─────────────────────────────────────────────────────────────
-- weekly_delta est un stub à 0 — à enrichir via fonction LAG dans une story future
-- Les vues sont accessible via le client Supabase avec RLS policies existantes
-- Note : pas de GRANT séparé nécessaire — les vues héritent des policies des tables sous-jacentes
