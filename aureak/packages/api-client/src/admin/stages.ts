// @aureak/api-client — Module Stages (migrations 00041 + 00048)
// Stages = camps d'entraînement multi-jours (distinct des sessions hebdomadaires)

import { supabase } from '../supabase'
import type {
  Stage, StageWithMeta, StageDay, StageBlock, StageBlockParticipant,
  StageStatus, StageType, StageSessionType, GroupMethod, EventType,
} from '@aureak/types'

// ============================================================
// Params
// ============================================================

export type CreateStageParams = {
  name            : string
  startDate       : string
  endDate         : string
  location?       : string | null
  type?           : StageType | null
  implantationId? : string | null
  status?         : StageStatus
  maxParticipants?: number | null
  notes?          : string | null
  seasonLabel?    : string | null
}

export type UpdateStageParams = Partial<CreateStageParams>

export type CreateStageDayParams = {
  stageId   : string
  date      : string
  notes?    : string | null
  sortOrder?: number
}

export type CreateStageBlockParams = {
  stageDayId         : string
  startHour          : number
  startMinute?       : number
  durationMinutes?   : number
  method?            : GroupMethod | null
  sessionType?       : StageSessionType
  terrain?           : string | null
  theme?             : string | null
  coachPrincipalId?  : string | null
  coachAssistantId?  : string | null
  coachReplacementId?: string | null
  notes?             : string | null
  sortOrder?         : number
}

export type UpdateStageBlockParams = Partial<Omit<CreateStageBlockParams, 'stageDayId'>>

// ============================================================
// Helpers
// ============================================================

function mapStage(row: Record<string, unknown>): Stage {
  return {
    id              : row.id              as string,
    tenantId        : row.tenant_id       as string,
    name            : row.name            as string,
    seasonLabel     : row.season_label    as string | null,
    startDate       : row.start_date      as string,
    endDate         : row.end_date        as string,
    location        : row.location        as string | null,
    type            : row.type            as StageType | null,
    implantationId  : row.implantation_id as string | null,
    status          : (row.status ?? 'planifié') as StageStatus,
    maxParticipants : row.max_participants as number | null,
    notes           : row.notes           as string | null,
    createdAt       : row.created_at      as string,
    eventType       : (row.event_type ?? 'stage') as EventType,
  }
}

function mapDay(row: Record<string, unknown>): StageDay {
  return {
    id        : row.id         as string,
    tenantId  : row.tenant_id  as string,
    stageId   : row.stage_id   as string,
    date      : row.date       as string,
    notes     : row.notes      as string | null,
    sortOrder : (row.sort_order ?? 0) as number,
    createdAt : row.created_at as string,
  }
}

function mapBlock(row: Record<string, unknown>): StageBlock {
  return {
    id                 : row.id                   as string,
    tenantId           : row.tenant_id             as string,
    stageDayId         : row.stage_day_id          as string,
    startHour          : row.start_hour            as number,
    startMinute        : (row.start_minute ?? 0)   as number,
    durationMinutes    : (row.duration_minutes ?? 60) as number,
    method             : row.method                as GroupMethod | null,
    sessionType        : (row.session_type ?? 'entrainement') as StageSessionType,
    terrain            : row.terrain               as string | null,
    theme              : row.theme                 as string | null,
    coachPrincipalId   : row.coach_principal_id    as string | null,
    coachAssistantId   : row.coach_assistant_id    as string | null,
    coachReplacementId : row.coach_replacement_id  as string | null,
    notes              : row.notes                 as string | null,
    sortOrder          : (row.sort_order ?? 0)     as number,
    createdAt          : row.created_at            as string,
  }
}

// ============================================================
// tenant resolution (Story 107-1 — fix RLS INSERT)
// Mirroir du pattern utilisé dans prospection.ts / sponsors.ts
// ============================================================

async function resolveTenantId(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) throw new Error('Non authentifié')

  const jwtTenant = (user.app_metadata?.tenant_id as string | undefined)
    ?? (user.user_metadata?.tenant_id as string | undefined)
  if (jwtTenant) return jwtTenant

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile?.tenant_id) {
    throw new Error('tenant_id introuvable (ni JWT, ni profiles)')
  }
  return profile.tenant_id as string
}

// ============================================================
// Stages CRUD
// ============================================================

export async function listStages(opts: {
  status?: StageStatus | 'all'
  season?: string
} = {}): Promise<StageWithMeta[]> {
  let q = supabase
    .from('stages')
    .select(`
      *,
      implantations ( name ),
      stage_days ( id ),
      child_stage_participations ( id )
    `)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  if (opts.status && opts.status !== 'all') {
    q = q.eq('status', opts.status)
  }
  if (opts.season) {
    q = q.eq('season_label', opts.season)
  }

  const { data, error } = await q
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const impl = row.implantations as { name: string } | null
    const days = (row.stage_days as unknown[]) ?? []
    const participants = (row.child_stage_participations as unknown[]) ?? []
    return {
      ...mapStage(row),
      implantationName : impl?.name ?? null,
      dayCount         : days.length,
      participantCount : participants.length,
    }
  })
}

