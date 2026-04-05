-- Story 57-5 — Fonction stats hover implantation
CREATE OR REPLACE FUNCTION get_implantation_hover_stats(
  p_implantation_id UUID,
  p_month_start     TIMESTAMPTZ,
  p_month_end       TIMESTAMPTZ
)
RETURNS TABLE (
  attendance_rate_pct      NUMERIC,
  mastery_rate_pct         NUMERIC,
  session_count_this_month BIGINT,
  active_group_count       BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(
      ROUND(
        100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(a.id), 0),
        1
      ), 0
    ) AS attendance_rate_pct,
    COALESCE(
      ROUND(
        100.0 * SUM(CASE WHEN e.signal = 'acquired' THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(e.id), 0),
        1
      ), 0
    ) AS mastery_rate_pct,
    COUNT(DISTINCT s.id) FILTER (
      WHERE s.date BETWEEN p_month_start AND p_month_end
    ) AS session_count_this_month,
    (
      SELECT COUNT(*) FROM groups g2
      WHERE g2.implantation_id = p_implantation_id
        AND g2.deleted_at IS NULL
        AND g2.is_transient = false
    ) AS active_group_count
  FROM sessions s
  JOIN groups g     ON g.id = s.group_id
  LEFT JOIN attendances a  ON a.session_id = s.id
  LEFT JOIN evaluations e  ON e.session_id = s.id
  WHERE g.implantation_id = p_implantation_id
    AND s.date BETWEEN p_month_start AND p_month_end
    AND s.deleted_at IS NULL;
$$;
