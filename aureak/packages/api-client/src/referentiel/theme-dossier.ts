// Migration 00056 — Theme Pedagogical Dossier API
// CRUD pour toutes les tables du dossier pédagogique
import { supabase } from '../supabase'
import type {
  ThemeVision, ThemePageTerrain, ThemeMiniExercise,
  ThemeHomeExercise, ThemeVideoEvalTemplate, ThemeVideoEvaluation,
  ThemeBadgeLevel, ThemeResource, ThemeAgeDifferentiation,
} from '@aureak/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function toThemeVision(r: Record<string, unknown>): ThemeVision {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    themeId              : r.theme_id as string,
    pourquoi             : r.pourquoi as string | null,
    quandEnMatch         : r.quand_en_match as string | null,
    ceQueComprend        : r.ce_que_comprend as string | null,
    ideeMaitresse        : r.idee_maitresse as string | null,
    criteresPrioritaires : r.criteres_prioritaires as string | null,
    createdAt            : r.created_at as string,
    updatedAt            : r.updated_at as string,
  }
}

function toThemePageTerrain(r: Record<string, unknown>): ThemePageTerrain {
  return {
    id              : r.id as string,
    tenantId        : r.tenant_id as string,
    themeId         : r.theme_id as string,
    sequencesCourt  : r.sequences_court as string | null,
    metaphorsCourt  : r.metaphors_court as string | null,
    cues            : (r.cues as string[]) ?? [],
    criteriaSummary : r.criteria_summary as string | null,
    createdAt       : r.created_at as string,
    updatedAt       : r.updated_at as string,
  }
}

function toThemeMiniExercise(r: Record<string, unknown>): ThemeMiniExercise {
  return {
    id          : r.id as string,
    tenantId    : r.tenant_id as string,
    themeId     : r.theme_id as string,
    criterionId : r.criterion_id as string | null,
    sequenceId  : r.sequence_id as string | null,
    title       : r.title as string,
    purpose     : r.purpose as string | null,
    situation   : r.situation as string | null,
    cue         : r.cue as string | null,
    videoUrl    : r.video_url as string | null,
    imageUrl    : r.image_url as string | null,
    sortOrder   : (r.sort_order as number) ?? 0,
    createdAt   : r.created_at as string,
    updatedAt   : r.updated_at as string,
  }
}

function toThemeHomeExercise(r: Record<string, unknown>): ThemeHomeExercise {
  return {
    id                      : r.id as string,
    tenantId                : r.tenant_id as string,
    themeId                 : r.theme_id as string,
    title                   : r.title as string,
    objective               : r.objective as string | null,
    material                : r.material as string | null,
    installation            : r.installation as string | null,
    parentChildInstructions : r.parent_child_instructions as string | null,
    distanceMeters          : r.distance_meters as number | null,
    intensity               : r.intensity as string | null,
    repetitions             : r.repetitions as number | null,
    demoVideoUrl            : r.demo_video_url as string | null,
    requiredLevel           : r.required_level as string | null,
    sortOrder               : (r.sort_order as number) ?? 0,
    createdAt               : r.created_at as string,
    updatedAt               : r.updated_at as string,
  }
}

function toThemeVideoEvalTemplate(r: Record<string, unknown>): ThemeVideoEvalTemplate {
  return {
    id           : r.id as string,
    tenantId     : r.tenant_id as string,
    themeId      : r.theme_id as string,
    exerciseId   : r.exercise_id as string | null,
    title        : r.title as string,
    instructions : r.instructions as string | null,
    sortOrder    : (r.sort_order as number) ?? 0,
    createdAt    : r.created_at as string,
    updatedAt    : r.updated_at as string,
  }
}

function toThemeBadgeLevel(r: Record<string, unknown>): ThemeBadgeLevel {
  return {
    id                    : r.id as string,
    tenantId              : r.tenant_id as string,
    themeId               : r.theme_id as string,
    levelNumber           : r.level_number as number,
    stage                 : r.stage as ThemeBadgeLevel['stage'],
    badgeImageUrl         : r.badge_image_url as string | null,
    progressionRule       : r.progression_rule as string | null,
    requiredCriteriaCount : r.required_criteria_count as number | null,
    sortOrder             : (r.sort_order as number) ?? 0,
    createdAt             : r.created_at as string,
  }
}

