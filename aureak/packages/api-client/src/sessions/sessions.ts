// Story 4.1 — CRUD sessions
import { supabase } from '../supabase'
import type { Session, SessionCoach, SessionTheme, SessionSituation, CoachRole } from '@aureak/types'

// ─── Session ──────────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  tenantId       : string
  implantationId : string
  groupId        : string
  scheduledAt    : string
  durationMinutes?: number
  location?      : string
  sessionBlockId?: string
  recurrenceId?  : string
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
}

export async function updateSession(
  sessionId: string,
  params   : UpdateSessionParams
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.scheduledAt)     updates['scheduled_at']     = params.scheduledAt
  if (params.durationMinutes) updates['duration_minutes']  = params.durationMinutes
  if (params.location !== undefined) updates['location']  = params.location
  if (params.status)          updates['status']            = params.status

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
