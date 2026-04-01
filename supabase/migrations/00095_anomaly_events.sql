-- =============================================================================
-- Migration 00095 : Détection anomalies (Story 9.2)
-- - table anomaly_events + RLS admin-only
-- - index d'unicité partiel (idempotency)
-- - RPC resolve_anomaly
-- =============================================================================

CREATE TABLE IF NOT EXISTS anomaly_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  anomaly_type  TEXT NOT NULL CHECK (anomaly_type IN (
    'session_not_closed',
    'high_absenteeism',
    'coach_feedback_missing',
    'no_session_activity'
  )),
  severity      TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info','warning','critical')),
  resource_type TEXT NOT NULL,
  resource_id   UUID NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES profiles(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency : pas de doublon non-résolu pour le même (tenant, type, resource)
CREATE UNIQUE INDEX IF NOT EXISTS anomaly_no_duplicate
  ON anomaly_events (tenant_id, anomaly_type, resource_id)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS anomaly_tenant_idx   ON anomaly_events (tenant_id);
CREATE INDEX IF NOT EXISTS anomaly_severity_idx ON anomaly_events (tenant_id, severity) WHERE resolved_at IS NULL;

ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anomaly_tenant_isolation" ON anomaly_events;
DROP POLICY IF EXISTS "anomaly_admin_only"        ON anomaly_events;

CREATE POLICY "anomaly_tenant_isolation" ON anomaly_events
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "anomaly_admin_only" ON anomaly_events
  FOR ALL USING (current_user_role() = 'admin');

-- ── RPC resolve_anomaly ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION resolve_anomaly(p_anomaly_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE anomaly_events
    SET resolved_at = now(),
        resolved_by = auth.uid()
    WHERE id        = p_anomaly_id
      AND tenant_id = current_tenant_id();
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
    VALUES (current_tenant_id(), auth.uid(), 'anomaly_resolved', 'anomaly', p_anomaly_id);
END;
$$;
REVOKE ALL ON FUNCTION resolve_anomaly FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_anomaly TO authenticated;
