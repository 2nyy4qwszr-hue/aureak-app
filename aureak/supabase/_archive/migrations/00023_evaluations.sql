-- Story 6.1 — Modèle Évaluations & Event Sourcing
-- Story 6.3 — validation_status sur sessions
-- Story 6.4 — closed_at, closed_by, notification_sent_at sur sessions
-- ============================================================

-- ─── Table evaluations ────────────────────────────────────────────────────────

CREATE TABLE evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id),
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  coach_id      UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  receptivite   evaluation_signal NOT NULL DEFAULT 'none',
  gout_effort   evaluation_signal NOT NULL DEFAULT 'none',
  attitude      evaluation_signal NOT NULL DEFAULT 'none',
  top_seance    TEXT NOT NULL DEFAULT 'none' CHECK (top_seance IN ('star','none')),
  note          TEXT,
  last_event_id UUID REFERENCES event_log(id),
  updated_by    UUID REFERENCES profiles(user_id),
  updated_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, child_id, coach_id)
);

CREATE INDEX eval_session_child_idx ON evaluations (session_id, child_id);
CREATE INDEX eval_coach_idx         ON evaluations (coach_id);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- ─── RLS evaluations ──────────────────────────────────────────────────────────

-- Coach : ses propres évaluations
CREATE POLICY "eval_coach_own" ON evaluations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

-- Admin : tout le tenant
CREATE POLICY "eval_admin_all" ON evaluations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Parent : lecture via parent_child_links
CREATE POLICY "eval_parent_read" ON evaluations
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id  = evaluations.child_id
    )
  );

-- ─── Vue fusionnée session_evaluations_merged ─────────────────────────────────

