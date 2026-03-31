// @aureak/api-client — Historique football par saison
// Migration 00010 — child_club_history

import { supabase } from './supabase'
import type { ChildClubHistory, FootballAgeCategory, FootballTeamLevel } from '@aureak/types'

// ── Types ──────────────────────────────────────────────────────────────────────

export type AddHistoryEntryParams = {
  tenantId     : string
  childId      : string
  season       : string
  clubName     : string
  isAffiliated : boolean
  ageCategory  : FootballAgeCategory
  clubId?      : string | null
  teamLevel?   : FootballTeamLevel | null
  notes?       : string | null
}

export type UpdateHistoryEntryParams = {
  id           : string
  tenantId     : string
  clubName?    : string
  isAffiliated?: boolean
  ageCategory? : FootballAgeCategory
  clubId?      : string | null
  teamLevel?   : FootballTeamLevel | null
  notes?       : string | null
}

// ── Row mapper ─────────────────────────────────────────────────────────────────

function toEntity(row: Record<string, unknown>): ChildClubHistory {
  return {
    id           : row.id as string,
    tenantId     : row.tenant_id as string,
    childId      : row.child_id as string,
    season       : row.season as string,
    clubId       : (row.club_id as string | null) ?? null,
    clubName     : row.club_name as string,
    isAffiliated : row.is_affiliated as boolean,
    ageCategory  : row.age_category as FootballAgeCategory,
    teamLevel    : (row.team_level as FootballTeamLevel | null) ?? null,
    notes        : (row.notes as string | null) ?? null,
    createdAt    : row.created_at as string,
    updatedAt    : (row.updated_at as string | null) ?? null,
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

/** Liste l'historique d'un enfant, trié par saison décroissante. */
export async function listHistoryByChild(
  childId: string,
): Promise<{ data: ChildClubHistory[]; error: unknown }> {
  const { data, error } = await supabase
    .from('child_club_history')
    .select('*')
    .eq('child_id', childId)
    .order('season', { ascending: false })

  if (error) return { data: [], error }
  return { data: (data ?? []).map(toEntity), error: null }
}

/** Liste les enfants affiliés à un club pour une saison donnée. */
export async function listAffiliatedChildrenByClub(
  clubId: string,
  season?: string,
): Promise<{ data: ChildClubHistory[]; error: unknown }> {
  let query = supabase
    .from('child_club_history')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_affiliated', true)
    .order('season', { ascending: false })

  if (season) {
    query = query.eq('season', season)
  }

  const { data, error } = await query
  if (error) return { data: [], error }
  return { data: (data ?? []).map(toEntity), error: null }
}

/** Ajoute une entrée d'historique pour un enfant. */
export async function addHistoryEntry(
  params: AddHistoryEntryParams,
): Promise<{ data: ChildClubHistory | null; error: unknown }> {
  const { data, error } = await supabase
    .from('child_club_history')
    .insert({
      tenant_id    : params.tenantId,
      child_id     : params.childId,
      season       : params.season,
      club_id      : params.clubId ?? null,
      club_name    : params.clubName,
      is_affiliated: params.isAffiliated,
      age_category : params.ageCategory,
      team_level   : params.teamLevel ?? null,
      notes        : params.notes ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: toEntity(data as Record<string, unknown>), error: null }
}

/** Met à jour une entrée d'historique existante. */
export async function updateHistoryEntry(
  params: UpdateHistoryEntryParams,
): Promise<{ error: unknown }> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (params.clubName     !== undefined) patch.club_name     = params.clubName
  if (params.isAffiliated !== undefined) patch.is_affiliated = params.isAffiliated
  if (params.ageCategory  !== undefined) patch.age_category  = params.ageCategory
  if (params.clubId       !== undefined) patch.club_id       = params.clubId
  if (params.teamLevel    !== undefined) patch.team_level    = params.teamLevel
  if (params.notes        !== undefined) patch.notes         = params.notes

  const { error } = await supabase
    .from('child_club_history')
    .update(patch)
    .eq('id', params.id)
    .eq('tenant_id', params.tenantId)

  return { error: error ?? null }
}

/** Soft-delete une entrée d'historique (ARCH-4 — purge dure = jobs RGPD uniquement). */
export async function deleteHistoryEntry(
  id: string,
  tenantId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('child_club_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  return { error: error ?? null }
}
