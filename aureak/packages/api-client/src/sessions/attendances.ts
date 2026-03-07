// Story 4.2 — CRUD présences terrain
// Story 5.2 — apply_event() RPC (event sourcing)
import { supabase } from '../supabase'
import type { Attendance, SessionAttendee, CoachPresenceConfirmation, BlockCheckin, AttendanceStatus } from '@aureak/types'

// ─── SessionAttendees (roster attendu) ────────────────────────────────────────

export async function listSessionAttendees(
  sessionId: string
): Promise<{ data: SessionAttendee[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_attendees')
    .select('*')
    .eq('session_id', sessionId)

  return { data: (data as SessionAttendee[]) ?? [], error }
}

export async function prefillSessionAttendees(
  sessionId: string
): Promise<{ data: number | null; error: unknown }> {
  const { data, error } = await supabase.rpc('prefill_session_attendees', {
    p_session_id: sessionId,
  })

  return { data: data as number | null, error }
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type RecordAttendanceParams = {
  sessionId  : string
  childId    : string
  tenantId   : string
  status     : AttendanceStatus
  recordedBy : string
}

export async function recordAttendance(
  params: RecordAttendanceParams
): Promise<{ data: Attendance | null; error: unknown }> {
  const { data, error } = await supabase
    .from('attendances')
    .upsert({
      session_id  : params.sessionId,
      child_id    : params.childId,
      tenant_id   : params.tenantId,
      status      : params.status,
      recorded_by : params.recordedBy,
      recorded_at : new Date().toISOString(),
    }, { onConflict: 'session_id,child_id' })
    .select()
    .single()

  return { data: data as Attendance | null, error }
}

export async function listAttendancesBySession(
  sessionId: string
): Promise<{ data: Attendance[]; error: unknown }> {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: true })

  return { data: (data as Attendance[]) ?? [], error }
}

// ─── CoachPresenceConfirmation ────────────────────────────────────────────────

export async function confirmCoachPresence(
  sessionId: string,
  coachId  : string,
  tenantId : string,
  deviceId?: string
): Promise<{ data: CoachPresenceConfirmation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('coach_presence_confirmations')
    .insert({
      session_id: sessionId,
      coach_id  : coachId,
      tenant_id : tenantId,
      device_id : deviceId ?? null,
    })
    .select()
    .single()

  // Audit log
  if (!error) {
    await supabase.from('audit_logs').insert({
      tenant_id  : tenantId,
      user_id    : coachId,
      entity_type: 'coach_presence',
      entity_id  : sessionId,
      action     : 'coach_presence_confirmed',
      metadata   : { coach_id: coachId, session_id: sessionId, confirmed_at: new Date().toISOString() },
    })
  }

  return { data: data as CoachPresenceConfirmation | null, error }
}

// ─── BlockCheckin ─────────────────────────────────────────────────────────────

export async function checkinBlock(
  sessionBlockId: string,
  coachId       : string,
  tenantId      : string
): Promise<{ data: BlockCheckin | null; error: unknown }> {
  const { data, error } = await supabase
    .from('block_checkins')
    .insert({
      session_block_id: sessionBlockId,
      coach_id        : coachId,
      tenant_id       : tenantId,
    })
    .select()
    .single()

  return { data: data as BlockCheckin | null, error }
}

// ─── apply_event() — Story 5.2 ────────────────────────────────────────────────

export type ApplyAttendanceEventParams = {
  operationId: string
  sessionId  : string
  childId    : string
  newStatus  : AttendanceStatus
  occurredAt : string
  deviceId?  : string
  source?    : 'field' | 'admin' | 'sync'
}

export type ApplyEventResult = {
  idempotent?: boolean
  snapshot?  : Attendance
  event_id?  : string
  conflict?  : string
}

export async function applyAttendanceEvent(
  params: ApplyAttendanceEventParams
): Promise<ApplyEventResult> {
  const { data: userResult } = await supabase.auth.getUser()
  const tenantId = (userResult?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''

  const { data, error } = await supabase.rpc('apply_event', {
    p_event: {
      operation_id: params.operationId,
      tenant_id   : tenantId,
      entity_type : 'attendance',
      entity_id   : null, // L'ID attendance n'est pas connu à l'avance pour un upsert
      event_type  : 'ATTENDANCE_SET',
      occurred_at : params.occurredAt,
      source      : params.source ?? 'field',
      device_id   : params.deviceId ?? null,
      payload     : {
        session_id : params.sessionId,
        child_id   : params.childId,
        new_status : params.newStatus,
      },
    },
  })

  if (error) throw error
  return data as ApplyEventResult
}

export async function listSessionEvents(
  sessionId: string
): Promise<{ data: unknown[]; error: unknown }> {
  const { data, error } = await supabase
    .from('event_log')
    .select('*')
    .eq('entity_type', 'attendance')
    .order('occurred_at', { ascending: true })

  // Filter by session_id from payload
  const filtered = (data ?? []).filter((e: unknown) => {
    const ev = e as { payload?: { session_id?: string } }
    return ev.payload?.session_id === sessionId
  })

  return { data: filtered, error }
}
