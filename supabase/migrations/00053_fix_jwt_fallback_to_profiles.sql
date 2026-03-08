-- Migration 00053 : Fix current_tenant_id() — fallback vers profiles quand JWT vide
-- Problème : sans Custom Access Token Hook, app_metadata.tenant_id est absent
--            → current_tenant_id() retourne NULL → RLS bloque tout
-- Solution  : COALESCE(JWT, SELECT FROM profiles) avec SECURITY DEFINER

CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    (SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  )
$$;
