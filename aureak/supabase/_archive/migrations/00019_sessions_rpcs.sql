-- Stories 4.4, 4.5, 4.6 — RPCs sessions : récurrence, annulation, présence coach
-- ============================================================

-- ─── Story 4.4 — RPC generate_recurrence_sessions ────────────────────────────

CREATE OR REPLACE FUNCTION generate_recurrence_sessions(
  p_rule                JSONB,
  p_base_session_params JSONB
) RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_series_id UUID;
  v_date      DATE := (p_base_session_params->>'start_date')::DATE;
  v_count     INT  := COALESCE((p_rule->>'count')::int, 52);
  v_until     DATE := (p_rule->>'until')::DATE;
  v_generated INT  := 0;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO recurrence_series (tenant_id, rule)
  VALUES (current_tenant_id(), p_rule)
  RETURNING id INTO v_series_id;

  -- Générer les occurrences (max 52 semaines pour sécurité)
  WHILE v_generated < LEAST(v_count, 52) AND (v_until IS NULL OR v_date <= v_until) LOOP
    PERFORM create_session_full(
      p_base_session_params || jsonb_build_object(
        'scheduled_at', v_date::TEXT || 'T' || (p_base_session_params->>'time') || ':00Z',
        'recurrence_id', v_series_id
      )
    );
    v_date      := v_date + INTERVAL '7 days';
    v_generated := v_generated + 1;
  END LOOP;

  RETURN v_generated;
END;
$$;

REVOKE ALL ON FUNCTION generate_recurrence_sessions(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_recurrence_sessions(JSONB, JSONB) TO authenticated;

-- ─── Story 4.4 — RPC cancel_recurrence_series ─────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_recurrence_series(
  p_series_id UUID,
  p_reason    TEXT DEFAULT 'Série récurrente annulée'
) RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  UPDATE sessions SET
    status              = 'annulée',
    cancelled_at        = now(),
    cancellation_reason = p_reason
  WHERE recurrence_id = p_series_id
    AND tenant_id = current_tenant_id()
    AND status = 'planifiée';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION cancel_recurrence_series(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_recurrence_series(UUID, TEXT) TO authenticated;

-- ─── Story 4.5 — Enrichissement notification_send_logs ────────────────────────

ALTER TABLE notification_send_logs
  ADD COLUMN urgency           TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('routine','urgent')),
  ADD COLUMN provider_response JSONB;

ALTER TABLE notification_send_logs
  ADD CONSTRAINT unique_send_once
  UNIQUE (tenant_id, recipient_id, reference_id, event_type, channel);

-- ─── Story 4.5 — RPC cancel_session ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_session(
  p_session_id UUID,
  p_reason     TEXT
) RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'Le motif d''annulation est obligatoire';
  END IF;

  UPDATE sessions SET
    status              = 'annulée',
    cancelled_at        = now(),
    cancellation_reason = p_reason
  WHERE id = p_session_id
    AND tenant_id = current_tenant_id()
    AND status IN ('planifiée','en_cours');

  INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, metadata)
  VALUES (
    current_tenant_id(), auth.uid(),
    'session', p_session_id, 'session_cancelled',
    jsonb_build_object('reason', p_reason, 'cancelled_at', now())
  );
END;
$$;

REVOKE ALL ON FUNCTION cancel_session(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_session(UUID, TEXT) TO authenticated;

-- ─── Story 4.6 — RPC confirm_coach_presence ───────────────────────────────────

CREATE OR REPLACE FUNCTION confirm_coach_presence(
  p_session_id UUID,
  p_device_id  TEXT DEFAULT NULL
) RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_block_id  UUID;
  v_tenant_id UUID;
BEGIN
  -- Vérifier que le coach est assigné à cette séance
  IF NOT EXISTS (
    SELECT 1 FROM session_coaches
    WHERE session_id = p_session_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Coach non assigné à cette séance';
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM sessions WHERE id = p_session_id;

  -- Confirmer la présence (idempotent)
  INSERT INTO coach_presence_confirmations (session_id, coach_id, tenant_id, confirmed_at, device_id)
  VALUES (p_session_id, auth.uid(), v_tenant_id, now(), p_device_id)
  ON CONFLICT (session_id, coach_id) DO NOTHING;

  -- Check-in bloc si applicable
  SELECT session_block_id INTO v_block_id FROM sessions WHERE id = p_session_id;
  IF v_block_id IS NOT NULL THEN
    INSERT INTO block_checkins (session_block_id, coach_id, tenant_id, checked_in_at)
    VALUES (v_block_id, auth.uid(), v_tenant_id, now())
    ON CONFLICT (session_block_id, coach_id) DO NOTHING;
  END IF;

  -- Audit
  INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, metadata)
  VALUES (
    v_tenant_id, auth.uid(),
    'coach_presence', p_session_id, 'coach_presence_confirmed',
    jsonb_build_object('device_id', p_device_id, 'confirmed_at', now())
  );
END;
$$;

REVOKE ALL ON FUNCTION confirm_coach_presence(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_coach_presence(UUID, TEXT) TO authenticated;

-- ─── Story 4.6 — Fonction can_close_session ───────────────────────────────────

CREATE OR REPLACE FUNCTION can_close_session(p_session_id UUID)
  RETURNS BOOLEAN
  LANGUAGE sql STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_presence_confirmations cpc
    JOIN session_coaches sc ON sc.session_id = cpc.session_id AND sc.coach_id = cpc.coach_id
    WHERE cpc.session_id = p_session_id AND sc.role = 'lead'
  )
  AND (
    (SELECT COUNT(*) FROM coach_presence_confirmations WHERE session_id = p_session_id) >= 1
  );
$$;

REVOKE ALL ON FUNCTION can_close_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_close_session(UUID) TO authenticated;