CREATE VIEW session_evaluations_merged AS
SELECT
  session_id,
  child_id,
  tenant_id,
  CASE WHEN bool_or(receptivite = 'attention') THEN 'attention'
       WHEN bool_or(receptivite = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS receptivite,
  CASE WHEN bool_or(gout_effort = 'attention') THEN 'attention'
       WHEN bool_or(gout_effort = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS gout_effort,
  CASE WHEN bool_or(attitude = 'attention') THEN 'attention'
       WHEN bool_or(attitude = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS attitude,
  CASE WHEN bool_or(top_seance = 'star') THEN 'star' ELSE 'none' END AS top_seance
FROM evaluations
GROUP BY session_id, child_id, tenant_id;

-- ─── Enrichissement sessions (Story 6.3 + 6.4) ───────────────────────────────

ALTER TABLE sessions
  ADD COLUMN validation_status   TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending','validated_lead','validated_both')),
  ADD COLUMN closed_at           TIMESTAMPTZ,
  ADD COLUMN closed_by           UUID REFERENCES profiles(user_id),
  ADD COLUMN notification_sent_at TIMESTAMPTZ;

-- ─── RPC validate_session (Story 6.3) ────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_session(p_session_id UUID)
  RETURNS TEXT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_role        TEXT;
  v_curr_status TEXT;
  v_coach_count INT;
  v_new_status  TEXT;
BEGIN
  SELECT role INTO v_role FROM session_coaches
    WHERE session_id = p_session_id AND coach_id = auth.uid();

  IF v_role IS NULL THEN RAISE EXCEPTION 'Non assigné à cette séance'; END IF;

  SELECT validation_status INTO v_curr_status
    FROM sessions WHERE id = p_session_id AND tenant_id = current_tenant_id();

  SELECT COUNT(*) INTO v_coach_count FROM session_coaches
    WHERE session_id = p_session_id;

  IF v_curr_status = 'validated_both' THEN
    RETURN 'validated_both';
  END IF;

  -- Lead valide → validated_lead
  IF v_role = 'lead' AND v_curr_status = 'pending' THEN
    v_new_status := CASE WHEN v_coach_count = 1 THEN 'validated_both' ELSE 'validated_lead' END;
    UPDATE sessions SET validation_status = v_new_status WHERE id = p_session_id;
    RETURN v_new_status;
  END IF;

  -- Assistant valide après lead → validated_both
  IF v_role = 'assistant' AND v_curr_status = 'validated_lead' THEN
    UPDATE sessions SET validation_status = 'validated_both' WHERE id = p_session_id;
    RETURN 'validated_both';
  END IF;

  RETURN v_curr_status;
END;
$$;

REVOKE ALL ON FUNCTION validate_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_session(UUID) TO authenticated;

-- ─── RPC close_session (Story 6.4) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION close_session(
  p_session_id   UUID,
  p_operation_id UUID
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Idempotency
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;

  -- Vérification état de validation
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
      AND validation_status IN ('validated_lead','validated_both')
      AND tenant_id = current_tenant_id()
  ) THEN
    RAISE EXCEPTION 'Session % not ready for close', p_session_id;
  END IF;

  -- Vérification confirmation présence coach lead
  IF NOT can_close_session(p_session_id) THEN
    RAISE EXCEPTION 'Confirmation du coach lead requise avant clôture';
  END IF;

  -- Émettre SESSION_CLOSED dans event_log
  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type, payload,
    actor_id, operation_id, source
  ) VALUES (
    current_tenant_id(), 'session', p_session_id, 'SESSION_CLOSED',
    jsonb_build_object('closed_by', auth.uid(), 'closed_at', now()),
    auth.uid(), p_operation_id, 'field'
  ) RETURNING id INTO v_event_id;

  UPDATE sessions SET
    status    = 'terminée',
    closed_at = now(),
    closed_by = auth.uid()
  WHERE id = p_session_id;

  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (p_operation_id, current_tenant_id());

  RETURN jsonb_build_object('closed', true, 'event_id', v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION close_session(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION close_session(UUID, UUID) TO authenticated;

-- ─── Extension apply_event() pour entity_type = 'evaluation' ─────────────────
-- Note : La branche evaluation est gérée via un OR REPLACE de la RPC complète
-- Pour éviter de dupliquer le code, on crée un wrapper dédié

CREATE OR REPLACE FUNCTION apply_evaluation_event(p_event JSONB)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_operation_id UUID := (p_event->>'operation_id')::uuid;
  v_event_id     UUID;
  v_snapshot     JSONB;
BEGIN
  IF (p_event->>'tenant_id')::uuid != current_tenant_id() THEN
    RAISE EXCEPTION 'Tenant mismatch';
  END IF;

  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = v_operation_id) THEN
    SELECT to_jsonb(e.*) INTO v_snapshot FROM evaluations e
      WHERE session_id = (p_event->'payload'->>'session_id')::uuid
        AND child_id   = (p_event->'payload'->>'child_id')::uuid
        AND coach_id   = auth.uid();
    RETURN jsonb_build_object('idempotent', true, 'snapshot', v_snapshot);
  END IF;

  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type,
    payload, actor_id, occurred_at, operation_id, source, device_id
  ) VALUES (
    current_tenant_id(), 'evaluation',
    COALESCE((p_event->>'entity_id')::uuid, gen_random_uuid()),
    'EVALUATION_SET',
    p_event->'payload',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_operation_id,
    COALESCE(p_event->>'source','field'),
    p_event->>'device_id'
  ) RETURNING id INTO v_event_id;

  INSERT INTO evaluations (
    session_id, child_id, coach_id, tenant_id,
    receptivite, gout_effort, attitude, top_seance, note,
    last_event_id, updated_by, updated_at
  ) VALUES (
    (p_event->'payload'->>'session_id')::uuid,
    (p_event->'payload'->>'child_id')::uuid,
    auth.uid(),
    current_tenant_id(),
    COALESCE((p_event->'payload'->>'receptivite'), 'none')::evaluation_signal,
    COALESCE((p_event->'payload'->>'gout_effort'), 'none')::evaluation_signal,
    COALESCE((p_event->'payload'->>'attitude'), 'none')::evaluation_signal,
    COALESCE(p_event->'payload'->>'top_seance', 'none'),
    p_event->'payload'->>'note',
    v_event_id, auth.uid(), now()
  )
  ON CONFLICT (session_id, child_id, coach_id) DO UPDATE SET
    receptivite   = EXCLUDED.receptivite,
    gout_effort   = EXCLUDED.gout_effort,
    attitude      = EXCLUDED.attitude,
    top_seance    = EXCLUDED.top_seance,
    note          = EXCLUDED.note,
    last_event_id = EXCLUDED.last_event_id,
    updated_by    = EXCLUDED.updated_by,
    updated_at    = EXCLUDED.updated_at;

  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (v_operation_id, current_tenant_id());

  SELECT to_jsonb(e.*) INTO v_snapshot FROM evaluations e
    WHERE session_id = (p_event->'payload'->>'session_id')::uuid
      AND child_id   = (p_event->'payload'->>'child_id')::uuid
      AND coach_id   = auth.uid();

  RETURN jsonb_build_object('snapshot', v_snapshot, 'event_id', v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION apply_evaluation_event(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_evaluation_event(JSONB) TO authenticated;
