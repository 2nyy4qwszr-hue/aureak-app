-- Story 49-6 — Ajout photo_url sur implantations + bucket Storage implantation-photos

ALTER TABLE implantations
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;

COMMENT ON COLUMN implantations.photo_url IS
  'URL publique Supabase Storage vers la photo ou le logo de ce site (bucket implantation-photos)';

-- Bucket Storage : créé via Dashboard Supabase ou via cette migration SQL
-- Si le bucket n'existe pas encore, l'insérer dans storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('implantation-photos', 'implantation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy : lecture publique
CREATE POLICY "implantation_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'implantation-photos');

-- Policy : insert/update/delete réservé aux admins authentifiés
CREATE POLICY "implantation_photos_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'implantation-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "implantation_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'implantation-photos'
    AND auth.role() = 'authenticated'
  );
