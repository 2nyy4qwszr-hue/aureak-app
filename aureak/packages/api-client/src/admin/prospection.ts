// Epic 88 — Story 88.2 : API CRUD pipeline CRM clubs prospects + contacts
import { supabase } from '../supabase'
import type {
  ClubProspect,
  ProspectContact,
  ClubProspectWithContacts,
  ClubProspectListRow,
  CreateClubProspectParams,
  UpdateClubProspectParams,
  CreateProspectContactParams,
  UpdateProspectContactParams,
  ClubProspectStatus,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapProspect(r: Record<string, unknown>): ClubProspect {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    clubName             : r.club_name as string,
    city                 : (r.city as string | null) ?? null,
    targetImplantationId : (r.target_implantation_id as string | null) ?? null,
    status               : r.status as ClubProspectStatus,
    assignedCommercialId : r.assigned_commercial_id as string,
    source               : (r.source as string | null) ?? null,
    notes                : (r.notes as string | null) ?? null,
    createdAt            : r.created_at as string,
    updatedAt            : r.updated_at as string,
    deletedAt            : (r.deleted_at as string | null) ?? null,
  }
}

function mapContact(r: Record<string, unknown>): ProspectContact {
  return {
    id              : r.id as string,
    clubProspectId  : r.club_prospect_id as string,
    firstName       : r.first_name as string,
    lastName        : r.last_name as string,
    role            : r.role as ProspectContact['role'],
    email           : (r.email as string | null) ?? null,
    phone           : (r.phone as string | null) ?? null,
    isDecisionnaire : Boolean(r.is_decisionnaire),
    notes           : (r.notes as string | null) ?? null,
    createdAt       : r.created_at as string,
    updatedAt       : r.updated_at as string,
    deletedAt       : (r.deleted_at as string | null) ?? null,
  }
}

// Lookup display_name pour un ensemble d'userIds (commerciaux)
async function buildDisplayNameMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] displayName lookup error:', error)
    return new Map()
  }

  const m = new Map<string, string>()
  for (const p of (data ?? []) as { user_id: string; display_name: string | null }[]) {
    if (p.display_name) m.set(p.user_id, p.display_name)
  }
  return m
}

// ── Liste pipeline ─────────────────────────────────────────────────────────

export type ListClubProspectsFilters = {
  status?       : ClubProspectStatus
  commercialId? : string
}

export async function listClubProspects(
  filters: ListClubProspectsFilters = {},
): Promise<ClubProspectListRow[]> {
  let q = supabase
    .from('club_prospects')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (filters.status)       q = q.eq('status', filters.status)
  if (filters.commercialId) q = q.eq('assigned_commercial_id', filters.commercialId)

  const { data: prospects, error } = await q

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] listClubProspects error:', error)
    return []
  }

  const rows = (prospects ?? []) as Record<string, unknown>[]
  if (rows.length === 0) return []

  const prospectIds = rows.map(r => r.id as string)

  // Compte + décisionnaire par prospect
  const { data: contactsRaw } = await supabase
    .from('prospect_contacts')
    .select('*')
    .in('club_prospect_id', prospectIds)
    .is('deleted_at', null)

  const contactsByProspect = new Map<string, ProspectContact[]>()
  for (const c of (contactsRaw ?? []) as Record<string, unknown>[]) {
    const mapped = mapContact(c)
    const arr = contactsByProspect.get(mapped.clubProspectId) ?? []
    arr.push(mapped)
    contactsByProspect.set(mapped.clubProspectId, arr)
  }

  const commercialIds = [...new Set(rows.map(r => r.assigned_commercial_id as string))]
  const nameMap = await buildDisplayNameMap(commercialIds)

  return rows.map(r => {
    const base = mapProspect(r)
    const contacts = contactsByProspect.get(base.id) ?? []
    const dec = contacts.find(c => c.isDecisionnaire)
    return {
      ...base,
      contactsCount       : contacts.length,
      decisionnaireName   : dec ? `${dec.firstName} ${dec.lastName}` : null,
      assignedDisplayName : nameMap.get(base.assignedCommercialId) ?? null,
    }
  })
}

export async function getClubProspect(id: string): Promise<ClubProspectWithContacts | null> {
  const { data, error } = await supabase
    .from('club_prospects')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] getClubProspect error:', error)
    return null
  }
  if (!data) return null

  const base = mapProspect(data as Record<string, unknown>)

  const { data: contactsRaw } = await supabase
    .from('prospect_contacts')
    .select('*')
    .eq('club_prospect_id', id)
    .is('deleted_at', null)
    .order('is_decisionnaire', { ascending: false })
    .order('last_name', { ascending: true })

  const contacts = ((contactsRaw ?? []) as Record<string, unknown>[]).map(mapContact)

  const nameMap = await buildDisplayNameMap([base.assignedCommercialId])
  return {
    ...base,
    contacts,
    assignedDisplayName: nameMap.get(base.assignedCommercialId) ?? null,
  }
}

