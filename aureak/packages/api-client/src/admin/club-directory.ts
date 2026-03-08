// @aureak/api-client — Annuaire des clubs belges (migration 00033)
// Entité organisationnelle pure — distincte de la table `clubs` (portail auth)

import { supabase } from '../supabase'
import type { ClubDirectoryEntry, BelgianProvince } from '@aureak/types'

// ============================================================
// Params
// ============================================================

export type ClubDirectoryFields = {
  nom                         : string
  matricule?                  : string | null
  label?                      : string | null
  province?                   : BelgianProvince | null
  adresseRue?                 : string | null
  codePostal?                 : string | null
  ville?                      : string | null
  siteInternet?               : string | null
  correspondant?              : string | null
  emailPrincipal?             : string | null
  telephonePrincipal?         : string | null
  responsableSportif?         : string | null
  emailResponsableSportif?    : string | null
  telephoneResponsableSportif?: string | null
  clubPartenaire?             : boolean
  actif?                      : boolean
  notesInternes?              : string | null
}

export type CreateClubDirectoryParams = ClubDirectoryFields & {
  tenantId : string
  createdBy: string
}

export type UpdateClubDirectoryParams = ClubDirectoryFields & {
  clubId   : string
  tenantId : string
  updatedBy: string
}

export type ListClubDirectoryOpts = {
  search?    : string
  province?  : BelgianProvince
  partenaire?: boolean
  actif?     : boolean
  page?      : number
  pageSize?  : number
}

// ============================================================
// Mapper DB row → TS type
// ============================================================

function mapRow(r: Record<string, unknown>): ClubDirectoryEntry {
  return {
    id                          : r.id as string,
    tenantId                    : r.tenant_id as string,
    nom                         : r.nom as string,
    matricule                   : (r.matricule as string | null) ?? null,
    label                       : (r.label as string | null) ?? null,
    province                    : (r.province as BelgianProvince | null) ?? null,
    adresseRue                  : (r.adresse_rue as string | null) ?? null,
    codePostal                  : (r.code_postal as string | null) ?? null,
    ville                       : (r.ville as string | null) ?? null,
    siteInternet                : (r.site_internet as string | null) ?? null,
    correspondant               : (r.correspondant as string | null) ?? null,
    emailPrincipal              : (r.email_principal as string | null) ?? null,
    telephonePrincipal          : (r.telephone_principal as string | null) ?? null,
    responsableSportif          : (r.responsable_sportif as string | null) ?? null,
    emailResponsableSportif     : (r.email_responsable_sportif as string | null) ?? null,
    telephoneResponsableSportif : (r.telephone_responsable_sportif as string | null) ?? null,
    clubPartenaire              : r.club_partenaire as boolean,
    actif                       : r.actif as boolean,
    notesInternes               : (r.notes_internes as string | null) ?? null,
    notionPageId                : (r.notion_page_id as string | null) ?? null,
    notionSyncedAt              : (r.notion_synced_at as string | null) ?? null,
    deletedAt                   : (r.deleted_at as string | null) ?? null,
    createdAt                   : r.created_at as string,
    updatedAt                   : r.updated_at as string,
  }
}

function toDbPayload(fields: ClubDirectoryFields) {
  return {
    nom                          : fields.nom,
    matricule                    : fields.matricule ?? null,
    label                        : fields.label ?? null,
    province                     : fields.province ?? null,
    adresse_rue                  : fields.adresseRue ?? null,
    code_postal                  : fields.codePostal ?? null,
    ville                        : fields.ville ?? null,
    site_internet                : fields.siteInternet ?? null,
    correspondant                : fields.correspondant ?? null,
    email_principal              : fields.emailPrincipal ?? null,
    telephone_principal          : fields.telephonePrincipal ?? null,
    responsable_sportif          : fields.responsableSportif ?? null,
    email_responsable_sportif    : fields.emailResponsableSportif ?? null,
    telephone_responsable_sportif: fields.telephoneResponsableSportif ?? null,
    club_partenaire              : fields.clubPartenaire ?? false,
    actif                        : fields.actif ?? true,
    notes_internes               : fields.notesInternes ?? null,
  }
}

