// Epic 85 — Story 85.1 : CRUD contacts commerciaux
import { supabase } from '../supabase'
import type {
  CommercialContact,
  CommercialContactWithCommercial,
  CreateCommercialContactParams,
  UpdateCommercialContactParams,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRow(r: Record<string, unknown>): CommercialContact {
  return {
    id             : r.id as string,
    tenantId       : r.tenant_id as string,
    clubDirectoryId: r.club_directory_id as string,
    commercialId   : r.commercial_id as string,
    contactName    : r.contact_name as string,
    contactRole    : (r.contact_role as string | null) ?? null,
    status         : r.status as CommercialContact['status'],
    note           : (r.note as string | null) ?? null,
    contactedAt    : r.contacted_at as string,
    createdAt      : r.created_at as string,
    updatedAt      : r.updated_at as string,
    deletedAt      : (r.deleted_at as string | null) ?? null,
  }
}

function mapRowWithCommercial(r: Record<string, unknown>): CommercialContactWithCommercial {
  const base = mapRow(r)
  // display_name vient du join profiles ou raw_user_meta_data
  const displayName = (r.commercial_display_name as string | null)
    ?? (r.commercial_email as string | null)
    ?? 'Inconnu'
  return { ...base, commercialDisplayName: displayName }
}

// ── Requêtes ───────────────────────────────────────────────────────────────

/**
 * Enrichit les contacts avec le display_name du commercial via profiles.
 * Pas de FK directe commercial_contacts → profiles, donc lookup séparé.
 */
async function enrichWithCommercialNames(
  rows: Record<string, unknown>[],
): Promise<CommercialContactWithCommercial[]> {
  if (rows.length === 0) return []

  const commercialIds = [...new Set(rows.map(r => r.commercial_id as string))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', commercialIds)

  const nameMap = new Map<string, string>()
  if (profiles) {
    for (const p of profiles as { user_id: string; display_name: string }[]) {
      nameMap.set(p.user_id, p.display_name)
    }
  }

  return rows.map(r => mapRowWithCommercial({
    ...r,
    commercial_display_name: nameMap.get(r.commercial_id as string) ?? null,
    commercial_email       : null,
  }))
}

/**
 * Liste tous les contacts commerciaux d'un club donné.
 */
export async function listCommercialContactsByClub(
  clubDirectoryId: string,
): Promise<CommercialContactWithCommercial[]> {
  const { data, error } = await supabase
    .from('commercial_contacts')
    .select('*')
    .eq('club_directory_id', clubDirectoryId)
    .is('deleted_at', null)
    .order('contacted_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] listByClub error:', error)
    return []
  }

  return enrichWithCommercialNames(data as Record<string, unknown>[])
}

/**
 * Liste TOUS les contacts commerciaux (tous clubs confondus).
 * Utilisé par la vue admin pour les compteurs et filtres.
 */
export async function listAllCommercialContacts(): Promise<CommercialContactWithCommercial[]> {
  const { data, error } = await supabase
    .from('commercial_contacts')
    .select('*')
    .is('deleted_at', null)
    .order('contacted_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] listAll error:', error)
    return []
  }

  return enrichWithCommercialNames(data as Record<string, unknown>[])
}

/**
 * Crée un nouveau contact commercial.
 * Le commercial_id et tenant_id sont injectés côté serveur via RLS/JWT.
 */
export async function createCommercialContact(
  params: CreateCommercialContactParams,
): Promise<CommercialContact> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Non authentifié')

  const tenantId = (userData.user.app_metadata as Record<string, unknown>)?.tenant_id as string
  if (!tenantId) throw new Error('Tenant ID manquant')

  const payload: Record<string, unknown> = {
    tenant_id        : tenantId,
    club_directory_id: params.clubDirectoryId,
    commercial_id    : userData.user.id,
    contact_name     : params.contactName,
    contact_role     : params.contactRole ?? null,
    status           : params.status ?? 'premier_contact',
    note             : params.note ?? null,
    contacted_at     : params.contactedAt ?? new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('commercial_contacts')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] create error:', error)
    throw error
  }

  return mapRow(data as Record<string, unknown>)
}

/**
 * Met à jour un contact commercial existant (statut + note uniquement).
 * Seul le commercial propriétaire peut modifier (RLS).
 */
export async function updateCommercialContact(
  params: UpdateCommercialContactParams,
): Promise<CommercialContact> {
  const payload: Record<string, unknown> = {}
  if (params.status !== undefined) payload.status = params.status
  if (params.note !== undefined) payload.note = params.note

  const { data, error } = await supabase
    .from('commercial_contacts')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] update error:', error)
    throw error
  }

  return mapRow(data as Record<string, unknown>)
}