function toThemeResource(r: Record<string, unknown>): ThemeResource {
  return {
    id           : r.id as string,
    tenantId     : r.tenant_id as string,
    themeId      : r.theme_id as string,
    resourceType : r.resource_type as ThemeResource['resourceType'],
    label        : r.label as string | null,
    url          : r.url as string,
    sortOrder    : (r.sort_order as number) ?? 0,
    createdAt    : r.created_at as string,
  }
}

function toThemeAgeDifferentiation(r: Record<string, unknown>): ThemeAgeDifferentiation {
  return {
    id                  : r.id as string,
    tenantId            : r.tenant_id as string,
    themeId             : r.theme_id as string,
    ageCategory         : r.age_category as string,
    simplificationNotes : r.simplification_notes as string | null,
    vocabularyAdapted   : r.vocabulary_adapted as string | null,
    createdAt           : r.created_at as string,
    updatedAt           : r.updated_at as string,
  }
}

// ── Vision Pédagogique ────────────────────────────────────────────────────────

export async function getThemeVision(themeId: string): Promise<ThemeVision | null> {
  const { data } = await supabase
    .from('theme_vision')
    .select('*')
    .eq('theme_id', themeId)
    .maybeSingle()
  return data ? toThemeVision(data) : null
}

export async function upsertThemeVision(
  themeId: string,
  tenantId: string,
  data: Partial<Omit<ThemeVision, 'id' | 'tenantId' | 'themeId' | 'createdAt' | 'updatedAt'>>
): Promise<ThemeVision> {
  const { data: row, error } = await supabase
    .from('theme_vision')
    .upsert({
      theme_id             : themeId,
      tenant_id            : tenantId,
      pourquoi             : data.pourquoi,
      quand_en_match       : data.quandEnMatch,
      ce_que_comprend      : data.ceQueComprend,
      idee_maitresse       : data.ideeMaitresse,
      criteres_prioritaires: data.criteresPrioritaires,
    }, { onConflict: 'theme_id' })
    .select()
    .single()
  if (error) throw error
  return toThemeVision(row)
}

// ── Page Terrain ──────────────────────────────────────────────────────────────

export async function getThemePageTerrain(themeId: string): Promise<ThemePageTerrain | null> {
  const { data } = await supabase
    .from('theme_page_terrain')
    .select('*')
    .eq('theme_id', themeId)
    .maybeSingle()
  return data ? toThemePageTerrain(data) : null
}

export async function upsertThemePageTerrain(
  themeId: string,
  tenantId: string,
  data: Partial<Omit<ThemePageTerrain, 'id' | 'tenantId' | 'themeId' | 'createdAt' | 'updatedAt'>>
): Promise<ThemePageTerrain> {
  const { data: row, error } = await supabase
    .from('theme_page_terrain')
    .upsert({
      theme_id       : themeId,
      tenant_id      : tenantId,
      sequences_court: data.sequencesCourt,
      metaphors_court: data.metaphorsCourt,
      cues           : data.cues ?? [],
      criteria_summary: data.criteriaSummary,
    }, { onConflict: 'theme_id' })
    .select()
    .single()
  if (error) throw error
  return toThemePageTerrain(row)
}

// ── Sequence ↔ Criteria ───────────────────────────────────────────────────────

export async function setSequenceCriteria(sequenceId: string, criteriaIds: string[]): Promise<void> {
  await supabase.from('sequence_criteria').delete().eq('sequence_id', sequenceId)
  if (criteriaIds.length > 0) {
    const { error } = await supabase.from('sequence_criteria').insert(
      criteriaIds.map(criterion_id => ({ sequence_id: sequenceId, criterion_id }))
    )
    if (error) throw error
  }
}

export async function getSequenceCriteria(sequenceId: string): Promise<string[]> {
  const { data } = await supabase
    .from('sequence_criteria')
    .select('criterion_id')
    .eq('sequence_id', sequenceId)
  return (data ?? []).map((r: { criterion_id: string }) => r.criterion_id)
}

// ── Mini-Exercices ────────────────────────────────────────────────────────────

export async function listThemeMiniExercises(themeId: string): Promise<ThemeMiniExercise[]> {
  const { data } = await supabase
    .from('theme_mini_exercises')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order')
  return (data ?? []).map(toThemeMiniExercise)
}

