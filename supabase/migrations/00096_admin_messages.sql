-- =============================================================================
-- Migration 00096 : Messages directs admin→coach (Story 9.5)
-- - table admin_messages + RLS
-- - RPC send_admin_message (SECURITY DEFINER)
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  sender_id    UUID NOT NULL REFERENCES profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES profiles(user_id),
  message      TEXT NOT NULL CHECK (char_length(message) <= 2000),
  urgency      TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_msg_tenant_idx    ON admin_messages (tenant_id);
CREATE INDEX IF NOT EXISTS admin_msg_recipient_idx ON admin_messages (recipient_id);
CREATE INDEX IF NOT EXISTS admin_msg_sender_idx    ON admin_messages (sender_id);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_msg_tenant_isolation" ON admin_messages;
DROP POLICY IF EXISTS "admin_msg_sender"            ON admin_messages;
DROP POLICY IF EXISTS "admin_msg_recipient_read"    ON admin_messages;

CREATE POLICY "admin_msg_tenant_isolation" ON admin_messages
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "admin_msg_sender" ON admin_messages
  FOR INSERT WITH CHECK (
    current_user_role() = 'admin'
    AND sender_id = auth.uid()
  );

CREATE POLICY "admin_msg_recipient_read" ON admin_messages
  FOR SELECT USING (
    recipient_id = auth.uid()
    OR current_user_role() = 'admin'
  );

-- ── RPC send_admin_message ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION send_admin_message(
  p_recipient_id UUID,
  p_message      TEXT,
  p_urgency      TEXT DEFAULT 'routine'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_msg_id UUID;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO admin_messages (tenant_id, sender_id, recipient_id, message, urgency)
    VALUES (current_tenant_id(), auth.uid(), p_recipient_id, p_message, p_urgency)
  RETURNING id INTO v_msg_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (current_tenant_id(), auth.uid(), 'admin_message_sent', 'coach', p_recipient_id,
      jsonb_build_object('message_id', v_msg_id, 'urgency', p_urgency));

  RETURN v_msg_id;
END;
$$;
REVOKE ALL ON FUNCTION send_admin_message FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_admin_message TO authenticated;