// ============================================================
// CRUD
// ============================================================

/**
 * Liste tous les clubs de l'annuaire avec filtres optionnels.
 */
export async function listClubDirectory(
  opts: ListClubDirectoryOpts = {},
): Promise<{ data: ClubDirectoryEntry[]; count: number; error: unknown }> {
  const page     = opts.page ?? 0
  const pageSize = opts.pageSize ?? 50

  let query = supabase
    .from('club_directory')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('nom', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (opts.search) {
    const s = opts.search.replace(/[%_]/g, '\\$&')
    query = query.or(
      `nom.ilike.%${s}%,matricule.ilike.%${s}%,ville.ilike.%${s}%,email_principal.ilike.%${s}%`,
    )
  }
  if (opts.province !== undefined) {
    query = query.eq('province', opts.province)
  }
  if (opts.partenaire !== undefined) {
    query = query.eq('club_partenaire', opts.partenaire)
  }
  if (opts.actif !== undefined) {
    query = query.eq('actif', opts.actif)
  }

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error }

  return {
    data : (data as Record<string, unknown>[]).map(mapRow),
    count: count ?? 0,
    error: null,
  }
}

/**
 * Récupère un club par son ID.
 */
export async function getClubDirectoryEntry(
  clubId: string,
): Promise<{ data: ClubDirectoryEntry | null; error: unknown }> {
  const { data, error } = await supabase
    .from('club_directory')
    .select('*')
    .eq('id', clubId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return { data: null, error: error ?? 'not_found' }
  return { data: mapRow(data as Record<string, unknown>), error: null }
}

/**
 * Crée une fiche club dans l'annuaire.
 */
export async function createClubDirectoryEntry(
  params: CreateClubDirectoryParams,
): Promise<{ data: ClubDirectoryEntry | null; error: unknown }> {
  const { data, error } = await supabase
    .from('club_directory')
    .insert({ tenant_id: params.tenantId, ...toDbPayload(params) })
    .select()
    .single()

  if (error || !data) return { data: null, error: error ?? 'insert_failed' }

  const entry = mapRow(data as Record<string, unknown>)

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.createdBy,
    entity_type: 'club_directory',
    entity_id  : entry.id,
    action     : 'club_directory_created',
    metadata   : { nom: params.nom, matricule: params.matricule ?? null },
  })

  return { data: entry, error: null }
}

/**
 * Met à jour une fiche club.
 */
export async function updateClubDirectoryEntry(
  params: UpdateClubDirectoryParams,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_directory')
    .update(toDbPayload(params))
    .eq('id', params.clubId)

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.updatedBy,
    entity_type: 'club_directory',
    entity_id  : params.clubId,
    action     : 'club_directory_updated',
    metadata   : { nom: params.nom },
  })

  return { error: null }
}

/**
 * Suppression logique (soft-delete) d'une fiche club.
 */
export async function softDeleteClubDirectoryEntry(params: {
  clubId   : string
  tenantId : string
  deletedBy: string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_directory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.clubId)

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.deletedBy,
    entity_type: 'club_directory',
    entity_id  : params.clubId,
    action     : 'club_directory_deleted',
    metadata   : {},
  })

  return { error: null }
}

// ============================================================
// Liaisons enfants — avec link_type (migration 00051)
// ============================================================

export type ClubChildLinkRow = {
  childId    : string
  displayName: string | null
  statut     : string | null   // Académicien | Nouveau | Stagiaire | Ancien
  niveauClub : string | null   // Provinciaux | Interprovinciaux | …
  linkType   : 'current' | 'affiliated'
  createdAt  : string
}

/**
 * Liste les joueurs liés à un club, filtrés optionnellement par link_type.
 * Joint child_directory (annuaire Notion) pour afficher nom + contexte.
 */
