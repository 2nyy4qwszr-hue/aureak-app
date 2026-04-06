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
  methodName      : string | null   // Story 65-5 — méthode pédagogique
  coachIds        : string[]        // Story 65-5 — coaches assignés
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
      implantations!sessions_implantation_id_fkey ( name ),
      methodology_sessions!sessions_methodology_session_id_fkey ( method ),
      session_coaches ( coach_id )
    `)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(200)

  if (params?.from)           sessionQuery = sessionQuery.gte('scheduled_at', params.from + 'T00:00:00')
  if (params?.to)             sessionQuery = sessionQuery.lte('scheduled_at', params.to + 'T23:59:59')
  if (params?.implantationId) sessionQuery = sessionQuery.eq('implantation_id', params.implantationId)
  if (params?.groupId)        sessionQuery = sessionQuery.eq('group_id', params.groupId)

  const { data: sessions, error: sessionsError } = await sessionQuery
  if (sessionsError) return []
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
      groups              : { name: string } | { name: string }[] | null
      implantations       : { name: string } | { name: string }[] | null
      methodology_sessions: { method: string } | { method: string }[] | null
      session_coaches     : { coach_id: string }[] | null
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
      methodName: (() => {
        const ms = s.methodology_sessions
        if (!ms) return null
        if (Array.isArray(ms)) return ms[0]?.method ?? null
        return (ms as { method: string }).method ?? null
      })(),
      coachIds: ((s.session_coaches ?? []) as { coach_id: string }[]).map(c => c.coach_id),
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

  // Story 54-7 — Vérification absence pattern (fire-and-forget, ne bloque pas)
  if (!error && params.status === 'absent') {
    ;(async () => {
      try {
        const { data: sessData } = await supabase
          .from('sessions')
          .select('group_id')
          .eq('id', params.sessionId)
          .single()
        const groupId = (sessData as { group_id: string | null } | null)?.group_id
        if (groupId) {
          await checkAbsenceAlertTrigger(params.childId, groupId, params.sessionId)
        }
      } catch (err) {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[recordAttendance] absence alert check failed:', err)
      }
    })()
  }

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

// ─── Enfants présents d'une séance (coach evaluations) ───────────────────────

/**
 * Retourne les child_ids dont le statut est présent/en retard/essai pour une séance.
 * Utilisé par coach/evaluations pour initialiser la liste d'évaluation.
 */
export async function listPresentChildIdsForSession(
  sessionId: string
): Promise<{ data: string[]; error: unknown }> {
  const { data, error } = await supabase
    .from('attendances')
    .select('child_id, status')
    .eq('session_id', sessionId)
    .in('status', ['present', 'late', 'trial'])

  if (error) return { data: [], error }
  return {
    data: (data ?? []).map((a: { child_id: string }) => a.child_id),
    error: null,
  }
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

// ─── listPlayersWithAttendance — Story 18.1 ───────────────────────────────────

export type PlayerAttendanceSummary = {
  childId         : string
  displayName     : string
  groupId         : string | null
  groupName       : string | null
  implantationName: string | null
  totalSessions   : number
  presentCount    : number
  absentCount     : number
  lateCount       : number
  attendanceRate  : number   // 0-100
  lastAttendanceAt: string | null
  lastStatus      : AttendanceStatus | null
}

const PRESENT_STATUSES_SET = new Set(['present', 'late', 'trial'])

export async function listPlayersWithAttendance(params: {
  from           : string
  to             : string
  implantationId?: string
  groupId?       : string
}): Promise<PlayerAttendanceSummary[]> {
  let sessionQuery = supabase
    .from('sessions')
    .select('id, group_id, implantation_id, groups ( name, implantations ( name ) )')
    .gte('scheduled_at', params.from + 'T00:00:00')
    .lte('scheduled_at', params.to + 'T23:59:59')
    .is('deleted_at', null)

  if (params.implantationId) sessionQuery = sessionQuery.eq('implantation_id', params.implantationId)
  if (params.groupId)        sessionQuery = sessionQuery.eq('group_id', params.groupId)

  const { data: sessions, error: sessionsError } = await sessionQuery
  if (sessionsError) return []
  if (!sessions || sessions.length === 0) return []

  type RawSession = {
    id: string; group_id: string; implantation_id: string
    groups: { name: string; implantations: { name: string } | null } | null
  }
  const sessionMap = new Map((sessions as unknown as RawSession[]).map(s => [s.id, s]))
  const sessionIds = [...sessionMap.keys()]

  const { data: attendances } = await supabase
    .from('attendances')
    .select('child_id, session_id, status, created_at, profiles ( display_name )')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })

  if (!attendances || attendances.length === 0) return []

  type RawAtt = {
    child_id: string; session_id: string; status: string; created_at: string
    profiles: { display_name: string } | null
  }

  const childMap = new Map<string, {
    displayName    : string
    groupId        : string | null
    groupName      : string | null
    implantationName: string | null
    statuses       : string[]
    lastAt         : string | null
  }>()

  for (const rawAtt of (attendances as unknown as RawAtt[])) {
    const sess = sessionMap.get(rawAtt.session_id)
    if (!childMap.has(rawAtt.child_id)) {
      const grp = sess?.groups ?? null
      childMap.set(rawAtt.child_id, {
        displayName    : (rawAtt.profiles as { display_name?: string } | null)?.display_name ?? rawAtt.child_id,
        groupId        : sess?.group_id ?? null,
        groupName      : grp?.name ?? null,
        implantationName: grp?.implantations?.name ?? null,
        statuses       : [],
        lastAt         : null,
      })
    }
    const entry = childMap.get(rawAtt.child_id)!
    entry.statuses.push(rawAtt.status)
    if (!entry.lastAt || rawAtt.created_at > entry.lastAt) {
      entry.lastAt = rawAtt.created_at
    }
  }

  return Array.from(childMap.entries())
    .map(([childId, entry]) => {
      const total   = entry.statuses.length
      const present = entry.statuses.filter(s => PRESENT_STATUSES_SET.has(s)).length
      const absent  = entry.statuses.filter(s => s === 'absent').length
      const late    = entry.statuses.filter(s => s === 'late').length
      const rate    = total > 0 ? Math.round((present / total) * 100) : 0
      return {
        childId,
        displayName    : entry.displayName,
        groupId        : entry.groupId,
        groupName      : entry.groupName,
        implantationName: entry.implantationName,
        totalSessions  : total,
        presentCount   : present,
        absentCount    : absent,
        lateCount      : late,
        attendanceRate : rate,
        lastAttendanceAt: entry.lastAt,
        lastStatus     : (entry.statuses[0] ?? null) as AttendanceStatus | null,
      }
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))
}

// ─── listSessionAttendeeRoster + batchResolveAttendeeNames — B-25 ────────────

export type AttendeeRosterEntry = {
  childId   : string
  isGuest   : boolean
  coachNotes: string | null
}

export async function listSessionAttendeeRoster(
  sessionId: string
): Promise<{ data: AttendeeRosterEntry[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_attendees')
    .select('child_id, is_guest, coach_notes')
    .eq('session_id', sessionId)
  return {
    data: (data ?? []).map(r => ({
      childId   : (r as { child_id: string }).child_id,
      isGuest   : (r as { is_guest: boolean }).is_guest,
      coachNotes: (r as { coach_notes: string | null }).coach_notes,
    })),
    error,
  }
}

export async function batchResolveAttendeeNames(
  regularIds: string[],
  guestIds  : string[],
): Promise<{ profileMap: Map<string, string>; dirMap: Map<string, string> }> {
  const [profilesRes, dirRes] = await Promise.all([
    regularIds.length > 0
      ? supabase.from('profiles').select('user_id, display_name').in('user_id', regularIds)
      : Promise.resolve({ data: [] }),
    guestIds.length > 0
      ? supabase.from('child_directory').select('id, display_name').in('id', guestIds)
      : Promise.resolve({ data: [] }),
  ])
  const profileMap = new Map(
    (profilesRes.data ?? []).map(p => [
      (p as { user_id: string }).user_id,
      (p as { display_name: string }).display_name,
    ])
  )
  const dirMap = new Map(
    (dirRes.data ?? []).map(d => [
      (d as { id: string }).id,
      (d as { display_name: string }).display_name,
    ])
  )
  return { profileMap, dirMap }
}

// ─── AttendanceStat par groupe — Story 44.5 ──────────────────────────────────

export type AttendanceStat = {
  childId: string
  present: number
  total  : number
}

/**
 * Retourne les stats de présence par enfant pour toutes les séances d'un groupe.
 * present = statuts present|late|trial / total = toutes entrées d'attendance
 */
export async function listAttendanceStatsByGroup(
  groupId : string,
): Promise<AttendanceStat[]> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)
    .is('deleted_at', null)

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id)
  if (sessionIds.length === 0) return []

  const { data: attendances } = await supabase
    .from('attendances')
    .select('child_id, status')
    .in('session_id', sessionIds)

  const stats = new Map<string, { present: number; total: number }>()
  for (const a of ((attendances ?? []) as { child_id: string; status: string }[])) {
    const s = stats.get(a.child_id) ?? { present: 0, total: 0 }
    s.total++
    if (a.status === 'present' || a.status === 'late' || a.status === 'trial') s.present++
    stats.set(a.child_id, s)
  }
  return Array.from(stats.entries()).map(([childId, s]) => ({ childId, ...s }))
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

// ─── Story 54-3 — Streaks récentes par joueur (batch) ────────────────────────

export type PlayerRecentStreak = {
  consecutivePresences: number   // streak actuel (présences d'affilée depuis la plus récente)
  recentAbsences      : number   // absences sur les 5 dernières séances
}

/**
 * Charge les 10 dernières séances réalisées d'un groupe (avant sessionId inclus),
 * puis calcule pour chaque joueur sa streak de présences consécutives et
 * son nombre d'absences sur les 5 dernières séances.
 * Retourne un Record<childId, PlayerRecentStreak>.
 * Si l'appel échoue, retourne {}.
 */
export async function getGroupMembersRecentStreaks(
  groupId  : string,
  sessionId: string,
): Promise<Record<string, PlayerRecentStreak>> {
  try {
    // 1. Récupérer les 10 dernières séances réalisées du groupe
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, scheduled_at, status')
      .eq('group_id', groupId)
      .eq('status', 'réalisée')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(10)

    if (sessErr || !sessions || sessions.length === 0) return {}

    const sessionIds = (sessions as { id: string; scheduled_at: string }[]).map(s => s.id)

    // 2. Récupérer toutes les présences pour ces séances
    const { data: attendances, error: attErr } = await supabase
      .from('attendances')
      .select('session_id, child_id, status')
      .in('session_id', sessionIds)

    if (attErr || !attendances) return {}

    // 3. Construire une map session_id → Set<childId présent>
    const presentBySess = new Map<string, Set<string>>()
    for (const sess of sessions as { id: string }[]) {
      presentBySess.set(sess.id, new Set())
    }
    for (const att of attendances as { session_id: string; child_id: string; status: string }[]) {
      if (att.status === 'present' || att.status === 'late' || att.status === 'trial') {
        presentBySess.get(att.session_id)?.add(att.child_id)
      }
    }

    // 4. Collecter tous les enfants concernés
    const allChildIds = new Set<string>()
    for (const att of attendances as { child_id: string }[]) {
      allChildIds.add(att.child_id)
    }

    // sessions is already sorted desc (most recent first)
    const sessionsDesc = sessions as { id: string }[]

    // 5. Calculer streak et absences récentes pour chaque enfant
    const result: Record<string, PlayerRecentStreak> = {}
    for (const childId of allChildIds) {
      // Streak : présences d'affilée depuis la plus récente
      let consecutivePresences = 0
      for (const s of sessionsDesc) {
        if (presentBySess.get(s.id)?.has(childId)) {
          consecutivePresences++
        } else {
          break
        }
      }
      // Absences sur les 5 dernières séances
      const last5 = sessionsDesc.slice(0, 5)
      let recentAbsences = 0
      for (const s of last5) {
        if (!presentBySess.get(s.id)?.has(childId)) {
          recentAbsences++
        }
      }
      result[childId] = { consecutivePresences, recentAbsences }
    }

    return result
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[getGroupMembersRecentStreaks] error:', err)
    return {}
  }
}

// ─── Story 54-7 — Alertes absence pattern ────────────────────────────────────

export type AbsenceAlertRow = {
  id         : string
  childId    : string
  childName  : string
  groupId    : string
  groupName  : string
  absenceCount: number
  createdAt  : string
}

/**
 * Vérifie si un joueur a 3+ absences consécutives dans un groupe et crée une alerte
 * dans inapp_notifications si ce n'est pas déjà fait dans les dernières 24h.
 * Ne throw jamais — silent fail avec console.error dev-only.
 * TODO: migrer vers Edge Function cron (Option B) pour une couverture plus robuste.
 */
export async function checkAbsenceAlertTrigger(
  childId  : string,
  groupId  : string,
  _sessionId: string,
): Promise<void> {
  try {
    // 1. Récupérer les 5 dernières séances réalisées du groupe (desc)
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, scheduled_at')
      .eq('group_id', groupId)
      .eq('status', 'réalisée')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(5)

    if (sessErr || !sessions || sessions.length < 3) return

    const sessionIds = (sessions as { id: string }[]).map(s => s.id)

    // 2. Récupérer les présences du joueur pour ces séances
    const { data: atts, error: attErr } = await supabase
      .from('attendances')
      .select('session_id, status')
      .eq('child_id', childId)
      .in('session_id', sessionIds)

    if (attErr) return

    // 3. Compter les absences consécutives depuis la plus récente
    const attMap = new Map((atts ?? []).map((a: { session_id: string; status: string }) => [a.session_id, a.status]))
    let consecutiveAbsences = 0
    for (const sess of sessions as { id: string }[]) {
      const status = attMap.get(sess.id)
      if (status === 'absent') {
        consecutiveAbsences++
      } else {
        break
      }
    }

    if (consecutiveAbsences < 3) return

    // 4. Vérifier doublon : alerte 'absence_alert' dans les 24h pour ce joueur + groupe
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('inapp_notifications')
      .select('id')
      .eq('type', 'absence_alert')
      .gte('created_at', since24h)
      .filter('payload->>childId', 'eq', childId)
      .filter('payload->>groupId', 'eq', groupId)
      .limit(1)

    if (existing && existing.length > 0) return   // déjà alerté

    // 5. Récupérer le nom du joueur et du groupe
    const [childRes, groupRes, userRes] = await Promise.all([
      supabase.from('child_directory').select('display_name').eq('id', childId).single(),
      supabase.from('groups').select('name').eq('id', groupId).single(),
      supabase.auth.getUser(),
    ])

    const childName = (childRes.data as { display_name: string } | null)?.display_name ?? childId
    const groupName = (groupRes.data as { name: string } | null)?.name ?? groupId
    const tenantId  = (userRes.data?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''
    const userId    = userRes.data?.user?.id ?? ''

    if (!tenantId || !userId) return

    // 6. Insérer la notification
    await supabase.from('inapp_notifications').insert({
      tenant_id: tenantId,
      user_id  : userId,
      title    : `Absence répétée — ${childName}`,
      body     : `${childName} est absent(e) depuis ${consecutiveAbsences} séances consécutives dans ${groupName}.`,
      type     : 'absence_alert',
      payload  : { childId, childName, absenceCount: consecutiveAbsences, groupId, groupName },
    })
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[checkAbsenceAlertTrigger] error:', err)
    // Ne pas throw — AC7
  }
}

/**
 * Liste les alertes d'absence actives (non lues) pour un groupe donné.
 * Retourne un tableau vide en cas d'erreur (silent fail).
 */
export async function listActiveAbsenceAlerts(
  groupId: string,
): Promise<AbsenceAlertRow[]> {
  try {
    const { data, error } = await supabase
      .from('inapp_notifications')
      .select('id, payload, created_at')
      .eq('type', 'absence_alert')
      .is('read_at', null)
      .filter('payload->>groupId', 'eq', groupId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[listActiveAbsenceAlerts] error:', error)
      return []
    }

    return ((data ?? []) as { id: string; payload: Record<string, unknown>; created_at: string }[]).map(r => ({
      id          : r.id,
      childId     : (r.payload?.['childId'] as string)    ?? '',
      childName   : (r.payload?.['childName'] as string)  ?? '',
      groupId     : (r.payload?.['groupId'] as string)    ?? '',
      groupName   : (r.payload?.['groupName'] as string)  ?? '',
      absenceCount: (r.payload?.['absenceCount'] as number) ?? 0,
      createdAt   : r.created_at,
    }))
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[listActiveAbsenceAlerts] error:', err)
    return []
  }
}

// ─── Story 54-6 — Heatmap mensuelle par joueur ───────────────────────────────

export type AttendanceHistoryRow = {
  sessionId  : string
  sessionDate: string
  sessionType: string
  groupName  : string
  status     : AttendanceStatus
}

/**
 * Retourne les présences d'un joueur (child_directory) sur une période.
 * Joint sessions → groups pour récupérer le nom du groupe.
 */
export async function listAttendancesByChild(
  childId  : string,
  startDate: string,
  endDate  : string,
): Promise<AttendanceHistoryRow[]> {
  const { data, error } = await supabase
    .from('attendances')
    .select(`
      session_id,
      status,
      sessions!inner (
        session_date,
        session_type,
        group_id,
        groups ( name )
      )
    `)
    .eq('child_id', childId)
    .gte('sessions.session_date', startDate)
    .lte('sessions.session_date', endDate)
    .order('sessions.session_date', { ascending: true })

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[listAttendancesByChild] error:', error)
    throw error
  }

  return ((data ?? []) as unknown[]).map(row => {
    const r        = row as { session_id: string; status: string; sessions: { session_date: string; session_type: string | null; groups: { name: string } | null } }
    const sessions = r.sessions
    return {
      sessionId  : r.session_id,
      sessionDate: sessions?.session_date ?? '',
      sessionType: sessions?.session_type ?? '',
      groupName  : (sessions?.groups as { name: string } | null)?.name ?? '',
      status     : r.status as AttendanceStatus,
    }
  })
}
