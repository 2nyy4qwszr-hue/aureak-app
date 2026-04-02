// Sessions — Présences Admin : dashboard, corrections, essais (Story 33.1)

import { supabase } from '../supabase'
import type {
  AttendanceCorrection, SessionPresenceSummary, AttendanceType, CoachPresenceType,
} from '@aureak/types'

// ─── Filtres ──────────────────────────────────────────────────────────────────

export type PresenceCardFilters = {
  implantationId? : string
  groupId?        : string
  /** ISO date string — inclusif */
  fromDate?       : string
  toDate?         : string
}

// ─── Session Presence Cards ───────────────────────────────────────────────────

export async function listSessionsWithPresence(
  filters?: PresenceCardFilters,
): Promise<{ data: SessionPresenceSummary[]; error: unknown }> {
  let query = supabase
    .from('v_session_presence_summary')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(200)

  if (filters?.implantationId) query = query.eq('implantation_id', filters.implantationId)
  if (filters?.groupId)        query = query.eq('group_id', filters.groupId)
  if (filters?.fromDate)       query = query.gte('scheduled_at', filters.fromDate)
  if (filters?.toDate)         query = query.lte('scheduled_at', filters.toDate)

  const { data, error } = await query

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] listSessionsWithPresence:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      sessionId       : r['session_id']        as string,
      tenantId        : r['tenant_id']         as string,
      groupId         : r['group_id']          as string,
      implantationId  : r['implantation_id']   as string,
      scheduledAt     : r['scheduled_at']      as string,
      sessionStatus   : r['session_status']    as string,
      sessionType     : r['session_type']      as string | null,
      closedAt        : r['closed_at']         as string | null,
      label           : r['label']             as string | null,
      totalRoster     : Number(r['total_roster']      ?? 0),
      memberPresent   : Number(r['member_present']    ?? 0),
      trialPresent    : Number(r['trial_present']     ?? 0),
      absentCount     : Number(r['absent_count']      ?? 0),
      unconfirmedCount: Number(r['unconfirmed_count'] ?? 0),
    })),
    error: null,
  }
}

// ─── Session Attendance Detail ────────────────────────────────────────────────

export type AttendeeWithStatus = {
  childId         : string
  displayName     : string
  attendanceType  : AttendanceType
  status          : string | null
  recordedBy      : string | null
  correctedByAdmin: boolean
  isGuest         : boolean
}

export type CoachPresenceRow = {
  coachId       : string
  displayName   : string
  presenceType  : CoachPresenceType
  partialStart  : string | null
  partialEnd    : string | null
}

export type SessionAttendanceDetail = {
  sessionId  : string
  attendees  : AttendeeWithStatus[]
  coaches    : CoachPresenceRow[]
  corrections: AttendanceCorrection[]
}

/**
 * Détail complet d'une séance : roster avec statuts, coachs, corrections admin.
 */
