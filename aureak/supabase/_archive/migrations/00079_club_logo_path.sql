-- Migration 00079 : Ajout du chemin logo pour les clubs + bucket Storage club-logos
-- Story 23.2 — Logo club upload

-- ── Colonne DB ────────────────────────────────────────────────────────────────

ALTER TABLE club_directory
  ADD COLUMN logo_path TEXT NULL;

COMMENT ON COLUMN club_directory.logo_path
  IS 'Chemin Storage Supabase du logo du club (bucket club-logos). NULL si aucun logo.';

-- ── Bucket Storage ────────────────────────────────────────────────────────────
-- NOTE : si le bucket est déjà créé via le Dashboard, cette instruction est silencieuse.

INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', false)
ON CONFLICT (id) DO NOTHING;

-- ── Policies RLS Storage ──────────────────────────────────────────────────────

-- Upload : admins uniquement
CREATE POLICY "club_logos_upload_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'club-logos'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Lecture : tout utilisateur authentifié du même tenant
CREATE POLICY "club_logos_read_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'club-logos');

-- Suppression : admins uniquement
CREATE POLICY "club_logos_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'club-logos'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );
