-- Migration 00009 — audit_logs + processed_operations
-- Story 1.2 — Tables Foundation (numérotée 00009 pour laisser de la place aux stories 4-8)
-- Prérequis : 00001 (tenants, current_tenant_id)
-- Note : audit_logs est immuable — aucun UPDATE ni DELETE autorisé (renforcé en Story 10.4)

-- ============================================================
-- Table processed_operations — idempotency sync offline (Zone 10)
-- ============================================================
CREATE TABLE processed_operations (
  operation_id UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id)
);

ALTER TABLE processed_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON processed_operations
  FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================
-- Table audit_logs — append-only, immuable par design
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Pas de deleted_at : audit_logs est immuable par design
  -- Pas de updated_at : jamais modifié
);

CREATE INDEX audit_logs_tenant_idx ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS minimal — étendu en Story 10.4 (lecture admin, no_update, no_delete, rétention)
CREATE POLICY "tenant_isolation" ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "insert_only_base" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
