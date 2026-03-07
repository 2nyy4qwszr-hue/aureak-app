-- Story 4.2 — Roster Attendu & Présences Terrain
-- ============================================================

CREATE TABLE session_attendees (
  session_id UUID NOT NULL REFERENCES sessions(id),
  child_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (session_id, child_id)
);

CREATE INDEX sa_child_idx  ON session_attendees (child_id);
CREATE INDEX sa_tenant_idx ON session_attendees (tenant_id);

CREATE TABLE attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  child_id    UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  status      attendance_status NOT NULL,
  recorded_by UUID NOT NULL REFERENCES profiles(user_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at   TIMESTAMPTZ,
  UNIQUE (session_id, child_id)
);

CREATE INDEX attendances_session_idx ON attendances (session_id, tenant_id);
CREATE INDEX attendances_child_idx   ON attendances (child_id);

CREATE TABLE coach_presence_confirmations (
  session_id   UUID NOT NULL REFERENCES sessions(id),
  coach_id     UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id    TEXT,
  PRIMARY KEY (session_id, coach_id)
);

CREATE TABLE block_checkins (
  session_block_id UUID NOT NULL REFERENCES session_blocks(id),
  coach_id         UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  checked_in_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_block_id, coach_id)
);

-- ─── Trigger : première attendance → session en_cours ─────────────────────────

CREATE OR REPLACE FUNCTION trg_attendance_start_session()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE sessions
  SET
    attendance_started_at = COALESCE(attendance_started_at, now()),
    status = CASE WHEN status = 'planifiée' THEN 'en_cours' ELSE status END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_start
  AFTER INSERT ON attendances
  FOR EACH ROW EXECUTE FUNCTION trg_attendance_start_session();

-- ─── RPC : pré-remplir le roster depuis group_members ─────────────────────────

CREATE OR REPLACE FUNCTION prefill_session_attendees(p_session_id UUID)
  RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_group_id  UUID;
  v_tenant_id UUID;
  v_count     INT;
BEGIN
  SELECT group_id, tenant_id INTO v_group_id, v_tenant_id
    FROM sessions
    WHERE id = p_session_id AND tenant_id = current_tenant_id();

  INSERT INTO session_attendees (session_id, child_id, tenant_id)
  SELECT p_session_id, child_id, v_tenant_id
    FROM group_members
    WHERE group_id = v_group_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION prefill_session_attendees(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prefill_session_attendees(UUID) TO authenticated;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE session_attendees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_presence_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_checkins               ENABLE ROW LEVEL SECURITY;
