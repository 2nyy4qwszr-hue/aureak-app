// Story 108.1 — Hub Activités : KPIs globaux + 3 mini-widgets
// Endpoints dédiés au hub /activites (vue d'ensemble 100% cartes)
import { supabase } from '../supabase'

export type HubScope = { implantationId?: string; groupId?: string }

// ── Types ────────────────────────────────────────────────────────────────────

export type ActivitesHubKpis = {
  sessionsThisMonth    : number
  sessionsLastMonth    : number   // pour trend
  attendanceRate30d    : number   // 0-100
  attendanceRate30dPrev: number   // pour trend
  evaluationsDone      : number
  evaluationsExpected  : number
  playersAtRisk        : number   // ≥3 absences consécutives
}

export type HubNextSession = {
  sessionId       : string
  startAt         : string
  groupName       : string | null
  coachName       : string | null
  implantationName: string | null
  registeredCount : number
}

export type HubRecentEvaluation = {
  evaluationId: string
  submittedAt : string
  childName   : string
  coachName   : string | null
  method      : string | null
}

export type HubAtRiskPlayer = {
  childId            : string
  childName          : string
  groupName          : string | null
  consecutiveAbsences: number
}

// ── Helpers internes ─────────────────────────────────────────────────────────

const PRESENT_STATUSES = new Set(['present', 'late', 'trial'])

function monthBounds(refDate = new Date()): { start: Date; end: Date } {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
  const end   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1)
  return { start, end }
}

function daysAgo(n: number, refDate = new Date()): Date {
  return new Date(refDate.getTime() - n * 86_400_000)
}

function applyScopeToSessionsQuery<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  scope?: HubScope,
): T {
  if (scope?.implantationId) query = query.eq('implantation_id', scope.implantationId)
  if (scope?.groupId)        query = query.eq('group_id',        scope.groupId)
  return query
}

/**
 * Calcule les joueurs à risque (≥3 absences consécutives sur leurs 3 dernières séances)
 * pour un scope donné. Partagé entre KPI count et widget liste.
 */
async function computeAtRiskPlayers(
  scope?: HubScope,
): Promise<{ childId: string; consecutiveAbsences: number; groupId: string | null }[]> {
  // 1. Récupérer les séances récentes (90 jours) du scope, ordre desc
  const since90d = daysAgo(90).toISOString()
  let sessQuery = supabase
    .from('sessions')
    .select('id, group_id, scheduled_at')
    .gte('scheduled_at', since90d)
    .lte('scheduled_at', new Date().toISOString())
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(500)
  sessQuery = applyScopeToSessionsQuery(sessQuery, scope)

  const { data: sessions, error: sessErr } = await sessQuery
  if (sessErr || !sessions || sessions.length === 0) return []

  type SessionRow = { id: string; group_id: string | null; scheduled_at: string }
  const sessionRows = sessions as SessionRow[]
  const sessionIds  = sessionRows.map(s => s.id)
  const sessionMap  = new Map(sessionRows.map(s => [s.id, s]))

  // 2. Récupérer toutes les présences sur ces séances
  const { data: attendances, error: attErr } = await supabase
    .from('attendances')
    .select('session_id, child_id, status')
    .in('session_id', sessionIds)
  if (attErr || !attendances) return []

  type AttRow = { session_id: string; child_id: string; status: string }
  const attRows = attendances as AttRow[]

  // 3. Pour chaque enfant, lister ses présences ordonnées par date de séance desc
  const byChild = new Map<string, { sessionId: string; status: string; scheduledAt: string }[]>()
  for (const a of attRows) {
    const sess = sessionMap.get(a.session_id)
    if (!sess) continue
    const arr = byChild.get(a.child_id) ?? []
    arr.push({ sessionId: a.session_id, status: a.status, scheduledAt: sess.scheduled_at })
    byChild.set(a.child_id, arr)
  }

  // 4. Pour chaque enfant : trier desc, prendre les 3 dernières, flag si toutes 'absent'
  const atRisk: { childId: string; consecutiveAbsences: number; groupId: string | null }[] = []
  for (const [childId, entries] of byChild.entries()) {
    if (entries.length < 3) continue
    entries.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    const last3 = entries.slice(0, 3)
    if (last3.every(e => e.status === 'absent')) {
      // Compter le streak réel (peut être > 3)
      let streak = 0
      for (const e of entries) {
        if (e.status === 'absent') streak++
        else break
      }
      const lastSession = sessionMap.get(last3[0]!.sessionId)
      atRisk.push({
        childId,
        consecutiveAbsences: streak,
        groupId            : lastSession?.group_id ?? null,
      })
    }
  }

  return atRisk
}

