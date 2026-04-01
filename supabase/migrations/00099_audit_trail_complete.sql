-- =============================================================================
-- Migration 00099 : Audit Trail Admin — Policies complètes, indexes & rétention
-- Story 10.4
-- =============================================================================

-- ── 1. Policies RLS complètes sur audit_logs ─────────────────────────────────

DROP POLICY IF EXISTS "insert_only_base"  ON audit_logs;
DROP POLICY IF EXISTS "admin_read_audit"  ON audit_logs;
DROP POLICY IF EXISTS "no_update"         ON audit_logs;
DROP POLICY IF EXISTS "no_delete"         ON audit_logs;
DROP POLICY IF EXISTS "admin_read"        ON audit_logs;
DROP POLICY IF EXISTS "insert_only"       ON audit_logs;

CREATE POLICY "admin_read" ON audit_logs
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "insert_only" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "no_update" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "no_delete" ON audit_logs
  FOR DELETE USING (false);

-- ── 2. Indexes performants ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS audit_logs_tenant_user
  ON audit_logs (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity
  ON audit_logs (tenant_id, entity_type, entity_id);

-- ── 3. Table de rétention configurable par tenant ─────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_retention_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  retention_years INTEGER NOT NULL DEFAULT 5 CHECK (retention_years >= 5),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenant_retention_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_retention_settings;
DROP POLICY IF EXISTS "admin_write"      ON tenant_retention_settings;

CREATE POLICY "tenant_isolation" ON tenant_retention_settings
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "admin_write" ON tenant_retention_settings
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );
