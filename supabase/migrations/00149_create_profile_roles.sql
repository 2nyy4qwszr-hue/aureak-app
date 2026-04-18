-- Story 86-2 — Epic 86 Architecture Rôles & Permissions
-- Table profile_roles : relation N-N profiles × user_role (rôles additionnels)
-- profiles.user_role reste la source de vérité pour current_user_role() (rétrocompatibilité RLS).
-- profile_roles est ADDITIF — aucune policy existante n'est modifiée.
--
-- NOTE : profiles.user_role est TEXT (pas l'enum user_role) côté table — cf. migration 00003.
-- Dans profile_roles.role, on utilise l'enum user_role pour typer fortement les valeurs.
--
-- Multi-tenant : tenant_id est dérivé de profiles.tenant_id et vérifié dans les RLS policies
-- pour empêcher un admin de tenant A de modifier les rôles d'un profil du tenant B.

CREATE TABLE IF NOT EXISTS profile_roles (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role        user_role   NOT NULL,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by  UUID        REFERENCES profiles(user_id),
  deleted_at  TIMESTAMPTZ,
  PRIMARY KEY (profile_id, role)
);

-- Index partiel sur les rôles actifs (non soft-deleted) pour perf du switcher
CREATE INDEX IF NOT EXISTS idx_profile_roles_active_profile
  ON profile_roles(profile_id)
  WHERE deleted_at IS NULL;

-- Index tenant pour isolation multi-tenant
CREATE INDEX IF NOT EXISTS idx_profile_roles_tenant
  ON profile_roles(tenant_id);

-- =============================================================================
-- RLS — isolation tenant obligatoire sur toutes les policies
-- =============================================================================
ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;

-- SELECT : l'utilisateur lit ses propres rôles (self via auth.uid()) ou admin du même tenant
DROP POLICY IF EXISTS profile_roles_select_self_or_admin ON profile_roles;
CREATE POLICY profile_roles_select_self_or_admin
  ON profile_roles FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      profile_id = auth.uid()
      OR current_user_role() = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE : admin du même tenant uniquement (y compris révocation via UPDATE deleted_at)
DROP POLICY IF EXISTS profile_roles_admin_all ON profile_roles;
CREATE POLICY profile_roles_admin_all
  ON profile_roles FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );

-- =============================================================================
-- Trigger : à chaque création de profil, peupler profile_roles avec le rôle principal
-- Note : profiles.user_role est TEXT — on caste vers l'enum user_role.
-- Le trigger récupère tenant_id depuis NEW.tenant_id (colonne de profiles).
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_profile_role_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profile_roles (profile_id, role, tenant_id, granted_at, granted_by)
  VALUES (NEW.user_id, NEW.user_role::user_role, NEW.tenant_id, now(), NEW.user_id)
  ON CONFLICT (profile_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON profiles;
CREATE TRIGGER trg_sync_profile_role
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_role_on_insert();

-- =============================================================================
-- Backfill : tous les profils existants reçoivent leur rôle principal dans profile_roles
-- avec leur tenant_id dérivé de profiles.
-- =============================================================================
INSERT INTO profile_roles (profile_id, role, tenant_id, granted_at, granted_by)
SELECT user_id, user_role::user_role, tenant_id, COALESCE(created_at, now()), user_id
FROM profiles
WHERE user_role IS NOT NULL AND tenant_id IS NOT NULL
ON CONFLICT (profile_id, role) DO NOTHING;
