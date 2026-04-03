-- Story 9.1 — Vue dashboard agrégé multi-implantations
-- Story 9.2 — Anomalies détection
-- Story 9.3 — Comparaison inter-implantations
-- Story 9.5 — Contact direct coach
-- ============================================================

-- ─── Vue implantation_dashboard_stats (Story 9.1) ────────────────────────────

CREATE OR REPLACE VIEW implantation_dashboard_stats AS
SELECT
  i.id                    AS implantation_id,
  i.name                  AS implantation_name,
  i.tenant_id,
  COUNT(DISTINCT s.id)    AS sessions_total,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'terminée') AS sessions_closed,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
    / NULLIF(COUNT(a.id), 0) * 100
  ) AS attendance_rate_pct,
  ROUND(
    COUNT(la.id) FILTER (WHERE la.mastery_status = 'acquired')::numeric
    / NULLIF(COUNT(la.id), 0) * 100
  ) AS mastery_rate_pct
FROM implantations i
LEFT JOIN sessions s
  ON s.implantation_id = i.id
  AND s.tenant_id = i.tenant_id
LEFT JOIN attendances a
  ON a.session_id = s.id AND a.tenant_id = i.tenant_id
LEFT JOIN learning_attempts la
  ON la.session_id = s.id AND la.tenant_id = i.tenant_id
GROUP BY i.id, i.name, i.tenant_id;

-- ─── RPC get_implantation_stats (Story 9.1) ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_implantation_stats(
  p_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_to   TIMESTAMPTZ DEFAULT now()
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF current_user_role() NOT IN ('admin','coach') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN (
    SELECT jsonb_agg(row_to_json(stats))
    FROM implantation_dashboard_stats stats
    WHERE stats.tenant_id = current_tenant_id()
      AND (
        current_user_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM coach_implantation_assignments cia
          WHERE cia.implantation_id = stats.implantation_id
            AND cia.coach_id = auth.uid()
            AND cia.unassigned_at IS NULL
        )
      )
  );
END;
$$;
REVOKE ALL ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ─── RPC get_comparison_report (Story 9.3) ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_comparison_report(
  p_from         TIMESTAMPTZ,
  p_to           TIMESTAMPTZ,
  p_metric_keys  TEXT[] DEFAULT NULL
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé — rôle admin requis';
  END IF;

  RETURN (
    SELECT jsonb_agg(row_to_json(stats))
    FROM implantation_dashboard_stats stats
    WHERE stats.tenant_id = current_tenant_id()
  );
END;
$$;
REVOKE ALL ON FUNCTION get_comparison_report(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_comparison_report(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[]) TO authenticated;

-- ─── Table anomaly_events (Story 9.2) ────────────────────────────────────────

CREATE TABLE anomaly_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  anomaly_type  TEXT NOT NULL
    CHECK (anomaly_type IN ('session_not_closed','high_absenteeism','coach_feedback_missing','no_session_activity')),
  severity      TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info','warning','critical')),
  resource_type TEXT NOT NULL,
  resource_id   UUID NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES profiles(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomaly_tenant" ON anomaly_events
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "anomaly_admin" ON anomaly_events
  FOR ALL USING (current_user_role() = 'admin');

-- Idempotency : pas de doublon non-résolu
CREATE UNIQUE INDEX anomaly_no_duplicate ON anomaly_events (tenant_id, anomaly_type, resource_id)
  WHERE resolved_at IS NULL;

-- ─── RPC resolve_anomaly (Story 9.2) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION resolve_anomaly(p_anomaly_id UUID)
  RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  UPDATE anomaly_events
  SET resolved_at = now(), resolved_by = auth.uid()
  WHERE id = p_anomaly_id AND tenant_id = current_tenant_id();

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'anomaly_resolved', 'anomaly', p_anomaly_id, '{}');
END;
$$;
REVOKE ALL ON FUNCTION resolve_anomaly(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_anomaly(UUID) TO authenticated;

-- ─── Table admin_messages (Story 9.5) ────────────────────────────────────────

CREATE TABLE admin_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  sender_id    UUID NOT NULL REFERENCES profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES profiles(user_id),
  message      TEXT NOT NULL CHECK (char_length(message) <= 2000),
  urgency      TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_messages_tenant" ON admin_messages
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "admin_messages_sender" ON admin_messages
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND sender_id = auth.uid());
CREATE POLICY "admin_messages_read" ON admin_messages
  FOR SELECT USING (recipient_id = auth.uid() OR current_user_role() = 'admin');

-- ─── RPC send_admin_message (Story 9.5) ──────────────────────────────────────

CREATE OR REPLACE FUNCTION send_admin_message(
  p_recipient_id UUID,
  p_message      TEXT,
  p_urgency      TEXT DEFAULT 'routine'
) RETURNS UUID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE v_msg_id UUID;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO admin_messages (tenant_id, sender_id, recipient_id, message, urgency)
  VALUES (current_tenant_id(), auth.uid(), p_recipient_id, p_message, p_urgency)
  RETURNING id INTO v_msg_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    current_tenant_id(), auth.uid(), 'admin_message_sent', 'coach', p_recipient_id,
    jsonb_build_object('message_id', v_msg_id, 'urgency', p_urgency)
  );

  RETURN v_msg_id;
END;
$$;
REVOKE ALL ON FUNCTION send_admin_message(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_admin_message(UUID, TEXT, TEXT) TO authenticated;
