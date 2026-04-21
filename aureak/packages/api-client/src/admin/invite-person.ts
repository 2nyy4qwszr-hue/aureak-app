// Story 87.4 — Helper d'invitation/création de fiche pour les 3 rôles non-child.
// Encapsule l'appel à l'Edge Function `create-user-profile` (service_role derrière)
// pour respecter ARCH-1 : aucun `supabase.functions.invoke` direct dans `apps/web/`.

import { supabase } from '../supabase'

export type InvitePersonMode = 'invite' | 'fiche'

export type InvitePersonRole = 'commercial' | 'manager' | 'marketeur'

export type InvitePersonParams = {
  mode     : InvitePersonMode
  role     : InvitePersonRole
  tenantId : string
  firstName: string
  lastName : string
  email?   : string
  phone?   : string
}

export type InvitePersonResult =
  | { ok: true;  userId: string }
  | { ok: false; message: string; step?: string }

/**
 * invitePerson — crée un profil pour un commercial/manager/marketeur.
 * - mode 'invite' : envoie un magic-link via inviteUserByEmail, status=pending.
 * - mode 'fiche'  : crée un user local (email synthétique si non fourni), status=active.
 * Retourne un discriminated union — jamais de throw, toujours un { ok }.
 */
export async function invitePerson(params: InvitePersonParams): Promise<InvitePersonResult> {
  try {
    const body = {
      mode     : params.mode,
      role     : params.role,
      tenantId : params.tenantId,
      firstName: params.firstName,
      lastName : params.lastName,
      email    : params.email,
      phone    : params.phone,
    }

    const { data, error } = await supabase.functions.invoke('create-user-profile', { body })

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[invitePerson] invoke error:', error)
      return { ok: false, message: error.message ?? 'Erreur inconnue' }
    }

    // Réponse Edge = { data: { userId } } OU { error, step } en cas d'erreur serveur
    const payload = (data ?? {}) as Record<string, unknown>
    const errMessage = (payload.error as string | undefined) ?? undefined
    if (errMessage) {
      return { ok: false, message: errMessage, step: payload.step as string | undefined }
    }

    const inner  = (payload.data ?? {}) as { userId?: string }
    const userId = typeof inner.userId === 'string' ? inner.userId : undefined

    if (!userId) {
      if (process.env.NODE_ENV !== 'production') console.error('[invitePerson] missing userId in response:', payload)
      return { ok: false, message: 'Réponse Edge Function invalide (userId manquant)' }
    }

    return { ok: true, userId }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[invitePerson] exception:', err)
    const message = err instanceof Error ? err.message : 'Exception inconnue'
    return { ok: false, message }
  }
}
