-- Story 92-2 : Sponsors — CRUD + lien enfant + capsule vidéo
-- Enums sponsorship_type, capsule_status + table sponsors + RLS + index

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE sponsorship_type AS ENUM ('individual', 'club', 'corporate', 'media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE capsule_status AS ENUM ('not_started', 'filming', 'editing', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL DEFAULT current_setting('app.tenant_id')::uuid,
  name             text NOT NULL,
  logo_url         text,
  contact_name     text NOT NULL DEFAULT '',
  contact_email    text NOT NULL DEFAULT '',
  contact_phone    text NOT NULL DEFAULT '',
  sponsorship_type sponsorship_type NOT NULL,
  amount           numeric,
  currency         text NOT NULL DEFAULT 'EUR',
  start_date       date NOT NULL DEFAULT CURRENT_DATE,
  end_date         date,
  linked_child_id  uuid REFERENCES child_directory(id),
  capsule_status   capsule_status DEFAULT 'not_started',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sponsors_type           ON sponsors (sponsorship_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sponsors_child           ON sponsors (linked_child_id) WHERE deleted_at IS NULL AND linked_child_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sponsors_capsule         ON sponsors (capsule_status) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER trg_sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Admin : CRUD complet
CREATE POLICY sponsors_admin_all ON sponsors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
