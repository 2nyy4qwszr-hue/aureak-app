// Story 88.2 — Pipeline CRM Clubs : CRUD club_prospects + prospect_contacts
// Story 88.3 — Actions commerciales (prospect_actions)
import { supabase } from '../supabase'
import type {
  ClubProspect,
  ClubProspectWithContacts,
  ClubProspectListItem,
  ProspectContact,
  CreateClubProspectParams,
  UpdateClubProspectParams,
  CreateProspectContactParams,
  UpdateProspectContactParams,
  ProspectAction,
  CreateProspectActionParams,
} from '@aureak/types'
import type { ProspectStatus } from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapProspectRow(r: Record<string, unknown>): ClubProspect {
  return {
    id                  : r.id as string,
    tenantId            : r.tenant_id as string,
    clubName            : r.club_name as string,
    city                : r.city as string,
    targetImplantationId: (r.target_implantation_id as string | null) ?? null,
    status              : r.status as ClubProspect['status'],
    assignedCommercialId: r.assigned_commercial_id as string,
    source              : (r.source as string | null) ?? null,
    notes               : (r.notes as string | null) ?? null,
    createdAt           : r.created_at as string,
    updatedAt           : r.updated_at as string,
    deletedAt           : (r.deleted_at as string | null) ?? null,
  }
}

function mapContactRow(r: Record<string, unknown>): ProspectContact {
  return {
    id             : r.id as string,
    clubProspectId : r.club_prospect_id as string,
    firstName      : r.first_name as string,
    lastName       : r.last_name as string,
    role           : r.role as ProspectContact['role'],
    email          : (r.email as string | null) ?? null,
    phone          : (r.phone as string | null) ?? null,
    isDecisionnaire: r.is_decisionnaire as boolean,
    notes          : (r.notes as string | null) ?? null,
    createdAt      : r.created_at as string,
    updatedAt      : r.updated_at as string,
    deletedAt      : (r.deleted_at as string | null) ?? null,
  }
}

// ── Requêtes ───────────────────────────────────────────────────────────────

/**
 * Liste les club prospects du tenant, avec enrichissement contacts count + décisionnaire + nom commercial.
 * Filtrable par statut et/ou commercial assigné.
 */
export async function listClubProspects(
  filters?: { status?: ProspectStatus; commercialId?: string },
): Promise<ClubProspectListItem[]> {
  let query = supabase
    .from('club_prospects')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.commercialId) {
    query = query.eq('assigned_commercial_id', filters.commercialId)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return []

  const rows = data as Record<string, unknown>[]
  const prospectIds = rows.map(r => r.id as string)

  // Fetch contacts for all prospects in a single query
  const { data: contactsData, error: contactsError } = await supabase
    .from('prospect_contacts')
    .select('*')
    .in('club_prospect_id', prospectIds)
    .is('deleted_at', null)

  if (contactsError) {
    if (process.env.NODE_ENV !== 'production') console.error('[listClubProspects] contacts error:', contactsError)
  }

  const contactsByProspect = new Map<string, Record<string, unknown>[]>()
  if (contactsData) {
    for (const c of contactsData as Record<string, unknown>[]) {
      const pid = c.club_prospect_id as string
      const arr = contactsByProspect.get(pid) ?? []
      arr.push(c)
      contactsByProspect.set(pid, arr)
    }
  }

  // Resolve commercial display names
  const commercialIds = [...new Set(rows.map(r => r.assigned_commercial_id as string))]
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

  return rows.map(r => {
    const base = mapProspectRow(r)
    const contacts = contactsByProspect.get(base.id) ?? []
    const decisionnaire = contacts.find(c => c.is_decisionnaire === true)

    return {
      ...base,
      contactsCount       : contacts.length,
      decisionnaireNom    : decisionnaire
        ? `${decisionnaire.first_name} ${decisionnaire.last_name}`
        : null,
      commercialDisplayName: nameMap.get(base.assignedCommercialId) ?? 'Inconnu',
    }
  })
}

/**
 * Récupère un prospect par ID avec tous ses contacts.
 */