async function resolveProfileNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', ids)
  return new Map(
    ((data ?? []) as { user_id: string; display_name: string | null }[])
      .map(p => [p.user_id, p.display_name ?? 'Inconnu']),
  )
}

async function resolveGroupNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data } = await supabase
    .from('groups')
    .select('id, name')
    .in('id', unique)
  return new Map(
    ((data ?? []) as { id: string; name: string }[]).map(g => [g.id, g.name]),
  )
}

// ── Endpoint 1 — KPIs globaux ────────────────────────────────────────────────

export async function getActivitesHubKpis(scope?: HubScope): Promise<ActivitesHubKpis> {
  const now      = new Date()
  const thisMo   = monthBounds(now)
  const lastMoRef = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  const lastMo   = monthBounds(lastMoRef)
  const cut30    = daysAgo(30, now)
  const cut60    = daysAgo(60, now)

  // 1. Sessions du mois courant + précédent (count)
  const buildSessQuery = (start: Date, end: Date) => {
    let q = supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', start.toISOString())
      .lt('scheduled_at',  end.toISOString())
      .is('deleted_at', null)
    q = applyScopeToSessionsQuery(q, scope)
    return q
  }

  // 2. Sessions des 60 derniers jours (pour calculer attendance rate 30d + prev30d)
  let recent60Query = supabase
    .from('sessions')
    .select('id, scheduled_at')
    .gte('scheduled_at', cut60.toISOString())
    .lte('scheduled_at', now.toISOString())
    .is('deleted_at', null)
    .limit(2000)
  recent60Query = applyScopeToSessionsQuery(recent60Query, scope)

  // 3. Évaluations du mois courant (count)
  let evalDoneQuery = supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .gte('updated_at', thisMo.start.toISOString())
    .lt('updated_at',  thisMo.end.toISOString())

  // 4. Sessions terminées du mois courant (= évaluations attendues : 1 par enfant attendu × séance terminée)
  let sessThisMoForEvalQuery = supabase
    .from('sessions')
    .select('id')
    .gte('scheduled_at', thisMo.start.toISOString())
    .lt('scheduled_at',  thisMo.end.toISOString())
    .in('status', ['réalisée', 'terminée'])
    .is('deleted_at', null)
  sessThisMoForEvalQuery = applyScopeToSessionsQuery(sessThisMoForEvalQuery, scope)

  const [
    sessThisMoRes,
    sessLastMoRes,
    recent60Res,
    evalDoneRes,
    sessThisMoForEvalRes,
    atRiskList,
  ] = await Promise.all([
    buildSessQuery(thisMo.start, thisMo.end),
    buildSessQuery(lastMo.start, lastMo.end),
    recent60Query,
    evalDoneQuery,
    sessThisMoForEvalQuery,
    computeAtRiskPlayers(scope),
  ])

  const sessionsThisMonth = sessThisMoRes.count ?? 0
  const sessionsLastMonth = sessLastMoRes.count ?? 0
  const evaluationsDone   = evalDoneRes.count   ?? 0

  // Calcul attendance rate 30d / prev30d
  const recent60 = (recent60Res.data ?? []) as { id: string; scheduled_at: string }[]
  const last30Ids = recent60.filter(s => s.scheduled_at >= cut30.toISOString()).map(s => s.id)
  const prev30Ids = recent60.filter(s => s.scheduled_at <  cut30.toISOString()).map(s => s.id)

  const fetchAttRate = async (ids: string[]): Promise<number> => {
    if (ids.length === 0) return 0
    const { data } = await supabase
      .from('attendances')
      .select('status')
      .in('session_id', ids)
    const rows = (data ?? []) as { status: string }[]
    if (rows.length === 0) return 0
    const present = rows.filter(r => PRESENT_STATUSES.has(r.status)).length
    return Math.round((present / rows.length) * 100)
  }

  const [attendanceRate30d, attendanceRate30dPrev] = await Promise.all([
    fetchAttRate(last30Ids),
    fetchAttRate(prev30Ids),
  ])

  // Évaluations attendues = nb d'enfants × séances terminées du mois.
  // Approximation : nb de présences (status != absent) sur séances terminées du mois.
  const completedSessionIds = ((sessThisMoForEvalRes.data ?? []) as { id: string }[]).map(s => s.id)
  let evaluationsExpected = 0
  if (completedSessionIds.length > 0) {
    const { count } = await supabase
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .in('session_id', completedSessionIds)
      .in('status', ['present', 'late', 'trial'])
    evaluationsExpected = count ?? 0
  }

  return {
    sessionsThisMonth,
    sessionsLastMonth,
    attendanceRate30d,
    attendanceRate30dPrev,
    evaluationsDone,
    evaluationsExpected,
    playersAtRisk: atRiskList.length,
  }
}

