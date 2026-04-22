-- Epic 91 — Story 91.2 : Médiathèque (upload coachs + validation admin/marketeur)
-- Table metadata + bucket Storage `media-library` + RLS role-aware.
--
-- Workflow :
--   - Coach : upload → status `pending` (insert own only)
--   - Admin / Marketeur : approve / reject (peuvent aussi uploader)
-- Soft-delete uniquement (deleted_at).

-- 1. Enum type fichier
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_file_type') THEN
    CREATE TYPE media_file_type AS ENUM (
      'image',
      'video'
    );
  END IF;
END $$;

-- 2. Enum statut
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_item_status') THEN
    CREATE TYPE media_item_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;
END $$;

-- 3. Table media_items
CREATE TABLE IF NOT EXISTS media_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  uploaded_by       UUID NOT NULL REFERENCES auth.users(id),
  file_path         TEXT NOT NULL,
  file_type         media_file_type NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  status            media_item_status NOT NULL DEFAULT 'pending',
  approved_by       UUID REFERENCES auth.users(id),
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  file_size         BIGINT,
  mime_type         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_items_tenant_status
  ON media_items(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_items_uploader_created
  ON media_items(uploaded_by, created_at DESC)
  WHERE deleted_at IS NULL;

-- 4. RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- SELECT : coach own OR admin/marketeur all-tenant
CREATE POLICY media_items_select
  ON media_items FOR SELECT
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND (
      uploaded_by = auth.uid()
      OR public.current_user_role_with_fallback() IN ('admin', 'marketeur')
    )
  );

-- INSERT : tout utilisateur authentifié du tenant (uploaded_by = auth.uid())
CREATE POLICY media_items_insert
  ON media_items FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id_with_fallback()
    AND uploaded_by = auth.uid()
  );

-- UPDATE : coach own (tant que pending) OR admin/marketeur all-tenant
CREATE POLICY media_items_update
  ON media_items FOR UPDATE
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND (
      (uploaded_by = auth.uid() AND status = 'pending')
      OR public.current_user_role_with_fallback() IN ('admin', 'marketeur')
    )
  );

-- DELETE : coach own OR admin/marketeur all-tenant (soft-delete côté app)
CREATE POLICY media_items_delete
  ON media_items FOR DELETE
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND (
      uploaded_by = auth.uid()
      OR public.current_user_role_with_fallback() IN ('admin', 'marketeur')
    )
  );

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_media_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_media_items_updated_at ON media_items;
CREATE TRIGGER trg_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE FUNCTION update_media_items_updated_at();

-- 6. Bucket Storage media-library (privé, URLs signées)
--    file_size_limit = 500MB (max vidéo) ; la limite image 50MB est enforced côté client
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library',
  'media-library',
  false,
  524288000,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies — path structuré : {tenant_id}/{uploaded_by}/{filename}
--    Coach : INSERT own path, SELECT own
--    Admin / Marketeur : SELECT/UPDATE/DELETE tout le tenant

-- INSERT : tout authentifié — WITH CHECK path débute par tenant_id + own uid
DO $$ BEGIN
  CREATE POLICY "media_library_insert_own_path"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'media-library'
      AND (storage.foldername(name))[1] = public.current_tenant_id_with_fallback()::text
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SELECT : coach own OR admin/marketeur tout tenant
DO $$ BEGIN
  CREATE POLICY "media_library_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'media-library'
      AND (storage.foldername(name))[1] = public.current_tenant_id_with_fallback()::text
      AND (
        (storage.foldername(name))[2] = auth.uid()::text
        OR public.current_user_role_with_fallback() IN ('admin', 'marketeur')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE / DELETE : admin/marketeur uniquement (coach peut supprimer via DB soft-delete)
DO $$ BEGIN
  CREATE POLICY "media_library_update_admin_marketeur"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'media-library'
      AND (storage.foldername(name))[1] = public.current_tenant_id_with_fallback()::text
      AND public.current_user_role_with_fallback() IN ('admin', 'marketeur')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "media_library_delete_admin_marketeur"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'media-library'
      AND (storage.foldername(name))[1] = public.current_tenant_id_with_fallback()::text
      AND public.current_user_role_with_fallback() IN ('admin', 'marketeur')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE media_items IS
  'Médiathèque — upload coachs, validation admin/marketeur. Workflow : pending → approved|rejected. Soft-delete via deleted_at.';
