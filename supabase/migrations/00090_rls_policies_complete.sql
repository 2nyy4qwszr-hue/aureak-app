-- =============================================================================
-- Migration 00090 : Registre central RLS — fonctions helpers durcis + policies
-- Story 2.2 — Contrôle d'accès par rôle (RBAC — Règle Universelle RLS)
--
-- IMPORTANT : cette migration est idempotente (CREATE OR REPLACE, DROP IF EXISTS).
-- Elle peut être appliquée même si les fonctions/policies existent déjà en DB.
--
-- Contexte : les migrations 00004-00032 n'existent pas dans le repo mais les
-- tables correspondantes ont été créées directement dans Supabase. Ce fichier
-- documente et durcit les fonctions helpers + policies qui doivent exister.
-- =============================================================================

-- =============================================================================
-- FONCTIONS HELPER JWT — durcies (SECURITY DEFINER, search_path, REVOKE ALL)
-- =============================================================================

-- Retourne le tenant_id depuis app_metadata du JWT.
-- SET search_path = public : protège contre l'injection via schéma custom.
-- SECURITY DEFINER : accès à auth.jwt() depuis les policies RLS.
-- REVOKE ALL + GRANT TO authenticated : seuls les users connectés peuvent appeler.
CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;
REVOKE ALL ON FUNCTION current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;

-- Retourne le rôle utilisateur depuis app_metadata du JWT.
-- Retourne le type enum user_role : un cast invalide lève une erreur PostgreSQL
-- explicite plutôt qu'une dérive silencieuse.
CREATE OR REPLACE FUNCTION current_user_role()
  RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::user_role;
$$;
REVOKE ALL ON FUNCTION current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- Vérifie qu'un utilisateur actif (status = 'active' ET non supprimé) appelle.
-- STABLE : mise en cache dans la transaction — une seule requête SQL par tx.
-- Performance : si profiling montre un impact, encoder le statut dans le JWT
-- via le Custom Access Token Hook et remplacer cette fonction par un check JWT.
CREATE OR REPLACE FUNCTION is_active_user()
  RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  );
$$;
REVOKE ALL ON FUNCTION is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_active_user() TO authenticated;

-- =============================================================================
-- POLICIES : TABLE tenants
-- =============================================================================

DROP POLICY IF EXISTS "tenant_isolation" ON tenants;
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (
    id = current_tenant_id()
    AND is_active_user()
  );

-- =============================================================================
-- POLICIES : TABLE profiles
-- =============================================================================

DROP POLICY IF EXISTS "own_profile_read"   ON profiles;
DROP POLICY IF EXISTS "own_profile_update" ON profiles;
DROP POLICY IF EXISTS "admin_insert"       ON profiles;
DROP POLICY IF EXISTS "admin_read_all"     ON profiles;

-- Lecture : utilisateur lui-même OU admin du même tenant
CREATE POLICY "own_profile_read" ON profiles
  FOR SELECT USING (
    (user_id = auth.uid() OR current_user_role() = 'admin')
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Mise à jour : utilisateur peut modifier son propre display_name
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    AND is_active_user()
  )
  WITH CHECK (user_id = auth.uid());

-- Insertion : admin uniquement (création de compte)
CREATE POLICY "admin_insert" ON profiles
  FOR INSERT WITH CHECK (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Suppression (soft-delete) : admin uniquement
DROP POLICY IF EXISTS "admin_soft_delete" ON profiles;
CREATE POLICY "admin_soft_delete" ON profiles
  FOR UPDATE USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- =============================================================================
-- POLICIES : TABLE parent_child_links
-- =============================================================================

DROP POLICY IF EXISTS "parent_sees_own_links" ON parent_child_links;
DROP POLICY IF EXISTS "admin_manage_links"    ON parent_child_links;

CREATE POLICY "parent_sees_own_links" ON parent_child_links
  FOR SELECT USING (
    parent_id = auth.uid()
    AND is_active_user()
  );

CREATE POLICY "admin_manage_links" ON parent_child_links
  FOR ALL USING (
    current_user_role() = 'admin'
    AND is_active_user()
  );

-- =============================================================================
-- POLICIES : TABLE processed_operations
-- =============================================================================

DROP POLICY IF EXISTS "user_own_operations"  ON processed_operations;
DROP POLICY IF EXISTS "admin_all_operations" ON processed_operations;

-- processed_operations n'a pas de user_id — isolation par tenant uniquement
CREATE POLICY "user_own_operations" ON processed_operations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "admin_all_operations" ON processed_operations
  FOR SELECT USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
  );

