// Story 3.4 — CRUD référentiel taxonomies (Taxonomy, TaxonomyNode, UnitClassification)
import { supabase } from '../supabase'
import type { Taxonomy, TaxonomyNode, UnitClassification, UnitType } from '@aureak/types'

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export type CreateTaxonomyParams = {
  tenantId: string
  name    : string
  slug    : string
}

export async function createTaxonomy(
  params: CreateTaxonomyParams
): Promise<{ data: Taxonomy | null; error: unknown }> {
  const { data, error } = await supabase
    .from('taxonomies')
    .insert({
      tenant_id: params.tenantId,
      name     : params.name,
      slug     : params.slug,
    })
    .select()
    .single()

  return { data: data as Taxonomy | null, error }
}

export async function listTaxonomies(): Promise<{ data: Taxonomy[]; error: unknown }> {
  const { data, error } = await supabase
    .from('taxonomies')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return { data: (data as Taxonomy[]) ?? [], error }
}

export async function deleteTaxonomy(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('taxonomies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error }
}

// ─── TaxonomyNode ─────────────────────────────────────────────────────────────

export type CreateTaxonomyNodeParams = {
  taxonomyId: string
  tenantId  : string
  parentId? : string
  name      : string
  slug      : string
  sortOrder?: number
}

export async function createTaxonomyNode(
  params: CreateTaxonomyNodeParams
): Promise<{ data: TaxonomyNode | null; error: unknown }> {
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .insert({
      taxonomy_id: params.taxonomyId,
      tenant_id  : params.tenantId,
      parent_id  : params.parentId ?? null,
      name       : params.name,
      slug       : params.slug,
      sort_order : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as TaxonomyNode | null, error }
}

export async function listNodesByTaxonomy(
  taxonomyId: string
): Promise<{ data: TaxonomyNode[]; error: unknown }> {
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select('*')
    .eq('taxonomy_id', taxonomyId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as TaxonomyNode[]) ?? [], error }
}

export async function deleteTaxonomyNode(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('taxonomy_nodes')
    .delete()
    .eq('id', id)

  return { error }
}

// ─── UnitClassification ───────────────────────────────────────────────────────

export type CreateUnitClassificationParams = {
  taxonomyNodeId: string
  tenantId      : string
  unitType      : UnitType
  unitId        : string
}

export async function classifyUnit(
  params: CreateUnitClassificationParams
): Promise<{ data: UnitClassification | null; error: unknown }> {
  const { data, error } = await supabase
    .from('unit_classifications')
    .insert({
      taxonomy_node_id: params.taxonomyNodeId,
      tenant_id       : params.tenantId,
      unit_type       : params.unitType,
      unit_id         : params.unitId,
    })
    .select()
    .single()

  return { data: data as UnitClassification | null, error }
}

export async function unclassifyUnit(
  taxonomyNodeId: string,
  unitType      : UnitType,
  unitId        : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('unit_classifications')
    .delete()
    .eq('taxonomy_node_id', taxonomyNodeId)
    .eq('unit_type', unitType)
    .eq('unit_id', unitId)

  return { error }
}

export async function listClassificationsByUnit(
  unitType: UnitType,
  unitId  : string
): Promise<{ data: UnitClassification[]; error: unknown }> {
  const { data, error } = await supabase
    .from('unit_classifications')
    .select('*')
    .eq('unit_type', unitType)
    .eq('unit_id', unitId)

  return { data: (data as UnitClassification[]) ?? [], error }
}

export async function listClassificationsByNode(
  taxonomyNodeId: string
): Promise<{ data: UnitClassification[]; error: unknown }> {
  const { data, error } = await supabase
    .from('unit_classifications')
    .select('*')
    .eq('taxonomy_node_id', taxonomyNodeId)

  return { data: (data as UnitClassification[]) ?? [], error }
}
