// Story 90.1 — Pipeline entraîneurs : CRUD coach_prospects
import { supabase } from '../supabase'
import type {
  CoachProspect,
  CoachProspectListItem,
  CreateCoachProspectParams,
  UpdateCoachProspectParams,
} from '@aureak/types'
import type { CoachProspectStatus } from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRow(r: Record<string, unknown>): CoachProspect {
  return {
    id               : r.id as string,
    tenantId         : r.tenant_id as string,
    name             : r.name as string,
    email            : (r.email as string | null) ?? null,
    phone            : (r.phone as string | null) ?? null,
    status           : r.status as CoachProspect['status'],
    experienceYears  : (r.experience_years as number | null) ?? null,
    diplomas         : (r.diplomas as string[] | null) ?? [],
    assignedManagerId: (r.assigned_manager_id as string | null) ?? null,
    recommendedById  : (r.recommended_by_id as string | null) ?? null,
    source           : (r.source as string | null) ?? null,
    notes            : (r.notes as string | null) ?? null,
    createdAt        : r.created_at as string,
    updatedAt        : r.updated_at as string,
    deletedAt        : (r.deleted_at as string | null) ?? null,
  }
}

// ── Requêtes ───────────────────────────────────────────────────────────────

/**
 * Liste les coach prospects du tenant, enrichis du nom du manager assigné.
 * Filtrable par statut et/ou manager assigné.
 */
export async function listCoachProspects(
  filters?: { status?: CoachProspectStatus; managerId?: string },
): Promise<CoachProspectListItem[]> {
  let query = supabase
    .from('coach_prospects')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.managerId) {
    query = query.eq('assigned_manager_id', filters.managerId)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return []

  const rows = data as Record<string, unknown>[]

  // Resolve manager display names
  const managerIds = [...new Set(
    rows.map(r => r.assigned_manager_id as string | null).filter(Boolean) as string[],
  )]

  const nameMap = new Map<string, string>()
  if (managerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', managerIds)

    if (profiles) {
      for (const p of profiles as { user_id: string; display_name: string }[]) {
        nameMap.set(p.user_id, p.display_name)
      }
    }
  }

  return rows.map(r => {
    const base = mapRow(r)
    return {
      ...base,
      managerDisplayName: base.assignedManagerId
        ? nameMap.get(base.assignedManagerId) ?? null
        : null,
    }
  })
}

/**
 * Crée un nouveau coach prospect.
 */
export async function createCoachProspect(
  params: CreateCoachProspectParams,
  tenantId: string,
): Promise<CoachProspect> {
  const { data, error } = await supabase
    .from('coach_prospects')
    .insert({
      tenant_id          : tenantId,
      name               : params.name,
      email              : params.email ?? null,
      phone              : params.phone ?? null,
      experience_years   : params.experienceYears ?? null,
      diplomas           : params.diplomas ?? [],
      assigned_manager_id: params.assignedManagerId ?? null,
      recommended_by_id  : params.recommendedById ?? null,
      source             : params.source ?? null,
      notes              : params.notes ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/**
 * Met à jour un coach prospect (partiel).
 */
export async function updateCoachProspect(
  id: string,
  params: UpdateCoachProspectParams,
): Promise<CoachProspect> {
  const patch: Record<string, unknown> = {}
  if (params.name !== undefined)             patch.name = params.name
  if (params.email !== undefined)            patch.email = params.email
  if (params.phone !== undefined)            patch.phone = params.phone
  if (params.status !== undefined)           patch.status = params.status
  if (params.experienceYears !== undefined)  patch.experience_years = params.experienceYears
  if (params.diplomas !== undefined)         patch.diplomas = params.diplomas
  if (params.assignedManagerId !== undefined) patch.assigned_manager_id = params.assignedManagerId
  if (params.source !== undefined)           patch.source = params.source
  if (params.notes !== undefined)            patch.notes = params.notes

  const { data, error } = await supabase
    .from('coach_prospects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/**
 * Met à jour uniquement le statut d'un coach prospect.
 */
export async function updateCoachProspectStatus(
  id: string,
  status: CoachProspectStatus,
): Promise<CoachProspect> {
  return updateCoachProspect(id, { status })
}

/**
 * Soft-delete un coach prospect.
 */
export async function deleteCoachProspect(id: string): Promise<void> {
  const { error } = await supabase
    .from('coach_prospects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// ── Story 90.2 — Recommandation coach ─────────────────────────────────────

export type CreateCoachRecommendationParams = {
  name      : string
  contact   : string
  relation  : string
  comment?  : string
}

/**
 * Crée un coach prospect via recommandation d'un coach.
 * Détecte si le contact est un email ou un téléphone.
 */
export async function createCoachRecommendation(
  params: CreateCoachRecommendationParams,
  tenantId: string,
  coachUserId: string,
): Promise<CoachProspect> {
  const isEmail = params.contact.includes('@')
  return createCoachProspect({
    name           : params.name,
    email          : isEmail ? params.contact : undefined,
    phone          : isEmail ? undefined : params.contact,
    source         : 'recommendation_coach',
    recommendedById: coachUserId,
    notes          : `Relation : ${params.relation}${params.comment ? `\n${params.comment}` : ''}`,
  }, tenantId)
}

/**
 * Liste les recommandations faites par un coach spécifique.
 */
export async function listMyRecommendations(
  coachUserId: string,
): Promise<CoachProspect[]> {
  const { data, error } = await supabase
    .from('coach_prospects')
    .select('*')
    .eq('recommended_by_id', coachUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}

/**
 * Récupère les user_id des admins du tenant courant (pour notifications).
 */
export async function listAdminUserIds(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .eq('user_role', 'admin')

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coachProspects] listAdminUserIds:', error)
    return []
  }
  return (data ?? []).map(p => (p as { user_id: string }).user_id)
}