export async function getSessionAttendanceDetail(
  sessionId: string,
): Promise<{ data: SessionAttendanceDetail | null; error: unknown }> {
  const [attendeesRes, attendancesRes, coachesRes, correctionsRes] = await Promise.all([
    supabase
      .from('session_attendees')
      .select('child_id, is_guest, attendance_type')
      .eq('session_id', sessionId),
    supabase
      .from('attendances')
      .select('child_id, status, recorded_by')
      .eq('session_id', sessionId),
    supabase
      .from('coach_presence_confirmations')
      .select('coach_id, presence_type, partial_start, partial_end, profiles(display_name)')
      .eq('session_id', sessionId),
    supabase
      .from('attendance_corrections')
      .select('*')
      .eq('session_id', sessionId)
      .order('corrected_at', { ascending: false }),
  ])

  if (attendeesRes.error) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] getSessionAttendanceDetail:', attendeesRes.error)
    return { data: null, error: attendeesRes.error }
  }

  type AttendeeRow = { child_id: string; is_guest: boolean; attendance_type: string }
  type AttendanceRow = { child_id: string; status: string; recorded_by: string }
  type CoachRow = { coach_id: string; presence_type: string; partial_start: string | null; partial_end: string | null; profiles: { display_name: string } | null }
  type CorrectionRow = { id: string; tenant_id: string; session_id: string; child_id: string; corrected_by: string; old_status: string | null; new_status: string; corrected_at: string }

  const attendees  = (attendeesRes.data  ?? []) as AttendeeRow[]
  const attendances = (attendancesRes.data ?? []) as AttendanceRow[]
  const coachRows  = (coachesRes.data ?? []) as unknown as CoachRow[]
  const corrections = (correctionsRes.data ?? []) as CorrectionRow[]

  // Resolve display names
  const childIds = attendees.map(a => a.child_id)
  const regularIds = attendees.filter(a => !a.is_guest).map(a => a.child_id)
  const guestIds   = attendees.filter(a =>  a.is_guest).map(a => a.child_id)

  const [profilesRes, dirRes] = await Promise.all([
    regularIds.length > 0
      ? supabase.from('profiles').select('user_id, display_name').in('user_id', regularIds)
      : Promise.resolve({ data: [] as { user_id: string; display_name: string }[] }),
    guestIds.length > 0
      ? supabase.from('child_directory').select('id, display_name').in('id', guestIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ])

  const nameMap = new Map<string, string>([
    ...((profilesRes.data ?? []) as { user_id: string; display_name: string }[])
      .map(p => [p.user_id, p.display_name] as [string, string]),
    ...((dirRes.data ?? []) as { id: string; display_name: string }[])
      .map(d => [d.id, d.display_name] as [string, string]),
  ])

  const attendanceMap = new Map(attendances.map(a => [a.child_id, a]))
  const correctedSet  = new Set(corrections.map(c => c.child_id))

  return {
    data: {
      sessionId,
      attendees: attendees.map(a => {
        const att = attendanceMap.get(a.child_id)
        return {
          childId         : a.child_id,
          displayName     : nameMap.get(a.child_id) ?? a.child_id,
          attendanceType  : (a.attendance_type ?? 'member') as AttendanceType,
          status          : att?.status ?? null,
          recordedBy      : att?.recorded_by ?? null,
          correctedByAdmin: correctedSet.has(a.child_id),
          isGuest         : a.is_guest,
        }
      }),
      coaches: coachRows.map(c => ({
        coachId      : c.coach_id,
        displayName  : c.profiles?.display_name ?? c.coach_id,
        presenceType : (c.presence_type ?? 'full') as CoachPresenceType,
        partialStart : c.partial_start,
        partialEnd   : c.partial_end,
      })),
      corrections: corrections.map(c => ({
        id          : c.id,
        tenantId    : c.tenant_id,
        sessionId   : c.session_id,
        childId     : c.child_id,
        correctedBy : c.corrected_by,
        oldStatus   : c.old_status,
        newStatus   : c.new_status,
        correctedAt : c.corrected_at,
      })),
    },
    error: null,
  }
}

// ─── Correction Présence ──────────────────────────────────────────────────────

export async function correctAttendance(params: {
  tenantId  : string
  sessionId : string
  childId   : string
  newStatus : string
  adminId   : string
  oldStatus?: string
}): Promise<{ error: unknown }> {
  // Upsert in attendances
  const { error: attErr } = await supabase
    .from('attendances')
    .upsert({
      session_id  : params.sessionId,
      child_id    : params.childId,
      tenant_id   : params.tenantId,
      status      : params.newStatus,
      recorded_by : params.adminId,
      recorded_at : new Date().toISOString(),
    }, { onConflict: 'session_id,child_id' })

  if (attErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] correctAttendance:', attErr)
    return { error: attErr }
  }

  // Write correction audit trail
  const { error: corrErr } = await supabase
    .from('attendance_corrections')
    .insert({
      tenant_id    : params.tenantId,
      session_id   : params.sessionId,
      child_id     : params.childId,
      corrected_by : params.adminId,
      old_status   : params.oldStatus ?? null,
      new_status   : params.newStatus,
    })

  if (corrErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] correctAttendance audit:', corrErr)
  }

  return { error: null }
}

