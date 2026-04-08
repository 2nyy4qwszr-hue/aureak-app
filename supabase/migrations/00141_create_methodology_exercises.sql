-- Migration 00141 — Table methodology_exercises
-- Story 34.3 : Redesign Entraînements v2 + Table Exercices

CREATE TABLE IF NOT EXISTS methodology_exercises (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method       TEXT        NOT NULL,
  context_type TEXT        NOT NULL DEFAULT 'academie' CHECK (context_type IN ('academie', 'stage')),
  title        TEXT        NOT NULL,
  training_ref INT,
  description  TEXT,
  pdf_url      TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE methodology_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies : miroir de methodology_sessions (tenant_id isolation)
CREATE POLICY "tenant_isolation_select" ON methodology_exercises
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_insert" ON methodology_exercises
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_update" ON methodology_exercises
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_delete" ON methodology_exercises
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Index sur tenant_id pour les queries RLS
CREATE INDEX IF NOT EXISTS methodology_exercises_tenant_id_idx ON methodology_exercises (tenant_id);
CREATE INDEX IF NOT EXISTS methodology_exercises_method_idx ON methodology_exercises (method);
CREATE INDEX IF NOT EXISTS methodology_exercises_deleted_at_idx ON methodology_exercises (deleted_at);
