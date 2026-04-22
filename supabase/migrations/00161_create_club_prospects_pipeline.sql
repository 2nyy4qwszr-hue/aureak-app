-- Epic 88 — Story 88.2 : Pipeline CRM clubs prospects (multi-contacts par prospect)
-- Tables : club_prospects (pipeline) + prospect_contacts (cartographie organisation)
-- Séparées de club_directory (annuaire Notion) et commercial_contacts (registre epic 85).

-- 1. Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_prospect_status') THEN
    CREATE TYPE club_prospect_status AS ENUM (
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

-- 2. Table club_prospects
CREATE TABLE IF NOT EXISTS club_prospects (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  club_name                TEXT NOT NULL,
  city                     TEXT,
  target_implantation_id   UUID REFERENCES implantations(id),
  status                   club_prospect_status NOT NULL DEFAULT 'premier_contact',
  assigned_commercial_id   UUID NOT NULL REFERENCES auth.users(id),
  source                   TEXT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_club_prospects_tenant_status
  ON club_prospects(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_prospects_assigned_commercial
  ON club_prospects(assigned_commercial_id)
  WHERE deleted_at IS NULL;

-- 3. Table prospect_contacts
CREATE TABLE IF NOT EXISTS prospect_contacts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_prospect_id   UUID NOT NULL REFERENCES club_prospects(id) ON DELETE CASCADE,
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  role               club_contact_role NOT NULL DEFAULT 'autre',
  email              TEXT,
  phone              TEXT,
  is_decisionnaire   BOOLEAN NOT NULL DEFAULT FALSE,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prospect_contacts_club_prospect
  ON prospect_contacts(club_prospect_id)
  WHERE deleted_at IS NULL;

-- 4. RLS club_prospects
ALTER TABLE club_prospects ENABLE ROW LEVEL SECURITY;

-- SELECT : admin voit tout le tenant, commercial voit ses prospects assignés
CREATE POLICY club_prospects_select
  ON club_prospects FOR SELECT
  USING (
    deleted_at IS NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR assigned_commercial_id = auth.uid()
    )
  );

-- INSERT : admin ou commercial sur son propre tenant
CREATE POLICY club_prospects_insert
  ON club_prospects FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR (current_user_role() = 'commercial' AND assigned_commercial_id = auth.uid())
    )
  );

-- UPDATE : admin ou commercial propriétaire
CREATE POLICY club_prospects_update
  ON club_prospects FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      current_user_role() = 'admin'
      OR assigned_commercial_id = auth.uid()
    )
  );

-- 5. RLS prospect_contacts (via join club_prospects)
ALTER TABLE prospect_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY prospect_contacts_select
  ON prospect_contacts FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (current_user_role() = 'admin' OR cp.assigned_commercial_id = auth.uid())
    )
  );

CREATE POLICY prospect_contacts_insert
  ON prospect_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (current_user_role() = 'admin' OR cp.assigned_commercial_id = auth.uid())
    )
  );

CREATE POLICY prospect_contacts_update
  ON prospect_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (current_user_role() = 'admin' OR cp.assigned_commercial_id = auth.uid())
    )
  );

-- 6. Triggers updated_at
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

-- 7. Comments
COMMENT ON TABLE club_prospects IS 'Pipeline CRM clubs prospects (epic 88). Séparé de club_directory (annuaire Notion) et commercial_contacts (registre epic 85).';
COMMENT ON TABLE prospect_contacts IS 'Cartographie organisationnelle des prospects — multi-contacts par club, identification du décisionnaire.';
COMMENT ON COLUMN prospect_contacts.is_decisionnaire IS 'Flag décisionnaire identifié — tant que false, prospect reste en mapping_orga.';
