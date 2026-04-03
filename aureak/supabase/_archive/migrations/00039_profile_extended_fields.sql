-- Migration 00039 — Champs étendus profils + table child_metadata
-- Sépare clairement "fiche profil" (données métier) de "compte auth" (invitation)

-- ── Champs étendus sur profiles ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name      TEXT,
  ADD COLUMN IF NOT EXISTS last_name       TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  -- invite_status distingue "fiche locale", "invitation envoyée", "compte actif"
  ADD COLUMN IF NOT EXISTS invite_status   TEXT NOT NULL DEFAULT 'not_invited'
    CHECK (invite_status IN ('not_invited', 'invited', 'active'));

-- Index pour requêtes admin par statut d'invitation
CREATE INDEX IF NOT EXISTS profiles_invite_status_idx
  ON profiles (tenant_id, invite_status) WHERE deleted_at IS NULL;

-- ── Table child_metadata ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_metadata (
  child_id          UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  birth_date        DATE,
  gender            TEXT CHECK (gender IN ('male', 'female', 'other')),
  strong_foot       TEXT CHECK (strong_foot IN ('right', 'left', 'both')),
  age_category      TEXT CHECK (age_category IN ('U5', 'U8', 'U11', 'Senior')),
  current_club      TEXT,
  implantation_id   UUID REFERENCES implantations(id) ON DELETE SET NULL,
  group_id          UUID REFERENCES groups(id) ON DELETE SET NULL,
  -- Contact parent (dénormalisé pour accès rapide sans jointure profile parent)
  parent_first_name TEXT,
  parent_last_name  TEXT,
  parent_email      TEXT,
  parent_phone      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE child_metadata ENABLE ROW LEVEL SECURITY;

-- Admin : lecture + écriture complète
CREATE POLICY "admin_manage_child_metadata" ON child_metadata
  FOR ALL USING (current_user_role() = 'admin');

-- Coach : lecture seule (pour accès aux fiches enfants lors des séances)
CREATE POLICY "coach_read_child_metadata" ON child_metadata
  FOR SELECT USING (current_user_role() IN ('admin', 'coach'));

-- Club : lecture des enfants liés uniquement
CREATE POLICY "club_read_linked_child_metadata" ON child_metadata
  FOR SELECT USING (
    current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM club_child_links
      WHERE club_child_links.child_id = child_metadata.child_id
        AND club_child_links.club_id  = auth.uid()
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_child_metadata_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER child_metadata_updated_at
  BEFORE UPDATE ON child_metadata
  FOR EACH ROW EXECUTE FUNCTION update_child_metadata_updated_at();
