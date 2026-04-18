-- Story 91-2 : Médiathèque — upload coachs + validation admin
-- Enum, table media_items, RLS, bucket Storage

-- ── Enum ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE media_item_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL DEFAULT current_setting('app.tenant_id')::uuid,
  uploaded_by  uuid NOT NULL REFERENCES profiles(id),
  file_path    text NOT NULL,
  file_type    text NOT NULL CHECK (file_type IN ('image', 'video')),
  title        text NOT NULL DEFAULT '',
  description  text DEFAULT '',
  status       media_item_status NOT NULL DEFAULT 'pending',
  approved_by  uuid REFERENCES profiles(id),
  approved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- Index
CREATE INDEX IF NOT EXISTS idx_media_items_status     ON media_items (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_items_uploaded_by ON media_items (uploaded_by) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER trg_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Admin : lecture + modification de tous les médias
CREATE POLICY media_items_admin_all ON media_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Coach : insert ses propres médias
CREATE POLICY media_items_coach_insert ON media_items
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
    )
  );

-- Coach : lecture de ses propres médias
CREATE POLICY media_items_coach_select ON media_items
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
    )
  );

-- ── Bucket Storage ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY storage_media_library_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'coach')
    )
  );

CREATE POLICY storage_media_library_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'coach')
    )
  );

CREATE POLICY storage_media_library_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
