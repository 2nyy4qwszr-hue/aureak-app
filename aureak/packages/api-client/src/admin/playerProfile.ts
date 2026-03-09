// Story 18.1 — Fiche Joueur 360° Admin : profil complet + historique présences
import { supabase } from '../supabase'
import type { EvaluationSignal, AttendanceStatus } from '@aureak/types'

// ─── AdminPlayerProfile ───────────────────────────────────────────────────────

export type AdminPlayerProfile = {
  userId          : string
  tenantId        : string
  displayName     : string
  firstName       : string | null
  lastName        : string | null
  email           : string | null
  phone           : string | null
  status          : 'pending' | 'active' | 'suspended' | 'deleted'
  inviteStatus    : 'not_invited' | 'invited' | 'active'
  internalNotes   : string | null
  createdAt       : string
  lastSignInAt    : string | null
  // child_metadata (nullable si non renseigné)
  birthDate       : string | null
  gender          : 'male' | 'female' | 'other' | null
  strongFoot      : 'right' | 'left' | 'both' | null
  ageCategory     : string | null
  currentClub     : string | null
  groupId         : string | null
  groupName       : string | null
  implantationId  : string | null
  implantationName: string | null
  // contacts parents
  parentFirstName : string | null
  parentLastName  : string | null
  parentEmail     : string | null
  parentPhone     : string | null
  parent2FirstName: string | null
  parent2LastName : string | null
  parent2Email    : string | null
  parent2Phone    : string | null
}

export async function getAdminPlayerProfile(
  playerId: string
): Promise<{ data: AdminPlayerProfile | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      user_id, tenant_id, display_name, first_name, last_name, email, phone,
      status, invite_status, internal_notes, created_at, last_sign_in_at,
      child_metadata (
        birth_date, gender, strong_foot, age_category, current_club, group_id,
        parent_first_name, parent_last_name, parent_email, parent_phone,
        parent2_first_name, parent2_last_name, parent2_email, parent2_phone,
        groups ( name, implantation_id, implantations ( name ) )
      )
    `)
    .eq('user_id', playerId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return { data: null, error }

  type RawCm = {
    birth_date: string | null; gender: string | null; strong_foot: string | null
    age_category: string | null; current_club: string | null; group_id: string | null
    parent_first_name: string | null; parent_last_name: string | null
    parent_email: string | null; parent_phone: string | null
    parent2_first_name: string | null; parent2_last_name: string | null
    parent2_email: string | null; parent2_phone: string | null
    groups: { name: string; implantation_id: string; implantations: { name: string } | null } | null
  }
  type RawProfile = {
    user_id: string; tenant_id: string; display_name: string
    first_name: string | null; last_name: string | null; email: string | null
    phone: string | null; status: string; invite_status: string
    internal_notes: string | null; created_at: string; last_sign_in_at: string | null
    child_metadata: RawCm | RawCm[] | null
  }

  const raw = data as unknown as RawProfile
  const cm  = Array.isArray(raw.child_metadata) ? raw.child_metadata[0] ?? null : raw.child_metadata
  const grp = cm?.groups ?? null

  return {
    data: {
      userId          : raw.user_id,
      tenantId        : raw.tenant_id,
      displayName     : raw.display_name,
      firstName       : raw.first_name,
      lastName        : raw.last_name,
      email           : raw.email,
      phone           : raw.phone,
      status          : raw.status as AdminPlayerProfile['status'],
      inviteStatus    : raw.invite_status as AdminPlayerProfile['inviteStatus'],
      internalNotes   : raw.internal_notes,
      createdAt       : raw.created_at,
      lastSignInAt    : raw.last_sign_in_at,
      birthDate       : cm?.birth_date ?? null,
      gender          : (cm?.gender ?? null) as AdminPlayerProfile['gender'],
      strongFoot      : (cm?.strong_foot ?? null) as AdminPlayerProfile['strongFoot'],
      ageCategory     : cm?.age_category ?? null,
      currentClub     : cm?.current_club ?? null,
      groupId         : cm?.group_id ?? null,
      groupName       : grp?.name ?? null,
      implantationId  : grp?.implantation_id ?? null,
      implantationName: grp?.implantations?.name ?? null,
      parentFirstName : cm?.parent_first_name ?? null,
      parentLastName  : cm?.parent_last_name ?? null,
      parentEmail     : cm?.parent_email ?? null,
      parentPhone     : cm?.parent_phone ?? null,
      parent2FirstName: cm?.parent2_first_name ?? null,
      parent2LastName : cm?.parent2_last_name ?? null,
      parent2Email    : cm?.parent2_email ?? null,
      parent2Phone    : cm?.parent2_phone ?? null,
    },
    error: null,
  }
}

// ─── PlayerAttendanceRecord ───────────────────────────────────────────────────

export type PlayerAttendanceRecord = {
  attendanceId: string
  sessionId   : string
  scheduledAt : string
  groupName   : string | null
  status      : AttendanceStatus
  receptivite : EvaluationSignal | null
  goutEffort  : EvaluationSignal | null
  attitude    : EvaluationSignal | null
  topSeance   : 'star' | 'none' | null
}

export async function getPlayerAttendanceHistory(
  playerId: string,
  opts?: { from?: string; to?: string; limit?: number }
): Promise<{ data: PlayerAttendanceRecord[]; error: unknown }> {
  let query = supabase
    .from('attendances')
    .select(`
      id, status, session_id,
      sessions ( scheduled_at, groups ( name ) )
    `)
    .eq('child_id', playerId)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 30)

  if (opts?.from) query = query.gte('created_at', opts.from + 'T00:00:00')
  if (opts?.to)   query = query.lte('created_at', opts.to + 'T23:59:59')

  const { data: attendances, error } = await query
  if (error || !attendances) return { data: [], error }

  const sessionIds = [...new Set((attendances as { session_id: string }[]).map(a => a.session_id))]

  const { data: evals } = sessionIds.length > 0
    ? await supabase
        .from('session_evaluations_merged')
        .select('session_id, receptivite, gout_effort, attitude, top_seance')
        .eq('child_id', playerId)
        .in('session_id', sessionIds)
    : { data: [] }

  type EvalRow = { session_id: string; receptivite: string; gout_effort: string; attitude: string; top_seance: string }
  const evalMap = new Map(((evals ?? []) as EvalRow[]).map(e => [e.session_id, e]))

  type RawAtt = {
    id: string; status: string; session_id: string
    sessions: { scheduled_at: string; groups: { name: string } | { name: string }[] | null } | null
  }

  return {
    data: (attendances as unknown as RawAtt[]).map(a => {
      const ev  = evalMap.get(a.session_id)
      const grp = Array.isArray(a.sessions?.groups) ? a.sessions?.groups[0] : a.sessions?.groups
      return {
        attendanceId: a.id,
        sessionId   : a.session_id,
        scheduledAt : a.sessions?.scheduled_at ?? '',
        groupName   : (grp as { name?: string } | null | undefined)?.name ?? null,
        status      : a.status as AttendanceStatus,
        receptivite : (ev?.receptivite ?? null) as EvaluationSignal | null,
        goutEffort  : (ev?.gout_effort ?? null) as EvaluationSignal | null,
        attitude    : (ev?.attitude ?? null) as EvaluationSignal | null,
        topSeance   : (ev?.top_seance ?? null) as 'star' | 'none' | null,
      }
    }),
    error: null,
  }
}
