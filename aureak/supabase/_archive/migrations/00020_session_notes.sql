-- Story 4.7 — Vue Coach : Notes de séance & Feedback contenu
-- ============================================================

CREATE TABLE coach_session_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES sessions(id),
  coach_id         UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  note             TEXT NOT NULL,
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ,
  UNIQUE (session_id, coach_id)
);

CREATE INDEX csn_session_idx ON coach_session_notes (session_id);
CREATE INDEX csn_coach_idx   ON coach_session_notes (coach_id);

CREATE TABLE coach_content_feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  unit_type  TEXT NOT NULL CHECK (unit_type IN ('theme','situation','sequence')),
  unit_id    UUID NOT NULL,
  content    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','accepted','rejected','testing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ccf_coach_idx  ON coach_content_feedback (coach_id);
CREATE INDEX ccf_unit_idx   ON coach_content_feedback (unit_type, unit_id);
CREATE INDEX ccf_status_idx ON coach_content_feedback (status, tenant_id);

ALTER TABLE coach_session_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_content_feedback ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- coach_session_notes : coach auteur = ALL, admin = SELECT
CREATE POLICY "csn_coach_own" ON coach_session_notes
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

CREATE POLICY "csn_admin_read" ON coach_session_notes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
    AND visible_to_admin = true
  );

-- coach_content_feedback : coach auteur = ALL, admin = ALL (pour modération)
CREATE POLICY "ccf_coach_own" ON coach_content_feedback
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

CREATE POLICY "ccf_admin_all" ON coach_content_feedback
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );
