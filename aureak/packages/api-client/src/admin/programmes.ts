// @aureak/api-client — Programmes pédagogiques (Story 34.1)
// Migration 00100

import { supabase } from '../supabase'
import type {
  Programme, ProgrammeTraining, MethodModuleConfig, MethodologySession,
} from '@aureak/types'
import type { MethodologyMethod, ProgrammeType, TrainingType } from '@aureak/types'

// ── Row mappers ───────────────────────────────────────────────────────────────

function str(v: unknown): string | null { return (v as string | null) ?? null }

function mapProgramme(row: Record<string, unknown>): Programme {
  return {
    id            : row.id             as string,
    tenantId      : row.tenant_id      as string,
    name          : row.name           as string,
    programmeType : row.programme_type as ProgrammeType,
    seasonId      : str(row.season_id),
    seasonLabel   : str(row.season_label),
    theme         : str(row.theme),
    description   : str(row.description),
    isActive      : row.is_active      as boolean,
    trainingCount : (row.training_count as number | null) ?? 0,
    deletedAt     : str(row.deleted_at),
    createdAt     : row.created_at     as string,
    updatedAt     : str(row.updated_at),
  }
}

function mapModuleConfig(row: Record<string, unknown>): MethodModuleConfig {
  return {
    id           : row.id            as string,
    method       : row.method        as MethodologyMethod,
    moduleNumber : row.module_number as number,
    rangeStart   : row.range_start   as number,
    rangeEnd     : row.range_end     as number,
  }
}

// ── Programmes ────────────────────────────────────────────────────────────────

export type CreateProgrammeParams = {
  tenantId      : string
  name          : string
  programmeType : ProgrammeType
  seasonId?     : string | null
  theme?        : string | null
  description?  : string | null
}

export type UpdateProgrammeParams = Partial<Omit<CreateProgrammeParams, 'tenantId'>> & {
  isActive?: boolean
}

export async function listProgrammes(opts?: { activeOnly?: boolean }): Promise<Programme[]> {
  let q = supabase
    .from('programmes')
    .select('*, academy_seasons(label)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (opts?.activeOnly) q = q.eq('is_active', true)

  const { data, error } = await q
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] listProgrammes:', error)
    throw error
  }

  return (data ?? []).map((row) => {
    const season = row.academy_seasons as { label: string } | null
    return mapProgramme({ ...row, season_label: season?.label ?? null, training_count: 0 })
  })
}

export async function getProgramme(id: string): Promise<Programme | null> {
  const { data, error } = await supabase
    .from('programmes')
    .select('*, academy_seasons(label)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] getProgramme:', error)
    return null
  }

  const trainingCount = await getProgrammeTrainingCount(id)
  const season = (data as Record<string, unknown>).academy_seasons as { label: string } | null
  return mapProgramme({ ...data as Record<string, unknown>, season_label: season?.label ?? null, training_count: trainingCount })
}

async function getProgrammeTrainingCount(programmeId: string): Promise<number> {
  const { count } = await supabase
    .from('programme_trainings')
    .select('*', { count: 'exact', head: true })
    .eq('programme_id', programmeId)
  return count ?? 0
}

export async function createProgramme(params: CreateProgrammeParams): Promise<Programme> {
  const { data, error } = await supabase
    .from('programmes')
    .insert({
      tenant_id     : params.tenantId,
      name          : params.name,
      programme_type: params.programmeType,
      season_id     : params.seasonId    ?? null,
      theme         : params.theme       ?? null,
      description   : params.description ?? null,
    })
    .select('*, academy_seasons(label)')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] createProgramme:', error)
    throw error
  }

  const season = (data as Record<string, unknown>).academy_seasons as { label: string } | null
  return mapProgramme({ ...data as Record<string, unknown>, season_label: season?.label ?? null, training_count: 0 })
}

