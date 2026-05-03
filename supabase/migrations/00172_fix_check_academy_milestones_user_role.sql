-- Fix : check_academy_milestones référençait `role` au lieu de `user_role`
-- (typo dans 00132). Erreur runtime: 42703 column "role" does not exist.

CREATE OR REPLACE FUNCTION check_academy_milestones(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_count    INTEGER;
  v_players_count     INTEGER;
  v_attendances_count INTEGER;
  v_newly_reached     JSONB := '[]'::JSONB;
  v_row               academy_milestones%ROWTYPE;
  v_current           INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_sessions_count
  FROM sessions
  WHERE tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND closed_at IS NOT NULL;

  SELECT COUNT(*)::INTEGER INTO v_players_count
  FROM profiles
  WHERE tenant_id = p_tenant_id
    AND user_role = 'child';

  SELECT COUNT(*)::INTEGER INTO v_attendances_count
  FROM attendance_records ar
  JOIN sessions s ON s.id = ar.session_id
  WHERE s.tenant_id = p_tenant_id;

  FOR v_row IN
    SELECT * FROM academy_milestones
    WHERE tenant_id = p_tenant_id
  LOOP
    CASE
      WHEN v_row.milestone_code LIKE 'SESSION_%' THEN
        v_current := v_sessions_count;
      WHEN v_row.milestone_code LIKE 'PLAYER_%' THEN
        v_current := v_players_count;
      WHEN v_row.milestone_code LIKE 'ATTENDANCE_%' THEN
        v_current := v_attendances_count;
      ELSE
        v_current := 0;
    END CASE;

    UPDATE academy_milestones
    SET current_value = v_current
    WHERE id = v_row.id;

    IF v_current >= v_row.threshold_value AND v_row.reached_at IS NULL THEN
      UPDATE academy_milestones
      SET reached_at = now()
      WHERE id = v_row.id;

      v_newly_reached := v_newly_reached || jsonb_build_object(
        'id',              v_row.id,
        'milestone_code',  v_row.milestone_code,
        'milestone_label', v_row.milestone_label,
        'threshold_value', v_row.threshold_value,
        'current_value',   v_current,
        'celebrated',      v_row.celebrated
      );
    END IF;
  END LOOP;

  RETURN (
    SELECT COALESCE(jsonb_agg(m ORDER BY m.reached_at ASC), '[]'::JSONB)
    FROM academy_milestones m
    WHERE m.tenant_id = p_tenant_id
      AND m.reached_at IS NOT NULL
      AND m.celebrated = false
  );
END;
$$;
