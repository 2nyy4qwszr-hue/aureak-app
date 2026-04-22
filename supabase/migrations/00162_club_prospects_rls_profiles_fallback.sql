-- Epic 88 — Story 88.2 (fix) : RLS fallback sur profiles pour admin sans tenant_id dans JWT
-- Problème identifié : certains admins n'ont ni `tenant_id` ni `role` dans leur JWT
-- (hook `custom-access-token` pas universellement déployé). Les policies de 00161
-- dépendaient de `(auth.jwt() ->> 'tenant_id')::uuid` et `current_user_role()` qui
-- retournent NULL dans ce cas → tout INSERT/SELECT échoue 403.
--
-- Fix : inline un COALESCE(jwt, profiles) dans les policies pour rester fonctionnel
-- même sans hook. Pattern inspiré de la migration 00053 (historique).

-- 1. Helper tenant_id avec fallback profiles (SECURITY DEFINER pour contourner RLS profiles)
CREATE OR REPLACE FUNCTION public.current_tenant_id_with_fallback()
  RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    (SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  );
$$;
REVOKE ALL ON FUNCTION public.current_tenant_id_with_fallback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id_with_fallback() TO authenticated;

-- 2. Helper user_role avec fallback profiles
CREATE OR REPLACE FUNCTION public.current_user_role_with_fallback()
  RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT p.user_role::text FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  );
$$;
REVOKE ALL ON FUNCTION public.current_user_role_with_fallback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role_with_fallback() TO authenticated;

-- 3. DROP + RECREATE policies club_prospects
DROP POLICY IF EXISTS club_prospects_select ON club_prospects;
DROP POLICY IF EXISTS club_prospects_insert ON club_prospects;
DROP POLICY IF EXISTS club_prospects_update ON club_prospects;

CREATE POLICY club_prospects_select
  ON club_prospects FOR SELECT
  USING (
    deleted_at IS NULL
    AND tenant_id = public.current_tenant_id_with_fallback()
    AND (
      public.current_user_role_with_fallback() = 'admin'
      OR assigned_commercial_id = auth.uid()
    )
  );

CREATE POLICY club_prospects_insert
  ON club_prospects FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id_with_fallback()
    AND (
      public.current_user_role_with_fallback() = 'admin'
      OR (public.current_user_role_with_fallback() = 'commercial' AND assigned_commercial_id = auth.uid())
    )
  );

CREATE POLICY club_prospects_update
  ON club_prospects FOR UPDATE
  USING (
    tenant_id = public.current_tenant_id_with_fallback()
    AND (
      public.current_user_role_with_fallback() = 'admin'
      OR assigned_commercial_id = auth.uid()
    )
  );

-- 4. DROP + RECREATE policies prospect_contacts
DROP POLICY IF EXISTS prospect_contacts_select ON prospect_contacts;
DROP POLICY IF EXISTS prospect_contacts_insert ON prospect_contacts;
DROP POLICY IF EXISTS prospect_contacts_update ON prospect_contacts;

CREATE POLICY prospect_contacts_select
  ON prospect_contacts FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = public.current_tenant_id_with_fallback()
        AND (
          public.current_user_role_with_fallback() = 'admin'
          OR cp.assigned_commercial_id = auth.uid()
        )
    )
  );

CREATE POLICY prospect_contacts_insert
  ON prospect_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = public.current_tenant_id_with_fallback()
        AND (
          public.current_user_role_with_fallback() = 'admin'
          OR cp.assigned_commercial_id = auth.uid()
        )
    )
  );

CREATE POLICY prospect_contacts_update
  ON prospect_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_contacts.club_prospect_id
        AND cp.tenant_id = public.current_tenant_id_with_fallback()
        AND (
          public.current_user_role_with_fallback() = 'admin'
          OR cp.assigned_commercial_id = auth.uid()
        )
    )
  );

COMMENT ON FUNCTION public.current_tenant_id_with_fallback() IS
  'Helper tenant-id scope-aware : JWT app_metadata puis fallback profiles. Utilisé par les policies epic 88 pour rester fonctionnel sans custom-access-token-hook déployé.';