export async function getClubProspect(id: string): Promise<ClubProspectWithContacts> {
  const { data, error } = await supabase
    .from('club_prospects')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error

  const prospect = mapProspectRow(data as Record<string, unknown>)

  const { data: contactsData, error: contactsError } = await supabase
    .from('prospect_contacts')
    .select('*')
    .eq('club_prospect_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (contactsError) throw contactsError

  const contacts = (contactsData as Record<string, unknown>[]).map(mapContactRow)

  return { ...prospect, contacts }
}

/**
 * Crée un nouveau club prospect. Le tenant_id et assigned_commercial_id sont résolus côté client.
 */
export async function createClubProspect(
  params: CreateClubProspectParams,
  tenantId: string,
  commercialId: string,
): Promise<ClubProspect> {
  const { data, error } = await supabase
    .from('club_prospects')
    .insert({
      tenant_id             : tenantId,
      club_name             : params.clubName,
      city                  : params.city,
      target_implantation_id: params.targetImplantationId ?? null,
      assigned_commercial_id: commercialId,
      source                : params.source ?? null,
      notes                 : params.notes ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapProspectRow(data as Record<string, unknown>)
}

/**
 * Met à jour un prospect (partiel).
 */
export async function updateClubProspect(
  id: string,
  params: UpdateClubProspectParams,
): Promise<ClubProspect> {
  const patch: Record<string, unknown> = {}
  if (params.clubName !== undefined)            patch.club_name = params.clubName
  if (params.city !== undefined)                patch.city = params.city
  if (params.targetImplantationId !== undefined) patch.target_implantation_id = params.targetImplantationId
  if (params.status !== undefined)              patch.status = params.status
  if (params.assignedCommercialId !== undefined) patch.assigned_commercial_id = params.assignedCommercialId
  if (params.source !== undefined)              patch.source = params.source
  if (params.notes !== undefined)               patch.notes = params.notes

  const { data, error } = await supabase
    .from('club_prospects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapProspectRow(data as Record<string, unknown>)
}

/**
 * Met à jour uniquement le statut d'un prospect.
 */
export async function updateClubProspectStatus(
  id: string,
  status: ProspectStatus,
): Promise<ClubProspect> {
  return updateClubProspect(id, { status })
}

/**
 * Ajoute un contact à un prospect.
 */
export async function addProspectContact(
  clubProspectId: string,
  params: CreateProspectContactParams,
): Promise<ProspectContact> {
  const { data, error } = await supabase
    .from('prospect_contacts')
    .insert({
      club_prospect_id: clubProspectId,
      first_name      : params.firstName,
      last_name       : params.lastName,
      role            : params.role ?? 'autre',
      email           : params.email ?? null,
      phone           : params.phone ?? null,
      is_decisionnaire: params.isDecisionnaire ?? false,
      notes           : params.notes ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapContactRow(data as Record<string, unknown>)
}

/**
 * Met à jour un contact prospect.
 */
export async function updateProspectContact(
  id: string,
  params: UpdateProspectContactParams,
): Promise<ProspectContact> {
  const patch: Record<string, unknown> = {}
  if (params.firstName !== undefined)       patch.first_name = params.firstName
  if (params.lastName !== undefined)        patch.last_name = params.lastName
  if (params.role !== undefined)            patch.role = params.role
  if (params.email !== undefined)           patch.email = params.email
  if (params.phone !== undefined)           patch.phone = params.phone
  if (params.isDecisionnaire !== undefined) patch.is_decisionnaire = params.isDecisionnaire
  if (params.notes !== undefined)           patch.notes = params.notes

  const { data, error } = await supabase
    .from('prospect_contacts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapContactRow(data as Record<string, unknown>)
}

/**
 * Soft-delete un contact prospect.
 */
export async function deleteProspectContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// ── Story 88.3 — Actions commerciales ──────────────────────────────────────

function mapActionRow(r: Record<string, unknown>): ProspectAction {
  return {
    id              : r.id as string,
    clubProspectId  : r.club_prospect_id as string,
    performedBy     : r.performed_by as string,
    actionType      : r.action_type as ProspectAction['actionType'],
    description     : (r.description as string | null) ?? null,
    createdAt       : r.created_at as string,
  }
}

/**
 * Liste les actions d'un prospect (chronologie inversée).
 * Résout les displayNames des performers via profiles.
 */
export async function listProspectActions(clubProspectId: string): Promise<ProspectAction[]> {
  const { data, error } = await supabase
    .from('prospect_actions')
    .select('*')
    .eq('club_prospect_id', clubProspectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  const rows = data as Record<string, unknown>[]
  const actions = rows.map(mapActionRow)

  // Résolution noms performers
  const performerIds = [...new Set(actions.map(a => a.performedBy))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', performerIds)

  const nameMap = new Map<string, string>()
  if (profiles) {
    for (const p of profiles as { user_id: string; display_name: string }[]) {
      nameMap.set(p.user_id, p.display_name)
    }
  }

  return actions.map(a => ({
    ...a,
    performerDisplayName: nameMap.get(a.performedBy) ?? 'Inconnu',
  }))
}

/**
 * Ajoute une action commerciale manuelle sur un prospect.
 */
export async function addProspectAction(params: CreateProspectActionParams): Promise<ProspectAction> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session?.session?.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('prospect_actions')
    .insert({
      club_prospect_id: params.clubProspectId,
      performed_by    : userId,
      action_type     : params.actionType,
      description     : params.description ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapActionRow(data as Record<string, unknown>)
}

/**
 * Liste les actions du commercial courant (toutes prospects).
 * Pour la vue "Mes actions".
 */
export async function listMyActions(
  filters?: { limit?: number; offset?: number },
): Promise<ProspectAction[]> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session?.session?.user?.id
  if (!userId) throw new Error('Not authenticated')

  let query = supabase
    .from('prospect_actions')
    .select('*')
    .eq('performed_by', userId)
    .order('created_at', { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return []

  const rows = data as Record<string, unknown>[]
  return rows.map(r => ({
    ...mapActionRow(r),
    performerDisplayName: undefined,
  }))
}