export async function updateProgramme(id: string, patch: UpdateProgrammeParams): Promise<Programme> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name          !== undefined) update.name           = patch.name
  if (patch.programmeType !== undefined) update.programme_type = patch.programmeType
  if (patch.seasonId      !== undefined) update.season_id      = patch.seasonId
  if (patch.theme         !== undefined) update.theme          = patch.theme
  if (patch.description   !== undefined) update.description    = patch.description
  if (patch.isActive      !== undefined) update.is_active      = patch.isActive

  const { data, error } = await supabase
    .from('programmes')
    .update(update)
    .eq('id', id)
    .select('*, academy_seasons(label)')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] updateProgramme:', error)
    throw error
  }

  const trainingCount = await getProgrammeTrainingCount(id)
  const season = (data as Record<string, unknown>).academy_seasons as { label: string } | null
  return mapProgramme({ ...data as Record<string, unknown>, season_label: season?.label ?? null, training_count: trainingCount })
}

export async function softDeleteProgramme(id: string): Promise<void> {
  const { error } = await supabase
    .from('programmes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] softDeleteProgramme:', error)
    throw error
  }
}

export async function duplicateProgramme(programmeId: string, newSeasonId: string, newName: string): Promise<Programme> {
  // 1. Charger le programme source
  const source = await getProgramme(programmeId)
  if (!source) throw new Error(`Programme ${programmeId} introuvable`)

  // 2. Créer le nouveau programme
  const newProgramme = await createProgramme({
    tenantId      : source.tenantId,
    name          : newName,
    programmeType : source.programmeType,
    seasonId      : newSeasonId,
    theme         : source.theme,
    description   : source.description,
  })

  // 3. Copier les liens entraînements
  const { data: links, error: linksError } = await supabase
    .from('programme_trainings')
    .select('training_id')
    .eq('programme_id', programmeId)

  if (linksError) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] duplicateProgramme links:', linksError)
    throw linksError
  }

  if (links && links.length > 0) {
    const { error: insertError } = await supabase
      .from('programme_trainings')
      .insert(links.map((l) => ({ programme_id: newProgramme.id, training_id: l.training_id })))
    if (insertError) {
      if (process.env.NODE_ENV !== 'production') console.error('[programmes] duplicateProgramme insert:', insertError)
      throw insertError
    }
  }

  return newProgramme
}

// ── Entraînements liés à un programme ─────────────────────────────────────────

export type CreateTrainingParams = {
  tenantId       : string
  title          : string
  method         : MethodologyMethod
  programmeId    : string
  trainingType?  : TrainingType | null
  moduleNumber?  : number | null
  blocName?      : string | null
  trainingNumber?: number | null
  description?   : string | null
}

export async function createTraining(params: CreateTrainingParams): Promise<MethodologySession> {
  // 1. Créer la methodology_session
  const { data, error } = await supabase
    .from('methodology_sessions')
    .insert({
      tenant_id      : params.tenantId,
      title          : params.title,
      method         : params.method,
      training_type  : params.trainingType   ?? null,
      module_number  : params.moduleNumber   ?? null,
      bloc_name      : params.blocName       ?? null,
      training_number: params.trainingNumber ?? null,
      description    : params.description    ?? null,
      is_active      : true,
    })
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] createTraining:', error)
    throw error
  }

  // 2. Lier au programme
  const { error: linkError } = await supabase
    .from('programme_trainings')
    .insert({ programme_id: params.programmeId, training_id: data.id })

  if (linkError) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] linkTraining:', linkError)
    throw linkError
  }

  const row = data as Record<string, unknown>
  return {
    id             : row.id         as string,
    tenantId       : row.tenant_id  as string,
    title          : row.title      as string,
    method         : str(row.method) as MethodologyMethod | null,
    contextType    : null,
    moduleName     : str(row.module_name),
    trainingRef    : str(row.training_ref),
    description    : str(row.description),
    pdfUrl         : null,
    plateauUrl     : null,
    videoUrl       : null,
    audioUrl       : null,
    objective      : null,
    level          : null,
    notes          : null,
    moduleNumber   : row.module_number   != null ? (row.module_number   as number) : null,
    blocName       : str(row.bloc_name),
    trainingNumber : row.training_number != null ? (row.training_number as number) : null,
    trainingType   : str(row.training_type) as TrainingType | null,
    isActive       : row.is_active as boolean,
    deletedAt      : null,
    createdAt      : row.created_at as string,
    updatedAt      : row.updated_at as string,
  }
}

