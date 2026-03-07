-- Story 5.2 — Event Sourcing : event_log + apply_event() + enrichissement attendances
-- Story 5.4 — Gestion conflits dans apply_event()
-- Story 5.5 — conflicts_reviewed_at sur sessions
-- ============================================================

-- ─── Table event_log ──────────────────────────────────────────────────────────

CREATE TABLE event_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  actor_id     UUID NOT NULL REFERENCES auth.users(id),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  operation_id UUID NOT NULL,
  source       TEXT NOT NULL DEFAULT 'field'
    CHECK (source IN ('field','admin','sync','import')),
  device_id    TEXT
);

CREATE INDEX event_log_entity_idx ON event_log (tenant_id, entity_type, entity_id);
CREATE UNIQUE INDEX event_log_operation_id_idx ON event_log (operation_id);

-- ─── Enrichissement attendances (Story 5.2) ───────────────────────────────────

ALTER TABLE attendances
  ADD COLUMN last_event_id UUID REFERENCES event_log(id),
  ADD COLUMN updated_by    UUID REFERENCES profiles(user_id),
  ADD COLUMN updated_at    TIMESTAMPTZ;

-- ─── Enrichissement sessions (Story 5.4 — badge conflits) ────────────────────

ALTER TABLE sessions
  ADD COLUMN conflicts_reviewed_at TIMESTAMPTZ;

-- ─── RPC apply_event() ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_event(p_event JSONB)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_operation_id UUID := (p_event->>'operation_id')::uuid;
  v_event_id     UUID;
  v_snapshot     JSONB;
  v_current_status TEXT;
  v_actor_role   TEXT;
  v_is_lead      BOOLEAN := false;
BEGIN
  -- Vérification tenant
  IF (p_event->>'tenant_id')::uuid != current_tenant_id() THEN
    RAISE EXCEPTION 'Tenant mismatch';
  END IF;

  -- Idempotency : déjà traité ?
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = v_operation_id) THEN
    SELECT to_jsonb(a.*) INTO v_snapshot
      FROM attendances a
      WHERE session_id = (p_event->'payload'->>'session_id')::uuid
        AND child_id   = (p_event->'payload'->>'child_id')::uuid;
    RETURN jsonb_build_object('idempotent', true, 'snapshot', v_snapshot);
  END IF;

  -- Détection de conflit : status existant != nouveau
  SELECT status INTO v_current_status FROM attendances
    WHERE session_id = (p_event->'payload'->>'session_id')::uuid
      AND child_id   = (p_event->'payload'->>'child_id')::uuid;

  IF v_current_status IS NOT NULL
     AND v_current_status != (p_event->'payload'->>'new_status') THEN
    -- Vérifier si l'acteur est lead coach
    SELECT EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = (p_event->'payload'->>'session_id')::uuid
        AND sc.coach_id   = auth.uid()
        AND sc.role       = 'lead'
    ) INTO v_is_lead;

    IF v_is_lead THEN
      -- lead_wins : l'événement entrant écrase (on continue normalement)
      -- Logguer le conflit résolu
      INSERT INTO event_log (tenant_id, entity_type, entity_id, event_type, payload, actor_id, occurred_at, operation_id, source, device_id)
      VALUES (
        current_tenant_id(),
        p_event->>'entity_type',
        (p_event->>'entity_id')::uuid,
        'ATTENDANCE_CONFLICT_RESOLVED',
        jsonb_build_object('resolution', 'lead_wins', 'old_status', v_current_status, 'new_status', p_event->'payload'->>'new_status'),
        auth.uid(), now(), gen_random_uuid(), COALESCE(p_event->>'source','field'), p_event->>'device_id'
      );
    ELSE
      -- server_wins : ignorer l'opération
      INSERT INTO processed_operations (operation_id, tenant_id)
      VALUES (v_operation_id, current_tenant_id());

      INSERT INTO event_log (tenant_id, entity_type, entity_id, event_type, payload, actor_id, occurred_at, operation_id, source, device_id)
      VALUES (
        current_tenant_id(),
        p_event->>'entity_type',
        COALESCE((p_event->>'entity_id')::uuid, gen_random_uuid()),
        'ATTENDANCE_CONFLICT_RESOLVED',
        jsonb_build_object('resolution', 'server_wins', 'old_status', v_current_status, 'rejected_status', p_event->'payload'->>'new_status'),
        auth.uid(), now(), gen_random_uuid(), COALESCE(p_event->>'source','field'), p_event->>'device_id'
      );

      SELECT to_jsonb(a.*) INTO v_snapshot FROM attendances a
        WHERE session_id = (p_event->'payload'->>'session_id')::uuid
          AND child_id   = (p_event->'payload'->>'child_id')::uuid;
      RETURN jsonb_build_object('idempotent', true, 'snapshot', v_snapshot, 'conflict', 'server_wins');
    END IF;
  END IF;

  -- Insérer dans event_log
  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type,
    payload, actor_id, occurred_at, operation_id, source, device_id
  ) VALUES (
    current_tenant_id(),
    p_event->>'entity_type',
    COALESCE((p_event->>'entity_id')::uuid, gen_random_uuid()),
    p_event->>'event_type',
    p_event->'payload',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_operation_id,
    COALESCE(p_event->>'source','field'),
    p_event->>'device_id'
  ) RETURNING id INTO v_event_id;

  -- Upsert snapshot attendance
  INSERT INTO attendances (
    session_id, child_id, tenant_id, status,
    recorded_by, recorded_at, last_event_id, updated_by, updated_at
  ) VALUES (
    (p_event->'payload'->>'session_id')::uuid,
    (p_event->'payload'->>'child_id')::uuid,
    current_tenant_id(),
    p_event->'payload'->>'new_status',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_event_id, auth.uid(), now()
  )
  ON CONFLICT (session_id, child_id) DO UPDATE SET
    status        = EXCLUDED.status,
    last_event_id = EXCLUDED.last_event_id,
    updated_by    = EXCLUDED.updated_by,
    updated_at    = EXCLUDED.updated_at;

  -- Marquer comme traité
  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (v_operation_id, current_tenant_id());

  SELECT to_jsonb(a.*) INTO v_snapshot FROM attendances a
    WHERE session_id = (p_event->'payload'->>'session_id')::uuid
      AND child_id   = (p_event->'payload'->>'child_id')::uuid;

  RETURN jsonb_build_object('snapshot', v_snapshot, 'event_id', v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION apply_event(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_event(JSONB) TO authenticated;

-- ─── RLS event_log ────────────────────────────────────────────────────────────

ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- Coach : lecture de ses sessions
CREATE POLICY "el_coach_read" ON event_log
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = event_log.entity_id
        AND sc.coach_id   = auth.uid()
    )
  );

-- Admin : tout le tenant
CREATE POLICY "el_admin_all" ON event_log
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );
