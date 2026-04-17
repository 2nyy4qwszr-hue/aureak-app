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
 * Liste tous les contacts commerciaux d'un club donné.
 * Retourne les contacts avec le nom d'affichage du commercial.
 */
export async function listCommercialContactsByClub(
  clubDirectoryId: string,
): Promise<CommercialContactWithCommercial[]> {
  // On fait un select avec un join manuel via profiles pour le display name
  const { data, error } = await supabase
    .from('commercial_contacts')
    .select(`
      *,
      profiles!commercial_contacts_commercial_id_fkey(display_name, email)
    `)
    .eq('club_directory_id', clubDirectoryId)
    .is('deleted_at', null)
    .order('contacted_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] listByClub error:', error)
    return []
  }

  return (data as Record<string, unknown>[]).map((r) => {
    const profile = r.profiles as Record<string, unknown> | null
    return mapRowWithCommercial({
      ...r,
      commercial_display_name: profile?.display_name ?? null,
      commercial_email       : profile?.email ?? null,
    })
  })
}

/**
 * Liste TOUS les contacts commerciaux (tous clubs confondus).
 * Utilisé par la vue admin pour les compteurs et filtres.
 */
export async function listAllCommercialContacts(): Promise<CommercialContactWithCommercial[]> {
  const { data, error } = await supabase
    .from('commercial_contacts')
    .select(`
      *,
      profiles!commercial_contacts_commercial_id_fkey(display_name, email)
    `)
    .is('deleted_at', null)
    .order('contacted_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-contacts] listAll error:', error)
    return []
  }

  return (data as Record<string, unknown>[]).map((r) => {
    const profile = r.profiles as Record<string, unknown> | null
    return mapRowWithCommercial({
      ...r,
      commercial_display_name: profile?.display_name ?? null,
      commercial_email       : profile?.email ?? null,
    })
  })
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
