// @aureak/api-client — Annuaire joueurs (child_directory)
// CRUD + historique football par saison
// Terminologie : joueur = enfant = child (cf. MEMORY)

import { supabase } from '../supabase'
import type { ChildDirectoryEntry, ChildDirectoryHistory } from '@aureak/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEntry(row: any): ChildDirectoryEntry {
  return {
    id             : row.id,
    tenantId       : row.tenant_id,
    displayName    : row.display_name,
    birthDate      : row.birth_date     ?? null,
    statut         : row.statut         ?? null,
    currentClub    : row.current_club   ?? null,
    niveauClub     : row.niveau_club    ?? null,
    clubDirectoryId: row.club_directory_id ?? null,
    adresseRue     : row.adresse_rue    ?? null,
    codePostal     : row.code_postal    ?? null,
    localite       : row.localite       ?? null,
    parent1Nom     : row.parent1_nom    ?? null,
    parent1Tel     : row.parent1_tel    ?? null,
    parent1Email   : row.parent1_email  ?? null,
    parent2Nom     : row.parent2_nom    ?? null,
    parent2Tel     : row.parent2_tel    ?? null,
    parent2Email   : row.parent2_email  ?? null,
    actif          : row.actif,
    notesInternes  : row.notes_internes ?? null,
    notionPageId   : row.notion_page_id ?? null,
    notionSyncedAt : row.notion_synced_at ?? null,
    deletedAt      : row.deleted_at     ?? null,
    createdAt      : row.created_at,
    updatedAt      : row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toHistory(row: any): ChildDirectoryHistory {
  return {
    id             : row.id,
    tenantId       : row.tenant_id,
    childId        : row.child_id,
    saison         : row.saison,
    clubDirectoryId: row.club_directory_id ?? null,
    clubNom        : row.club_nom,
    categorie      : row.categorie  ?? null,
    niveau         : row.niveau     ?? null,
    affilie        : row.affilie,
    notes          : row.notes      ?? null,
    notionPageId   : row.notion_page_id   ?? null,
    notionSyncedAt : row.notion_synced_at ?? null,
    createdAt      : row.created_at,
    updatedAt      : row.updated_at,
  }
}

// ── List ───────────────────────────────────────────────────────────────────────

export type ListChildDirectoryOpts = {
  search?  : string
  statut?  : string
  actif?   : boolean
  page?    : number
  pageSize?: number
}

export async function listChildDirectory(
  opts: ListChildDirectoryOpts = {},
): Promise<{ data: ChildDirectoryEntry[]; count: number }> {
  const { search, statut, actif, page = 0, pageSize = 50 } = opts

  let q = supabase
    .from('child_directory')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_name', { ascending: true })

  if (search) q = q.ilike('display_name', `%${search}%`)
  if (statut !== undefined) q = q.eq('statut', statut)
  if (actif  !== undefined) q = q.eq('actif',  actif)

  q = q.range(page * pageSize, (page + 1) * pageSize - 1)

  const { data, count, error } = await q
  if (error) throw error
  return { data: (data ?? []).map(toEntry), count: count ?? 0 }
}

// ── Get single ─────────────────────────────────────────────────────────────────

export async function getChildDirectoryEntry(
  id: string,
): Promise<ChildDirectoryEntry | null> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) return null
  return toEntry(data)
}

// ── Update ─────────────────────────────────────────────────────────────────────

export type UpdateChildDirectoryParams = Partial<{
  displayName    : string
  birthDate      : string | null
  statut         : string | null
  currentClub    : string | null
  niveauClub     : string | null
  clubDirectoryId: string | null
  adresseRue     : string | null
  codePostal     : string | null
  localite       : string | null
  parent1Nom     : string | null
  parent1Tel     : string | null
  parent1Email   : string | null
  parent2Nom     : string | null
  parent2Tel     : string | null
  parent2Email   : string | null
  actif          : boolean
  notesInternes  : string | null
}>

