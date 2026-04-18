// Story 88.4 — CRUD règles d'attribution + suggestion
import { supabase } from '../supabase'
import type {
  AttributionRule,
  AttributionSuggestion,
  CreateAttributionRuleParams,
  UpdateAttributionRuleParams,
  AttributionPercentages,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRuleRow(r: Record<string, unknown>): AttributionRule {
  return {
    id          : r.id as string,
    tenantId    : r.tenant_id as string,
    ruleName    : r.rule_name as string,
    description : (r.description as string) ?? '',
    conditions  : (r.conditions as Record<string, unknown>) ?? {},
    percentages : r.percentages as AttributionPercentages,
    isDefault   : r.is_default as boolean,
    createdAt   : r.created_at as string,
    updatedAt   : r.updated_at as string,
    deletedAt   : (r.deleted_at as string | null) ?? null,
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Liste les règles d'attribution (défaut en premier, puis par nom).
 */
export async function listAttributionRules(): Promise<AttributionRule[]> {
  const { data, error } = await supabase
    .from('attribution_rules')
    .select('*')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('rule_name', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []
  return (data as Record<string, unknown>[]).map(mapRuleRow)
}

/**
 * Crée une règle d'attribution. Si isDefault=true, désactive d'abord l'ancien défaut.
 */
export async function createAttributionRule(
  params: CreateAttributionRuleParams,
  tenantId: string,
): Promise<AttributionRule> {
  // If setting as default, unset the current default first
  if (params.isDefault) {
    const { error: resetError } = await supabase
      .from('attribution_rules')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .is('deleted_at', null)

    if (resetError) {
      if (process.env.NODE_ENV !== 'production') console.error('[createAttributionRule] reset default error:', resetError)
    }
  }

  const { data, error } = await supabase
    .from('attribution_rules')
    .insert({
      tenant_id  : tenantId,
      rule_name  : params.ruleName,
      description: params.description ?? '',
      percentages: params.percentages,
      conditions : params.conditions ?? {},
      is_default : params.isDefault ?? false,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapRuleRow(data as Record<string, unknown>)
}

/**
 * Met à jour une règle d'attribution.
 */
export async function updateAttributionRule(
  id: string,
  params: UpdateAttributionRuleParams,
  tenantId?: string,
): Promise<AttributionRule> {
  // If setting as default, unset current default first
  if (params.isDefault && tenantId) {
    const { error: resetError } = await supabase
      .from('attribution_rules')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .is('deleted_at', null)
      .neq('id', id)

    if (resetError) {
      if (process.env.NODE_ENV !== 'production') console.error('[updateAttributionRule] reset default error:', resetError)
    }
  }

  const patch: Record<string, unknown> = {}
  if (params.ruleName !== undefined)    patch.rule_name = params.ruleName
  if (params.description !== undefined) patch.description = params.description
  if (params.percentages !== undefined) patch.percentages = params.percentages
  if (params.conditions !== undefined)  patch.conditions = params.conditions
  if (params.isDefault !== undefined)   patch.is_default = params.isDefault

  const { data, error } = await supabase
    .from('attribution_rules')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRuleRow(data as Record<string, unknown>)
}

/**
 * Soft-delete une règle d'attribution (interdit sur la règle par défaut).
 */
export async function deleteAttributionRule(id: string): Promise<void> {
  // Check if it's the default rule
  const { data: rule } = await supabase
    .from('attribution_rules')
    .select('is_default')
    .eq('id', id)
    .single()

  if (rule && (rule as Record<string, unknown>).is_default) {
    throw new Error('Impossible de supprimer la règle par défaut')
  }

  const { error } = await supabase
    .from('attribution_rules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/**
 * Calcule la suggestion d'attribution pour un prospect donné :
 * 1. Récupère les actions du prospect groupées par commercial
 * 2. Applique la règle par défaut
 */
export async function suggestAttribution(clubProspectId: string): Promise<AttributionSuggestion | null> {
  // Get default rule
  const { data: ruleData, error: ruleError } = await supabase
    .from('attribution_rules')
    .select('*')
    .eq('is_default', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (ruleError) {
    if (process.env.NODE_ENV !== 'production') console.error('[suggestAttribution] rule error:', ruleError)
    return null
  }
  if (!ruleData) return null

  const defaultRule = mapRuleRow(ruleData as Record<string, unknown>)

  // Get actions grouped by performed_by
  const { data: actionsData, error: actionsError } = await supabase
    .from('prospect_actions')
    .select('performed_by')
    .eq('club_prospect_id', clubProspectId)

  if (actionsError) {
    if (process.env.NODE_ENV !== 'production') console.error('[suggestAttribution] actions error:', actionsError)
    return null
  }

  if (!actionsData || actionsData.length === 0) {
    return { ruleApplied: defaultRule, commercials: [] }
  }

  // Group by performer
  const countMap = new Map<string, number>()
  for (const a of actionsData as { performed_by: string }[]) {
    countMap.set(a.performed_by, (countMap.get(a.performed_by) ?? 0) + 1)
  }

  // Resolve display names
  const performerIds = [...countMap.keys()]
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

  // Calculate suggested percentages based on action count ratio
  const totalActions = [...countMap.values()].reduce((a, b) => a + b, 0)
  const commercials = performerIds.map(id => ({
    commercialId       : id,
    displayName        : nameMap.get(id) ?? 'Inconnu',
    actionCount        : countMap.get(id) ?? 0,
    suggestedPercentage: Math.round(((countMap.get(id) ?? 0) / totalActions) * 100),
  }))

  // Sort by action count descending
  commercials.sort((a, b) => b.actionCount - a.actionCount)

  return { ruleApplied: defaultRule, commercials }
}

/**
 * Stocke le résultat d'attribution dans club_prospects.attribution_result
 */
export async function saveAttributionResult(
  clubProspectId: string,
  attributionResult: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('club_prospects')
    .update({ attribution_result: attributionResult })
    .eq('id', clubProspectId)

  if (error) throw error
}