/**
 * listEvents — vue unifiée de tous les évènements avec filtre optionnel sur event_type (Story 63.2)
 * Utilise la table `stages` avec filtre sur `event_type`.
 * Compatible avec le RLS tenant_id existant.
 */
export async function listEvents(filter?: { type?: EventType }): Promise<StageWithMeta[]> {
  let q = supabase
    .from('stages')
    .select(`
      *,
      implantations ( name ),
      stage_days ( id ),
      child_stage_participations ( id )
    `)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  if (filter?.type) {
    q = q.eq('event_type', filter.type)
  }

  const { data, error } = await q
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const impl = row.implantations as { name: string } | null
    const days = (row.stage_days as unknown[]) ?? []
    const participants = (row.child_stage_participations as unknown[]) ?? []
    return {
      ...mapStage(row),
      implantationName : impl?.name ?? null,
      dayCount         : days.length,
      participantCount : participants.length,
    }
  })
}

export async function getStage(id: string): Promise<StageWithMeta | null> {
  const { data, error } = await supabase
    .from('stages')
    .select(`
      *,
      implantations ( name ),
      stage_days ( id ),
      child_stage_participations ( id )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null

  const impl = (data as Record<string, unknown>).implantations as { name: string } | null
  const days = ((data as Record<string, unknown>).stage_days as unknown[]) ?? []
  const participants = ((data as Record<string, unknown>).child_stage_participations as unknown[]) ?? []

  return {
    ...mapStage(data as Record<string, unknown>),
    implantationName : impl?.name ?? null,
    dayCount         : days.length,
    participantCount : participants.length,
  }
}

export async function createStage(params: CreateStageParams): Promise<Stage> {
  const tenantId = await resolveTenantId()

  const { data, error } = await supabase
    .from('stages')
    .insert({
      tenant_id       : tenantId,
      name            : params.name,
      start_date      : params.startDate,
      end_date        : params.endDate,
      location        : params.location        ?? null,
      type            : params.type            ?? null,
      implantation_id : params.implantationId  ?? null,
      status          : params.status          ?? 'planifié',
      max_participants: params.maxParticipants ?? null,
      notes           : params.notes           ?? null,
      season_label    : params.seasonLabel     ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapStage(data as Record<string, unknown>)
}

export async function updateStage(id: string, params: UpdateStageParams): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (params.name            !== undefined) patch.name             = params.name
  if (params.startDate       !== undefined) patch.start_date       = params.startDate
  if (params.endDate         !== undefined) patch.end_date         = params.endDate
  if (params.location        !== undefined) patch.location         = params.location
  if (params.type            !== undefined) patch.type             = params.type
  if (params.implantationId  !== undefined) patch.implantation_id  = params.implantationId
  if (params.status          !== undefined) patch.status           = params.status
  if (params.maxParticipants !== undefined) patch.max_participants = params.maxParticipants
  if (params.notes           !== undefined) patch.notes            = params.notes
  if (params.seasonLabel     !== undefined) patch.season_label     = params.seasonLabel

  const { error } = await supabase.from('stages').update(patch).eq('id', id)
  if (error) throw error
}

export async function softDeleteStage(id: string): Promise<void> {
  const { error } = await supabase
    .from('stages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// Stage Days CRUD
// ============================================================

export async function listStageDays(stageId: string): Promise<StageDay[]> {
  const { data, error } = await supabase
    .from('stage_days')
    .select('*')
    .eq('stage_id', stageId)
    .order('date', { ascending: true })

  if (error) throw error
  return (data ?? []).map(row => mapDay(row as Record<string, unknown>))
}

export async function createStageDay(params: CreateStageDayParams): Promise<StageDay> {
  const { data, error } = await supabase
    .from('stage_days')
    .insert({
      stage_id  : params.stageId,
      date      : params.date,
      notes     : params.notes      ?? null,
      sort_order: params.sortOrder  ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return mapDay(data as Record<string, unknown>)
}

export async function updateStageDay(id: string, patch: { notes?: string | null; sortOrder?: number }): Promise<void> {
  const p: Record<string, unknown> = {}
  if (patch.notes     !== undefined) p.notes      = patch.notes
  if (patch.sortOrder !== undefined) p.sort_order = patch.sortOrder

  const { error } = await supabase.from('stage_days').update(p).eq('id', id)
  if (error) throw error
}

export async function deleteStageDay(id: string): Promise<void> {
  const { error } = await supabase.from('stage_days').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// Stage Blocks CRUD
// ============================================================

export async function listStageBlocks(stageDayId: string): Promise<StageBlock[]> {
  const { data, error } = await supabase
    .from('stage_blocks')
    .select('*')
    .eq('stage_day_id', stageDayId)
    .order('start_hour', { ascending: true })
    .order('start_minute', { ascending: true })

  if (error) throw error
  return (data ?? []).map(row => mapBlock(row as Record<string, unknown>))
}

export async function createStageBlock(params: CreateStageBlockParams): Promise<StageBlock> {
  const { data, error } = await supabase
    .from('stage_blocks')
    .insert({
      stage_day_id        : params.stageDayId,
      start_hour          : params.startHour,
      start_minute        : params.startMinute        ?? 0,
      duration_minutes    : params.durationMinutes    ?? 60,
      method              : params.method             ?? null,
      session_type        : params.sessionType        ?? 'entrainement',
      terrain             : params.terrain            ?? null,
      theme               : params.theme              ?? null,
      coach_principal_id  : params.coachPrincipalId   ?? null,
      coach_assistant_id  : params.coachAssistantId   ?? null,
      coach_replacement_id: params.coachReplacementId ?? null,
      notes               : params.notes              ?? null,
      sort_order          : params.sortOrder          ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return mapBlock(data as Record<string, unknown>)
}

export async function updateStageBlock(id: string, params: UpdateStageBlockParams): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (params.startHour          !== undefined) patch.start_hour           = params.startHour
  if (params.startMinute        !== undefined) patch.start_minute         = params.startMinute
  if (params.durationMinutes    !== undefined) patch.duration_minutes     = params.durationMinutes
  if (params.method             !== undefined) patch.method               = params.method
  if (params.sessionType        !== undefined) patch.session_type         = params.sessionType
  if (params.terrain            !== undefined) patch.terrain              = params.terrain
  if (params.theme              !== undefined) patch.theme                = params.theme
  if (params.coachPrincipalId   !== undefined) patch.coach_principal_id   = params.coachPrincipalId
  if (params.coachAssistantId   !== undefined) patch.coach_assistant_id   = params.coachAssistantId
  if (params.coachReplacementId !== undefined) patch.coach_replacement_id = params.coachReplacementId
  if (params.notes              !== undefined) patch.notes                = params.notes
  if (params.sortOrder          !== undefined) patch.sort_order           = params.sortOrder

  const { error } = await supabase.from('stage_blocks').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteStageBlock(id: string): Promise<void> {
  const { error } = await supabase.from('stage_blocks').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// Stage Block Participants
// ============================================================

export async function listStageBlockParticipants(stageBlockId: string): Promise<StageBlockParticipant[]> {
  const { data, error } = await supabase
    .from('stage_block_participants')
    .select('*')
    .eq('stage_block_id', stageBlockId)

  if (error) throw error
  return (data ?? []).map(row => ({
    id          : (row as Record<string, unknown>).id           as string,
    tenantId    : (row as Record<string, unknown>).tenant_id    as string,
    stageBlockId: (row as Record<string, unknown>).stage_block_id as string,
    childId     : (row as Record<string, unknown>).child_id     as string,
    createdAt   : (row as Record<string, unknown>).created_at   as string,
  }))
}

export async function addStageBlockParticipant(stageBlockId: string, childId: string): Promise<void> {
  const { error } = await supabase
    .from('stage_block_participants')
    .insert({ stage_block_id: stageBlockId, child_id: childId })
  if (error) throw error
}

export async function removeStageBlockParticipant(stageBlockId: string, childId: string): Promise<void> {
  const { error } = await supabase
    .from('stage_block_participants')
    .delete()
    .eq('stage_block_id', stageBlockId)
    .eq('child_id', childId)
  if (error) throw error
}

// ============================================================
// Story 105.1 — Stage children (génération cartes Panini)
// ============================================================

export type StageChild = {
  id           : string
  stageId      : string
  prenom       : string
  nom          : string
  ageCategory  : string | null
}

/**
 * Liste les enfants inscrits à un stage (via child_stage_participations → child_directory).
 * Utilisé par la feature "cartes Panini" (story 105-1).
 */
export async function listStageChildren(stageId: string): Promise<StageChild[]> {
  const { data, error } = await supabase
    .from('child_stage_participations')
    .select('id, stage_id, child_directory ( id, prenom, nom, age_category )')
    .eq('stage_id', stageId)

  if (error) throw error

  return (data ?? [])
    .map((row: Record<string, unknown>) => {
      const child = row.child_directory as Record<string, unknown> | null
      if (!child) return null
      return {
        id          : child.id           as string,
        stageId     : row.stage_id       as string,
        prenom      : (child.prenom as string | null) ?? '',
        nom         : (child.nom    as string | null) ?? '',
        ageCategory : (child.age_category as string | null) ?? null,
      }
    })
    .filter((c): c is StageChild => c !== null && (c.prenom !== '' || c.nom !== ''))
}