export async function listChildrenOfClub(
  clubId   : string,
  linkType?: 'current' | 'affiliated',
): Promise<{ data: ClubChildLinkRow[]; error: unknown }> {
  let q = supabase
    .from('club_directory_child_links')
    .select('child_id, link_type, created_at, child_directory(display_name, statut, niveau_club)')
    .eq('club_id', clubId)
    .order('link_type', { ascending: true })

  if (linkType) q = q.eq('link_type', linkType)

  const { data, error } = await q
  if (error) return { data: [], error }

  const rows = (data as unknown as Array<{
    child_id        : string
    link_type       : 'current' | 'affiliated'
    created_at      : string
    child_directory : { display_name: string | null; statut: string | null; niveau_club: string | null } | null
  }>).map(r => ({
    childId    : r.child_id,
    displayName: r.child_directory?.display_name ?? null,
    statut     : r.child_directory?.statut ?? null,
    niveauClub : r.child_directory?.niveau_club ?? null,
    linkType   : r.link_type,
    createdAt  : r.created_at,
  }))

  return { data: rows, error: null }
}

/** Raccourcis sémantiques */
export const listCurrentPlayersOfClub   = (clubId: string) => listChildrenOfClub(clubId, 'current')
export const listAffiliatedPlayersOfClub = (clubId: string) => listChildrenOfClub(clubId, 'affiliated')

/**
 * Lie un joueur à un club avec un type de relation explicite.
 * Idempotent sur (club_id, child_id, link_type) — silencieux si déjà existant.
 */
export async function linkChildToClubDirectory(params: {
  clubId   : string
  childId  : string
  linkType : 'current' | 'affiliated'
  tenantId : string
  linkedBy : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_directory_child_links')
    .upsert(
      { club_id: params.clubId, child_id: params.childId, link_type: params.linkType, tenant_id: params.tenantId },
      { onConflict: 'club_id,child_id,link_type', ignoreDuplicates: true },
    )

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.linkedBy,
    entity_type: 'club_directory_child_link',
    entity_id  : params.childId,
    action     : 'child_linked_to_club_directory',
    metadata   : { club_id: params.clubId, link_type: params.linkType },
  })

  return { error: null }
}

/**
 * Retire le lien d'un joueur avec un club pour un type de relation donné.
 */
export async function unlinkChildFromClubDirectory(params: {
  clubId   : string
  childId  : string
  linkType : 'current' | 'affiliated'
  tenantId : string
  linkedBy : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_directory_child_links')
    .delete()
    .eq('club_id', params.clubId)
    .eq('child_id', params.childId)
    .eq('link_type', params.linkType)

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.linkedBy,
    entity_type: 'club_directory_child_link',
    entity_id  : params.childId,
    action     : 'child_unlinked_from_club_directory',
    metadata   : { club_id: params.clubId, link_type: params.linkType },
  })

  return { error: null }
}

// ============================================================
// Liaisons coachs
// ============================================================

export async function listCoachesOfClub(
  clubId: string,
): Promise<{ data: Array<{ coachId: string; displayName: string | null; createdAt: string }>; error: unknown }> {
  const { data, error } = await supabase
    .from('club_directory_coach_links')
    .select('coach_id, created_at, profiles(display_name)')
    .eq('club_id', clubId)

  if (error) return { data: [], error }

  const rows = (data as unknown as Array<{
    coach_id: string
    created_at: string
    profiles: { display_name: string | null } | null
  }>).map(r => ({
    coachId    : r.coach_id,
    displayName: r.profiles?.display_name ?? null,
    createdAt  : r.created_at,
  }))

  return { data: rows, error: null }
}

export async function linkCoachToClubDirectory(params: {
  clubId   : string
  coachId  : string
  tenantId : string
  linkedBy : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase.from('club_directory_coach_links').insert({
    club_id  : params.clubId,
    coach_id : params.coachId,
    tenant_id: params.tenantId,
  })
  return { error: error ?? null }
}

export async function unlinkCoachFromClubDirectory(params: {
  clubId   : string
  coachId  : string
  tenantId : string
  linkedBy : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_directory_coach_links')
    .delete()
    .eq('club_id', params.clubId)
    .eq('coach_id', params.coachId)
  return { error: error ?? null }
}
