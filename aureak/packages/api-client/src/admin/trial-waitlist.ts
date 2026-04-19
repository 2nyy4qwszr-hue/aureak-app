// Epic 89 — Story 89.5 : Liste d'attente intelligente + notification absence
// CRUD de la table trial_waitlist + confirmation parent via Edge Function.

import { supabase } from '../supabase'
import type { TrialWaitlistEntry, WaitlistStatus } from '@aureak/types'

// ── Mapping snake_case → camelCase ────────────────────────────────────────────

function mapRow(r: Record<string, unknown>): TrialWaitlistEntry {
  return {
    id                : r.id as string,
    tenantId          : r.tenant_id as string,
    childId           : r.child_id as string,
    groupId           : r.group_id as string,
    implantationId    : r.implantation_id as string,
    parentEmail       : r.parent_email as string,
    parentPhone       : (r.parent_phone as string | null) ?? null,
    status            : r.status as WaitlistStatus,
    requestedAt       : r.requested_at as string,
    notifiedAt        : (r.notified_at as string | null) ?? null,
    confirmedAt       : (r.confirmed_at as string | null) ?? null,
    expiredAt         : (r.expired_at as string | null) ?? null,
    notifiedSessionId : (r.notified_session_id as string | null) ?? null,
    confirmToken      : r.confirm_token as string,
    createdBy         : (r.created_by as string | null) ?? null,
    createdAt         : r.created_at as string,
    updatedAt         : r.updated_at as string,
    deletedAt         : (r.deleted_at as string | null) ?? null,
  }
}

// ── Lecture ───────────────────────────────────────────────────────────────────

export type ListWaitlistParams = {
  groupId?: string
  status?: WaitlistStatus | WaitlistStatus[]
}

/** Liste la waitlist (par groupe et/ou statut, ordre FIFO sur requested_at). */
export async function listWaitlist(
  params: ListWaitlistParams = {},
): Promise<TrialWaitlistEntry[]> {
  let q = supabase
    .from('trial_waitlist')
    .select('*')
    .is('deleted_at', null)
    .order('requested_at', { ascending: true })

  if (params.groupId) q = q.eq('group_id', params.groupId)
  if (params.status) {
    q = Array.isArray(params.status) ? q.in('status', params.status) : q.eq('status', params.status)
  }

  const { data, error } = await q
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-waitlist] listWaitlist error:', error)
    throw error
  }
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
}

/** Liste les entrées waitlist d'un gardien (tous statuts). */
export async function listWaitlistByChild(childId: string): Promise<TrialWaitlistEntry[]> {
  const { data, error } = await supabase
    .from('trial_waitlist')
    .select('*')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('requested_at', { ascending: false })
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-waitlist] listWaitlistByChild error:', error)
    throw error
  }
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
}

// ── Écriture ──────────────────────────────────────────────────────────────────

export type AddToWaitlistParams = {
  childId        : string
  groupId        : string
  implantationId : string
  parentEmail    : string
  parentPhone?   : string | null
}

/** Ajoute un prospect à la waitlist d'un groupe (status=waiting). */
export async function addToWaitlist(
  params: AddToWaitlistParams,
): Promise<TrialWaitlistEntry> {
  const { data: session } = await supabase.auth.getSession()
  const tenantId = session.session?.user.user_metadata?.tenant_id
    ?? (session.session?.user.app_metadata?.tenant_id as string | undefined)
  if (!tenantId) throw new Error('tenant_id absent du JWT')

  const { data, error } = await supabase
    .from('trial_waitlist')
    .insert({
      tenant_id      : tenantId,
      child_id       : params.childId,
      group_id       : params.groupId,
      implantation_id: params.implantationId,
      parent_email   : params.parentEmail,
      parent_phone   : params.parentPhone ?? null,
      created_by     : session.session?.user.id ?? null,
    })
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-waitlist] addToWaitlist error:', error)
    throw error
  }
  return mapRow(data as Record<string, unknown>)
}

/** Retire un prospect de la waitlist (soft-delete). */
export async function removeFromWaitlist(waitlistId: string): Promise<void> {
  const { error } = await supabase
    .from('trial_waitlist')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', waitlistId)
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-waitlist] removeFromWaitlist error:', error)
    throw error
  }
}

// ── Confirmation parent (via Edge Function) ──────────────────────────────────

export type ConfirmTrialSlotResult = {
  ok   : true
  entry: TrialWaitlistEntry
} | {
  ok   : false
  error: string
}

/**
 * Confirme un slot waitlist via le confirm_token (lien email parent).
 * Passe par l'Edge Function `confirm-trial-slot` qui :
 *   1. Valide le token + statut 'notified' + non-expiré (< 24h)
 *   2. Met à jour status='confirmed' + confirmed_at
 *   3. Ajoute une entrée session_attendees(attendance_type='trial') sur notified_session_id
 */
export async function confirmTrialSlot(
  confirmToken: string,
): Promise<ConfirmTrialSlotResult> {
  const { data, error } = await supabase.functions.invoke('confirm-trial-slot', {
    body: { confirmToken },
  })

  if (error) {
    return { ok: false, error: error.message ?? 'Erreur réseau' }
  }

  const payload = data as { entry?: Record<string, unknown>; error?: string } | null
  if (!payload || payload.error) {
    return { ok: false, error: payload?.error ?? 'Réponse invalide' }
  }
  if (!payload.entry) {
    return { ok: false, error: 'Entrée waitlist non renvoyée' }
  }

  return { ok: true, entry: mapRow(payload.entry) }
}
