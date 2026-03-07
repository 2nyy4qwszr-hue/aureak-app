-- Story 10.1 — Cycle de vie utilisateur

-- 1. Colonne status sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','suspended','pending_deletion','deleted'));

-- 2. Journal immuable des événements de cycle de vie
CREATE TABLE user_lifecycle_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES profiles(user_id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created','activated','suspended','reactivated',
    'deletion_requested','deleted','data_exported','consent_revoked'
  )),
  actor_id   UUID REFERENCES profiles(user_id),
  reason     TEXT,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON user_lifecycle_events
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON user_lifecycle_events
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "no_update" ON user_lifecycle_events FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON user_lifecycle_events FOR DELETE USING (false);
-- Allow insert by system (RPC SECURITY DEFINER handles this)
CREATE POLICY "insert_rpc" ON user_lifecycle_events
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- 3. RPCs cycle de vie
CREATE OR REPLACE FUNCTION suspend_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'suspended'
    WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id, reason)
  VALUES (current_tenant_id(), p_user_id, 'suspended', auth.uid(), p_reason);
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'user_suspended', 'user', p_user_id,
    jsonb_build_object('reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION reactivate_user(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'active'
    WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id)
  VALUES (current_tenant_id(), p_user_id, 'reactivated', auth.uid());
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'user_reactivated', 'user', p_user_id, '{}');
END;
$$;

CREATE OR REPLACE FUNCTION request_user_deletion(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'pending_deletion'
    WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id)
  VALUES (current_tenant_id(), p_user_id, 'deletion_requested', auth.uid());
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'user_deletion_requested', 'user', p_user_id, '{}');
END;
$$;

REVOKE ALL ON FUNCTION suspend_user FROM PUBLIC;
REVOKE ALL ON FUNCTION reactivate_user FROM PUBLIC;
REVOKE ALL ON FUNCTION request_user_deletion FROM PUBLIC;
GRANT EXECUTE ON FUNCTION suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_user TO authenticated;
GRANT EXECUTE ON FUNCTION request_user_deletion TO authenticated;

-- 4. Enrichir is_active_user() pour inclure le status
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND tenant_id = current_tenant_id()
      AND status = 'active'
  );
$$;
