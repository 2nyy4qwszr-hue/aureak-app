-- =============================================================================
-- Migration 00137 : Fix custom_access_token_hook — EXCEPTION handler
--
-- Problème : lors de admin.auth.admin.createUser(), Supabase appelle le hook
-- dans un contexte où la table `profiles` n'est pas accessible
-- → "ERROR: relation "profiles" does not exist (SQLSTATE 42P01)"
-- → "500: Database error creating new user"
--
-- Fix : ajouter EXCEPTION WHEN OTHERS pour retourner les claims originaux
-- sans bloquer la création du user. Le profil n'existe pas encore à ce stade
-- (il est inséré après par l'Edge Function create-user-profile).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
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
  -- NOTE : peut échouer si le profil n'existe pas encore (ex : création admin)
  --        → géré par le bloc EXCEPTION ci-dessous
  SELECT tenant_id, user_role::TEXT
    INTO v_tenant_id, v_role
    FROM public.profiles
   WHERE user_id = v_user_id
     AND deleted_at IS NULL
   LIMIT 1;

  -- Injecter dans app_metadata si le profil existe
  IF v_tenant_id IS NOT NULL THEN
    v_claims := jsonb_set(
      v_claims,
      '{app_metadata}',
      COALESCE(v_claims->'app_metadata', '{}'::JSONB)
      || jsonb_build_object(
           'tenant_id', v_tenant_id,
           'role',      v_role
         )
    );
  END IF;

  RETURN jsonb_build_object('claims', v_claims);

EXCEPTION WHEN OTHERS THEN
  -- Profil inaccessible (table absente du contexte ou profil non encore créé)
  -- → retourner les claims originaux sans modification pour ne pas bloquer l'auth
  RETURN jsonb_build_object('claims', v_claims);
END;
$$;

-- Révoquer l'accès public et accorder uniquement à supabase_auth_admin
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
