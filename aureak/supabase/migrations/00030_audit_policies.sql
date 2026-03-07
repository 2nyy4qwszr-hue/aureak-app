-- Story 10.4 — Audit trail : policies complètes, indexes, rétention

-- Remplace la policy de base Story 1.2
DROP POLICY IF EXISTS "insert_only_base" ON audit_logs;
DROP POLICY IF EXISTS "tenant_isolation" ON audit_logs;

CREATE POLICY "admin_read" ON audit_logs
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "insert_only" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "no_update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON audit_logs FOR DELETE USING (false);

-- Indexes performants
CREATE INDEX IF NOT EXISTS audit_logs_tenant_user
  ON audit_logs (tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity
  ON audit_logs (tenant_id, entity_type, entity_id);

-- Rétention configurable par tenant
CREATE TABLE tenant_retention_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
  retention_years INTEGER NOT NULL DEFAULT 5 CHECK (retention_years >= 5),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenant_retention_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_retention_settings
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON tenant_retention_settings
  FOR ALL USING (current_user_role() = 'admin');
