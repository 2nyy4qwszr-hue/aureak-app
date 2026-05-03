// @aureak/api-client — Annuaire joueurs (child_directory)
// CRUD + historique football par saison
// Terminologie : joueur = enfant = child (cf. MEMORY)

import { supabase } from '../supabase'
import { getCachedUrl, setCachedUrl } from '../utils/signed-url-cache'
import type { ChildDirectoryEntry, ChildDirectoryHistory, ChildDirectoryPhoto, FootballAgeCategory, ChildCurrentClubFromHistory, ProspectStatus, TrialOutcome } from '@aureak/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toEntry(row: Record<string, unknown>): ChildDirectoryEntry {
  return {
    id             : row.id              as string,
    tenantId       : row.tenant_id       as string,
    displayName    : row.display_name    as string,
    nom            : (row.nom            as string | null) ?? null,
    prenom         : (row.prenom         as string | null) ?? null,
    birthDate      : (row.birth_date     as string | null) ?? null,
    email          : (row.email          as string | null) ?? null,
    tel            : (row.tel            as string | null) ?? null,
    statut         : (row.statut         as string | null) ?? null,
    currentClub    : (row.current_club   as string | null) ?? null,
    niveauClub     : (row.niveau_club    as string | null) ?? null,
    clubDirectoryId: (row.club_directory_id as string | null) ?? null,
    adresseRue     : (row.adresse_rue    as string | null) ?? null,
    codePostal     : (row.code_postal    as string | null) ?? null,
    localite       : (row.localite       as string | null) ?? null,
    parent1Nom     : (row.parent1_nom    as string | null) ?? null,
    parent1Tel     : (row.parent1_tel    as string | null) ?? null,
    parent1Email   : (row.parent1_email  as string | null) ?? null,
    parent2Nom     : (row.parent2_nom    as string | null) ?? null,
    parent2Tel     : (row.parent2_tel    as string | null) ?? null,
    parent2Email   : (row.parent2_email  as string | null) ?? null,
    actif           : row.actif          as boolean,
    notesInternes   : (row.notes_internes   as string | null) ?? null,
    contactDeclined : (row.contact_declined as boolean | null) ?? false,
    ageCategory     : (row.age_category     as FootballAgeCategory | null) ?? null,
    playerType      : (row.player_type      as 'youth' | 'senior' | null) ?? null,
    youthLevel      : (row.youth_level      as string | null) ?? null,
    seniorDivision  : (row.senior_division  as string | null) ?? null,
    teamLevelStars  : (row.team_level_stars as number | null) ?? null,
    prospectStatus  : (row.prospect_status  as ProspectStatus | null) ?? null,
    trialUsed       : (row.trial_used       as boolean | null) ?? false,
    trialDate       : (row.trial_date       as string | null) ?? null,
    trialOutcome    : (row.trial_outcome    as TrialOutcome | null) ?? null,
    notionPageId    : (row.notion_page_id   as string | null) ?? null,
    notionSyncedAt  : (row.notion_synced_at as string | null) ?? null,
    createdBy       : (row.created_by       as string | null) ?? null,
    deletedAt       : (row.deleted_at       as string | null) ?? null,
    createdAt       : row.created_at        as string,
    updatedAt       : row.updated_at        as string,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toHistory(row: Record<string, unknown>): ChildDirectoryHistory {
  return {
    id             : row.id             as string,
    tenantId       : row.tenant_id      as string,
    childId        : row.child_id       as string,
    saison         : row.saison         as string,
    clubDirectoryId: (row.club_directory_id as string | null) ?? null,
    clubNom        : row.club_nom       as string,
    categorie      : (row.categorie     as string | null) ?? null,
    niveau         : (row.niveau        as string | null) ?? null,
    affilie        : row.affilie        as boolean,
    notes          : (row.notes         as string | null) ?? null,
    notionPageId   : (row.notion_page_id   as string | null) ?? null,
    notionSyncedAt : (row.notion_synced_at as string | null) ?? null,
    createdAt      : row.created_at     as string,
    updatedAt      : row.updated_at     as string,
  }
}

// ── Photos — Signed URL helpers ───────────────────────────────────────────────

/** Génère une Signed URL pour un chemin Storage (expiration 1h = 3600s).
 *  Cache mémoire 50 min — évite un double appel Storage lors du refresh post-upload. */
async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const cached = getCachedUrl(path)
  if (cached) return cached
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  setCachedUrl(path, data.signedUrl)
  return data.signedUrl
}

