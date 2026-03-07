-- Story 4.3 — Infrastructure notifications (push_tokens, notification_preferences, notification_send_logs)
-- ============================================================

-- Tokens push par utilisateur/appareil
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX pt_user_idx   ON push_tokens (user_id);
CREATE INDEX pt_tenant_idx ON push_tokens (tenant_id);

-- Préférences de notification par utilisateur
CREATE TABLE notification_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  push_enabled  BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled   BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journal d'envoi des notifications (append-only)
CREATE TABLE notification_send_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  channel      TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  event_type   TEXT NOT NULL,
  reference_id UUID,
  status       TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error_text   TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX nsl_tenant_idx    ON notification_send_logs (tenant_id, sent_at);
CREATE INDEX nsl_recipient_idx ON notification_send_logs (recipient_id, sent_at);
CREATE INDEX nsl_reference_idx ON notification_send_logs (reference_id) WHERE reference_id IS NOT NULL;

-- ─── RPC : create_session_full (Story 4.3) ────────────────────────────────────

CREATE OR REPLACE FUNCTION create_session_full(p_params JSONB)
  RETURNS sessions
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_session  sessions;
  v_theme_id UUID;
  v_coach    JSONB;
BEGIN
  IF current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO sessions (
    tenant_id, implantation_id, group_id, scheduled_at,
    duration_minutes, location, status
  ) VALUES (
    current_tenant_id(),
    (p_params->>'implantation_id')::uuid,
    (p_params->>'group_id')::uuid,
    (p_params->>'scheduled_at')::timestamptz,
    COALESCE((p_params->>'duration_minutes')::int, 90),
    p_params->>'location',
    'planifiée'
  ) RETURNING * INTO v_session;

  -- Pré-remplir le roster depuis group_members
  PERFORM prefill_session_attendees(v_session.id);

  -- Themes snapshot (versions is_current = true figées au moment de la création)
  FOR v_theme_id IN
    SELECT jsonb_array_elements_text(p_params->'theme_ids')::uuid
  LOOP
    INSERT INTO session_themes (session_id, theme_id, tenant_id)
    VALUES (v_session.id, v_theme_id, current_tenant_id());
  END LOOP;

  -- Coaches
  FOR v_coach IN SELECT jsonb_array_elements(p_params->'coaches')
  LOOP
    INSERT INTO session_coaches (session_id, coach_id, tenant_id, role)
    VALUES (
      v_session.id,
      (v_coach->>'coach_id')::uuid,
      current_tenant_id(),
      COALESCE(v_coach->>'role', 'lead')
    );
  END LOOP;

  RETURN v_session;
END;
$$;

REVOKE ALL ON FUNCTION create_session_full(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_session_full(JSONB) TO authenticated;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE push_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_send_logs   ENABLE ROW LEVEL SECURITY;
