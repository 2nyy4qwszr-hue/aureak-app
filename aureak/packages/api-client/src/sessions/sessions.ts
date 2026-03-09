// Story 4.1 — CRUD sessions
// Story 13.1 — Sessions v2 : sessionType, contentRef, guest management
import { supabase } from '../supabase'
import type { Session, SessionCoach, SessionTheme, SessionSituation, SessionAttendee, CoachRole, SessionType, SessionContentRef } from '@aureak/types'

// ─── Session ──────────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  tenantId        : string
  implantationId  : string
  groupId         : string
  scheduledAt     : string
  durationMinutes?: number
  location?       : string
  sessionBlockId? : string
  recurrenceId?   : string
  // Story 13.1
  sessionType?    : SessionType
  contentRef?     : SessionContentRef
}

export async function createSession(
  params: CreateSessionParams
): Promise<{ data: Session | null; error: unknown }> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      tenant_id       : params.tenantId,
      implantation_id : params.implantationId,
      group_id        : params.groupId,
      scheduled_at    : params.scheduledAt,
      duration_minutes: params.durationMinutes ?? 90,
      location        : params.location ?? null,
      session_block_id: params.sessionBlockId ?? null,
      recurrence_id   : params.recurrenceId ?? null,
      // Story 13.1
      session_type    : params.sessionType ?? null,
      content_ref     : params.contentRef ?? {},
    })
    .select()
    .single()

  return { data: data as Session | null, error }
}

export async function getSession(
  sessionId: string
): Promise<{ data: Session | null; error: unknown }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single()

  return { data: data as Session | null, error }
}

export async function listSessionsByCoach(
  coachId: string
): Promise<{ data: Session[]; error: unknown }> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_coaches!inner(coach_id)
    `)
    .eq('session_coaches.coach_id', coachId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  return { data: (data as Session[]) ?? [], error }
}

export async function listUpcomingSessions(params?: {
  implantationId?: string
  groupId?       : string
  status?        : string
}): Promise<{ data: Session[]; error: unknown }> {
  let query = supabase
    .from('sessions')
    .select('*')
    .is('deleted_at', null)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (params?.implantationId) query = query.eq('implantation_id', params.implantationId)
  if (params?.groupId)        query = query.eq('group_id', params.groupId)
  if (params?.status)         query = query.eq('status', params.status)

  const { data, error } = await query
  return { data: (data as Session[]) ?? [], error }
}

export type UpdateSessionParams = {
  scheduledAt?    : string
  durationMinutes?: number
  location?       : string
  status?         : string
  // Story 13.1
  sessionType?    : SessionType | null
  contentRef?     : SessionContentRef
}

export async function updateSession(
  sessionId: string,
  params   : UpdateSessionParams
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.scheduledAt)                  updates['scheduled_at']     = params.scheduledAt
  if (params.durationMinutes)              updates['duration_minutes']  = params.durationMinutes
  if (params.location !== undefined)       updates['location']          = params.location
  if (params.status)                       updates['status']            = params.status
  // Story 13.1
  if (params.sessionType !== undefined)    updates['session_type']      = params.sessionType
  if (params.contentRef !== undefined)     updates['content_ref']       = params.contentRef

  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)

  return { error }
}

export async function cancelSession(
  sessionId         : string,
  cancellationReason: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status             : 'annulée',
      cancelled_at       : new Date().toISOString(),
      cancellation_reason: cancellationReason,
    })
    .eq('id', sessionId)

  return { error }
}

// ─── Session coaches ──────────────────────────────────────────────────────────

export async function assignCoach(
  sessionId: string,
  coachId  : string,
  tenantId : string,
  role     : CoachRole = 'lead'
): Promise<{ data: SessionCoach | null; error: unknown }> {
  const { data, error } = await supabase
    .from('session_coaches')
    .insert({ session_id: sessionId, coach_id: coachId, tenant_id: tenantId, role })
    .select()
    .single()

  return { data: data as SessionCoach | null, error }
}

export async function listSessionCoaches(
  sessionId: string
): Promise<{ data: SessionCoach[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_coaches')
    .select('*')
    .eq('session_id', sessionId)

  return { data: (data as SessionCoach[]) ?? [], error }
}

// ─── Session themes & situations ─────────────────────────────────────────────

export async function addSessionTheme(
  sessionId: string,
  themeId  : string,
  tenantId : string,
  sortOrder?: number
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_themes')
    .insert({ session_id: sessionId, theme_id: themeId, tenant_id: tenantId, sort_order: sortOrder ?? null })

  return { error }
}

export async function addSessionSituation(
  sessionId  : string,
  situationId: string,
  tenantId   : string,
  sortOrder? : number
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_situations')
    .insert({ session_id: sessionId, situation_id: situationId, tenant_id: tenantId, sort_order: sortOrder ?? null })

  return { error }
}

export async function listSessionThemes(
  sessionId: string
): Promise<{ data: SessionTheme[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_themes')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SessionTheme[]) ?? [], error }
}

export async function listSessionSituations(
  sessionId: string
): Promise<{ data: SessionSituation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_situations')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SessionSituation[]) ?? [], error }
}

// ─── Session attendees (Story 13.1) ──────────────────────────────────────────

export async function listSessionAttendees(
  sessionId: string
): Promise<{ data: SessionAttendee[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_attendees')
    .select('session_id, child_id, tenant_id, is_guest')
    .eq('session_id', sessionId)

  const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
    sessionId: row['session_id'] as string,
    childId  : row['child_id']   as string,
    tenantId : row['tenant_id']  as string,
    isGuest  : (row['is_guest']  as boolean) ?? false,
  })) as SessionAttendee[]

  return { data: mapped, error }
}

/**
 * Ajoute un joueur invité à une séance (is_guest = true, status = 'trial').
 * Le joueur n'a pas besoin d'être membre du groupe.
 */
export async function addGuestToSession(
  sessionId: string,
  childId  : string,
  tenantId : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_attendees')
    .upsert(
      { session_id: sessionId, child_id: childId, tenant_id: tenantId, is_guest: true },
      { onConflict: 'session_id,child_id', ignoreDuplicates: false }
    )

  return { error }
}

/**
 * Retire un joueur invité d'une séance.
 * Sécurisé : ne supprime que si is_guest = true (ne peut pas retirer un membre régulier).
 */
export async function removeGuestFromSession(
  sessionId: string,
  childId  : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)
    .eq('child_id', childId)
    .eq('is_guest', true)

  return { error }
}