export async function updateChildDirectoryEntry(
  id    : string,
  fields: UpdateChildDirectoryParams,
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (fields.displayName     !== undefined) payload.display_name     = fields.displayName
  if (fields.birthDate       !== undefined) payload.birth_date       = fields.birthDate
  if (fields.statut          !== undefined) payload.statut           = fields.statut
  if (fields.currentClub     !== undefined) payload.current_club     = fields.currentClub
  if (fields.niveauClub      !== undefined) payload.niveau_club      = fields.niveauClub
  if (fields.clubDirectoryId !== undefined) payload.club_directory_id = fields.clubDirectoryId
  if (fields.adresseRue      !== undefined) payload.adresse_rue      = fields.adresseRue
  if (fields.codePostal      !== undefined) payload.code_postal      = fields.codePostal
  if (fields.localite        !== undefined) payload.localite         = fields.localite
  if (fields.parent1Nom      !== undefined) payload.parent1_nom      = fields.parent1Nom
  if (fields.parent1Tel      !== undefined) payload.parent1_tel      = fields.parent1Tel
  if (fields.parent1Email    !== undefined) payload.parent1_email    = fields.parent1Email
  if (fields.parent2Nom      !== undefined) payload.parent2_nom      = fields.parent2Nom
  if (fields.parent2Tel      !== undefined) payload.parent2_tel      = fields.parent2Tel
  if (fields.parent2Email    !== undefined) payload.parent2_email    = fields.parent2Email
  if (fields.actif           !== undefined) payload.actif            = fields.actif
  if (fields.notesInternes   !== undefined) payload.notes_internes   = fields.notesInternes

  const { error } = await supabase
    .from('child_directory')
    .update(payload)
    .eq('id', id)
  if (error) throw error
}

// ── Soft-delete ────────────────────────────────────────────────────────────────

export async function softDeleteChildDirectoryEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── Joueurs list (child_directory + v_child_academy_status) ───────────────────

export type JoueurListItem = {
  id              : string
  displayName     : string
  birthDate       : string | null
  currentClub     : string | null
  niveauClub      : string | null
  clubDirectoryId : string | null
  computedStatus  : string | null
  totalAcademySeasons: number
  inCurrentSeason : boolean
  currentSeasonLabel: string | null
  totalStages     : number
}

export type ListJoueursOpts = {
  search?          : string
  computedStatus?  : string
  totalSeasonsCmp? : 'eq1' | 'eq2' | 'gte3'
  totalStagesCmp?  : 'eq0' | 'eq1' | 'eq2' | 'gte3'
  currentClub?     : string
  niveauClub?      : string
  page?            : number
  pageSize?        : number
}

