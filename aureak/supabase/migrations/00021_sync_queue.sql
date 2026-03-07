-- Story 5.1 — Table sync_queue serveur (Offline-First)
-- ============================================================

CREATE TABLE sync_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id    UUID NOT NULL,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  device_id       TEXT,
  actor_id        UUID NOT NULL REFERENCES auth.users(id),
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('attendance','evaluation','coach_presence')),
  entity_id       UUID,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','syncing','failed','done')),
  retry_count     INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  last_attempt_at TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operation_id)
);

-- Index partiel sur les opérations en attente
CREATE INDEX sync_queue_pending_idx ON sync_queue (tenant_id, status, created_at)
  WHERE status IN ('pending','failed');

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Coach : INSERT/SELECT ses propres opérations
CREATE POLICY "sq_coach_own" ON sync_queue
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND actor_id = auth.uid()
  );

-- Admin : tout voir dans le tenant
CREATE POLICY "sq_admin_all" ON sync_queue
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );
