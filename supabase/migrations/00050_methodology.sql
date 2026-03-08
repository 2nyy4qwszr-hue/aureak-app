-- =============================================================================
-- Migration 00050 : Méthodologie — contenu pédagogique
-- Séparation nette : sessions terrain (opérationnelles) ≠ séances pédagogiques
-- Tables : methodology_themes, methodology_situations, methodology_sessions
-- Joins  : methodology_session_themes, methodology_session_situations
-- Lien   : sessions.methodology_session_id → methodology_sessions(id)
-- =============================================================================

-- ── Thèmes pédagogiques (blocs de savoir) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS methodology_themes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  method          TEXT,                    -- NULL = toutes méthodes
  description     TEXT,
  corrections     TEXT,                    -- points de correction clés
  coaching_points TEXT,                    -- points d'attention coach
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'methodology_themes' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE methodology_themes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON methodology_themes FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

CREATE INDEX IF NOT EXISTS idx_mthemes_tenant ON methodology_themes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mthemes_method ON methodology_themes(tenant_id, method) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION set_methodology_themes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS methodology_themes_updated_at ON methodology_themes;
CREATE TRIGGER methodology_themes_updated_at BEFORE UPDATE ON methodology_themes FOR EACH ROW EXECUTE FUNCTION set_methodology_themes_updated_at();

-- ── Situations pédagogiques (blocs de savoir) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS methodology_situations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  method          TEXT,
  description     TEXT,
  corrections     TEXT,
  common_mistakes TEXT,
  theme_id        UUID        REFERENCES methodology_themes(id) ON DELETE SET NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'methodology_situations' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE methodology_situations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON methodology_situations FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

CREATE INDEX IF NOT EXISTS idx_msituations_tenant ON methodology_situations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msituations_method ON methodology_situations(tenant_id, method) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msituations_theme  ON methodology_situations(theme_id) WHERE theme_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_methodology_situations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS methodology_situations_updated_at ON methodology_situations;
CREATE TRIGGER methodology_situations_updated_at BEFORE UPDATE ON methodology_situations FOR EACH ROW EXECUTE FUNCTION set_methodology_situations_updated_at();

-- ── Séances pédagogiques (contenu réutilisable, principalement PDF) ───────────

CREATE TABLE IF NOT EXISTS methodology_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  method       TEXT,        -- 'Golden Player' | 'Technique' | 'Situationnel' | 'Décisionnel' | 'Intégration' | 'Perfectionnement'
  context_type TEXT,        -- 'academie' | 'stage'
  objective    TEXT,
  level        TEXT,        -- 'debutant' | 'intermediaire' | 'avance'
  pdf_url      TEXT,
  description  TEXT,
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'methodology_sessions' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE methodology_sessions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON methodology_sessions FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

CREATE INDEX IF NOT EXISTS idx_msessions_tenant  ON methodology_sessions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msessions_method  ON methodology_sessions(tenant_id, method) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msessions_context ON methodology_sessions(tenant_id, context_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_msessions_active  ON methodology_sessions(tenant_id, is_active) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION set_methodology_sessions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS methodology_sessions_updated_at ON methodology_sessions;
CREATE TRIGGER methodology_sessions_updated_at BEFORE UPDATE ON methodology_sessions FOR EACH ROW EXECUTE FUNCTION set_methodology_sessions_updated_at();

-- ── Tables de liaison séance pédagogique ↔ blocs de savoir ───────────────────

CREATE TABLE IF NOT EXISTS methodology_session_themes (
  session_id UUID NOT NULL REFERENCES methodology_sessions(id) ON DELETE CASCADE,
  theme_id   UUID NOT NULL REFERENCES methodology_themes(id)   ON DELETE CASCADE,
  PRIMARY KEY (session_id, theme_id)
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'methodology_session_themes' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE methodology_session_themes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON methodology_session_themes FOR ALL USING (
      EXISTS (SELECT 1 FROM methodology_sessions ms WHERE ms.id = session_id AND ms.tenant_id = current_tenant_id())
    );
  END IF;
END $rls$;

CREATE TABLE IF NOT EXISTS methodology_session_situations (
  session_id   UUID NOT NULL REFERENCES methodology_sessions(id)   ON DELETE CASCADE,
  situation_id UUID NOT NULL REFERENCES methodology_situations(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, situation_id)
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'methodology_session_situations' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE methodology_session_situations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON methodology_session_situations FOR ALL USING (
      EXISTS (SELECT 1 FROM methodology_sessions ms WHERE ms.id = session_id AND ms.tenant_id = current_tenant_id())
    );
  END IF;
END $rls$;

-- ── Lien session terrain → séance pédagogique ────────────────────────────────
-- Une session terrain peut être basée sur une séance pédagogique de la bibliothèque

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS methodology_session_id UUID REFERENCES methodology_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_methodology ON sessions(methodology_session_id)
  WHERE methodology_session_id IS NOT NULL;
