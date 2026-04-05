-- Migration 00116 — Story 49.8
-- Création de la fonction RPC get_implantation_stats
-- Appelée par : @aureak/api-client/src/admin/supervision.ts → getImplantationStats()
-- Retourne les stats d'assiduité et de maîtrise par implantation sur une période donnée.
--
-- Schéma réel utilisé :
--   sessions.scheduled_at   (colonne de date — pas session_date)
--   attendances.status       enum attendance_status ('present','absent','injured','late','trial')
--   evaluations.(receptivite|gout_effort|attitude)  enum evaluation_signal ('positive','attention','none')
--
-- DROP préalable nécessaire si la signature du type de retour a changé
DROP FUNCTION IF EXISTS get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_implantation_stats(
  p_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_to   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  implantation_id     UUID,
  implantation_name   TEXT,
  tenant_id           UUID,
  sessions_total      BIGINT,
  sessions_closed     BIGINT,
  attendance_rate_pct NUMERIC,
  mastery_rate_pct    NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id                                                      AS implantation_id,
    i.name                                                    AS implantation_name,
    i.tenant_id                                               AS tenant_id,
    COUNT(DISTINCT s.id)                                      AS sessions_total,
    COUNT(DISTINCT s.id) FILTER (
      WHERE s.status = 'closed'
    )                                                         AS sessions_closed,
    -- Taux de présence : présents / total enregistrés
    ROUND(
      100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present')
      / NULLIF(COUNT(a.id), 0),
      1
    )                                                         AS attendance_rate_pct,
    -- Taux de maîtrise : signaux 'positive' / (positive + attention)
    -- On agrège les 3 colonnes d'évaluation en dénombrant par signal
    ROUND(
      100.0 * (
        COUNT(ev.id) FILTER (WHERE ev.receptivite = 'positive')
        + COUNT(ev.id) FILTER (WHERE ev.gout_effort = 'positive')
        + COUNT(ev.id) FILTER (WHERE ev.attitude = 'positive')
      )
      / NULLIF(
        (
          COUNT(ev.id) FILTER (WHERE ev.receptivite <> 'none')
          + COUNT(ev.id) FILTER (WHERE ev.gout_effort <> 'none')
          + COUNT(ev.id) FILTER (WHERE ev.attitude <> 'none')
        ),
        0
      ),
      1
    )                                                         AS mastery_rate_pct
  FROM implantations i
  JOIN groups g
    ON g.implantation_id = i.id
   AND g.deleted_at IS NULL
   AND g.is_transient  = false
  JOIN sessions s
    ON s.group_id    = g.id
   AND s.scheduled_at BETWEEN p_from AND p_to
   AND s.deleted_at  IS NULL
  LEFT JOIN attendances a
    ON a.session_id = s.id
  LEFT JOIN evaluations ev
    ON ev.session_id = s.id
  WHERE i.deleted_at IS NULL
    AND i.tenant_id  = (
      SELECT tenant_id FROM profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  GROUP BY i.id, i.name, i.tenant_id
  ORDER BY i.name
$$;

-- Permissions : accessible uniquement aux utilisateurs authentifiés (RLS côté app)
REVOKE ALL ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