// ─── Coach Presence ───────────────────────────────────────────────────────────

export async function updateCoachPresence(params: {
  tenantId      : string
  sessionId     : string
  coachId       : string
  presenceType  : CoachPresenceType
  partialStart? : string
  partialEnd?   : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('coach_presence_confirmations')
    .upsert({
      session_id    : params.sessionId,
      coach_id      : params.coachId,
      tenant_id     : params.tenantId,
      presence_type : params.presenceType,
      partial_start : params.partialStart ?? null,
      partial_end   : params.partialEnd   ?? null,
      confirmed_at  : new Date().toISOString(),
    }, { onConflict: 'session_id,coach_id' })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] updateCoachPresence:', error)
  }
  return { error: error ?? null }
}

// ─── Ajout Enfant Essai ───────────────────────────────────────────────────────

/**
 * Ajoute un enfant (depuis child_directory) à une séance en mode essai.
 * Ne modifie pas group_members.
 */
export async function addTrialAttendance(params: {
  tenantId  : string
  sessionId : string
  childId   : string   // child_directory.id
}): Promise<{ error: unknown }> {
  // Ajouter à session_attendees avec type essai
  const { error: saErr } = await supabase
    .from('session_attendees')
    .upsert({
      session_id      : params.sessionId,
      child_id        : params.childId,
      tenant_id       : params.tenantId,
      is_guest        : true,
      attendance_type : 'trial',
    }, { onConflict: 'session_id,child_id' })

  if (saErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] addTrialAttendance:', saErr)
    return { error: saErr }
  }

  return { error: null }
}

// ─── Suggestions conversion essai → membre ───────────────────────────────────

export type TrialConversionSuggestion = {
  childId    : string
  childName  : string
  trialCount : number
  sessionIds : string[]
}

/**
 * Retourne les enfants essai ayant participé à 3+ séances (sans être membres du groupe).
 */
export async function listTrialConversionSuggestions(): Promise<{
  data: TrialConversionSuggestion[]
  error: unknown
}> {
  const { data, error } = await supabase
    .from('session_attendees')
    .select('child_id, session_id')
    .eq('attendance_type', 'trial')
    .eq('is_guest', true)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] listTrialConversionSuggestions:', error)
    return { data: [], error }
  }

  // Aggregate by child
  const childCountMap = new Map<string, string[]>()
  for (const row of (data ?? []) as { child_id: string; session_id: string }[]) {
    const existing = childCountMap.get(row.child_id) ?? []
    existing.push(row.session_id)
    childCountMap.set(row.child_id, existing)
  }

  const suggestions = [...childCountMap.entries()]
    .filter(([, sessions]) => sessions.length >= 3)
    .map(([childId, sessions]) => ({ childId, trialCount: sessions.length, sessionIds: sessions }))

  if (suggestions.length === 0) return { data: [], error: null }

  // Resolve names from child_directory
  const childIds = suggestions.map(s => s.childId)
  const { data: dirRows } = await supabase
    .from('child_directory')
    .select('id, display_name')
    .in('id', childIds)

  const nameMap = new Map(
    ((dirRows ?? []) as { id: string; display_name: string }[]).map(r => [r.id, r.display_name]),
  )

  return {
    data: suggestions.map(s => ({
      ...s,
      childName: nameMap.get(s.childId) ?? s.childId,
    })),
    error: null,
  }
}

/**
 * Convertit un enfant essai en membre d'un groupe.
 * Crée une entrée dans group_members.
 */
export async function convertTrialToMember(params: {
  tenantId : string
  childId  : string   // child_directory.id
  groupId  : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('group_members')
    .upsert({
      tenant_id  : params.tenantId,
      child_id   : params.childId,
      group_id   : params.groupId,
      joined_at  : new Date().toISOString(),
    }, { onConflict: 'group_id,child_id' })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[presences] convertTrialToMember:', error)
  }
  return { error: error ?? null }
}
