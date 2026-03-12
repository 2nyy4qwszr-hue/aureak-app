// @aureak/api-client — Annuaire joueurs (child_directory)
// CRUD + historique football par saison
// Terminologie : joueur = enfant = child (cf. MEMORY)

import { supabase } from '../supabase'
import type { ChildDirectoryEntry, ChildDirectoryHistory, ChildDirectoryPhoto } from '@aureak/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEntry(row: any): ChildDirectoryEntry {
  return {
    id             : row.id,
    tenantId       : row.tenant_id,
    displayName    : row.display_name,
    nom            : row.nom            ?? null,
    prenom         : row.prenom         ?? null,
    birthDate      : row.birth_date     ?? null,
    email          : row.email          ?? null,
    tel            : row.tel            ?? null,
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
    actif           : row.actif,
    notesInternes   : row.notes_internes   ?? null,
    contactDeclined : row.contact_declined ?? false,
    notionPageId    : row.notion_page_id   ?? null,
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

// ── Photos — Signed URL helpers ───────────────────────────────────────────────

/** Génère une Signed URL pour un chemin Storage (expiration 1h = 3600s) */
async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}

/** Génère des Signed URLs en batch — 1 seul appel Storage (évite N+1) */
async function getSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrls(paths, 3600)
  if (error || !data) return {}
  const result: Record<string, string> = {}
  for (const item of data) {
    if (item.signedUrl) result[item.path] = item.signedUrl
  }
  return result
}

/** Mapper DB row → ChildDirectoryPhoto TS */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPhoto(row: any, signedUrl: string | null): ChildDirectoryPhoto {
  return {
    id         : row.id,
    tenantId   : row.tenant_id,
    childId    : row.child_id,
    photoPath  : row.photo_path,
    photoUrl   : signedUrl,
    takenAt    : row.taken_at    ?? null,
    season     : row.season      ?? null,
    caption    : row.caption     ?? null,
    uploadedBy : row.uploaded_by ?? null,
    isCurrent  : row.is_current,
    deletedAt  : row.deleted_at  ?? null,
    createdAt  : row.created_at,
    updatedAt  : row.updated_at,
  }
}

// ── Photos — CRUD ─────────────────────────────────────────────────────────────

/** Historique des photos d'un joueur (ordre antéchronologique) */
export async function listChildPhotos(childId: string): Promise<ChildDirectoryPhoto[]> {
  const { data, error } = await supabase
    .from('child_directory_photos')
    .select('*')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as Record<string, unknown>[]
  const paths = rows.map(r => r.photo_path as string)
  const signedMap = await getSignedPhotoUrls(paths)
  return rows.map(r => toPhoto(r, signedMap[r.photo_path as string] ?? null))
}

export type AddChildPhotoParams = {
  tenantId    : string
  childId     : string
  file        : File           // HTML File object — web admin uniquement
  takenAt?    : string | null  // ISO date optionnelle
  season?     : string | null  // ex: '2024-2025'
  caption?    : string | null
  setCurrent? : boolean        // true = définit immédiatement comme photo actuelle
}

/**
 * Upload d'une photo vers Supabase Storage puis insertion du record en DB.
 * Rollback automatique du Storage si l'insertion DB échoue.
 */
export async function addChildPhoto(params: AddChildPhotoParams): Promise<ChildDirectoryPhoto> {
  const { tenantId, childId, file, takenAt, season, caption, setCurrent = false } = params

  // Sanitize filename : lowercase + remplacement caractères spéciaux + collapse tirets
  const ts = Date.now()
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
  const photoPath = `${tenantId}/${childId}/${ts}_${safeName}`

  // 1. Upload vers Supabase Storage (bucket privé child-photos)
  const { error: uploadError } = await supabase.storage
    .from('child-photos')
    .upload(photoPath, file, { upsert: false })
  if (uploadError) throw uploadError

  // 2. Insert record en DB
  const { data, error: dbError } = await supabase
    .from('child_directory_photos')
    .insert({
      tenant_id  : tenantId,
      child_id   : childId,
      photo_path : photoPath,
      taken_at   : takenAt  ?? null,
      season     : season   ?? null,
      caption    : caption  ?? null,
      is_current : setCurrent,
    })
    .select()
    .single()

  if (dbError) {
    // Rollback Storage pour éviter les orphelins
    await supabase.storage.from('child-photos').remove([photoPath])
    throw dbError
  }

  const signedUrl = await getSignedPhotoUrl(photoPath)
  return toPhoto(data as Record<string, unknown>, signedUrl)
}

/**
 * Définit une photo comme photo actuelle du joueur.
 * Le trigger DB fn_ensure_single_current_photo assure l'unicité automatiquement.
 */
export async function setCurrentPhoto(photoId: string, childId: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory_photos')
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq('id', photoId)
    .eq('child_id', childId)
  if (error) throw error
}

/** Soft-delete d'une photo (deleted_at + is_current = false) */
export async function deleteChildPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory_photos')
    .update({ deleted_at: new Date().toISOString(), is_current: false, updated_at: new Date().toISOString() })
    .eq('id', photoId)
  if (error) throw error
}

// ── Create ─────────────────────────────────────────────────────────────────────

export type CreateChildDirectoryParams = {
  tenantId    : string
  displayName : string
  nom?        : string | null
  prenom?     : string | null
  birthDate?  : string | null
  statut?     : string | null
  currentClub?: string | null
  niveauClub? : string | null
  actif?      : boolean
}

