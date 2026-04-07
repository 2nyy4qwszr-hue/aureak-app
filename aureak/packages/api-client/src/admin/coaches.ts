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
