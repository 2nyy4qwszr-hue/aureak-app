-- Story 86-3 — Epic 86 Architecture Rôles & Permissions
-- Table section_permissions : défauts par rôle × section (config globale plateforme).
-- Pas de tenant_id — la matrice par défaut est partagée entre tous les tenants.
-- Les overrides individuels sont dans user_section_overrides (migration 00151).
--
-- Enums :
--   section_key       = 10 sections navigation (dashboard, activites, methodologie,
--                       academie, evenements, prospection, marketing, partenariat,
--                       performances, admin)
--   permission_access = granted | denied (réservé pour usage futur granularité)
--
-- RLS :
--   SELECT : ouvert à tout utilisateur authentifié (besoin sidebar dynamique)
--   INSERT/UPDATE/DELETE : admin uniquement (config globale, pas de tenant check)

-- =============================================================================
-- 1. Enums
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE section_key AS ENUM (
    'dashboard','activites','methodologie','academie',
    'evenements','prospection','marketing','partenariat',
    'performances','admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE permission_access AS ENUM ('granted','denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. Table section_permissions — défauts par rôle (config globale)
-- =============================================================================
CREATE TABLE IF NOT EXISTS section_permissions (
  role         user_role   NOT NULL,
  section_key  section_key NOT NULL,
  granted      BOOLEAN     NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID        REFERENCES profiles(user_id),
  PRIMARY KEY (role, section_key)
);

-- =============================================================================
-- 3. RLS — config globale, lecture ouverte auth, écriture admin seulement
-- =============================================================================
ALTER TABLE section_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_permissions_read_all ON section_permissions;
CREATE POLICY section_permissions_read_all
  ON section_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS section_permissions_admin_write ON section_permissions;
CREATE POLICY section_permissions_admin_write
  ON section_permissions FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- =============================================================================
-- 4. Trigger : updated_at automatique
-- =============================================================================
CREATE OR REPLACE FUNCTION update_section_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_section_permissions_updated_at ON section_permissions;
CREATE TRIGGER trg_section_permissions_updated_at
  BEFORE UPDATE ON section_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_section_permissions_updated_at();

-- =============================================================================
-- 5. Seed matrice par défaut — 8 rôles × 10 sections = 80 lignes
-- =============================================================================
INSERT INTO section_permissions (role, section_key, granted) VALUES
  -- admin : tout
  ('admin','dashboard',true),('admin','activites',true),('admin','methodologie',true),
  ('admin','academie',true),('admin','evenements',true),('admin','prospection',true),
  ('admin','marketing',true),('admin','partenariat',true),('admin','performances',true),
  ('admin','admin',true),
  -- coach : opérationnel (pas de prospection/marketing/partenariat/admin)
  ('coach','dashboard',true),('coach','activites',true),('coach','methodologie',true),
  ('coach','academie',true),('coach','evenements',true),('coach','prospection',false),
  ('coach','marketing',false),('coach','partenariat',false),('coach','performances',true),
  ('coach','admin',false),
  -- parent : dashboard uniquement (reste = portail enfant dédié)
  ('parent','dashboard',true),('parent','activites',false),('parent','methodologie',false),
  ('parent','academie',false),('parent','evenements',false),('parent','prospection',false),
  ('parent','marketing',false),('parent','partenariat',false),('parent','performances',false),
  ('parent','admin',false),
  -- child : rien dans l'admin panel (espace joueur séparé)
  ('child','dashboard',false),('child','activites',false),('child','methodologie',false),
  ('child','academie',false),('child','evenements',false),('child','prospection',false),
  ('child','marketing',false),('child','partenariat',false),('child','performances',false),
  ('child','admin',false),
  -- club : portail dédié, quelques sections utiles (dashboard, partenariat, performances)
  ('club','dashboard',true),('club','activites',false),('club','methodologie',false),
  ('club','academie',false),('club','evenements',false),('club','prospection',false),
  ('club','marketing',false),('club','partenariat',true),('club','performances',true),
  ('club','admin',false),
  -- commercial : prospection + académie (fiches clubs) + partenariat
  ('commercial','dashboard',true),('commercial','activites',false),('commercial','methodologie',false),
  ('commercial','academie',true),('commercial','evenements',false),('commercial','prospection',true),
  ('commercial','marketing',false),('commercial','partenariat',true),('commercial','performances',false),
  ('commercial','admin',false),
  -- manager : vue opérationnelle étendue (pas méthodologie/marketing/admin)
  ('manager','dashboard',true),('manager','activites',true),('manager','methodologie',false),
  ('manager','academie',true),('manager','evenements',true),('manager','prospection',false),
  ('manager','marketing',false),('manager','partenariat',true),('manager','performances',true),
  ('manager','admin',false),
  -- marketeur : marketing + médiathèque (académie pour visuels)
  ('marketeur','dashboard',true),('marketeur','activites',false),('marketeur','methodologie',false),
  ('marketeur','academie',true),('marketeur','evenements',false),('marketeur','prospection',false),
  ('marketeur','marketing',true),('marketeur','partenariat',false),('marketeur','performances',false),
  ('marketeur','admin',false)
ON CONFLICT (role, section_key) DO NOTHING;