export async function listJoueurs(
  opts: ListJoueursOpts = {}
): Promise<{ data: JoueurListItem[]; count: number }> {
  const {
    search, computedStatus, totalSeasonsCmp, totalStagesCmp,
    currentClub, niveauClub, page = 0, pageSize = 50,
  } = opts

  const hasStatusFilter = !!(computedStatus || totalSeasonsCmp !== undefined || totalStagesCmp !== undefined)

  // Phase 1 (optional): filter by computed academy status
  let filteredIds: string[] | null = null
  if (hasStatusFilter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vq: any = supabase.from('v_child_academy_status').select('child_id')
    if (computedStatus)                vq = vq.eq('computed_status', computedStatus)
    if (totalSeasonsCmp === 'eq1')     vq = vq.eq('total_academy_seasons', 1)
    else if (totalSeasonsCmp === 'eq2')  vq = vq.eq('total_academy_seasons', 2)
    else if (totalSeasonsCmp === 'gte3') vq = vq.gte('total_academy_seasons', 3)
    if (totalStagesCmp === 'eq0')      vq = vq.eq('total_stages', 0)
    else if (totalStagesCmp === 'eq1')  vq = vq.eq('total_stages', 1)
    else if (totalStagesCmp === 'eq2')  vq = vq.eq('total_stages', 2)
    else if (totalStagesCmp === 'gte3') vq = vq.gte('total_stages', 3)
    const { data: viewRows } = await vq
    filteredIds = ((viewRows ?? []) as Record<string, unknown>[]).map(r => r.child_id as string)
    if (filteredIds.length === 0) return { data: [], count: 0 }
  }

  // Phase 2: paginate child_directory
  let q = supabase
    .from('child_directory')
    .select('id, display_name, birth_date, current_club, niveau_club, club_directory_id', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
  if (search)      q = q.ilike('display_name', `%${search}%`)
  if (currentClub) q = q.ilike('current_club', `%${currentClub}%`)
  if (niveauClub)  q = q.eq('niveau_club', niveauClub)
  if (filteredIds) q = q.in('id', filteredIds)
  q = q.range(page * pageSize, (page + 1) * pageSize - 1)

  const { data: childRows, count, error } = await q
  if (error) throw error

  const pageIds = ((childRows ?? []) as Record<string, unknown>[]).map(r => r.id as string)

  // Phase 3: fetch status summaries for this page
  type StatusSummary = {
    computedStatus: string | null; totalAcademySeasons: number
    inCurrentSeason: boolean; currentSeasonLabel: string | null; totalStages: number
  }
  const statusMap: Record<string, StatusSummary> = {}
  if (pageIds.length > 0) {
    const { data: statusRows } = await supabase
      .from('v_child_academy_status')
      .select('child_id, computed_status, total_academy_seasons, in_current_season, current_season_label, total_stages')
      .in('child_id', pageIds)
    for (const r of (statusRows ?? []) as Record<string, unknown>[]) {
      statusMap[r.child_id as string] = {
        computedStatus     : (r.computed_status       as string  | null) ?? null,
        totalAcademySeasons: (r.total_academy_seasons as number) ?? 0,
        inCurrentSeason    : (r.in_current_season     as boolean) ?? false,
        currentSeasonLabel : (r.current_season_label  as string  | null) ?? null,
        totalStages        : (r.total_stages          as number) ?? 0,
      }
    }
  }

  const data: JoueurListItem[] = ((childRows ?? []) as Record<string, unknown>[]).map(r => {
    const st = statusMap[r.id as string] ?? null
    return {
      id              : r.id              as string,
      displayName     : r.display_name    as string,
      birthDate       : (r.birth_date     as string | null) ?? null,
      currentClub     : (r.current_club   as string | null) ?? null,
      niveauClub      : (r.niveau_club    as string | null) ?? null,
      clubDirectoryId : (r.club_directory_id as string | null) ?? null,
      computedStatus     : st?.computedStatus      ?? null,
      totalAcademySeasons: st?.totalAcademySeasons ?? 0,
      inCurrentSeason    : st?.inCurrentSeason     ?? false,
      currentSeasonLabel : st?.currentSeasonLabel  ?? null,
      totalStages        : st?.totalStages         ?? 0,
    }
  })

  return { data, count: count ?? 0 }
}

// ── History ────────────────────────────────────────────────────────────────────

export async function listChildDirectoryHistory(
  childId: string,
): Promise<ChildDirectoryHistory[]> {
  const { data, error } = await supabase
    .from('child_directory_history')
    .select('*')
    .eq('child_id', childId)
    .order('saison', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toHistory)
}

export type AddChildHistoryParams = {
  childId        : string
  saison         : string
  clubNom        : string
  clubDirectoryId?: string | null
  categorie?     : string | null
  niveau?        : string | null
  affilie?       : boolean
  notes?         : string | null
}

export async function addChildHistoryEntry(
  params: AddChildHistoryParams,
): Promise<ChildDirectoryHistory> {
  const { data, error } = await supabase
    .from('child_directory_history')
    .insert({
      child_id         : params.childId,
      saison           : params.saison,
      club_nom         : params.clubNom,
      club_directory_id: params.clubDirectoryId ?? null,
      categorie        : params.categorie ?? null,
      niveau           : params.niveau    ?? null,
      affilie          : params.affilie   ?? false,
      notes            : params.notes     ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toHistory(data)
}

export type UpdateChildHistoryParams = Partial<{
  saison         : string
  clubNom        : string
  clubDirectoryId: string | null
  categorie      : string | null
  niveau         : string | null
  affilie        : boolean
  notes          : string | null
}>

export async function updateChildHistoryEntry(
  id    : string,
  params: UpdateChildHistoryParams,
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (params.saison          !== undefined) payload.saison            = params.saison
  if (params.clubNom         !== undefined) payload.club_nom          = params.clubNom
  if (params.clubDirectoryId !== undefined) payload.club_directory_id = params.clubDirectoryId
  if (params.categorie       !== undefined) payload.categorie         = params.categorie
  if (params.niveau          !== undefined) payload.niveau            = params.niveau
  if (params.affilie         !== undefined) payload.affilie           = params.affilie
  if (params.notes           !== undefined) payload.notes             = params.notes

  const { error } = await supabase
    .from('child_directory_history')
    .update(payload)
    .eq('id', id)
  if (error) throw error
}

export async function deleteChildHistoryEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory_history')
    .delete()
    .eq('id', id)
  if (error) throw error
}
