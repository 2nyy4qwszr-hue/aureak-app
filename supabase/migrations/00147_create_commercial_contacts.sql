-- Epic 85 — Story 85.1 : Registre Commercial Clubs
-- Enum commercial_contact_status + rôle commercial + table commercial_contacts

-- 1. Enum statut contact commercial
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commercial_contact_status') THEN
    CREATE TYPE commercial_contact_status AS ENUM (
      'premier_contact',
      'en_cours',
      'en_attente',
      'pas_de_suite'
    );
  END IF;
END $$;

-- 2. Ajout rôle commercial à user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'commercial';

-- 3. Table commercial_contacts
CREATE TABLE IF NOT EXISTS commercial_contacts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  club_directory_id UUID        NOT NULL REFERENCES club_directory(id),
  commercial_id     UUID        NOT NULL REFERENCES auth.users(id),
  contact_name      TEXT        NOT NULL,
  contact_role      TEXT,
  status            commercial_contact_status NOT NULL DEFAULT 'premier_contact',
  note              TEXT,
  contacted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_commercial_contacts_club
  ON commercial_contacts(club_directory_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_commercial_contacts_commercial
  ON commercial_contacts(commercial_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_commercial_contacts_tenant
  ON commercial_contacts(tenant_id)
  WHERE deleted_at IS NULL;

-- 5. RLS
ALTER TABLE commercial_contacts ENABLE ROW LEVEL SECURITY;

-- SELECT : même tenant (admin + commercial voient tout)
CREATE POLICY commercial_contacts_select
  ON commercial_contacts FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- INSERT : même tenant + own commercial_id
CREATE POLICY commercial_contacts_insert
  ON commercial_contacts FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND commercial_id = auth.uid()
  );

-- UPDATE : même tenant + own commercial_id
CREATE POLICY commercial_contacts_update
  ON commercial_contacts FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND commercial_id = auth.uid()
  );

-- 6. Trigger updated_at
CREATE OR REPLACE FUNCTION update_commercial_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commercial_contacts_updated_at ON commercial_contacts;
CREATE TRIGGER trg_commercial_contacts_updated_at
  BEFORE UPDATE ON commercial_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_contacts_updated_at();