// ── Mutations prospect ─────────────────────────────────────────────────────

export async function createClubProspect(params: CreateClubProspectParams): Promise<ClubProspect> {
  const { data: session } = await supabase.auth.getSession()
  const user = session.session?.user
  if (!user) throw new Error('Non authentifié')
  const tenantId = (user.user_metadata?.tenant_id as string | undefined)
    ?? (user.app_metadata?.tenant_id as string | undefined)
  if (!tenantId) throw new Error('tenant_id absent du JWT')

  const payload: Record<string, unknown> = {
    tenant_id              : tenantId,
    club_name              : params.clubName,
    city                   : params.city ?? null,
    target_implantation_id : params.targetImplantationId ?? null,
    status                 : params.status ?? 'premier_contact',
    assigned_commercial_id : params.assignedCommercialId ?? user.id,
    source                 : params.source ?? null,
    notes                  : params.notes ?? null,
  }

  const { data, error } = await supabase
    .from('club_prospects')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] create error:', error)
    throw error
  }
  return mapProspect(data as Record<string, unknown>)
}

export async function updateClubProspect(params: UpdateClubProspectParams): Promise<ClubProspect> {
  const payload: Record<string, unknown> = {}
  if (params.clubName             !== undefined) payload.club_name              = params.clubName
  if (params.city                 !== undefined) payload.city                   = params.city
  if (params.targetImplantationId !== undefined) payload.target_implantation_id = params.targetImplantationId
  if (params.status               !== undefined) payload.status                 = params.status
  if (params.source               !== undefined) payload.source                 = params.source
  if (params.notes                !== undefined) payload.notes                  = params.notes
  if (params.assignedCommercialId !== undefined) payload.assigned_commercial_id = params.assignedCommercialId

  const { data, error } = await supabase
    .from('club_prospects')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] update error:', error)
    throw error
  }
  return mapProspect(data as Record<string, unknown>)
}

export async function updateClubProspectStatusById(id: string, status: ClubProspectStatus): Promise<ClubProspect> {
  return updateClubProspect({ id, status })
}

// ── Mutations contacts ─────────────────────────────────────────────────────

export async function addProspectContact(params: CreateProspectContactParams): Promise<ProspectContact> {
  const payload: Record<string, unknown> = {
    club_prospect_id : params.clubProspectId,
    first_name       : params.firstName,
    last_name        : params.lastName,
    role             : params.role,
    email            : params.email ?? null,
    phone            : params.phone ?? null,
    is_decisionnaire : params.isDecisionnaire ?? false,
    notes            : params.notes ?? null,
  }

  const { data, error } = await supabase
    .from('prospect_contacts')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] addContact error:', error)
    throw error
  }
  return mapContact(data as Record<string, unknown>)
}

export async function updateProspectContact(params: UpdateProspectContactParams): Promise<ProspectContact> {
  const payload: Record<string, unknown> = {}
  if (params.firstName       !== undefined) payload.first_name       = params.firstName
  if (params.lastName        !== undefined) payload.last_name        = params.lastName
  if (params.role            !== undefined) payload.role             = params.role
  if (params.email           !== undefined) payload.email            = params.email
  if (params.phone           !== undefined) payload.phone            = params.phone
  if (params.isDecisionnaire !== undefined) payload.is_decisionnaire = params.isDecisionnaire
  if (params.notes           !== undefined) payload.notes            = params.notes

  const { data, error } = await supabase
    .from('prospect_contacts')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] updateContact error:', error)
    throw error
  }
  return mapContact(data as Record<string, unknown>)
}

/** Soft-delete d'un contact (deleted_at = NOW) */
export async function deleteProspectContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] deleteContact error:', error)
    throw error
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────

export type ProspectPipelineStats = {
  total           : number
  inClosing       : number
  convertedMonth  : number
  contactsMonth   : number
}

export async function getProspectPipelineStats(): Promise<ProspectPipelineStats> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [totalRes, closingRes, convertedRes, contactsRes] = await Promise.all([
    supabase.from('club_prospects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('club_prospects').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'closing'),
    supabase.from('club_prospects').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'converti').gte('updated_at', monthStart),
    supabase.from('prospect_contacts').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', monthStart),
  ])

  return {
    total          : totalRes.count ?? 0,
    inClosing      : closingRes.count ?? 0,
    convertedMonth : convertedRes.count ?? 0,
    contactsMonth  : contactsRes.count ?? 0,
  }
}