// ── Endpoint 2 — Prochaine séance ────────────────────────────────────────────

export async function getHubNextSession(scope?: HubScope): Promise<HubNextSession | null> {
  const now = new Date().toISOString()
  let query = supabase
    .from('sessions')
    .select(`
      id, scheduled_at, group_id,
      groups!sessions_group_id_fkey ( name ),
      implantations!sessions_implantation_id_fkey ( name ),
      session_coaches ( coach_id )
    `)
    .gte('scheduled_at', now)
    .is('deleted_at', null)
    .neq('status', 'annulée')
    .order('scheduled_at', { ascending: true })
    .limit(1)
  query = applyScopeToSessionsQuery(query, scope)

  const { data, error } = await query
  if (error || !data || data.length === 0) return null

  const raw = data[0] as {
    id: string; scheduled_at: string; group_id: string
    groups       : { name: string } | { name: string }[] | null
    implantations: { name: string } | { name: string }[] | null
    session_coaches: { coach_id: string }[] | null
  }

  const grp  = Array.isArray(raw.groups)        ? raw.groups[0]        : raw.groups
  const impl = Array.isArray(raw.implantations) ? raw.implantations[0] : raw.implantations

  // Compter les inscrits attendus (session_attendees)
  const { count: registered } = await supabase
    .from('session_attendees')
    .select('child_id', { count: 'exact', head: true })
    .eq('session_id', raw.id)

  // Premier coach assigné
  const coachIds = (raw.session_coaches ?? []).map(c => c.coach_id)
  const coachMap = await resolveProfileNames(coachIds.slice(0, 1))

  return {
    sessionId       : raw.id,
    startAt         : raw.scheduled_at,
    groupName       : (grp  as { name: string } | null)?.name ?? null,
    coachName       : coachIds[0] ? (coachMap.get(coachIds[0]) ?? null) : null,
    implantationName: (impl as { name: string } | null)?.name ?? null,
    registeredCount : registered ?? 0,
  }
}

// ── Endpoint 3 — Évaluations récentes ────────────────────────────────────────