export async function createChildDirectoryEntry(
  params: CreateChildDirectoryParams,
): Promise<ChildDirectoryEntry> {
  const { data, error } = await supabase
    .from('child_directory')
    .insert({
      tenant_id   : params.tenantId,
      display_name: params.displayName,
      nom         : params.nom         ?? null,
      prenom      : params.prenom      ?? null,
      birth_date  : params.birthDate   ?? null,
      statut      : params.statut      ?? null,
      current_club: params.currentClub ?? null,
      niveau_club : params.niveauClub  ?? null,
      actif       : params.actif       ?? true,
    })
    .select()
    .single()
  if (error) throw error
  return toEntry(data)
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
  nom            : string | null
  prenom         : string | null
  birthDate      : string | null
  email          : string | null
  tel            : string | null
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
  if (fields.nom             !== undefined) payload.nom              = fields.nom
  if (fields.prenom          !== undefined) payload.prenom           = fields.prenom
  if (fields.birthDate       !== undefined) payload.birth_date       = fields.birthDate
  if (fields.email           !== undefined) payload.email            = fields.email
  if (fields.tel             !== undefined) payload.tel              = fields.tel
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
  nom             : string | null
  prenom          : string | null
  birthDate       : string | null
  currentClub     : string | null
  niveauClub      : string | null
  clubDirectoryId : string | null
  /** true si clubDirectoryId est renseigné ET club_directory.partenaire = true (Story 18.5) */
  isClubPartner   : boolean
  computedStatus  : string | null
  totalAcademySeasons: number
  inCurrentSeason : boolean
  currentSeasonLabel: string | null
  totalStages     : number
  /** Signed URL de la photo actuelle (null si aucune photo, expiration 1h) */
  currentPhotoUrl : string | null
}

export type ListJoueursOpts = {
  search?          : string
  computedStatus?  : string
  totalSeasonsCmp? : 'eq1' | 'eq2' | 'gte3'
  totalStagesCmp?  : 'eq0' | 'eq1' | 'eq2' | 'gte3'
  currentClub?     : string
  niveauClub?      : string
  /** Filtre par année de naissance ex: '2010' → birth_date BETWEEN 2010-01-01 AND 2010-12-31 */
  birthYear?       : string
  page?            : number
  pageSize?        : number
}

export async function listJoueurs(
  opts: ListJoueursOpts = {}
): Promise<{ data: JoueurListItem[]; count: number }> {
  const {
    search, computedStatus, totalSeasonsCmp, totalStagesCmp,
    currentClub, niveauClub, birthYear, page = 0, pageSize = 50,
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

  // Phase 2: paginate child_directory + join club_directory pour partenaire (Story 18.5)
  let q = supabase
    .from('child_directory')
    .select(
      'id, display_name, nom, prenom, birth_date, current_club, niveau_club, club_directory_id, ' +
      'club_directory!club_directory_id(partenaire)',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
  if (search)      q = q.ilike('display_name', `%${search}%`)
  if (currentClub) q = q.ilike('current_club', `%${currentClub}%`)
  if (niveauClub)  q = q.eq('niveau_club', niveauClub)
  if (birthYear)   q = q.gte('birth_date', `${birthYear}-01-01`).lte('birth_date', `${birthYear}-12-31`)
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

  // Phase 4 : batch fetch des photos courantes + signed URLs (évite N+1)
  const photoPathMap: Record<string, string> = {}
  if (pageIds.length > 0) {
    const { data: photoRows } = await supabase
      .from('child_directory_photos')
      .select('child_id, photo_path')
      .in('child_id', pageIds)
      .eq('is_current', true)
      .is('deleted_at', null)
    for (const r of (photoRows ?? []) as Record<string, unknown>[]) {
      photoPathMap[r.child_id as string] = r.photo_path as string
    }
  }
  // 1 seul appel Storage pour signer toutes les photos de la page
  const photoPaths = Object.values(photoPathMap)
  const signedMap = photoPaths.length > 0 ? await getSignedPhotoUrls(photoPaths) : {}

  const data: JoueurListItem[] = ((childRows ?? []) as Record<string, unknown>[]).map(r => {
    const st = statusMap[r.id as string] ?? null
    const photoPath = photoPathMap[r.id as string] ?? null
    const clubDir = r.club_directory as { partenaire: boolean } | null
    return {
      id              : r.id              as string,
      displayName     : r.display_name    as string,
      nom             : (r.nom            as string | null) ?? null,
      prenom          : (r.prenom         as string | null) ?? null,
      birthDate       : (r.birth_date     as string | null) ?? null,
      currentClub     : (r.current_club   as string | null) ?? null,
      niveauClub      : (r.niveau_club    as string | null) ?? null,
      clubDirectoryId : (r.club_directory_id as string | null) ?? null,
      isClubPartner   : !!(clubDir?.partenaire),
      computedStatus     : st?.computedStatus      ?? null,
      totalAcademySeasons: st?.totalAcademySeasons ?? 0,
      inCurrentSeason    : st?.inCurrentSeason     ?? false,
      currentSeasonLabel : st?.currentSeasonLabel  ?? null,
      totalStages        : st?.totalStages         ?? 0,
      currentPhotoUrl    : photoPath ? (signedMap[photoPath] ?? null) : null,
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
  tenantId       : string
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
      tenant_id        : params.tenantId,
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