export async function createThemeMiniExercise(
  themeId: string,
  tenantId: string,
  data: Omit<ThemeMiniExercise, 'id' | 'tenantId' | 'themeId' | 'createdAt' | 'updatedAt'>
): Promise<ThemeMiniExercise> {
  const { data: row, error } = await supabase
    .from('theme_mini_exercises')
    .insert({
      theme_id    : themeId,
      tenant_id   : tenantId,
      criterion_id: data.criterionId,
      sequence_id : data.sequenceId ?? null,
      title       : data.title,
      purpose     : data.purpose,
      situation   : data.situation,
      cue         : data.cue,
      video_url   : data.videoUrl,
      image_url   : data.imageUrl,
      sort_order  : data.sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeMiniExercise(row)
}

export async function updateThemeMiniExercise(id: string, data: Partial<ThemeMiniExercise>): Promise<ThemeMiniExercise> {
  const { data: row, error } = await supabase
    .from('theme_mini_exercises')
    .update({
      criterion_id: data.criterionId,
      sequence_id : data.sequenceId,
      title       : data.title,
      purpose     : data.purpose,
      situation   : data.situation,
      cue         : data.cue,
      video_url   : data.videoUrl,
      image_url   : data.imageUrl,
      sort_order  : data.sortOrder,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toThemeMiniExercise(row)
}

export async function deleteThemeMiniExercise(id: string): Promise<void> {
  const { error } = await supabase.from('theme_mini_exercises').delete().eq('id', id)
  if (error) throw error
}

// ── Home Exercises ────────────────────────────────────────────────────────────

export async function listThemeHomeExercises(themeId: string): Promise<ThemeHomeExercise[]> {
  const { data } = await supabase
    .from('theme_home_exercises')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order')
  if (!data) return []
  const exercises = data.map(toThemeHomeExercise)
  const ids = exercises.map(e => e.id)
  if (ids.length > 0) {
    const { data: links } = await supabase
      .from('home_exercise_criteria')
      .select('exercise_id, criterion_id')
      .in('exercise_id', ids)
    const linkMap: Record<string, string[]> = {}
    for (const l of (links ?? [])) {
      const row = l as { exercise_id: string; criterion_id: string }
      if (!linkMap[row.exercise_id]) linkMap[row.exercise_id] = []
      linkMap[row.exercise_id].push(row.criterion_id)
    }
    return exercises.map(e => ({ ...e, criteriaIds: linkMap[e.id] ?? [] }))
  }
  return exercises
}

export async function createThemeHomeExercise(
  themeId: string,
  tenantId: string,
  data: Omit<ThemeHomeExercise, 'id' | 'tenantId' | 'themeId' | 'createdAt' | 'updatedAt' | 'criteriaIds'>
): Promise<ThemeHomeExercise> {
  const { data: row, error } = await supabase
    .from('theme_home_exercises')
    .insert({
      theme_id                 : themeId,
      tenant_id                : tenantId,
      title                    : data.title,
      objective                : data.objective,
      material                 : data.material,
      installation             : data.installation,
      parent_child_instructions: data.parentChildInstructions,
      distance_meters          : data.distanceMeters,
      intensity                : data.intensity,
      repetitions              : data.repetitions,
      demo_video_url           : data.demoVideoUrl,
      required_level           : data.requiredLevel,
      sort_order               : data.sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeHomeExercise(row)
}

export async function updateThemeHomeExercise(id: string, data: Partial<ThemeHomeExercise>): Promise<ThemeHomeExercise> {
  const update: Record<string, unknown> = {}
  if (data.title !== undefined)                    update.title = data.title
  if (data.objective !== undefined)                update.objective = data.objective
  if (data.material !== undefined)                 update.material = data.material
  if (data.installation !== undefined)             update.installation = data.installation
  if (data.parentChildInstructions !== undefined)  update.parent_child_instructions = data.parentChildInstructions
  if (data.distanceMeters !== undefined)           update.distance_meters = data.distanceMeters
  if (data.intensity !== undefined)                update.intensity = data.intensity
  if (data.repetitions !== undefined)              update.repetitions = data.repetitions
  if (data.demoVideoUrl !== undefined)             update.demo_video_url = data.demoVideoUrl
  if (data.requiredLevel !== undefined)            update.required_level = data.requiredLevel
  if (data.sortOrder !== undefined)                update.sort_order = data.sortOrder
  const { data: row, error } = await supabase
    .from('theme_home_exercises')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toThemeHomeExercise(row)
}

export async function deleteThemeHomeExercise(id: string): Promise<void> {
  const { error } = await supabase.from('theme_home_exercises').delete().eq('id', id)
  if (error) throw error
}

export async function setHomeExerciseCriteria(exerciseId: string, criteriaIds: string[]): Promise<void> {
  await supabase.from('home_exercise_criteria').delete().eq('exercise_id', exerciseId)
  if (criteriaIds.length > 0) {
    const { error } = await supabase.from('home_exercise_criteria').insert(
      criteriaIds.map(criterion_id => ({ exercise_id: exerciseId, criterion_id }))
    )
    if (error) throw error
  }
}

// ── Video Eval Templates ──────────────────────────────────────────────────────

export async function listThemeVideoEvalTemplates(themeId: string): Promise<ThemeVideoEvalTemplate[]> {
  const { data } = await supabase
    .from('theme_video_eval_templates')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order')
  if (!data) return []
  const templates = data.map(toThemeVideoEvalTemplate)
  const ids = templates.map(t => t.id)
  if (ids.length > 0) {
    const { data: links } = await supabase
      .from('video_eval_template_criteria')
      .select('template_id, criterion_id')
      .in('template_id', ids)
    const linkMap: Record<string, string[]> = {}
    for (const l of (links ?? [])) {
      const row = l as { template_id: string; criterion_id: string }
      if (!linkMap[row.template_id]) linkMap[row.template_id] = []
      linkMap[row.template_id].push(row.criterion_id)
    }
    return templates.map(t => ({ ...t, criteriaIds: linkMap[t.id] ?? [] }))
  }
  return templates
}

export async function createThemeVideoEvalTemplate(
  themeId: string,
  tenantId: string,
  data: Omit<ThemeVideoEvalTemplate, 'id' | 'tenantId' | 'themeId' | 'createdAt' | 'updatedAt' | 'criteriaIds'>
): Promise<ThemeVideoEvalTemplate> {
  const { data: row, error } = await supabase
    .from('theme_video_eval_templates')
    .insert({
      theme_id    : themeId,
      tenant_id   : tenantId,
      exercise_id : data.exerciseId,
      title       : data.title,
      instructions: data.instructions,
      sort_order  : data.sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeVideoEvalTemplate(row)
}

export async function updateThemeVideoEvalTemplate(id: string, data: Partial<ThemeVideoEvalTemplate>): Promise<ThemeVideoEvalTemplate> {
  const { data: row, error } = await supabase
    .from('theme_video_eval_templates')
    .update({
      exercise_id : data.exerciseId,
      title       : data.title,
      instructions: data.instructions,
      sort_order  : data.sortOrder,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toThemeVideoEvalTemplate(row)
}

export async function deleteThemeVideoEvalTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('theme_video_eval_templates').delete().eq('id', id)
  if (error) throw error
}

export async function setVideoEvalTemplateCriteria(templateId: string, criteriaIds: string[]): Promise<void> {
  await supabase.from('video_eval_template_criteria').delete().eq('template_id', templateId)
  if (criteriaIds.length > 0) {
    const { error } = await supabase.from('video_eval_template_criteria').insert(
      criteriaIds.map(criterion_id => ({ template_id: templateId, criterion_id }))
    )
    if (error) throw error
  }
}

// ── Badge Levels ──────────────────────────────────────────────────────────────

export async function listThemeBadgeLevels(themeId: string): Promise<ThemeBadgeLevel[]> {
  const { data } = await supabase
    .from('theme_badge_levels')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order')
  return (data ?? []).map(toThemeBadgeLevel)
}

export async function createThemeBadgeLevel(
  themeId: string,
  tenantId: string,
  data: Omit<ThemeBadgeLevel, 'id' | 'tenantId' | 'themeId' | 'createdAt'>
): Promise<ThemeBadgeLevel> {
  const { data: row, error } = await supabase
    .from('theme_badge_levels')
    .insert({
      theme_id               : themeId,
      tenant_id              : tenantId,
      level_number           : data.levelNumber,
      stage                  : data.stage,
      badge_image_url        : data.badgeImageUrl,
      progression_rule       : data.progressionRule,
      required_criteria_count: data.requiredCriteriaCount,
      sort_order             : data.sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeBadgeLevel(row)
}

export async function updateThemeBadgeLevel(id: string, data: Partial<ThemeBadgeLevel>): Promise<ThemeBadgeLevel> {
  const { data: row, error } = await supabase
    .from('theme_badge_levels')
    .update({
      level_number           : data.levelNumber,
      stage                  : data.stage,
      badge_image_url        : data.badgeImageUrl,
      progression_rule       : data.progressionRule,
      required_criteria_count: data.requiredCriteriaCount,
      sort_order             : data.sortOrder,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toThemeBadgeLevel(row)
}

export async function deleteThemeBadgeLevel(id: string): Promise<void> {
  const { error } = await supabase.from('theme_badge_levels').delete().eq('id', id)
  if (error) throw error
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function listThemeResources(themeId: string): Promise<ThemeResource[]> {
  const { data } = await supabase
    .from('theme_resources')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order')
  return (data ?? []).map(toThemeResource)
}

export async function createThemeResource(
  themeId: string,
  tenantId: string,
  data: Omit<ThemeResource, 'id' | 'tenantId' | 'themeId' | 'createdAt'>
): Promise<ThemeResource> {
  const { data: row, error } = await supabase
    .from('theme_resources')
    .insert({
      theme_id     : themeId,
      tenant_id    : tenantId,
      resource_type: data.resourceType,
      label        : data.label,
      url          : data.url,
      sort_order   : data.sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeResource(row)
}

export async function updateThemeResource(id: string, data: Partial<ThemeResource>): Promise<ThemeResource> {
  const { data: row, error } = await supabase
    .from('theme_resources')
    .update({
      resource_type: data.resourceType,
      label        : data.label,
      url          : data.url,
      sort_order   : data.sortOrder,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toThemeResource(row)
}

export async function deleteThemeResource(id: string): Promise<void> {
  const { error } = await supabase.from('theme_resources').delete().eq('id', id)
  if (error) throw error
}

// ── Age Differentiation ───────────────────────────────────────────────────────

export async function listThemeAgeDifferentiation(themeId: string): Promise<ThemeAgeDifferentiation[]> {
  const { data } = await supabase
    .from('theme_age_differentiation')
    .select('*')
    .eq('theme_id', themeId)
  return (data ?? []).map(toThemeAgeDifferentiation)
}

export async function upsertThemeAgeDifferentiation(
  themeId: string,
  tenantId: string,
  ageCategory: string,
  data: Partial<Pick<ThemeAgeDifferentiation, 'simplificationNotes' | 'vocabularyAdapted'>>
): Promise<ThemeAgeDifferentiation> {
  const { data: row, error } = await supabase
    .from('theme_age_differentiation')
    .upsert({
      theme_id            : themeId,
      tenant_id           : tenantId,
      age_category        : ageCategory,
      simplification_notes: data.simplificationNotes,
      vocabulary_adapted  : data.vocabularyAdapted,
    }, { onConflict: 'theme_id,age_category' })
    .select()
    .single()
  if (error) throw error
  return toThemeAgeDifferentiation(row)
}

// ── Criterion & Fault extended CRUD ──────────────────────────────────────────
// Extends the existing criteria.ts functions with new fields

export async function updateCriterionExtended(
  id: string,
  data: {
    label?                : string
    description?          : string
    whyImportant?         : string | null
    minLevel?             : string | null
    logicalOrder?         : number
    goodExecutionVideoUrl?: string | null
    goodExecutionImageUrl?: string | null
    sortOrder?            : number | null
    sequenceId?           : string | null
    metaphorId?           : string | null
  }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.label !== undefined)                 update.label = data.label
  if (data.description !== undefined)           update.description = data.description
  if (data.whyImportant !== undefined)          update.why_important = data.whyImportant
  if (data.minLevel !== undefined)              update.min_level = data.minLevel
  if (data.logicalOrder !== undefined)          update.logical_order = data.logicalOrder
  if (data.goodExecutionVideoUrl !== undefined) update.good_execution_video_url = data.goodExecutionVideoUrl
  if (data.goodExecutionImageUrl !== undefined) update.good_execution_image_url = data.goodExecutionImageUrl
  if (data.sortOrder !== undefined)             update.sort_order = data.sortOrder
  if (data.sequenceId !== undefined)            update.sequence_id = data.sequenceId
  if (data.metaphorId !== undefined)            update.metaphor_id = data.metaphorId
  const { error } = await supabase.from('criteria').update(update).eq('id', id)
  if (error) throw error
}

export async function updateFaultExtended(
  id: string,
  data: {
    label?              : string
    description?        : string
    visibleSign?        : string | null
    probableCause?      : string | null
    correctionWording?  : string | null
    coachingPhrase?     : string | null
    practicalAdjustment?: string | null
    correctiveVideoUrl? : string | null
    correctiveImageUrl? : string | null
    sortOrder?          : number | null
    criterionId?        : string | null
  }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.label !== undefined)               update.label = data.label
  if (data.description !== undefined)         update.description = data.description
  if (data.visibleSign !== undefined)         update.visible_sign = data.visibleSign
  if (data.probableCause !== undefined)       update.probable_cause = data.probableCause
  if (data.correctionWording !== undefined)   update.correction_wording = data.correctionWording
  if (data.coachingPhrase !== undefined)      update.coaching_phrase = data.coachingPhrase
  if (data.practicalAdjustment !== undefined) update.practical_adjustment = data.practicalAdjustment
  if (data.correctiveVideoUrl !== undefined)  update.corrective_video_url = data.correctiveVideoUrl
  if (data.correctiveImageUrl !== undefined)  update.corrective_image_url = data.correctiveImageUrl
  if (data.sortOrder !== undefined)           update.sort_order = data.sortOrder
  if (data.criterionId !== undefined)         update.criterion_id = data.criterionId
  const { error } = await supabase.from('faults').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteCriterionById(id: string): Promise<void> {
  const { error } = await supabase.from('criteria').delete().eq('id', id)
  if (error) throw error
}

export async function deleteFaultById(id: string): Promise<void> {
  const { error } = await supabase.from('faults').delete().eq('id', id)
  if (error) throw error
}

export async function listCriteriaByTheme(themeId: string): Promise<import('@aureak/types').Criterion[]> {
  const { data } = await supabase
    .from('criteria')
    .select('*')
    .eq('theme_id', themeId)
    .order('logical_order', { ascending: true })
  return (data ?? []).map(mapCriterionRow)
}

function mapCriterionRow(r: Record<string, unknown>): import('@aureak/types').Criterion {
  return {
    id                   : r.id as string,
    sequenceId           : r.sequence_id as string | null,
    tenantId             : r.tenant_id as string,
    themeId              : r.theme_id as string,
    metaphorId           : r.metaphor_id as string | null,
    label                : r.label as string,
    description          : r.description as string | null,
    sortOrder            : r.sort_order as number | null,
    createdAt            : r.created_at as string,
    whyImportant         : r.why_important as string | null,
    minLevel             : r.min_level as string | null,
    logicalOrder         : (r.logical_order as number) ?? 0,
    goodExecutionVideoUrl: r.good_execution_video_url as string | null,
    goodExecutionImageUrl: r.good_execution_image_url as string | null,
  }
}

export async function listFaultsByCriterionExtended(criterionId: string): Promise<import('@aureak/types').Fault[]> {
  const { data } = await supabase
    .from('faults')
    .select('*')
    .eq('criterion_id', criterionId)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return (data ?? []).map((r: Record<string, unknown>) => mapFaultRow(r))
}

export async function listFaultsByTheme(themeId: string): Promise<import('@aureak/types').Fault[]> {
  const { data } = await supabase
    .from('faults')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return (data ?? []).map((r: Record<string, unknown>) => mapFaultRow(r))
}

function mapFaultRow(r: Record<string, unknown>): import('@aureak/types').Fault {
  return {
    id                 : r.id as string,
    criterionId        : r.criterion_id as string | null,
    themeId            : r.theme_id as string,
    tenantId           : r.tenant_id as string,
    label              : r.label as string,
    description        : r.description as string | null,
    sortOrder          : r.sort_order as number | null,
    createdAt          : r.created_at as string,
    visibleSign        : r.visible_sign as string | null,
    probableCause      : r.probable_cause as string | null,
    correctionWording  : r.correction_wording as string | null,
    coachingPhrase     : r.coaching_phrase as string | null,
    practicalAdjustment: r.practical_adjustment as string | null,
    correctiveVideoUrl : r.corrective_video_url as string | null,
    correctiveImageUrl : r.corrective_image_url as string | null,
  }
}

/** Charge toutes les fautes pour plusieurs critères en une seule requête */
export async function listFaultsByCriteriaIds(
  criteriaIds: string[],
): Promise<import('@aureak/types').Fault[]> {
  if (criteriaIds.length === 0) return []
  const { data } = await supabase
    .from('faults')
    .select('*')
    .in('criterion_id', criteriaIds)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return (data ?? []).map((r: Record<string, unknown>) => mapFaultRow(r))
}

/** Charge les liens séquence↔critère pour plusieurs séquences en une seule requête */
export async function listCriteriaLinksBySequenceIds(
  sequenceIds: string[],
): Promise<{ sequenceId: string; criterionId: string }[]> {
  if (sequenceIds.length === 0) return []
  const { data } = await supabase
    .from('sequence_criteria')
    .select('sequence_id, criterion_id')
    .in('sequence_id', sequenceIds)
  return (data ?? []).map((r: { sequence_id: string; criterion_id: string }) => ({
    sequenceId : r.sequence_id,
    criterionId: r.criterion_id,
  }))
}
