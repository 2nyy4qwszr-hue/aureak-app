-- =============================================================================
-- Migration 00097 : Timeline admin — RPCs restauration + review conflits (Story 5.5)
-- =============================================================================

-- ── RPC restore_attendance ───────────────────────────────────────────────────
-- Admin restaure un état de présence antérieur via apply_event()

CREATE OR REPLACE FUNCTION restore_attendance(
  p_session_id        UUID,
  p_child_id          UUID,
  p_restored_status   TEXT,
  p_restored_from_event_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  RETURN apply_event(jsonb_build_object(
    'operation_id', gen_random_uuid(),
    'tenant_id',    current_tenant_id()::text,
    'entity_type',  'attendance',
    'entity_id',    gen_random_uuid()::text,
    'event_type',   'ATTENDANCE_RESTORED',
    'source',       'admin',
    'payload',      jsonb_build_object(
      'session_id',              p_session_id::text,
      'child_id',                p_child_id::text,
      'new_status',              p_restored_status,
      'restored_from_event_id',  p_restored_from_event_id::text
    )
  ));
END;
$$;
REVOKE ALL ON FUNCTION restore_attendance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION restore_attendance TO authenticated;

-- ── RPC mark_conflicts_reviewed ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_conflicts_reviewed(p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE sessions
    SET conflicts_reviewed_at = now()
    WHERE id        = p_session_id
      AND tenant_id = current_tenant_id();
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
    VALUES (current_tenant_id(), auth.uid(), 'conflicts_reviewed', 'session', p_session_id);
END;
$$;
REVOKE ALL ON FUNCTION mark_conflicts_reviewed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_conflicts_reviewed TO authenticated;
