// Story 7.3 — Fiche enfant : présences, évaluations fusionnées, historique séances
import { supabase } from '../supabase'

export async function getChildProfile(
  childId: string,
  options: { months?: number } = { months: 3 }
) {
  const from = new Date()
  from.setMonth(from.getMonth() - (options.months ?? 3))

  const [attendancesResult, evaluationsResult] = await Promise.all([
    supabase
      .from('attendances')
      .select(`
        id, status, created_at,
        sessions (
          id, scheduled_at,
          groups(name),
          session_themes(themes(name)),
          session_coaches(coach_id, role)
        )
      `)
      .eq('child_id', childId)
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: false }),

    supabase
      .from('session_evaluations_merged')
      .select('session_id, receptivite, gout_effort, attitude, top_seance')
      .eq('child_id', childId),
  ])

  return {
    attendances : attendancesResult.data ?? [],
    evaluations : evaluationsResult.data ?? [],
    error       : attendancesResult.error ?? evaluationsResult.error,
  }
}

export async function getAttendanceSource(attendanceId: string) {
  const { data, error } = await supabase
    .from('event_log')
    .select('source, occurred_at, actor_id')
    .eq('entity_id', attendanceId)
    .eq('entity_type', 'attendance')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .single()

  return { data, error }
}
