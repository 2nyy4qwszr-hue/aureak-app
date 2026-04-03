-- Migration 00038 — Custom Access Token Hook
-- Injecte tenant_id et role dans app_metadata du JWT
-- Requis par toutes les policies RLS (current_tenant_id(), current_user_role())

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_tenant_id UUID;
  v_role      TEXT;
  v_claims    JSONB;
BEGIN
  v_user_id := (event->>'user_id')::UUID;
  v_claims  := event->'claims';

  -- Récupérer tenant_id et user_role depuis profiles
  SELECT tenant_id, user_role::TEXT
    INTO v_tenant_id, v_role
    FROM public.profiles
   WHERE user_id = v_user_id
     AND deleted_at IS NULL
   LIMIT 1;

  -- Injecter dans app_metadata (sans écraser les autres champs existants)
  IF v_tenant_id IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{app_metadata}',
      COALESCE(v_claims->'app_metadata', '{}'::JSONB)
      || jsonb_build_object(
           'tenant_id', v_tenant_id,
           'role',      v_role
         )
    );
  END IF;

  RETURN jsonb_build_object('claims', v_claims);
END;
$$;

-- Permissions : supabase_auth_admin doit pouvoir exécuter cette fonction
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC, authenticated, anon;
