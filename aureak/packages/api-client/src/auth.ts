// @aureak/api-client — Auth functions
// Point d'accès unique pour toutes les opérations d'authentification
// RÈGLE : ne jamais exposer SUPABASE_SERVICE_ROLE_KEY depuis ce client public
// Les opérations admin (disable, revoke) passent par des Edge Functions avec service_role

import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

// ============================================================
// Types
// ============================================================

export type SignInParams = {
  email: string
  password: string
}

export type InviteUserParams = {
  email: string
  role: string
  tenantId: string
  displayName?: string
}

// ============================================================
// Auth functions
// ============================================================

/**
 * Connexion email/mot de passe.
 * Le JWT retourné contient app_metadata.role + app_metadata.tenant_id
 * injectés par le Custom Access Token Hook.
 */
export async function signIn({ email, password }: SignInParams) {
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Déconnexion — invalide la session côté client et serveur.
 */
export async function signOut() {
  return supabase.auth.signOut()
}

/**
 * Retourne la session active (null si non connecté).
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Invite un utilisateur par email.
 * IMPORTANT : inviteUserByEmail NE crée PAS la ligne profiles.
 * La ligne profiles est créée manuellement après l'invitation via createProfile().
 * Requiert que l'appelant soit admin (vérifié par RLS côté DB).
 */
export async function inviteUser({ email, role, tenantId, displayName }: InviteUserParams) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, tenant_id: tenantId },
  })

  if (error) return { data: null, error }

  // Créer la ligne profiles manuellement (le hook JWT ne s'exécute qu'à la connexion)
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id     : data.user.id,
        tenant_id   : tenantId,
        user_role   : role,
        status      : 'pending',
        display_name: displayName ?? null,
      })

    if (profileError) {
      if (process.env.NODE_ENV !== 'production') console.error('[api-client] createProfile error after invite:', profileError)
      return { data: null, error: profileError }
    }
  }

  return { data, error: null }
}

/**
 * Désactive un compte utilisateur.
 * Délègue la révocation de sessions à l'Edge Function admin-disable-user
 * (qui utilise service_role — jamais exposé côté client).
 */
export async function disableUser(userId: string) {
  return supabase.functions.invoke('admin-disable-user', {
    body: { userId },
  })
}

/**
 * Fallback de résolution du rôle depuis la table profiles.
 * Utilisé quand le JWT app_metadata ne contient pas encore le rôle
 * (Custom Access Token Hook non configuré).
 */
export async function getUserRoleFromProfile(
  userId: string,
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('user_id', userId)
    .single()
  return {
    data : (data as { user_role?: string } | null)?.user_role ?? null,
    error,
  }
}
