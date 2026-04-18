-- Story 86-3 — Epic 86 Architecture Rôles & Permissions
-- Table user_section_overrides : overrides individuels par utilisateur.
-- Override explicite granted/denied — surcharge les défauts de section_permissions.
--
-- Multi-tenant : tenant_id obligatoire — isolation stricte dans les RLS policies.
-- Soft-delete via deleted_at — la suppression d'un override réactive le défaut de rôle.
--
-- RLS :
--   SELECT : self OU admin du même tenant
--   INSERT/UPDATE/DELETE : admin du même tenant uniquement

-- =============================================================================
-- 1. Table user_section_overrides
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_section_overrides (
  profile_id   UUID        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  section_key  section_key NOT NULL,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted      BOOLEAN     NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by   UUID        REFERENCES profiles(user_id),
  deleted_at   TIMESTAMPTZ,
  PRIMARY KEY (profile_id, section_key, tenant_id)
);

-- =============================================================================
-- 2. Index — perf lookup par profil (filtre actifs only) + tenant
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_overrides_profile_active
  ON user_section_overrides(profile_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_overrides_tenant
  ON user_section_overrides(tenant_id);

-- =============================================================================
-- 3. RLS — isolation tenant obligatoire
-- =============================================================================
ALTER TABLE user_section_overrides ENABLE ROW LEVEL SECURITY;

-- SELECT : self (auth.uid()) OU admin du même tenant
DROP POLICY IF EXISTS user_overrides_select_self_or_admin ON user_section_overrides;
CREATE POLICY user_overrides_select_self_or_admin
  ON user_section_overrides FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      profile_id = auth.uid()
      OR current_user_role() = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE : admin du même tenant (soft-delete via UPDATE deleted_at)
DROP POLICY IF EXISTS user_overrides_admin_all ON user_section_overrides;
CREATE POLICY user_overrides_admin_all
  ON user_section_overrides FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );
