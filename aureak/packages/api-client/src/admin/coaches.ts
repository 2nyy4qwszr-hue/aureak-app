// Admin — Liste des coachs avec pagination
// Conformité ARCH-1 : remplace l'accès direct profiles dans coaches/index.tsx.

import { supabase } from '../supabase'

export type CoachListRow = {
  userId     : string
  displayName: string | null
}

export type CoachSessionStats = {
  sessionsCount    : number
  evaluationsCount : number
  avgPresencePct   : number | null
}

export type CoachRecentSession = {
  id          : string
  scheduledAt : string
  groupName   : string | null
  status      : string
}

/** getCoachSessionStats — stats d'activité pour un coach (séances, évaluations, présence moy.) */
export async function getCoachSessionStats(coachId: string): Promise<{ data: CoachSessionStats | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('session_coaches')
      .select('session_id, sessions!inner(id, status, deleted_at)')
      .eq('coach_id', coachId)
      .is('sessions.deleted_at', null)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] getCoachSessionStats error:', error)
      return { data: null, error }
    }

    const sessionIds = ((data ?? []) as unknown as { session_id: string }[]).map(r => r.session_id)
    const sessionsCount = sessionIds.length

    // Évaluations saisies par ce coach
    let evaluationsCount = 0
    if (sessionIds.length > 0) {
      const { count, error: evalErr } = await supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .in('session_id', sessionIds)
      if (!evalErr) evaluationsCount = count ?? 0
    }

    return { data: { sessionsCount, evaluationsCount, avgPresencePct: null }, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] getCoachSessionStats exception:', err)
    return { data: null, error: err }
  }
}

/** listCoachRecentSessions — 10 dernières séances d'un coach */
export async function listCoachRecentSessions(coachId: string, limit = 10): Promise<{ data: CoachRecentSession[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('session_coaches')
      .select('sessions!inner(id, scheduled_at, status, deleted_at, groups(name))')
      .eq('coach_id', coachId)
      .is('sessions.deleted_at', null)
      .order('sessions.scheduled_at', { ascending: false })
      .limit(limit)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] listCoachRecentSessions error:', error)
      return { data: [], error }
    }

    const rows: CoachRecentSession[] = ((data ?? []) as unknown as {
      sessions: { id: string; scheduled_at: string; status: string; groups: { name: string } | null }
    }[]).map(r => ({
      id          : r.sessions.id,
      scheduledAt : r.sessions.scheduled_at,
      groupName   : r.sessions.groups?.name ?? null,
      status      : r.sessions.status,
    }))

    return { data: rows, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] listCoachRecentSessions exception:', err)
    return { data: [], error: err }
  }
}

/**
 * Liste les profils coach avec pagination et compte total.
 * Utilisé par la page admin coaches/index.tsx.
 */
export async function listCoaches(opts: {
  page    : number
  pageSize: number
}): Promise<{ data: CoachListRow[]; count: number; error: unknown }> {
  const { data, count, error } = await supabase
    .from('profiles')
    .select('user_id, display_name', { count: 'exact' })
    .eq('user_role', 'coach')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

  if (error) return { data: [], count: 0, error }

  const rows: CoachListRow[] = (
    (data ?? []) as { user_id: string; display_name: string | null }[]
  ).map(p => ({
    userId     : p.user_id,
    displayName: p.display_name,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

// ── Story 79.1 — Coachs inactifs ─────────────────────────────────────────────

export type InactiveCoach = {
  userId     : string
  displayName: string | null
}

/** detectInactiveCoaches — coachs sans séance ni évaluation dans les N derniers jours */
export async function detectInactiveCoaches(
  daysSince = 7
): Promise<{ data: InactiveCoach[] | null; error: unknown }> {
  const since = new Date(Date.now() - daysSince * 24 * 3600_000).toISOString()

  try {
    // 1. Tous les coachs actifs
    const { data: allCoaches, error: coachErr } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_role', 'coach')
      .is('deleted_at', null)
      .order('display_name', { ascending: true })

    if (coachErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] detectInactiveCoaches profiles error:', coachErr)
      return { data: null, error: coachErr }
    }

    const coaches = (allCoaches ?? []) as { user_id: string; display_name: string | null }[]
    if (coaches.length === 0) return { data: [], error: null }

    // 2. Coachs actifs en séance (session_coaches JOIN sessions)
    const { data: sessionRows, error: sessionErr } = await supabase
      .from('session_coaches')
      .select('coach_id, sessions!inner(scheduled_at)')
      .gte('sessions.scheduled_at', since)
      .is('sessions.deleted_at', null)

    if (sessionErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] detectInactiveCoaches sessions error:', sessionErr)
      return { data: null, error: sessionErr }
    }

    const activeBySession = new Set(
      ((sessionRows ?? []) as unknown as { coach_id: string }[]).map(r => r.coach_id)
    )

    // 3. Coachs actifs en évaluations
    const { data: evalRows, error: evalErr } = await supabase
      .from('evaluations')
      .select('coach_id')
      .gte('created_at', since)

    if (evalErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] detectInactiveCoaches evaluations error:', evalErr)
      return { data: null, error: evalErr }
    }

    const activeByEval = new Set(
      ((evalRows ?? []) as { coach_id: string }[]).map(r => r.coach_id)
    )

    // 4. Inactifs = all minus (session ∪ eval)
    const inactive: InactiveCoach[] = coaches
      .filter(c => !activeBySession.has(c.user_id) && !activeByEval.has(c.user_id))
      .map(c => ({ userId: c.user_id, displayName: c.display_name }))

    return { data: inactive, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coaches] detectInactiveCoaches exception:', err)
    return { data: null, error: err }
  }
}
