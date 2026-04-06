-- =============================================================================
-- Migration 00138 : Fix handle_user_confirmation — SET search_path = public
--
-- Problème : lors de admin.auth.admin.createUser(), GoTrue met à jour
-- email_confirmed_at dans auth.users, ce qui déclenche le trigger
-- on_auth_user_confirmed → handle_user_confirmation().
-- Cette fonction exécutait UPDATE profiles sans search_path défini,
-- → "ERROR: relation "profiles" does not exist (SQLSTATE 42P01)"
-- → "500: Database error creating new user"
--
-- Fix : ajouter SET search_path = public à la fonction trigger.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  -- email_confirmed_at vient d'être renseigné (confirmation du lien invitation)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles
    SET status = 'active', updated_at = now()
    WHERE user_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$;
