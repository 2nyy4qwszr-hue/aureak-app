// API Client — Système de statut académie (migration 00041)
// Toutes les fonctions opèrent sur child_directory (pas profiles/auth.users)

import { supabase } from '../supabase'
import type {
  AcademySeason,
  ChildAcademyMembership,
  Stage,
  ChildStageParticipation,
  ChildAcademyStatusData,
} from '@aureak/types'

// ── Mappers snake_case → camelCase ────────────────────────────────────────────

function mapSeason(r: Record<string, unknown>): AcademySeason {
  return {
    id       : r.id        as string,
    tenantId : r.tenant_id as string,
    label    : r.label     as string,
    startDate: r.start_date as string,
    endDate  : r.end_date   as string,
    isCurrent: r.is_current as boolean,
    createdAt: r.created_at as string,
  }
}

function mapMembership(r: Record<string, unknown>): ChildAcademyMembership {
  const raw = r as {
    id: string; tenant_id: string; child_id: string; season_id: string
    joined_at: string; left_at: string | null; notes: string | null
    created_at: string; academy_seasons?: Record<string, unknown>
  }
  return {
    id       : raw.id,
    tenantId : raw.tenant_id,
    childId  : raw.child_id,
    seasonId : raw.season_id,
    season   : raw.academy_seasons ? mapSeason(raw.academy_seasons) : undefined,
    joinedAt : raw.joined_at,
    leftAt   : raw.left_at,
    notes    : raw.notes,
    createdAt: raw.created_at,
  }
}

function mapStage(r: Record<string, unknown>): Stage {
  return {
    id             : r.id              as string,
    tenantId       : r.tenant_id       as string,
    name           : r.name            as string,
    seasonLabel    : (r.season_label   as string | null) ?? null,
    startDate      : r.start_date      as string,
    endDate        : r.end_date        as string,
    location       : (r.location       as string | null) ?? null,
    type           : (r.type           as import('@aureak/types').StageType | null) ?? null,
    implantationId : (r.implantation_id as string | null) ?? null,
    status         : ((r.status as string | null) ?? 'planifié') as import('@aureak/types').StageStatus,
    maxParticipants: (r.max_participants as number | null) ?? null,
    notes          : (r.notes          as string | null) ?? null,
    createdAt      : r.created_at      as string,
    eventType      : (r.event_type     as import('@aureak/types').EventType | null) ?? 'stage',
  }
}

function mapParticipation(r: Record<string, unknown>): ChildStageParticipation {
  const raw = r as {
    id: string; tenant_id: string; child_id: string; stage_id: string
    participation_status: string; registered_at: string; created_at: string
    stages?: Record<string, unknown>
  }
  return {
    id                 : raw.id,
    tenantId           : raw.tenant_id,
    childId            : raw.child_id,
    stageId            : raw.stage_id,
    stage              : raw.stages ? mapStage(raw.stages) : undefined,
    participationStatus: raw.participation_status,
    registeredAt       : raw.registered_at,
    createdAt          : raw.created_at,
  }
}

function mapStatusView(r: Record<string, unknown>): ChildAcademyStatusData {
  return {
    childId            : r.child_id               as string,
    tenantId           : r.tenant_id              as string,
    displayName        : r.display_name           as string,
    computedStatus     : r.computed_status        as ChildAcademyStatusData['computedStatus'],
    totalAcademySeasons: (r.total_academy_seasons as number)  ?? 0,
    inCurrentSeason    : (r.in_current_season     as boolean) ?? false,
    firstSeasonLabel   : (r.first_season_label    as string | null) ?? null,
    lastSeasonLabel    : (r.last_season_label     as string | null) ?? null,
    currentSeasonLabel : (r.current_season_label  as string | null) ?? null,
    totalStages        : (r.total_stages          as number)  ?? 0,
    firstStageName     : (r.first_stage_name      as string | null) ?? null,
    lastStageName      : (r.last_stage_name       as string | null) ?? null,
    firstStageDate     : (r.first_stage_date      as string | null) ?? null,
    lastStageDate      : (r.last_stage_date       as string | null) ?? null,
  }
}

// ── v_child_academy_status ────────────────────────────────────────────────────

/** Statut calculé + agrégats pour un enfant depuis la vue SQL */
export async function getChildAcademyStatus(
  childId: string
): Promise<{ data: ChildAcademyStatusData | null; error: unknown }> {
  // maybeSingle() : retourne null si pas de row (vs 406 single() / 400 sur uuid invalide géré par RLS)
  const { data, error } = await supabase
    .from('v_child_academy_status')
    .select('*')
    .eq('child_id', childId)
    .maybeSingle()

  if (error || !data) return { data: null, error }
  return { data: mapStatusView(data as Record<string, unknown>), error: null }
}

