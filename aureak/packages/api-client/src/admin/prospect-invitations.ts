// Epic 89 — Story 89.4 : Invitations séance gratuite
// Wrapper centralisé pour l'envoi d'invitations + lecture de l'historique.
// L'envoi réel de l'email passe par l'Edge Function `send-trial-invitation`.

import { supabase } from '../supabase'
import type { ProspectInvitation } from '@aureak/types'

// ── Mapping snake_case → camelCase ────────────────────────────────────────────

function mapRow(r: Record<string, unknown>): ProspectInvitation {
  return {
    id            : r.id as string,
    tenantId      : r.tenant_id as string,
    childId       : r.child_id as string,
    invitedBy     : r.invited_by as string,
    parentEmail   : r.parent_email as string,
    parentName    : (r.parent_name as string | null) ?? null,
    implantationId: (r.implantation_id as string | null) ?? null,
    message       : (r.message as string | null) ?? null,
    sentAt        : r.sent_at as string,
    status        : r.status as ProspectInvitation['status'],
    resendId      : (r.resend_id as string | null) ?? null,
    createdAt     : r.created_at as string,
    updatedAt     : r.updated_at as string,
    deletedAt     : (r.deleted_at as string | null) ?? null,
  }
}

// ── Lecture ───────────────────────────────────────────────────────────────────

/** Liste les invitations envoyées pour un gardien (ordre antéchronologique). */
export async function listProspectInvitations(
  childId: string,
): Promise<ProspectInvitation[]> {
  const { data, error } = await supabase
    .from('prospect_invitations')
    .select('*')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
}

// ── Envoi ─────────────────────────────────────────────────────────────────────

export type SendTrialInvitationParams = {
  childId         : string
  parentEmail     : string
  parentName?     : string | null
  implantationId? : string | null
  message?        : string | null
}

export type SendTrialInvitationResult = {
  invitation: ProspectInvitation
  error     : null
} | {
  invitation: null
  error     : string
}

/**
 * Envoie une invitation séance gratuite au parent d'un gardien prospect.
 *
 * Effets :
 *   1. Persiste l'email parent sur `child_directory` (champ `parent1_email` si
 *      vide, sinon `parent2_email` si vide, sinon update `parent1_email`).
 *   2. Déclenche l'Edge Function `send-trial-invitation` qui crée la ligne
 *      `prospect_invitations` + envoie le mail via Resend.
 *   3. Met à jour `prospect_status` → `invite` côté DB.
 */
export async function sendTrialInvitation(
  params: SendTrialInvitationParams,
): Promise<SendTrialInvitationResult> {
  const { data, error } = await supabase.functions.invoke('send-trial-invitation', {
    body: {
      childId       : params.childId,
      parentEmail   : params.parentEmail,
      parentName    : params.parentName    ?? null,
      implantationId: params.implantationId ?? null,
      message       : params.message       ?? null,
    },
  })

  if (error) {
    return { invitation: null, error: error.message ?? 'Erreur réseau' }
  }

  const payload = data as { invitation?: Record<string, unknown>; error?: string } | null
  if (!payload || payload.error) {
    return { invitation: null, error: payload?.error ?? 'Réponse invalide' }
  }
  if (!payload.invitation) {
    return { invitation: null, error: 'Invitation non renvoyée par le serveur' }
  }

  return { invitation: mapRow(payload.invitation), error: null }
}