export async function linkTrainingToProgramme(trainingId: string, programmeId: string): Promise<void> {
  const { error } = await supabase
    .from('programme_trainings')
    .upsert({ programme_id: programmeId, training_id: trainingId }, { onConflict: 'programme_id,training_id' })
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] linkTrainingToProgramme:', error)
    throw error
  }
}

export async function unlinkTrainingFromProgramme(trainingId: string, programmeId: string): Promise<void> {
  const { error } = await supabase
    .from('programme_trainings')
    .delete()
    .eq('programme_id', programmeId)
    .eq('training_id', trainingId)
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] unlinkTrainingFromProgramme:', error)
    throw error
  }
}

export async function listTrainingsByProgramme(
  programmeId: string,
  filters?: { method?: MethodologyMethod; moduleNumber?: number; blocName?: string },
): Promise<MethodologySession[]> {
  const { data, error } = await supabase
    .from('programme_trainings')
    .select('training_id, methodology_sessions!inner(*)')
    .eq('programme_id', programmeId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] listTrainingsByProgramme:', error)
    throw error
  }

  const rows = (data ?? []).map((row) => {
    const s = (row as Record<string, unknown>).methodology_sessions as Record<string, unknown>
    return {
      id             : s.id         as string,
      tenantId       : s.tenant_id  as string,
      title          : s.title      as string,
      method         : str(s.method)       as MethodologyMethod | null,
      contextType    : str(s.context_type) as import('@aureak/types').MethodologyContextType | null,
      moduleName     : str(s.module_name),
      trainingRef    : str(s.training_ref),
      description    : str(s.description),
      pdfUrl         : str(s.pdf_url),
      plateauUrl     : str(s.plateau_url),
      videoUrl       : str(s.video_url),
      audioUrl       : str(s.audio_url),
      objective      : str(s.objective),
      level          : str(s.level) as import('@aureak/types').MethodologyLevel | null,
      notes          : str(s.notes),
      moduleNumber   : s.module_number   != null ? (s.module_number   as number) : null,
      blocName       : str(s.bloc_name),
      trainingNumber : s.training_number != null ? (s.training_number as number) : null,
      trainingType   : str(s.training_type) as TrainingType | null,
      isActive       : s.is_active as boolean,
      deletedAt      : str(s.deleted_at),
      createdAt      : s.created_at as string,
      updatedAt      : s.updated_at as string,
    }
  })

  // Apply optional client-side filters
  if (!filters) return rows
  return rows.filter((t) => {
    if (filters.method       && t.method       !== filters.method)       return false
    if (filters.moduleNumber && t.moduleNumber  !== filters.moduleNumber) return false
    if (filters.blocName     && t.blocName      !== filters.blocName)     return false
    return true
  })
}

export async function getUsedTrainingNumbers(
  programmeId: string,
  method: MethodologyMethod,
  moduleOrBloc: number | string,
): Promise<number[]> {
  const isNumeric = typeof moduleOrBloc === 'number'

  // Load all trainings for this programme then filter client-side to avoid complex join filters
  const trainings = await listTrainingsByProgramme(programmeId)

  return trainings
    .filter((t) => {
      if (t.method !== method) return false
      if (isNumeric) return t.moduleNumber === moduleOrBloc
      return t.blocName === moduleOrBloc
    })
    .map((t) => t.trainingNumber)
    .filter((n): n is number => n != null)
}

// ── Config modules ────────────────────────────────────────────────────────────

export async function listModuleConfigs(): Promise<MethodModuleConfig[]> {
  const { data, error } = await supabase
    .from('method_module_config')
    .select('*')
    .order('method')
    .order('module_number')

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[programmes] listModuleConfigs:', error)
    throw error
  }
  return (data ?? []).map((r) => mapModuleConfig(r as Record<string, unknown>))
}

export async function getModuleConfig(method: string, moduleNumber: number): Promise<MethodModuleConfig | null> {
  const { data, error } = await supabase
    .from('method_module_config')
    .select('*')
    .eq('method', method)
    .eq('module_number', moduleNumber)
    .single()

  if (error) return null
  return mapModuleConfig(data as Record<string, unknown>)
}