// ── academy_seasons ───────────────────────────────────────────────────────────

export async function listAcademySeasons(): Promise<{ data: AcademySeason[]; error: unknown }> {
  const { data, error } = await supabase
    .from('academy_seasons')
    .select('*')
    .order('start_date', { ascending: false })

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapSeason), error: null }
}

export async function createAcademySeason(params: {
  tenantId  : string
  label     : string
  startDate : string
  endDate   : string
  isCurrent?: boolean
}): Promise<{ data: AcademySeason | null; error: unknown }> {
  const { data, error } = await supabase
    .from('academy_seasons')
    .insert({
      tenant_id : params.tenantId,
      label     : params.label,
      start_date: params.startDate,
      end_date  : params.endDate,
      is_current: params.isCurrent ?? false,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapSeason(data as Record<string, unknown>), error: null }
}

/** Marque une saison comme courante (retire is_current des autres via index unique) */
export async function setCurrentSeason(seasonId: string): Promise<{ error: unknown }> {
  // Reset all to false, then set the chosen one to true
  const { error: e1 } = await supabase
    .from('academy_seasons')
    .update({ is_current: false })
    .neq('id', seasonId)

  if (e1) return { error: e1 }

  const { error: e2 } = await supabase
    .from('academy_seasons')
    .update({ is_current: true })
    .eq('id', seasonId)

  return { error: e2 }
}

// ── child_academy_memberships ─────────────────────────────────────────────────

export async function listChildAcademyMemberships(
  childId: string
): Promise<{ data: ChildAcademyMembership[]; error: unknown }> {
  const { data, error } = await supabase
    .from('child_academy_memberships')
    .select('*, academy_seasons(*)')
    .eq('child_id', childId)
    .order('joined_at', { ascending: false })

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapMembership), error: null }
}

export async function addChildAcademyMembership(params: {
  tenantId : string
  childId  : string
  seasonId : string
  notes?   : string
}): Promise<{ data: ChildAcademyMembership | null; error: unknown }> {
  const { data, error } = await supabase
    .from('child_academy_memberships')
    .insert({
      tenant_id: params.tenantId,
      child_id : params.childId,
      season_id: params.seasonId,
      notes    : params.notes ?? null,
    })
    .select('*, academy_seasons(*)')
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapMembership(data as Record<string, unknown>), error: null }
}

export async function removeChildAcademyMembership(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('child_academy_memberships')
    .delete()
    .eq('id', id)
  return { error }
}

// ── stages ────────────────────────────────────────────────────────────────────

export async function listStages(): Promise<{ data: Stage[]; error: unknown }> {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .order('start_date', { ascending: false })

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapStage), error: null }
}

export async function createStage(params: {
  tenantId    : string
  name        : string
  seasonLabel?: string
  startDate   : string
  endDate     : string
  location?   : string
  type?       : string
}): Promise<{ data: Stage | null; error: unknown }> {
  const { data, error } = await supabase
    .from('stages')
    .insert({
      tenant_id   : params.tenantId,
      name        : params.name,
      season_label: params.seasonLabel ?? null,
      start_date  : params.startDate,
      end_date    : params.endDate,
      location    : params.location ?? null,
      type        : params.type     ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapStage(data as Record<string, unknown>), error: null }
}

// ── child_stage_participations ────────────────────────────────────────────────

export async function listChildStageParticipations(
  childId: string
): Promise<{ data: ChildStageParticipation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('child_stage_participations')
    .select('*, stages(*)')
    .eq('child_id', childId)
    .order('registered_at', { ascending: false })

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapParticipation), error: null }
}

export async function addChildStageParticipation(params: {
  tenantId            : string
  childId             : string
  stageId             : string
  participationStatus?: string
}): Promise<{ data: ChildStageParticipation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('child_stage_participations')
    .insert({
      tenant_id           : params.tenantId,
      child_id            : params.childId,
      stage_id            : params.stageId,
      participation_status: params.participationStatus ?? 'confirmed',
    })
    .select('*, stages(*)')
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapParticipation(data as Record<string, unknown>), error: null }
}

export async function removeChildStageParticipation(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('child_stage_participations')
    .delete()
    .eq('id', id)
  return { error }
}
