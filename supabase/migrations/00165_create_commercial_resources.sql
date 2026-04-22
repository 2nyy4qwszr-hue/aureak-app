-- Epic 88 — Story 88.5 : Bibliothèque ressources commerciales (PowerPoint, Flyer, Webpage, Tarifs)
-- Table metadata + bucket Storage + seed 4 ressources prédéfinies.

-- 1. Enum type ressource
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commercial_resource_type') THEN
    CREATE TYPE commercial_resource_type AS ENUM (
      'powerpoint',
      'flyer',
      'webpage',
      'tarifs'
    );
  END IF;
END $$;

-- 2. Table commercial_resources
CREATE TABLE IF NOT EXISTS commercial_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  resource_type commercial_resource_type NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  file_path     TEXT,
  external_url  TEXT,
  file_size     BIGINT,
  mime_type     TEXT,
  uploaded_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un seul enregistrement par type par tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_resources_tenant_type
  ON commercial_resources(tenant_id, resource_type);

-- 3. RLS — admin CRUD, tout utilisateur tenant = SELECT
ALTER TABLE commercial_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY commercial_resources_select
  ON commercial_resources FOR SELECT
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
  );

CREATE POLICY commercial_resources_insert
  ON commercial_resources FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id_with_fallback()
    AND public.current_user_role_with_fallback() = 'admin'
  );

CREATE POLICY commercial_resources_update
  ON commercial_resources FOR UPDATE
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND public.current_user_role_with_fallback() = 'admin'
  );

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION update_commercial_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commercial_resources_updated_at ON commercial_resources;
CREATE TRIGGER trg_commercial_resources_updated_at
  BEFORE UPDATE ON commercial_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_resources_updated_at();

-- 5. Seed : 4 ressources prédéfinies pour chaque tenant existant
INSERT INTO commercial_resources (tenant_id, resource_type, title, description)
SELECT t.id, 'powerpoint', 'PowerPoint Club',
  'Présentation à envoyer aux clubs prospects — pitch Aureak, offre, preuves.'
FROM tenants t
ON CONFLICT (tenant_id, resource_type) DO NOTHING;

INSERT INTO commercial_resources (tenant_id, resource_type, title, description)
SELECT t.id, 'flyer', 'Flyer Parents',
  'Document à distribuer aux parents — positionnement, programme, inscriptions.'
FROM tenants t
ON CONFLICT (tenant_id, resource_type) DO NOTHING;

INSERT INTO commercial_resources (tenant_id, resource_type, title, description)
SELECT t.id, 'webpage', 'Webpage One-pager',
  'Page web de présentation publique à partager par lien.'
FROM tenants t
ON CONFLICT (tenant_id, resource_type) DO NOTHING;

INSERT INTO commercial_resources (tenant_id, resource_type, title, description)
SELECT t.id, 'tarifs', 'Grille Tarifaire',
  'Tarifs actuels — à présenter en clôture de RDV commercial.'
FROM tenants t
ON CONFLICT (tenant_id, resource_type) DO NOTHING;

-- 6. Bucket Storage commercial-resources (privé, URLs signées)
INSERT INTO storage.buckets (id, name, public)
VALUES ('commercial-resources', 'commercial-resources', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies : lecture auth-tenant, écriture admin
DO $$ BEGIN
  CREATE POLICY "commercial_resources_read_authenticated"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'commercial-resources');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "commercial_resources_upload_admin"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'commercial-resources'
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "commercial_resources_update_admin"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'commercial-resources'
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "commercial_resources_delete_admin"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'commercial-resources'
      AND public.current_user_role_with_fallback() = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE commercial_resources IS
  '4 ressources commerciales prédéfinies par tenant (powerpoint, flyer, webpage, tarifs). Seed auto — admin met à jour contenu. Webpage stocke external_url au lieu de file_path.';
