-- ============================================================
-- DEPLOY NOW — Run this in Supabase SQL Editor
-- Combines migration 00039 + 00040
-- Idempotent (safe to re-run)
-- ============================================================

-- ── Champs étendus sur profiles (00039) ──────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name      TEXT,
  ADD COLUMN IF NOT EXISTS last_name       TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  ADD COLUMN IF NOT EXISTS invite_status   TEXT NOT NULL DEFAULT 'not_invited'
    CHECK (invite_status IN ('not_invited', 'invited', 'active'));

CREATE INDEX IF NOT EXISTS profiles_invite_status_idx
  ON profiles (tenant_id, invite_status) WHERE deleted_at IS NULL;

-- ── Table child_metadata (00039) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_metadata (
  child_id           UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  birth_date         DATE,
  gender             TEXT CHECK (gender IN ('male', 'female', 'other')),
  strong_foot        TEXT CHECK (strong_foot IN ('right', 'left', 'both')),
  age_category       TEXT CHECK (age_category IN ('Foot à 5', 'Foot à 8', 'Foot à 11', 'Senior')),
  current_club       TEXT,
  implantation_id    UUID REFERENCES implantations(id) ON DELETE SET NULL,
  group_id           UUID REFERENCES groups(id) ON DELETE SET NULL,
  -- Papa (premier contact)
  parent_first_name  TEXT,
  parent_last_name   TEXT,
  parent_email       TEXT,
  parent_phone       TEXT,
  -- Maman (second contact — 00040)
  parent2_first_name TEXT,
  parent2_last_name  TEXT,
  parent2_email      TEXT,
  parent2_phone      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE child_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent via IF NOT EXISTS not supported — use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'child_metadata' AND policyname = 'admin_manage_child_metadata'
  ) THEN
    CREATE POLICY "admin_manage_child_metadata" ON child_metadata
      FOR ALL USING (current_user_role() = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'child_metadata' AND policyname = 'coach_read_child_metadata'
  ) THEN
    CREATE POLICY "coach_read_child_metadata" ON child_metadata
      FOR SELECT USING (current_user_role() IN ('admin', 'coach'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'child_metadata' AND policyname = 'club_read_linked_child_metadata'
  ) THEN
    CREATE POLICY "club_read_linked_child_metadata" ON child_metadata
      FOR SELECT USING (
        current_user_role() = 'club'
        AND EXISTS (
          SELECT 1 FROM club_child_links
          WHERE club_child_links.child_id = child_metadata.child_id
            AND club_child_links.club_id  = auth.uid()
        )
      );
  END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_child_metadata_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS child_metadata_updated_at ON child_metadata;
CREATE TRIGGER child_metadata_updated_at
  BEFORE UPDATE ON child_metadata
  FOR EACH ROW EXECUTE FUNCTION update_child_metadata_updated_at();

-- ── Colonnes parent2 si table existait déjà (00040 upgrade path) ─────────────
ALTER TABLE child_metadata
  ADD COLUMN IF NOT EXISTS parent2_first_name TEXT,
  ADD COLUMN IF NOT EXISTS parent2_last_name  TEXT,
  ADD COLUMN IF NOT EXISTS parent2_email      TEXT,
  ADD COLUMN IF NOT EXISTS parent2_phone      TEXT;

-- ── Fix age_category constraint si ancienne version existe ───────────────────
-- Drop old U5/U8/U11 constraint if it exists, replace with new values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'child_metadata_age_category_check'
    AND conrelid = 'public.child_metadata'::regclass
  ) THEN
    ALTER TABLE child_metadata DROP CONSTRAINT child_metadata_age_category_check;
  END IF;

  ALTER TABLE child_metadata
    ADD CONSTRAINT child_metadata_age_category_check
      CHECK (age_category IN ('Foot à 5', 'Foot à 8', 'Foot à 11', 'Senior'));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists with the right values
END $$;

SELECT 'Migration complete. child_metadata table ready.' as status;
