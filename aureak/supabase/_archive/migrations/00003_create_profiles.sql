-- Migration 00003 — profiles + parent_child_links + trigger activation
-- Story 2.1 — Inscription & Auth Standard
-- Prérequis : 00001 (tenants, current_tenant_id, current_user_role), 00002 (user_role enum)

-- ============================================================
-- Table profiles — liaison auth.users ↔ données applicatives
-- ============================================================
CREATE TABLE profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  user_role    user_role NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'active', 'disabled')),
  display_name TEXT,
  -- Soft-delete convention (Zone 11 architecture)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES auth.users(id)
);

-- Index de performance
CREATE INDEX profiles_tenant_idx      ON profiles (tenant_id);
CREATE INDEX profiles_role_idx        ON profiles (tenant_id, user_role);
CREATE INDEX profiles_status_idx      ON profiles (status) WHERE deleted_at IS NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateur lui-même OU admin du même tenant
CREATE POLICY "own_profile_read" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR current_user_role() = 'admin'
  );

-- Un utilisateur peut modifier son propre profil (display_name uniquement)
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seul l'admin peut insérer (création de compte)
CREATE POLICY "admin_insert" ON profiles
  FOR INSERT WITH CHECK (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
  );

-- ============================================================
-- Trigger — activation du compte à la confirmation email
-- S'exécute quand email_confirmed_at passe de NULL à non-NULL
-- ============================================================
CREATE OR REPLACE FUNCTION handle_user_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- email_confirmed_at vient d'être renseigné (confirmation du lien invitation)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles
    SET status = 'active', updated_at = now()
    WHERE user_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_confirmation();

-- ============================================================
-- Table parent_child_links — liaison parent ↔ enfant
-- ============================================================
CREATE TABLE parent_child_links (
  parent_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, child_id)
);

ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_sees_own_links" ON parent_child_links
  FOR SELECT USING (
    parent_id = auth.uid()
    OR current_user_role() = 'admin'
  );

CREATE POLICY "admin_manage_links" ON parent_child_links
  FOR ALL USING (current_user_role() = 'admin');
