-- Story 10.3 — Droits RGPD

CREATE TYPE gdpr_request_type AS ENUM (
  'access',
  'rectification',
  'erasure',
  'portability'
);

CREATE TABLE gdpr_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  requester_id     UUID NOT NULL REFERENCES profiles(user_id),
  target_id        UUID NOT NULL REFERENCES profiles(user_id),
  request_type     gdpr_request_type NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','rejected')),
  rejection_reason TEXT,
  payload          JSONB,
  file_url         TEXT,
  processed_at     TIMESTAMPTZ,
  processed_by     UUID REFERENCES profiles(user_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON gdpr_requests
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON gdpr_requests
  FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "admin_manage" ON gdpr_requests
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "parent_insert" ON gdpr_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid() AND tenant_id = current_tenant_id());

-- RPC submit_gdpr_request
CREATE OR REPLACE FUNCTION submit_gdpr_request(
  p_target_id UUID,
  p_type gdpr_request_type
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req_id UUID;
BEGIN
  INSERT INTO gdpr_requests (tenant_id, requester_id, target_id, request_type)
  VALUES (current_tenant_id(), auth.uid(), p_target_id, p_type)
  RETURNING id INTO v_req_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'gdpr_request_submitted', 'gdpr_request', v_req_id,
    jsonb_build_object('request_type', p_type, 'target_id', p_target_id));

  RETURN v_req_id;
END;
$$;

-- RPC process_gdpr_request (admin)
CREATE OR REPLACE FUNCTION process_gdpr_request(
  p_request_id UUID,
  p_status     TEXT,
  p_file_url   TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req gdpr_requests%ROWTYPE;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  SELECT * INTO v_req FROM gdpr_requests
  WHERE id = p_request_id AND tenant_id = current_tenant_id();

  IF NOT FOUND THEN RAISE EXCEPTION 'Demande RGPD introuvable'; END IF;

  UPDATE gdpr_requests SET
    status           = p_status,
    file_url         = p_file_url,
    rejection_reason = p_rejection_reason,
    processed_at     = now(),
    processed_by     = auth.uid()
  WHERE id = p_request_id;

  -- Si effacement → déclencher suppression
  IF v_req.request_type = 'erasure' AND p_status = 'completed' THEN
    PERFORM request_user_deletion(v_req.target_id);
  END IF;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'gdpr_request_processed', 'gdpr_request', p_request_id,
    jsonb_build_object('status', p_status, 'request_type', v_req.request_type));
END;
$$;

REVOKE ALL ON FUNCTION submit_gdpr_request FROM PUBLIC;
REVOKE ALL ON FUNCTION process_gdpr_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_gdpr_request TO authenticated;
GRANT EXECUTE ON FUNCTION process_gdpr_request TO authenticated;

-- Ajouter gdpr_request_overdue à anomaly_events check constraint
-- Note: modifie le check de la colonne anomaly_type dans anomaly_events
ALTER TABLE anomaly_events DROP CONSTRAINT IF EXISTS anomaly_events_anomaly_type_check;
ALTER TABLE anomaly_events ADD CONSTRAINT anomaly_events_anomaly_type_check
  CHECK (anomaly_type IN (
    'session_not_closed',
    'high_absenteeism',
    'coach_feedback_missing',
    'no_session_activity',
    'gdpr_request_overdue'
  ));
