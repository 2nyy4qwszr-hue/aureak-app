-- =============================================================================
-- Migration 00100 : Programmes pédagogiques & Architecture entraînements
-- Story 34.1 — Architecture Programme & Formulaire Intelligent
-- =============================================================================

-- ── 1. Table programmes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programmes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  programme_type  TEXT        NOT NULL CHECK (programme_type IN ('academie','stage')),
  season_id       UUID        REFERENCES academy_seasons(id),
  theme           TEXT,         -- thème libre pour stages (ex: 'Tir au but', '1v1')
  description     TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programmes_tenant_isolation" ON programmes
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_programmes_tenant
  ON programmes(tenant_id) WHERE deleted_at IS NULL;

-- ── 2. Table programme_trainings (join table M:N) ─────────────────────────────

CREATE TABLE IF NOT EXISTS programme_trainings (
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  training_id  UUID NOT NULL REFERENCES methodology_sessions(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (programme_id, training_id)
);

ALTER TABLE programme_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programme_trainings_tenant" ON programme_trainings
  FOR ALL USING (
    programme_id IN (
      SELECT id FROM programmes WHERE tenant_id = current_tenant_id()
    )
  );

-- ── 3. Table method_module_config (ranges numéros par module) ─────────────────

CREATE TABLE IF NOT EXISTS method_module_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method        TEXT NOT NULL,
  module_number INT  NOT NULL,
  range_start   INT  NOT NULL,
  range_end     INT  NOT NULL,
  UNIQUE (method, module_number)
);

-- Pas de tenant_id : données de configuration globale (read-only pour tous)
ALTER TABLE method_module_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "method_module_config_read_all" ON method_module_config
  FOR SELECT USING (true);

-- ── 4. Seed method_module_config ──────────────────────────────────────────────

INSERT INTO method_module_config (method, module_number, range_start, range_end) VALUES
  -- Goal and Player : 3 modules, 5 entraînements chacun
  ('Goal and Player', 1,  1,  5),
  ('Goal and Player', 2,  6, 10),
  ('Goal and Player', 3, 11, 15),
  -- Technique : 8 modules, 30 entraînements total (M4 et M8 = 3 seulement)
  ('Technique', 1,  1,  4),
  ('Technique', 2,  5,  8),
  ('Technique', 3,  9, 12),
  ('Technique', 4, 13, 15),
  ('Technique', 5, 16, 19),
  ('Technique', 6, 20, 23),
  ('Technique', 7, 24, 27),
  ('Technique', 8, 28, 30)
ON CONFLICT (method, module_number) DO NOTHING;

-- ── 5. Colonnes supplémentaires sur methodology_sessions ─────────────────────
-- Rétrocompatibilité : toutes NULLABLE, migration non destructive

ALTER TABLE methodology_sessions
  ADD COLUMN IF NOT EXISTS module_number   INT,
  ADD COLUMN IF NOT EXISTS bloc_name       TEXT,
  ADD COLUMN IF NOT EXISTS training_number INT,
  ADD COLUMN IF NOT EXISTS training_type   TEXT CHECK (
    training_type IS NULL OR training_type IN ('decouverte','consolidation')
  );

-- Index pour les lookups par programme/méthode/module
CREATE INDEX IF NOT EXISTS idx_sessions_method_module
  ON methodology_sessions(method, module_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_bloc
  ON methodology_sessions(bloc_name) WHERE deleted_at IS NULL;
