// Epic 88 — Story 88.2 : API CRUD pipeline CRM clubs prospects + contacts
import { supabase } from '../supabase'
import type {
  ClubProspect,
  ProspectContact,
  ClubProspectWithContacts,
  ClubProspectListRow,
  ClubProspectDirectorySummary,
  CreateClubProspectParams,
  UpdateClubProspectParams,
  CreateProspectContactParams,
  UpdateProspectContactParams,
  ClubProspectStatus,
  ProspectAction,
  ProspectActionType,
  CreateProspectActionParams,
  AttributionRule,
  AttributionSuggestion,
  AttributionPercentages,
  AttributionResult,
  CreateAttributionRuleParams,
  UpdateAttributionRuleParams,
  BelgianProvince,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapProspect(r: Record<string, unknown>): ClubProspect {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    clubName             : r.club_name as string,
    city                 : (r.city as string | null) ?? null,
    targetImplantationId : (r.target_implantation_id as string | null) ?? null,
    clubDirectoryId      : (r.club_directory_id as string | null) ?? null,
    status               : r.status as ClubProspectStatus,
    assignedCommercialId : r.assigned_commercial_id as string,
    source               : (r.source as string | null) ?? null,
    notes                : (r.notes as string | null) ?? null,
    createdAt            : r.created_at as string,
    updatedAt            : r.updated_at as string,
    deletedAt            : (r.deleted_at as string | null) ?? null,
  }
}

async function fetchDirectorySummaries(
  ids: string[],
): Promise<Map<string, ClubProspectDirectorySummary>> {
  const m = new Map<string, ClubProspectDirectorySummary>()
  const filtered = [...new Set(ids.filter(Boolean))]
  if (filtered.length === 0) return m

  const { data, error } = await supabase
    .from('club_directory')
    .select('id, nom, matricule, ville, province, logo_path')
    .in('id', filtered)
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] directory summaries error:', error)
    return m
  }

  for (const r of (data ?? []) as Record<string, unknown>[]) {
    m.set(r.id as string, {
      id        : r.id as string,
      nom       : r.nom as string,
      matricule : (r.matricule as string | null) ?? null,
      ville     : (r.ville as string | null) ?? null,
      province  : (r.province as BelgianProvince | null) ?? null,
      logoPath  : (r.logo_path as string | null) ?? null,
    })
  }
  return m
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
  const [nameMap, directoryMap] = await Promise.all([
    buildDisplayNameMap(commercialIds),
    fetchDirectorySummaries(
      rows.map(r => r.club_directory_id as string | null).filter((v): v is string => !!v),
    ),
  ])

  return rows.map(r => {
    const base = mapProspect(r)
    const contacts = contactsByProspect.get(base.id) ?? []
    const dec = contacts.find(c => c.isDecisionnaire)
    return {
      ...base,
      contactsCount       : contacts.length,
      decisionnaireName   : dec ? `${dec.firstName} ${dec.lastName}` : null,
      assignedDisplayName : nameMap.get(base.assignedCommercialId) ?? null,
      directory           : base.clubDirectoryId ? directoryMap.get(base.clubDirectoryId) ?? null : null,
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
  const directoryMap = base.clubDirectoryId
    ? await fetchDirectorySummaries([base.clubDirectoryId])
    : new Map()

  return {
    ...base,
    contacts,
    assignedDisplayName: nameMap.get(base.assignedCommercialId) ?? null,
    directory: base.clubDirectoryId ? directoryMap.get(base.clubDirectoryId) ?? null : null,
  }
}

// ── Mutations prospect ─────────────────────────────────────────────────────

async function resolveTenantId(): Promise<{ userId: string; tenantId: string }> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) throw new Error('Non authentifié')

  // 1) JWT claims (app_metadata ou user_metadata) — source rapide
  const jwtTenant = (user.app_metadata?.tenant_id as string | undefined)
    ?? (user.user_metadata?.tenant_id as string | undefined)
  if (jwtTenant) return { userId: user.id, tenantId: jwtTenant }

  // 2) Fallback : lookup dans profiles (user_id → tenant_id)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile?.tenant_id) {
    throw new Error('tenant_id introuvable (ni JWT, ni profiles)')
  }
  return { userId: user.id, tenantId: profile.tenant_id as string }
}

