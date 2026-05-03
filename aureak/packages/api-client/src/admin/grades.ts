// Story 11.1 — API grades coach
import { supabase } from '../supabase'

export type CoachGradeLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export type CoachGrade = {
  id         : string
  coach_id   : string
  grade_level: CoachGradeLevel
  awarded_by : string
  awarded_at : string
  notes      : string | null
  created_at : string
}

export async function awardCoachGrade(
  coachId   : string,
  grade     : CoachGradeLevel,
  notes?    : string,
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('award_coach_grade', {
    p_coach_id: coachId,
    p_grade   : grade,
    p_notes   : notes ?? null,
  })
  return { data: data as string | null, error }
}

export async function listCoachGradeHistory(
  coachId: string,
): Promise<{ data: CoachGrade[]; error: unknown }> {
  const { data, error } = await supabase
    .from('coach_grades')
    .select('*')
    .eq('coach_id', coachId)
    .order('awarded_at', { ascending: false })
  return { data: (data as CoachGrade[]) ?? [], error }
}

export async function getCoachCurrentGrade(
  coachId: string,
): Promise<{ data: CoachGrade | null; error: unknown }> {
  // maybeSingle() : retourne null si pas de row au lieu de 406 Not Acceptable
  const { data, error } = await supabase
    .from('coach_current_grade')
    .select('*')
    .eq('coach_id', coachId)
    .maybeSingle()
  return { data: data as CoachGrade | null, error }
}
