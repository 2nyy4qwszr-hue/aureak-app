-- Epic 92 — Story 92.2 : Sponsors liés à enfants (parrainage académie)
-- Admin crée des sponsors et relie 1..N enfants à chaque sponsor.
-- Un enfant peut être parrainé par plusieurs sponsors simultanément.
-- Révocation = soft-delete via ended_at (ligne conservée pour historique).

-- 1. Enum sponsor_type -------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_type') THEN
    CREATE TYPE sponsor_type AS ENUM (
      'entreprise',
      'individuel',
      'association',
      'club'
    );
  END IF;
END $$;

-- 2. Table sponsors ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sponsors (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT           NOT NULL,
  sponsor_type        sponsor_type   NOT NULL DEFAULT 'entreprise',
  annual_amount_cents INTEGER        NULL CHECK (annual_amount_cents IS NULL OR annual_amount_cents >= 0),
  active_from         DATE           NOT NULL DEFAULT CURRENT_DATE,
  active_until        DATE           NULL,
  contact_email       TEXT           NULL,
  contact_phone       TEXT           NULL,
  notes               TEXT           NULL,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by          UUID           NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT sponsors_dates_check CHECK (active_until IS NULL OR active_until >= active_from)
);

CREATE INDEX IF NOT EXISTS idx_sponsors_tenant_active_from
  ON sponsors (tenant_id, active_from DESC);

-- 3. Table sponsor_child_links ----------------------------------------------
-- FK child_id → profiles.user_id (PK des profils = user_id, pas id)
CREATE TABLE IF NOT EXISTS sponsor_child_links (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sponsor_id              UUID        NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  child_id                UUID        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  started_at              DATE        NOT NULL DEFAULT CURRENT_DATE,
  ended_at                DATE        NULL,
  allocated_amount_cents  INTEGER     NULL CHECK (allocated_amount_cents IS NULL OR allocated_amount_cents >= 0),
  notes                   TEXT        NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT sponsor_child_dates_check CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_sponsor_active
  ON sponsor_child_links (sponsor_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_child_active
  ON sponsor_child_links (child_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_tenant
  ON sponsor_child_links (tenant_id);

-- 4. RLS — admin-only tenant-isolated (helpers *_with_fallback obligatoires)
ALTER TABLE sponsors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_child_links  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY sponsors_admin_select ON sponsors
    FOR SELECT USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsors_admin_insert ON sponsors
    FOR INSERT WITH CHECK (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsors_admin_update ON sponsors
    FOR UPDATE
    USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    )
    WITH CHECK (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsors_admin_delete ON sponsors
    FOR DELETE USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsor_child_links_admin_select ON sponsor_child_links
    FOR SELECT USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsor_child_links_admin_insert ON sponsor_child_links
    FOR INSERT WITH CHECK (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsor_child_links_admin_update ON sponsor_child_links
    FOR UPDATE
    USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    )
    WITH CHECK (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sponsor_child_links_admin_delete ON sponsor_child_links
    FOR DELETE USING (
      tenant_id = public.current_tenant_id_with_fallback()
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Trigger updated_at sur sponsors -----------------------------------------
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sponsors_updated_at ON sponsors;
CREATE TRIGGER trg_sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

COMMENT ON TABLE sponsors IS
  'Sponsors de l''académie — parrainage enfants. Soft-delete non implémenté (DELETE admin uniquement). Actif = active_from <= today AND (active_until IS NULL OR active_until >= today).';

COMMENT ON TABLE sponsor_child_links IS
  'Lien sponsor ↔ enfant (parrainage). Multi-parrainage autorisé. Révocation = UPDATE ended_at (soft-delete).';
