-- =============================================================================
-- Migration 00009 : audit_logs + processed_operations
-- Story 1.2 — Foundation audit trail (append-only) + idempotency sync
-- Dépend de : 00001 (tenants, current_tenant_id())
-- Utilisé par : Epic 2, 4, 5, 6, 7, 9, 10, 11
-- =============================================================================

-- =============================================================================
-- Table processed_operations — idempotency de la sync offline (Zone 10)
-- =============================================================================

CREATE TABLE processed_operations (
  operation_id UUID        PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id)
);

ALTER TABLE processed_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON processed_operations
  FOR ALL USING (tenant_id = current_tenant_id());

-- =============================================================================
-- Table audit_logs — append-only, immuable par design (Zone 11)
-- NB : pas de deleted_at — cette table n'a pas de soft-delete
-- NB : policies complètes (no_update, no_delete, indexes, rétention) → Story 10.4
-- =============================================================================

CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL si système / cron
  entity_type TEXT        NOT NULL,  -- 'user', 'session', 'consent', 'coach', etc.
  entity_id   UUID,                  -- nullable si entité non identifiable
  action      TEXT        NOT NULL,  -- 'user_suspended', 'consent_revoked', 'session_closed', etc.
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Pas de deleted_at : audit_logs est immuable par design
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS minimal — étendu en Story 10.4 (lecture admin, no_update, no_delete, indexes, rétention)
CREATE POLICY "tenant_isolation" ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "insert_only_base" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Index de base sur tenant_id + created_at (index complets en Story 10.4)
CREATE INDEX audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);
