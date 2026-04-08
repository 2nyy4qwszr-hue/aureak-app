-- Migration 00142 — Tables methodology_programmes + methodology_programme_sessions
-- Story 34.4 : Page Programmes — Liste + Migration

-- ── Table principale : programmes pédagogiques ──────────────────────────────

CREATE TABLE IF NOT EXISTS methodology_programmes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method         TEXT        NOT NULL,
  context_type   TEXT        NOT NULL DEFAULT 'academie'
                             CHECK (context_type IN ('academie', 'stage')),
  title          TEXT        NOT NULL,
  season_id      UUID        REFERENCES academy_seasons(id) ON DELETE SET NULL,
  total_sessions INT         NOT NULL DEFAULT 0,
  description    TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- ── Table de jointure programme ↔ entraînements pédagogiques ────────────────

CREATE TABLE IF NOT EXISTS methodology_programme_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id   UUID        NOT NULL REFERENCES methodology_programmes(id) ON DELETE CASCADE,
  session_id     UUID        NOT NULL REFERENCES methodology_sessions(id)   ON DELETE CASCADE,
  scheduled_date DATE,
  position       INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (programme_id, session_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE methodology_programmes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_programme_sessions ENABLE ROW LEVEL SECURITY;

-- Policies methodology_programmes — tenant_id isolation (miroir methodology_exercises)
CREATE POLICY "tenant_isolation_select" ON methodology_programmes
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_insert" ON methodology_programmes
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_update" ON methodology_programmes
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_isolation_delete" ON methodology_programmes
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Policies methodology_programme_sessions — isolation via programme parent
CREATE POLICY "tenant_isolation_select" ON methodology_programme_sessions
  FOR SELECT USING (
    programme_id IN (
      SELECT id FROM methodology_programmes
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "tenant_isolation_insert" ON methodology_programme_sessions
  FOR INSERT WITH CHECK (
    programme_id IN (
      SELECT id FROM methodology_programmes
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "tenant_isolation_update" ON methodology_programme_sessions
  FOR UPDATE USING (
    programme_id IN (
      SELECT id FROM methodology_programmes
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "tenant_isolation_delete" ON methodology_programme_sessions
  FOR DELETE USING (
    programme_id IN (
      SELECT id FROM methodology_programmes
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

-- ── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_methodology_programmes_tenant
  ON methodology_programmes (tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_methodology_programmes_method
  ON methodology_programmes (method);

CREATE INDEX IF NOT EXISTS idx_methodology_programme_sessions_programme
  ON methodology_programme_sessions (programme_id);
