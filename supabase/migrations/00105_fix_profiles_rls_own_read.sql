-- Migration 00105 : Fix RLS profiles — lecture profil propre sans hook JWT
--
-- Problème : la policy "own_profile_read" requiert current_tenant_id() non-null,
-- mais cette fonction lit app_metadata.tenant_id depuis le JWT. Sans le Custom
-- Access Token Hook configuré, elle retourne NULL → tenant_id = NULL → FALSE →
-- le fallback login (getUserRoleFromProfile) échoue → "Rôle inconnu".
--
-- Fix : séparer la policy en deux cas :
--   1. L'utilisateur lit son propre profil (user_id = auth.uid()) : pas de tenant check
--   2. L'admin lit tous les profils du tenant : tenant check requis
--
-- Ceci permet au login de fonctionner même si le hook n'est pas encore configuré.

-- Supprimer l'ancienne policy combinée
DROP POLICY IF EXISTS "own_profile_read" ON profiles;

-- Cas 1 : chaque utilisateur peut toujours lire son propre profil
--   (pas de tenant check — nécessaire pour le bootstrap du login)
CREATE POLICY "own_profile_read_self" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- Cas 2 : admin peut lire tous les profils de son tenant (hook requis)
CREATE POLICY "own_profile_read_admin" ON profiles
  FOR SELECT USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
  );
