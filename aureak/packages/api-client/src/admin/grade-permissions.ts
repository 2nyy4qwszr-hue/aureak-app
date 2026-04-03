// Story 11.2 — Permissions de contenu par grade
// Gestion du champ required_grade_level sur themes et situations (migration 00091)

import { supabase } from '../supabase'

export type CoachGradeLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export type GradeContentItem = {
  id                 : string
  title              : string
  requiredGradeLevel : CoachGradeLevel
  resourceType       : 'theme' | 'situation'
  isActive           : boolean
}

export async function listThemesWithGrades(): Promise<{ data: GradeContentItem[]; error: unknown }> {
  const { data, error } = await supabase
    .from('themes')
    .select('id, title, required_grade_level, is_active')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (error || !data) return { data: [], error }
  return {
    data: (data as Record<string, unknown>[]).map(r => ({
      id                : r.id                as string,
      title             : r.title             as string,
      requiredGradeLevel: ((r.required_grade_level as string | null) ?? 'bronze') as CoachGradeLevel,
      resourceType      : 'theme' as const,
      isActive          : r.is_active         as boolean,
    })),
    error: null,
  }
}

export async function listSituationsWithGrades(): Promise<{ data: GradeContentItem[]; error: unknown }> {
  const { data, error } = await supabase
    .from('situations')
    .select('id, title, required_grade_level, is_active')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (error || !data) return { data: [], error }
  return {
    data: (data as Record<string, unknown>[]).map(r => ({
      id                : r.id                as string,
      title             : r.title             as string,
      requiredGradeLevel: ((r.required_grade_level as string | null) ?? 'bronze') as CoachGradeLevel,
      resourceType      : 'situation' as const,
      isActive          : r.is_active         as boolean,
    })),
    error: null,
  }
}

export async function updateThemeGradeLevel(
  themeId   : string,
  gradeLevel: CoachGradeLevel,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('themes')
    .update({ required_grade_level: gradeLevel })
    .eq('id', themeId)
  return { error }
}

