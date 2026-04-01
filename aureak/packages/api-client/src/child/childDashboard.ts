// Child — Données supplémentaires du dashboard joueur (ARCH-1)
// Consolide les 3 requêtes directes de child/dashboard/index.tsx

import { supabase } from '../supabase'

export type ChildNextSession = {
  scheduledAt    : string
  durationMinutes: number | null
  location       : string | null
}

export type ChildLastEval = {
  receptivite: string
  goutEffort : string
  attitude   : string
  topSeance  : string
}

export type ChildDashboardExtra = {
  nextSession: ChildNextSession | null
  lastEval   : ChildLastEval   | null
}

/**
 * Charge la prochaine séance et la dernière évaluation du joueur.
 * Consolide : session_attendees → sessions (next) + session_evaluations_merged (last).
 */
export async function getChildDashboardExtra(
  childId: string,
): Promise<{ data: ChildDashboardExtra; error: unknown }> {
  const empty: ChildDashboardExtra = { nextSession: null, lastEval: null }

  // 1. IDs des séances auxquelles l'enfant est inscrit
  const { data: saRows, error: saError } = await supabase
    .from('session_attendees')
    .select('session_id')
    .eq('child_id', childId)

  if (saError) return { data: empty, error: saError }

  // 2. Prochaine séance planifiée (parmi les IDs)
  let nextSession: ChildNextSession | null = null
  if (saRows && saRows.length > 0) {
    const ids = (saRows as { session_id: string }[]).map(r => r.session_id)
    const { data: upSessions } = await supabase
      .from('sessions')
      .select('scheduled_at, duration_minutes, location')
      .in('id', ids)
      .gt('scheduled_at', new Date().toISOString())
      .eq('status', 'planifiée')
      .order('scheduled_at', { ascending: true })
      .limit(1)
    if (upSessions && upSessions.length > 0) {
      const s = upSessions[0] as { scheduled_at: string; duration_minutes: number | null; location: string | null }
      nextSession = {
        scheduledAt    : s.scheduled_at,
        durationMinutes: s.duration_minutes,
        location       : s.location,
      }
    }
  }

  // 3. Dernière évaluation coach
  const { data: evalRows } = await supabase
    .from('session_evaluations_merged')
    .select('receptivite, gout_effort, attitude, top_seance')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)

  let lastEval: ChildLastEval | null = null
  if (evalRows && evalRows.length > 0) {
    const e = evalRows[0] as { receptivite: string; gout_effort: string; attitude: string; top_seance: string }
    lastEval = {
      receptivite: e.receptivite,
      goutEffort : e.gout_effort,
      attitude   : e.attitude,
      topSeance  : e.top_seance,
    }
  }

  return { data: { nextSession, lastEval }, error: null }
}