-- =============================================================================
-- POLICIES : TABLE audit_logs
-- =============================================================================

DROP POLICY IF EXISTS "admin_read_audit"  ON audit_logs;
DROP POLICY IF EXISTS "insert_only_base"  ON audit_logs;

-- Seul l'admin peut lire les logs d'audit
CREATE POLICY "admin_read_audit" ON audit_logs
  FOR SELECT USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Tout utilisateur actif peut insérer (pour les audit trails)
CREATE POLICY "insert_only_base" ON audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- =============================================================================
-- TABLE coach_implantation_assignments — créée si absente (idempotent)
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_implantation_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  coach_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  implantation_id UUID NOT NULL,  -- FK vers implantations ajoutée quand la table existe
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cia_tenant_idx ON coach_implantation_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS cia_coach_idx  ON coach_implantation_assignments (coach_id);

ALTER TABLE coach_implantation_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cia_tenant_read"  ON coach_implantation_assignments;
DROP POLICY IF EXISTS "cia_admin_write"  ON coach_implantation_assignments;
DROP POLICY IF EXISTS "cia_coach_read"   ON coach_implantation_assignments;

CREATE POLICY "cia_tenant_read" ON coach_implantation_assignments
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "cia_admin_write" ON coach_implantation_assignments
  FOR ALL USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "cia_coach_read" ON coach_implantation_assignments
  FOR SELECT USING (
    coach_id = auth.uid()
    AND is_active_user()
  );

-- =============================================================================
-- TABLE coach_access_grants (Story 2.3) — créée si absente (idempotent)
-- Accès temporaire cross-implantation avec expiration automatique.
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  coach_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  implantation_id UUID NOT NULL,  -- FK vers implantations ajoutée quand la table existe
  granted_by      UUID NOT NULL REFERENCES profiles(user_id),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,    -- NULL = actif, non-NULL = révoqué manuellement
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cag_tenant_idx    ON coach_access_grants (tenant_id);
-- Index partiels : n'indexent que les grants actifs (optimise les requêtes RLS)
CREATE INDEX IF NOT EXISTS cag_coach_exp_idx ON coach_access_grants (coach_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS cag_impl_exp_idx  ON coach_access_grants (implantation_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE coach_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cag_tenant_read"  ON coach_access_grants;
DROP POLICY IF EXISTS "cag_admin_write"  ON coach_access_grants;
DROP POLICY IF EXISTS "cag_coach_read"   ON coach_access_grants;

CREATE POLICY "cag_tenant_read" ON coach_access_grants
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "cag_admin_write" ON coach_access_grants
  FOR ALL USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "cag_coach_read" ON coach_access_grants
  FOR SELECT USING (
    coach_id = auth.uid()
    AND is_active_user()
  );

-- =============================================================================
-- PATTERN coach_assigned_or_granted — COMMENTÉ pour référence Stories 4.1 / 5.1
-- À copier dans la migration qui crée les tables sessions / attendances.
-- =============================================================================

-- -- Policy SELECT coach sur sessions (à ajouter en Story 4.1) :
-- CREATE POLICY "coach_assigned_or_granted" ON sessions
--   FOR SELECT USING (
--     tenant_id = current_tenant_id()
--     AND is_active_user()
--     AND (
--       -- Accès permanent (coach assigné à l'implantation)
--       EXISTS (
--         SELECT 1 FROM coach_implantation_assignments cia
--         WHERE cia.coach_id = auth.uid()
--           AND cia.implantation_id = sessions.implantation_id
--       )
--       OR
--       -- Accès temporaire actif (grant non expiré, non révoqué)
--       EXISTS (
--         SELECT 1 FROM coach_access_grants cag
--         WHERE cag.coach_id = auth.uid()
--           AND cag.implantation_id = sessions.implantation_id
--           AND cag.expires_at > now()
--           AND cag.revoked_at IS NULL
--       )
--     )
--   );