export async function createClubProspect(params: CreateClubProspectParams): Promise<ClubProspect> {
  const { userId, tenantId } = await resolveTenantId()

  // Epic 96 : check doublon applicatif (meilleur UX que l'erreur unique index)
  if (params.clubDirectoryId) {
    const { data: existing } = await supabase
      .from('club_prospects')
      .select('id, status, assigned_commercial_id')
      .eq('tenant_id', tenantId)
      .eq('club_directory_id', params.clubDirectoryId)
      .is('deleted_at', null)
      .not('status', 'in', '(converti,perdu)')
      .maybeSingle()

    if (existing) {
      const dup = existing as { id: string; status: string; assigned_commercial_id: string }
      const nameMap = await buildDisplayNameMap([dup.assigned_commercial_id])
      const who = nameMap.get(dup.assigned_commercial_id) ?? 'un autre commercial'
      throw new Error(`Ce club a déjà un prospect actif (statut: ${dup.status}) assigné à ${who}.`)
    }
  }

  const payload: Record<string, unknown> = {
    tenant_id              : tenantId,
    club_name              : params.clubName,
    city                   : params.city ?? null,
    target_implantation_id : params.targetImplantationId ?? null,
    club_directory_id      : params.clubDirectoryId ?? null,
    status                 : params.status ?? 'premier_contact',
    assigned_commercial_id : params.assignedCommercialId ?? userId,
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
  if (params.clubDirectoryId      !== undefined) payload.club_directory_id      = params.clubDirectoryId

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

// ── Actions (story 88.3) ───────────────────────────────────────────────────

function mapAction(r: Record<string, unknown>): ProspectAction {
  return {
    id                   : r.id as string,
    clubProspectId       : r.club_prospect_id as string,
    performedBy          : r.performed_by as string,
    actionType           : r.action_type as ProspectActionType,
    description          : (r.description as string | null) ?? null,
    createdAt            : r.created_at as string,
    performerDisplayName : (r.performer_display_name as string | null) ?? null,
  }
}

/** Actions d'un prospect, triées du plus récent au plus ancien, avec display_name performer. */
export async function listProspectActions(clubProspectId: string): Promise<ProspectAction[]> {
  const { data, error } = await supabase
    .from('prospect_actions')
    .select('*')
    .eq('club_prospect_id', clubProspectId)
    .order('created_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] listProspectActions error:', error)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  if (rows.length === 0) return []

  const performerIds = [...new Set(rows.map(r => r.performed_by as string))]
  const nameMap = await buildDisplayNameMap(performerIds)

  return rows.map(r => mapAction({
    ...r,
    performer_display_name: nameMap.get(r.performed_by as string) ?? null,
  }))
}

/** Ajoute une action manuelle. performed_by = auth.uid() (enforced RLS). */
export async function addProspectAction(params: CreateProspectActionParams): Promise<ProspectAction> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Non authentifié')

  const payload: Record<string, unknown> = {
    club_prospect_id : params.clubProspectId,
    performed_by     : userData.user.id,
    action_type      : params.actionType,
    description      : params.description ?? null,
  }

  const { data, error } = await supabase
    .from('prospect_actions')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] addProspectAction error:', error)
    throw error
  }
  return mapAction(data as Record<string, unknown>)
}

export type ListMyActionsFilters = {
  limit?  : number
  offset? : number
}

/** Actions de l'utilisateur courant (pour vue "Mes actions" commercial). */
export async function listMyActions(filters: ListMyActionsFilters = {}): Promise<ProspectAction[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return []

  let q = supabase
    .from('prospect_actions')
    .select('*')
    .eq('performed_by', userData.user.id)
    .order('created_at', { ascending: false })

  if (filters.limit)  q = q.limit(filters.limit)
  if (filters.offset) q = q.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1)

  const { data, error } = await q

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] listMyActions error:', error)
    return []
  }
  return ((data ?? []) as Record<string, unknown>[]).map(r =>
    mapAction({ ...r, performer_display_name: null })
  )
}

// ── Règles d'attribution (story 88.4) ──────────────────────────────────────

function mapAttributionRule(r: Record<string, unknown>): AttributionRule {
  return {
    id          : r.id as string,
    tenantId    : r.tenant_id as string,
    ruleName    : r.rule_name as string,
    description : (r.description as string | null) ?? null,
    conditions  : (r.conditions as Record<string, unknown>) ?? {},
    percentages : (r.percentages as AttributionPercentages) ?? {},
    isDefault   : Boolean(r.is_default),
    createdAt   : r.created_at as string,
    updatedAt   : r.updated_at as string,
    deletedAt   : (r.deleted_at as string | null) ?? null,
  }
}

export async function listAttributionRules(): Promise<AttributionRule[]> {
  const { data, error } = await supabase
    .from('attribution_rules')
    .select('*')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('rule_name', { ascending: true })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] listAttributionRules error:', error)
    return []
  }
  return ((data ?? []) as Record<string, unknown>[]).map(mapAttributionRule)
}