/** Génère des Signed URLs en batch — 1 seul appel Storage (évite N+1).
 *  Cache mémoire 50 min : évite de re-générer des URLs encore valides (Story 25.4). */
export async function getSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const result: Record<string, string> = {}
  const uncached: string[] = []
  for (const path of paths) {
    const cached = getCachedUrl(path)
    if (cached) result[path] = cached
    else uncached.push(path)
  }
  if (uncached.length === 0) return result
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrls(uncached, 3600)
  if (error || !data) return result
  for (const item of data) {
    if (item.signedUrl && item.path) {
      setCachedUrl(item.path, item.signedUrl)
      result[item.path] = item.signedUrl
    }
  }
  return result
}

/** Mapper DB row → ChildDirectoryPhoto TS */
function toPhoto(row: Record<string, unknown>, signedUrl: string | null): ChildDirectoryPhoto {
  return {
    id         : row.id          as string,
    tenantId   : row.tenant_id   as string,
    childId    : row.child_id    as string,
    photoPath  : row.photo_path  as string,
    photoUrl   : signedUrl,
    takenAt    : (row.taken_at    as string | null) ?? null,
    season     : (row.season      as string | null) ?? null,
    caption    : (row.caption     as string | null) ?? null,
    uploadedBy : (row.uploaded_by as string | null) ?? null,
    isCurrent  : row.is_current  as boolean,
    deletedAt  : (row.deleted_at  as string | null) ?? null,
    createdAt  : row.created_at  as string,
    updatedAt  : row.updated_at  as string,
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

  // Recommandation upload (Story 25.4 — AC #4) :
  // Photos JPEG ≤ 150 Ko, dimensions ≤ 400×450px, quality 80%.
  // Note : quand Story 25.3B (capture photo coach) sera implémentée,
  // la compression sera effectuée côté client avant cet appel.

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
  tenantId       : string
  displayName    : string
  nom?           : string | null
  prenom?        : string | null
  birthDate?     : string | null
  statut?        : string | null
  currentClub?   : string | null
  niveauClub?    : string | null
  clubDirectoryId?: string | null
  actif?         : boolean
  // Story 89.1 — ajouts pour l'ajout rapide prospect terrain
  email?          : string | null
  tel?            : string | null
  parent1Email?   : string | null
  parent1Tel?     : string | null
  notesInternes?  : string | null
  prospectStatus? : ProspectStatus | null
}

export async function createChildDirectoryEntry(
  params: CreateChildDirectoryParams,
): Promise<ChildDirectoryEntry> {
  // Story 89.3 — injection automatique de created_by = auth.uid() pour l'auto-grant RGPD 'creator'.
  const { data: userRes } = await supabase.auth.getUser()
  const createdBy = userRes?.user?.id ?? null

  const { data, error } = await supabase
    .from('child_directory')
    .insert({
      tenant_id        : params.tenantId,
      display_name     : params.displayName,
      nom              : params.nom            ?? null,
      prenom           : params.prenom         ?? null,
      birth_date       : params.birthDate      ?? null,
      statut           : params.statut         ?? null,
      current_club     : params.currentClub    ?? null,
      niveau_club      : params.niveauClub     ?? null,
      club_directory_id: params.clubDirectoryId ?? null,
      actif            : params.actif          ?? true,
      email            : params.email          ?? null,
      tel              : params.tel            ?? null,
      parent1_email    : params.parent1Email   ?? null,
      parent1_tel      : params.parent1Tel     ?? null,
      notes_internes   : params.notesInternes  ?? null,
      prospect_status  : params.prospectStatus ?? null,
      created_by       : createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return toEntry(data)
}

// ── Search by name (Story 89.1) ───────────────────────────────────────────────

/**
 * Recherche l'annuaire child_directory par display_name (ilike).
 * - Retourne [] si query < 2 caractères
 * - Filtre deleted_at IS NULL, ordre alphabétique ASC
 * - RLS tenant isolation appliquée automatiquement
 */
export async function searchChildDirectoryByName(
  query: string,
  opts: { limit?: number } = {},
): Promise<ChildDirectoryEntry[]> {
  if (query.trim().length < 2) return []
  const { data, error } = await supabase
    .from('child_directory')
    .select('*')
    .is('deleted_at', null)
    .ilike('display_name', `%${query.trim()}%`)
    .order('display_name', { ascending: true })
    .limit(opts.limit ?? 10)
  if (error) throw error
  return (data ?? []).map(toEntry)
}

// ── Find prospect duplicates (Story 89.1) ─────────────────────────────────────

/**
 * Détecte les doublons probables pour un nouveau prospect :
 * même prénom + nom (case-insensitive) + même année de naissance dans le tenant.
 * Aucune contrainte DB — garde-fou UI uniquement (AC #10 : "Créer quand même" doit rester possible).
 */
export async function findProspectDuplicates(params: {
  tenantId : string
  prenom   : string
  nom      : string
  birthYear: number
}): Promise<ChildDirectoryEntry[]> {
  const { tenantId, prenom, nom, birthYear } = params
  if (!prenom.trim() || !nom.trim() || !Number.isFinite(birthYear)) return []
  const { data, error } = await supabase
    .from('child_directory')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .ilike('prenom', prenom.trim())
    .ilike('nom', nom.trim())
    .gte('birth_date', `${birthYear}-01-01`)
    .lt ('birth_date', `${birthYear + 1}-01-01`)
  if (error) throw error
  return (data ?? []).map(toEntry)
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
  // Story 25.0 — classification niveau
  ageCategory    : FootballAgeCategory | null
  youthLevel     : string | null
  seniorDivision : string | null
  // Story 89.4 — prospection
  prospectStatus : ProspectStatus | null
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
  if (fields.ageCategory     !== undefined) payload.age_category     = fields.ageCategory
  if (fields.youthLevel      !== undefined) payload.youth_level      = fields.youthLevel
  if (fields.seniorDivision  !== undefined) payload.senior_division  = fields.seniorDivision
  if (fields.prospectStatus  !== undefined) payload.prospect_status  = fields.prospectStatus

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
  /** true si clubDirectoryId est renseigné ET club_directory.club_relation_type = 'partenaire' (Story 18.5 / 23.3) */
  isClubPartner   : boolean
  computedStatus  : string | null
  totalAcademySeasons: number
  inCurrentSeason : boolean
  currentSeasonLabel: string | null
  totalStages     : number
  /** Signed URL de la photo actuelle (null si aucune photo, expiration 1h) */
  currentPhotoUrl : string | null
  /** Catégorie d'âge — football_age_category enum (Story 25.0) */
  ageCategory     : FootballAgeCategory | null
  /** Dérivé de ageCategory (colonne générée) : 'youth' | 'senior' | null */
  playerType      : 'youth' | 'senior' | null
  /** Niveau compétitif joueur jeune — 'Régional'|'Provincial'|'Inter'|'Élite 2'|'Élite 1' */
  youthLevel      : string | null
  /** Division compétitive joueur senior — 'P4'..'D1A' */
  seniorDivision  : string | null
  /** Étoiles calculées en DB (1-5) ou null si données manquantes */
  teamLevelStars  : number | null
  /** Signed URL du logo club (bucket club-logos) — null si aucun logo (Story 25.2) */
  clubLogoUrl     : string | null
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
  /** Filtre par saison académie : retourne les joueurs ayant un historique pour cette saison (ex: '2025-2026') */
  academySaison?   : string
  page?            : number
  pageSize?        : number
}

export async function listJoueurs(
  opts: ListJoueursOpts = {}
): Promise<{ data: JoueurListItem[]; count: number }> {
  const {
    search, computedStatus, totalSeasonsCmp, totalStagesCmp,
    currentClub, niveauClub, birthYear, academySaison, page = 0, pageSize = 50,
  } = opts

  const hasStatusFilter = !!(computedStatus || totalSeasonsCmp !== undefined || totalStagesCmp !== undefined)

  // Phase 1 (optional): filter by computed academy status
  let filteredIds: string[] | null = null
  if (hasStatusFilter) {
    const { data: viewRows } = await (() => {
      let q = supabase.from('v_child_academy_status').select('child_id')
      if (computedStatus)                q = q.eq('computed_status', computedStatus)
      if (totalSeasonsCmp === 'eq1')     q = q.eq('total_academy_seasons', 1)
      else if (totalSeasonsCmp === 'eq2')  q = q.eq('total_academy_seasons', 2)
      else if (totalSeasonsCmp === 'gte3') q = q.gte('total_academy_seasons', 3)
      if (totalStagesCmp === 'eq0')      q = q.eq('total_stages', 0)
      else if (totalStagesCmp === 'eq1')  q = q.eq('total_stages', 1)
      else if (totalStagesCmp === 'eq2')  q = q.eq('total_stages', 2)
      else if (totalStagesCmp === 'gte3') q = q.gte('total_stages', 3)
      return q
    })()
    filteredIds = ((viewRows ?? []) as Record<string, unknown>[]).map(r => r.child_id as string)
    if (filteredIds.length === 0) return { data: [], count: 0 }
  }

  // Phase 1b (optional): filter by current academy season
  // Utilise v_child_academy_status.in_current_season = true (source de vérité SQL unique).
  // L'ancienne logique ILIKE '%aureak%' sur child_directory_history était incorrecte :
  // elle excluait les joueurs dont club_nom était différent ("Goal & Player", etc.).
  if (academySaison) {
    const { data: currentSeasonRows } = await supabase
      .from('v_child_academy_status')
      .select('child_id')
      .eq('in_current_season', true)

    const currentSeasonIds = ((currentSeasonRows ?? []) as Record<string, unknown>[]).map(r => r.child_id as string)
    if (currentSeasonIds.length === 0) return { data: [], count: 0 }

    if (filteredIds !== null) {
      const currentSeasonSet = new Set(currentSeasonIds)
      filteredIds = filteredIds.filter(id => currentSeasonSet.has(id))
    } else {
      filteredIds = currentSeasonIds
    }
    if (filteredIds.length === 0) return { data: [], count: 0 }
  }

  // Phase 2: paginate child_directory + join club_directory pour partenaire (Story 18.5)
  let q = supabase
    .from('child_directory')
    .select(
      'id, display_name, nom, prenom, birth_date, current_club, niveau_club, club_directory_id, ' +
      'age_category, player_type, youth_level, senior_division, team_level_stars, ' +
      'club_directory!club_directory_id(club_relation_type, logo_path)',
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

  const pageIds = ((childRows ?? []) as unknown as Record<string, unknown>[]).map(r => r.id as string)

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

  // Phase 4 bis : batch signed URLs pour les logos club (déduplication — 1 URL par logo_path distinct)
  const logoPathMap: Record<string, string> = {}
  const logoSignedMap: Record<string, string> = {}
  if (pageIds.length > 0) {
    for (const r of (childRows ?? []) as unknown as Record<string, unknown>[]) {
      const clubDir = r.club_directory as { club_relation_type: string; logo_path: string | null } | null
      if (clubDir?.logo_path) logoPathMap[r.id as string] = clubDir.logo_path
    }
    const logoPaths = [...new Set(Object.values(logoPathMap))]
    const uncachedLogoPaths: string[] = []
    for (const path of logoPaths) {
      const cached = getCachedUrl(`club-logos:${path}`)
      if (cached) logoSignedMap[path] = cached
      else uncachedLogoPaths.push(path)
    }
    const { data: logoSigned } = uncachedLogoPaths.length > 0
      ? await supabase.storage.from('club-logos').createSignedUrls(uncachedLogoPaths, 3600)
      : { data: [] }
    for (const item of logoSigned ?? []) {
      if (item.signedUrl && item.path) {
        setCachedUrl(`club-logos:${item.path}`, item.signedUrl)
        logoSignedMap[item.path] = item.signedUrl
      }
    }
  }

  const data: JoueurListItem[] = ((childRows ?? []) as unknown as Record<string, unknown>[]).map(r => {
    const st = statusMap[r.id as string] ?? null
    const photoPath = photoPathMap[r.id as string] ?? null
    const clubDir = r.club_directory as { club_relation_type: string; logo_path: string | null } | null
    return {
      id              : r.id              as string,
      displayName     : r.display_name    as string,
      nom             : (r.nom            as string | null) ?? null,
      prenom          : (r.prenom         as string | null) ?? null,
      birthDate       : (r.birth_date     as string | null) ?? null,
      currentClub     : (r.current_club   as string | null) ?? null,
      niveauClub      : (r.niveau_club    as string | null) ?? null,
      clubDirectoryId : (r.club_directory_id as string | null) ?? null,
      isClubPartner   : clubDir?.club_relation_type === 'partenaire',
      computedStatus     : st?.computedStatus      ?? null,
      totalAcademySeasons: st?.totalAcademySeasons ?? 0,
      inCurrentSeason    : st?.inCurrentSeason     ?? false,
      currentSeasonLabel : st?.currentSeasonLabel  ?? null,
      totalStages        : st?.totalStages         ?? 0,
      currentPhotoUrl    : photoPath ? (signedMap[photoPath] ?? null) : null,
      ageCategory        : (r.age_category     as FootballAgeCategory | null) ?? null,
      playerType         : (r.player_type      as 'youth' | 'senior' | null) ?? null,
      youthLevel         : (r.youth_level      as string | null) ?? null,
      seniorDivision     : (r.senior_division  as string | null) ?? null,
      teamLevelStars     : (r.team_level_stars as number | null) ?? null,
      clubLogoUrl        : logoPathMap[r.id as string]
        ? (logoSignedMap[logoPathMap[r.id as string]] ?? null)
        : null,
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

// ── Joueurs par club (liaison implicite via club_directory_id) ─────────────────

/**
 * Liste les joueurs de l'annuaire rattachés à un club via club_directory_id.
 * Résultat : joueurs actifs uniquement (deleted_at IS NULL, actif = true).
 * Utilisé dans la fiche club pour afficher la liaison implicite (auto-match Notion).
 */
export async function listChildrenByClubDirectoryId(
  clubId: string,
): Promise<{ data: Array<{ id: string; displayName: string; statut: string | null; niveauClub: string | null }>; error: unknown }> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('id, display_name, statut, niveau_club')
    .eq('club_directory_id', clubId)
    .eq('actif', true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true })

  if (error) return { data: [], error }

  const rows = (data as Array<{ id: string; display_name: string; statut: string | null; niveau_club: string | null }>)
    .map(r => ({
      id         : r.id,
      displayName: r.display_name,
      statut     : r.statut,
      niveauClub : r.niveau_club,
    }))

  return { data: rows, error: null }
}

// ── Compteur saison courante ────────────────────────────────────────────────────

/**
 * Retourne le nombre de joueurs ayant un membership dans la saison académique courante.
 * Source de vérité : `v_child_academy_status` WHERE `in_current_season = true`.
 * Utilisé par le KPI "Joueurs actifs" du dashboard admin.
 */
export async function countActivePlayersCurrentSeason(): Promise<number> {
  const { count, error } = await supabase
    .from('v_child_academy_status')
    .select('*', { count: 'exact', head: true })
    .eq('in_current_season', true)
  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[countActivePlayersCurrentSeason]', error)
    return 0
  }
  return count ?? 0
}

// ── Story 49-7 — Club calculé depuis l'historique football (vue v_child_current_club) ──

/**
 * Retourne le club de la saison académique courante pour un joueur,
 * calculé automatiquement depuis child_directory_history via la vue v_child_current_club.
 * Retourne null si aucune entrée pour la saison courante ou en cas d'erreur.
 */
export async function getChildCurrentClubFromHistory(
  childId: string,
): Promise<ChildCurrentClubFromHistory | null> {
  const { data, error } = await supabase
    .from('v_child_current_club')
    .select('child_id, saison, club_nom, club_directory_id, club_nom_annuaire')
    .eq('child_id', childId)
    .maybeSingle()
  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production')
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[getChildCurrentClubFromHistory] error:', error)
    return null
  }
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    childId         : row.child_id           as string,
    saison          : row.saison             as string,
    clubNom         : row.club_nom           as string,
    clubDirectoryId : (row.club_directory_id as string | null) ?? null,
    clubNomAnnuaire : (row.club_nom_annuaire as string | null) ?? null,
  }
}