export async function getHubRecentEvaluations(
  scope?: HubScope,
  limit = 3,
): Promise<HubRecentEvaluation[]> {
  // Si scope, filtrer via session_id → join sessions pour respecter scope
  let query = supabase
    .from('evaluations')
    .select(`
      id, child_id, coach_id, updated_at, session_id,
      sessions!evaluations_session_id_fkey (
        group_id, implantation_id,
        methodology_sessions!sessions_methodology_session_id_fkey ( method )
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(scope ? limit * 4 : limit)   // overfetch si scope pour filtrage côté client

  const { data, error } = await query
  if (error || !data || data.length === 0) return []

  type Row = {
    id: string; child_id: string; coach_id: string | null; updated_at: string; session_id: string
    sessions: {
      group_id: string | null; implantation_id: string | null
      methodology_sessions: { method: string } | { method: string }[] | null
    } | null
  }

  let rows = (data as unknown as Row[])

  // Filtrage scope côté client
  if (scope?.implantationId) rows = rows.filter(r => r.sessions?.implantation_id === scope.implantationId)
  if (scope?.groupId)        rows = rows.filter(r => r.sessions?.group_id        === scope.groupId)
  rows = rows.slice(0, limit)

  if (rows.length === 0) return []

  // Résoudre noms enfants + coachs
  const childIds = [...new Set(rows.map(r => r.child_id))]
  const coachIds = [...new Set(rows.map(r => r.coach_id).filter(Boolean) as string[])]

  const [childData, coachMap] = await Promise.all([
    supabase.from('child_directory').select('id, display_name').in('id', childIds),
    resolveProfileNames(coachIds),
  ])
  const childMap = new Map(
    ((childData.data ?? []) as { id: string; display_name: string }[]).map(c => [c.id, c.display_name]),
  )

  // Fallback profiles si non trouvé dans child_directory
  const missingChildIds = childIds.filter(id => !childMap.has(id))
  if (missingChildIds.length > 0) {
    const profileMap = await resolveProfileNames(missingChildIds)
    for (const [id, name] of profileMap.entries()) childMap.set(id, name)
  }

  return rows.map(r => {
    const ms = r.sessions?.methodology_sessions
    const method = ms
      ? (Array.isArray(ms) ? ms[0]?.method ?? null : (ms as { method: string }).method ?? null)
      : null
    return {
      evaluationId: r.id,
      submittedAt : r.updated_at,
      childName   : childMap.get(r.child_id) ?? 'Joueur',
      coachName   : r.coach_id ? (coachMap.get(r.coach_id) ?? null) : null,
      method,
    }
  })
}

// ── Endpoint 4 — Joueurs à risque (liste) ────────────────────────────────────

export async function getHubAtRiskPlayers(
  scope?: HubScope,
  limit = 5,
): Promise<HubAtRiskPlayer[]> {
  const atRisk = await computeAtRiskPlayers(scope)
  if (atRisk.length === 0) return []

  // Trier par streak desc et tronquer
  atRisk.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences)
  const top = atRisk.slice(0, limit)

  // Résoudre noms enfants (child_directory + fallback profiles) + groupe
  const childIds = top.map(a => a.childId)
  const groupIds = top.map(a => a.groupId).filter(Boolean) as string[]

  const [childDirData, groupMap] = await Promise.all([
    supabase.from('child_directory').select('id, display_name').in('id', childIds),
    resolveGroupNames(groupIds),
  ])

  const nameMap = new Map(
    ((childDirData.data ?? []) as { id: string; display_name: string }[]).map(c => [c.id, c.display_name]),
  )

  const missing = childIds.filter(id => !nameMap.has(id))
  if (missing.length > 0) {
    const profileMap = await resolveProfileNames(missing)
    for (const [id, name] of profileMap.entries()) nameMap.set(id, name)
  }

  return top.map(a => ({
    childId            : a.childId,
    childName          : nameMap.get(a.childId) ?? 'Joueur',
    groupName          : a.groupId ? (groupMap.get(a.groupId) ?? null) : null,
    consecutiveAbsences: a.consecutiveAbsences,
  }))
}
