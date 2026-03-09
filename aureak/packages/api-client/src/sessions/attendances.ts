// Story 4.2 — CRUD présences terrain
// Story 5.2 — apply_event() RPC (event sourcing)
import { supabase } from '../supabase'
import type { Attendance, SessionAttendee, CoachPresenceConfirmation, BlockCheckin, AttendanceStatus } from '@aureak/types'

// ─── Session Attendance Summary (vue agrégée par séance) ──────────────────────

export type SessionAttendanceSummary = {
  sessionId       : string
  scheduledAt     : string
  durationMinutes : number
  location        : string | null
  status          : string
  groupId         : string
  groupName       : string | null
  implantationId  : string
  implantationName: string | null
  presentCount    : number
  absentCount     : number
  lateCount       : number
  injuredCount    : number
  trialCount      : number
  excusedCount    : number
  totalAttendance : number
  completionStatus: 'complete' | 'partial' | 'not_started'
}

export async function listSessionsWithAttendance(params?: {
  from?          : string
  to?            : string
  implantationId?: string
  groupId?       : string
}): Promise<SessionAttendanceSummary[]> {
  let sessionQuery = supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, location, status, group_id, implantation_id,
      groups!sessions_group_id_fkey ( name ),
      implantations!sessions_implantation_id_fkey ( name )
    `)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(200)

  if (params?.from)           sessionQuery = sessionQuery.gte('scheduled_at', params.from + 'T00:00:00')
  if (params?.to)             sessionQuery = sessionQuery.lte('scheduled_at', params.to + 'T23:59:59')
  if (params?.implantationId) sessionQuery = sessionQuery.eq('implantation_id', params.implantationId)
  if (params?.groupId)        sessionQuery = sessionQuery.eq('group_id', params.groupId)

  const { data: sessions } = await sessionQuery
  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s: { id: string }) => s.id)

  const { data: attendances } = await supabase
    .from('attendances')
    .select('session_id, status')
    .in('session_id', sessionIds)

  const countMap: Record<string, Record<string, number>> = {}
  for (const a of ((attendances ?? []) as { session_id: string; status: string }[])) {
    if (!countMap[a.session_id]) countMap[a.session_id] = {}
    countMap[a.session_id][a.status] = (countMap[a.session_id][a.status] ?? 0) + 1
  }

  return (sessions as unknown[]).map((raw) => {
    const s = raw as {
      id: string; scheduled_at: string; duration_minutes: number; location: string | null
      status: string; group_id: string; implantation_id: string
      groups: { name: string } | { name: string }[] | null
      implantations: { name: string } | { name: string }[] | null
    }
    const counts  = countMap[s.id] ?? {}
    const present = counts['present']  ?? 0
    const absent  = counts['absent']   ?? 0
    const late    = counts['late']     ?? 0
    const injured = counts['injured']  ?? 0
    const trial   = counts['trial']    ?? 0
    const excused = counts['excused']  ?? 0
    const total   = present + absent + late + injured + trial + excused

    const grp  = Array.isArray(s.groups)        ? s.groups[0]        : s.groups
    const impl = Array.isArray(s.implantations) ? s.implantations[0] : s.implantations

    const completionStatus: 'complete' | 'partial' | 'not_started' =
      total === 0           ? 'not_started' :
      s.status === 'fermée' ? 'complete'    : 'partial'

    return {
      sessionId       : s.id,
      scheduledAt     : s.scheduled_at,
      durationMinutes : s.duration_minutes,
      location        : s.location,
      status          : s.status,
      groupId         : s.group_id,
      groupName       : (grp  as { name: string } | null)?.name ?? null,
      implantationId  : s.implantation_id,
      implantationName: (impl as { name: string } | null)?.name ?? null,
      presentCount    : present,
      absentCount     : absent,
      lateCount       : late,
      injuredCount    : injured,
      trialCount      : trial,
      excusedCount    : excused,
      totalAttendance : total,
      completionStatus,
    }
  })
}

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
