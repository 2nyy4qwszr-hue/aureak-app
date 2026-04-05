-- Story 49-6 — Ajout photo_url sur implantations + bucket Storage implantation-photos

ALTER TABLE implantations
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;

COMMENT ON COLUMN implantations.photo_url IS
  'URL publique Supabase Storage vers la photo ou le logo de ce site (bucket implantation-photos)';

-- Bucket Storage : créé via Dashboard Supabase ou via cette migration SQL
-- Si le bucket n'existe pas encore, l'insérer dans storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'implantation-photos',
  'implantation-photos',
  true,
  5242880,                                          -- 5 MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']   -- images uniquement
)
ON CONFLICT (id) DO NOTHING;

-- Policy : lecture publique (bucket public — pas de restriction)
DO $$ BEGIN
  CREATE POLICY "implantation_photos_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'implantation-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy : insert réservé aux admins authentifiés
DO $$ BEGIN
  CREATE POLICY "implantation_photos_admin_write"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'implantation-photos'
      AND (auth.jwt() ->> 'user_role') = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy : update réservé aux admins (nécessaire pour upsert: true dans uploadImplantationPhoto)
DO $$ BEGIN
  CREATE POLICY "implantation_photos_admin_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'implantation-photos'
      AND (auth.jwt() ->> 'user_role') = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy : delete réservé aux admins
DO $$ BEGIN
  CREATE POLICY "implantation_photos_admin_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'implantation-photos'
      AND (auth.jwt() ->> 'user_role') = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
