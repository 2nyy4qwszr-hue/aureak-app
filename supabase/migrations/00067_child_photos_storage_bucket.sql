-- Migration: 00067_child_photos_storage_bucket.sql
-- Story 18.2 : Création du bucket Storage privé "child-photos"
--
-- Complète la migration 00065 qui créait la table child_directory_photos
-- mais laissait la création du bucket en action manuelle.
--
-- Bucket : child-photos
--   - private (public = false)
--   - accès uniquement via Signed URLs
--   - structure : child-photos/{childId}/{photoId}.jpg

-- ── Bucket ────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-photos',
  'child-photos',
  false,                                          -- PRIVATE : pas d'URL publique
  5242880,                                        -- 5 MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- images uniquement
)
ON CONFLICT (id) DO NOTHING;                      -- idempotent

-- ── Storage Policies ──────────────────────────────────────────────────────────
--
-- Règles :
--   - Admin : upload + lecture (signed URL) + suppression
--   - Coach  : lecture uniquement (signed URL)
--   - Pas d'accès public direct — toujours via signed URL

-- Admin — INSERT (upload)
CREATE POLICY "child_photos_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Admin — SELECT (génération de signed URL)
CREATE POLICY "child_photos_admin_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Admin — DELETE (suppression d'une photo)
CREATE POLICY "child_photos_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Coach — SELECT uniquement (lecture via signed URL pour affichage futur)
CREATE POLICY "child_photos_coach_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (auth.jwt() ->> 'role') IN ('admin', 'coach')
  );