export async function createAttributionRule(params: CreateAttributionRuleParams): Promise<AttributionRule> {
  const { tenantId } = await resolveTenantId()

  // Si la nouvelle règle est marquée par défaut, on démarque l'ancienne
  if (params.isDefault) {
    await supabase
      .from('attribution_rules')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .is('deleted_at', null)
  }

  const payload: Record<string, unknown> = {
    tenant_id   : tenantId,
    rule_name   : params.ruleName,
    description : params.description ?? null,
    conditions  : params.conditions ?? {},
    percentages : params.percentages,
    is_default  : params.isDefault ?? false,
  }

  const { data, error } = await supabase
    .from('attribution_rules')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] createAttributionRule error:', error)
    throw error
  }
  return mapAttributionRule(data as Record<string, unknown>)
}

export async function updateAttributionRule(params: UpdateAttributionRuleParams): Promise<AttributionRule> {
  // Si on marque comme défaut, démarquer les autres du tenant
  if (params.isDefault) {
    const { tenantId } = await resolveTenantId()
    await supabase
      .from('attribution_rules')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .neq('id', params.id)
      .is('deleted_at', null)
  }

  const payload: Record<string, unknown> = {}
  if (params.ruleName    !== undefined) payload.rule_name   = params.ruleName
  if (params.description !== undefined) payload.description = params.description
  if (params.percentages !== undefined) payload.percentages = params.percentages
  if (params.isDefault   !== undefined) payload.is_default  = params.isDefault
  if (params.conditions  !== undefined) payload.conditions  = params.conditions

  const { data, error } = await supabase
    .from('attribution_rules')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] updateAttributionRule error:', error)
    throw error
  }
  return mapAttributionRule(data as Record<string, unknown>)
}

/** Soft-delete (jamais la règle par défaut) */
export async function deleteAttributionRule(id: string): Promise<void> {
  const { data: rule } = await supabase
    .from('attribution_rules')
    .select('is_default')
    .eq('id', id)
    .maybeSingle()

  if (rule?.is_default) {
    throw new Error('Impossible de supprimer la règle par défaut. Définissez-en une autre comme défaut d\'abord.')
  }

  const { error } = await supabase
    .from('attribution_rules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] deleteAttributionRule error:', error)
    throw error
  }
}

/**
 * Suggestion d'attribution basée sur les actions commerciales + règle par défaut.
 * Pondération simple : part proportionnelle au nombre d'actions par commercial.
 */
export async function suggestAttribution(clubProspectId: string): Promise<AttributionSuggestion | null> {
  const rules = await listAttributionRules()
  const defaultRule = rules.find(r => r.isDefault)
  if (!defaultRule) return null

  const { data: actions } = await supabase
    .from('prospect_actions')
    .select('performed_by, action_type')
    .eq('club_prospect_id', clubProspectId)

  const countsByPerformer = new Map<string, number>()
  for (const a of (actions ?? []) as { performed_by: string; action_type: string }[]) {
    // on exclut changement_statut (auto) pour la pondération
    if (a.action_type === 'changement_statut') continue
    countsByPerformer.set(a.performed_by, (countsByPerformer.get(a.performed_by) ?? 0) + 1)
  }

  const performerIds = [...countsByPerformer.keys()]
  const nameMap = await buildDisplayNameMap(performerIds)
  const totalActions = [...countsByPerformer.values()].reduce((a, b) => a + b, 0)

  // Répartition proportionnelle (si 1 seul commercial → 100%, si 2 → selon actions)
  const commercials = performerIds.map(id => {
    const count = countsByPerformer.get(id) ?? 0
    const pct = totalActions > 0 ? Math.round((count / totalActions) * 100) : 0
    return {
      commercialId        : id,
      displayName         : nameMap.get(id) ?? 'Inconnu',
      actionCount         : count,
      suggestedPercentage : pct,
    }
  })

  // Ajuste pour que la somme fasse bien 100 (arrondi cumulatif)
  const sum = commercials.reduce((a, c) => a + c.suggestedPercentage, 0)
  if (commercials.length > 0 && sum !== 100) {
    commercials[0].suggestedPercentage += (100 - sum)
  }

  return { ruleApplied: defaultRule, commercials }
}

/** Stocke la répartition finale de l'attribution sur le prospect converti */
export async function saveAttributionResult(
  clubProspectId: string,
  result: AttributionResult,
): Promise<void> {
  const { error } = await supabase
    .from('club_prospects')
    .update({ attribution_result: result })
    .eq('id', clubProspectId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection] saveAttributionResult error:', error)
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
