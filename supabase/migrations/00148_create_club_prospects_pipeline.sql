-- Story 88.2 — Pipeline clubs : club_prospects + prospect_contacts
-- Enums prospect_status, club_contact_role + 2 tables + RLS + index + triggers

-- 1. Enum prospect_status (7 valeurs pipeline CRM)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prospect_status') THEN
    CREATE TYPE prospect_status AS ENUM (
      'premier_contact',
      'mapping_orga',
      'decisionnaire_identifie',
      'rdv_qualifie',
      'closing',
      'converti',
      'perdu'
    );
  END IF;
END $$;

-- 2. Enum club_contact_role (5 valeurs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_contact_role') THEN
    CREATE TYPE club_contact_role AS ENUM (
      'entraineur',
      'directeur_sportif',
      'president',
      'secretaire',
      'autre'
    );
  END IF;
END $$;

-- 3. Table club_prospects
CREATE TABLE IF NOT EXISTS club_prospects (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL REFERENCES tenants(id),
  club_name                 TEXT        NOT NULL,
  city                      TEXT        NOT NULL,
  target_implantation_id    UUID        REFERENCES implantations(id),
  status                    prospect_status NOT NULL DEFAULT 'premier_contact',
  assigned_commercial_id    UUID        NOT NULL REFERENCES auth.users(id),
  source                    TEXT,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

-- 4. Table prospect_contacts
CREATE TABLE IF NOT EXISTS prospect_contacts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_prospect_id  UUID        NOT NULL REFERENCES club_prospects(id) ON DELETE CASCADE,
  first_name        TEXT        NOT NULL,
  last_name         TEXT        NOT NULL,
  role              club_contact_role NOT NULL DEFAULT 'autre',
  email             TEXT,
  phone             TEXT,
  is_decisionnaire  BOOLEAN     NOT NULL DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_club_prospects_tenant_status
  ON club_prospects(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_prospects_commercial
  ON club_prospects(assigned_commercial_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_contacts_prospect
  ON prospect_contacts(club_prospect_id)
  WHERE deleted_at IS NULL;

-- 6. RLS enable
ALTER TABLE club_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_contacts ENABLE ROW LEVEL SECURITY;

-- 7. Policies club_prospects

-- SELECT : admin voit tout le tenant, commercial voit ses prospects assignés
CREATE POLICY club_prospects_select ON club_prospects FOR SELECT USING (
  deleted_at IS NULL
  AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR assigned_commercial_id = auth.uid()
  )
);

-- INSERT : admin ou commercial (commercial = auto-assigné)
CREATE POLICY club_prospects_insert ON club_prospects FOR INSERT WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR assigned_commercial_id = auth.uid()
  )
);

-- UPDATE : admin ou commercial assigné
CREATE POLICY club_prospects_update ON club_prospects FOR UPDATE USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR assigned_commercial_id = auth.uid()
  )
);

-- 8. Policies prospect_contacts (via join sur club_prospects)

CREATE POLICY prospect_contacts_select ON prospect_contacts FOR SELECT USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM club_prospects cp
    WHERE cp.id = prospect_contacts.club_prospect_id
    AND cp.deleted_at IS NULL
    AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() ->> 'role') = 'admin'
      OR cp.assigned_commercial_id = auth.uid()
    )
  )
);

CREATE POLICY prospect_contacts_insert ON prospect_contacts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_prospects cp
    WHERE cp.id = prospect_contacts.club_prospect_id
    AND cp.deleted_at IS NULL
    AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() ->> 'role') = 'admin'
      OR cp.assigned_commercial_id = auth.uid()
    )
  )
);

CREATE POLICY prospect_contacts_update ON prospect_contacts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM club_prospects cp
    WHERE cp.id = prospect_contacts.club_prospect_id
    AND cp.deleted_at IS NULL
    AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() ->> 'role') = 'admin'
      OR cp.assigned_commercial_id = auth.uid()
    )
  )
);

-- 9. Triggers updated_at

CREATE OR REPLACE FUNCTION update_club_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_club_prospects_updated_at ON club_prospects;
CREATE TRIGGER trg_club_prospects_updated_at
  BEFORE UPDATE ON club_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_club_prospects_updated_at();

CREATE OR REPLACE FUNCTION update_prospect_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prospect_contacts_updated_at ON prospect_contacts;
CREATE TRIGGER trg_prospect_contacts_updated_at
  BEFORE UPDATE ON prospect_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_contacts_updated_at();
