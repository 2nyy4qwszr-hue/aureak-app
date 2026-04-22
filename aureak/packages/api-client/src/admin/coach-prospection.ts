// Epic 90 — Story 90.1 : API CRUD pipeline prospection entraîneurs
import { supabase } from '../supabase'
import type {
  CoachProspect,
  CoachProspectListRow,
  CoachProspectDetail,
  CreateCoachProspectParams,
  UpdateCoachProspectParams,
  CoachProspectStatus,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapProspect(r: Record<string, unknown>): CoachProspect {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    firstName            : r.first_name as string,
    lastName             : r.last_name as string,
    email                : (r.email as string | null) ?? null,
    phone                : (r.phone as string | null) ?? null,
    city                 : (r.city as string | null) ?? null,
    status               : r.status as CoachProspectStatus,
    currentClub          : (r.current_club as string | null) ?? null,
    specialite           : (r.specialite as string | null) ?? null,
    assignedCommercialId : (r.assigned_commercial_id as string | null) ?? null,
    recommendedByCoachId : (r.recommended_by_coach_id as string | null) ?? null,
    source               : (r.source as string | null) ?? null,
    notes                : (r.notes as string | null) ?? null,
    createdAt            : r.created_at as string,
    updatedAt            : r.updated_at as string,
    deletedAt            : (r.deleted_at as string | null) ?? null,
  }
}

async function buildDisplayNameMap(userIds: string[]): Promise<Map<string, string>> {
  const filtered = [...new Set(userIds.filter(Boolean))]
  if (filtered.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', filtered)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-prospection] displayName lookup error:', error)
    return new Map()
  }

  const m = new Map<string, string>()
  for (const p of (data ?? []) as { user_id: string; display_name: string | null }[]) {
    if (p.display_name) m.set(p.user_id, p.display_name)
  }
  return m
}

async function resolveTenantId(): Promise<{ userId: string; tenantId: string }> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) throw new Error('Non authentifié')

  const jwtTenant = (user.app_metadata?.tenant_id as string | undefined)
    ?? (user.user_metadata?.tenant_id as string | undefined)
  if (jwtTenant) return { userId: user.id, tenantId: jwtTenant }

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

// ── Liste pipeline ─────────────────────────────────────────────────────────

export type ListCoachProspectsFilters = {
  status?       : CoachProspectStatus
  commercialId? : string
}

export async function listCoachProspects(
  filters: ListCoachProspectsFilters = {},
): Promise<CoachProspectListRow[]> {
  let q = supabase
    .from('coach_prospects')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (filters.status)       q = q.eq('status', filters.status)
  if (filters.commercialId) q = q.eq('assigned_commercial_id', filters.commercialId)

  const { data, error } = await q

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-prospection] listCoachProspects error:', error)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  if (rows.length === 0) return []

  const userIds = [
    ...rows.map(r => r.assigned_commercial_id as string | null).filter((v): v is string => !!v),
    ...rows.map(r => r.recommended_by_coach_id as string | null).filter((v): v is string => !!v),
  ]
  const nameMap = await buildDisplayNameMap(userIds)

  return rows.map(r => {
    const base = mapProspect(r)
    return {
      ...base,
      assignedDisplayName      : base.assignedCommercialId ? nameMap.get(base.assignedCommercialId) ?? null : null,
      recommendedByDisplayName : base.recommendedByCoachId ? nameMap.get(base.recommendedByCoachId) ?? null : null,
      lastActionAt             : base.updatedAt,
    }
  })
}

// ── Détail ─────────────────────────────────────────────────────────────────

export async function getCoachProspect(id: string): Promise<CoachProspectDetail | null> {
  const { data, error } = await supabase
    .from('coach_prospects')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-prospection] getCoachProspect error:', error)
    return null
  }
  if (!data) return null

  const base = mapProspect(data as Record<string, unknown>)
  const ids = [base.assignedCommercialId, base.recommendedByCoachId].filter((v): v is string => !!v)
  const nameMap = await buildDisplayNameMap(ids)

  return {
    ...base,
    assignedDisplayName      : base.assignedCommercialId ? nameMap.get(base.assignedCommercialId) ?? null : null,
    recommendedByDisplayName : base.recommendedByCoachId ? nameMap.get(base.recommendedByCoachId) ?? null : null,
    lastActionAt             : base.updatedAt,
  }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createCoachProspect(params: CreateCoachProspectParams): Promise<CoachProspect> {
  const { userId, tenantId } = await resolveTenantId()

  const payload: Record<string, unknown> = {
    tenant_id                : tenantId,
    first_name               : params.firstName,
    last_name                : params.lastName,
    email                    : params.email ?? null,
    phone                    : params.phone ?? null,
    city                     : params.city ?? null,
    status                   : params.status ?? 'identifie',
    current_club             : params.currentClub ?? null,
    specialite               : params.specialite ?? null,
    assigned_commercial_id   : params.assignedCommercialId === undefined ? userId : params.assignedCommercialId,
    recommended_by_coach_id  : params.recommendedByCoachId ?? null,
    source                   : params.source ?? null,
    notes                    : params.notes ?? null,
  }

  const { data, error } = await supabase
    .from('coach_prospects')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-prospection] create error:', error)
    throw error
  }
  return mapProspect(data as Record<string, unknown>)
}

export async function updateCoachProspect(params: UpdateCoachProspectParams): Promise<CoachProspect> {
  const payload: Record<string, unknown> = {}
  if (params.firstName             !== undefined) payload.first_name              = params.firstName
  if (params.lastName              !== undefined) payload.last_name               = params.lastName
  if (params.email                 !== undefined) payload.email                   = params.email
  if (params.phone                 !== undefined) payload.phone                   = params.phone
  if (params.city                  !== undefined) payload.city                    = params.city
  if (params.status                !== undefined) payload.status                  = params.status
  if (params.currentClub           !== undefined) payload.current_club            = params.currentClub
  if (params.specialite            !== undefined) payload.specialite              = params.specialite
  if (params.assignedCommercialId  !== undefined) payload.assigned_commercial_id  = params.assignedCommercialId
  if (params.recommendedByCoachId  !== undefined) payload.recommended_by_coach_id = params.recommendedByCoachId
  if (params.source                !== undefined) payload.source                  = params.source
  if (params.notes                 !== undefined) payload.notes                   = params.notes

  const { data, error } = await supabase
    .from('coach_prospects')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-prospection] update error:', error)
    throw error
  }
  return mapProspect(data as Record<string, unknown>)
}

export async function updateCoachProspectStatus(id: string, status: CoachProspectStatus): Promise<CoachProspect> {
  return updateCoachProspect({ id, status })
}
