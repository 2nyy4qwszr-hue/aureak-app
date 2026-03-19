-- Migration 00084 — Story 23.2 : Chemin logo pour les clubs + bucket Storage club-logos

-- ── Colonne DB ────────────────────────────────────────────────────────────────

ALTER TABLE club_directory
  ADD COLUMN IF NOT EXISTS logo_path TEXT NULL;

COMMENT ON COLUMN club_directory.logo_path
  IS 'Chemin Storage Supabase du logo du club (bucket club-logos). NULL si aucun logo.';

-- ── Bucket Storage ────────────────────────────────────────────────────────────
-- NOTE : si le bucket est déjà créé via le Dashboard, cette instruction est silencieuse.

INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', false)
ON CONFLICT (id) DO NOTHING;

-- ── Policies RLS Storage ──────────────────────────────────────────────────────

-- Upload : admins uniquement
DO $$ BEGIN
  CREATE POLICY "club_logos_upload_admin"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'club-logos'
      AND (auth.jwt() ->> 'user_role') = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lecture : tout utilisateur authentifié
DO $$ BEGIN
  CREATE POLICY "club_logos_read_authenticated"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'club-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Suppression : admins uniquement
DO $$ BEGIN
  CREATE POLICY "club_logos_delete_admin"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'club-logos'
      AND (auth.jwt() ->> 'user_role') = 'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
