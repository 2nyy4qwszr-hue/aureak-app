// Story 3.2 — CRUD référentiel critères/faults/cues
import { supabase } from '../supabase'
import type { Criterion, Fault, Cue } from '@aureak/types'

// ─── Criterion ────────────────────────────────────────────────────────────────

export type CreateCriterionParams = {
  tenantId    : string
  themeId     : string
  label       : string
  description?: string
  sortOrder?  : number
  sequenceId? : string | null
  metaphorId? : string | null
}

export async function createCriterion(
  params: CreateCriterionParams
): Promise<{ data: Criterion | null; error: unknown }> {
  const { data, error } = await supabase
    .from('criteria')
    .insert({
      tenant_id  : params.tenantId,
      theme_id   : params.themeId,
      sequence_id: params.sequenceId ?? null,
      metaphor_id: params.metaphorId ?? null,
      label      : params.label,
      description: params.description ?? null,
      sort_order : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as Criterion | null, error }
}

export async function listCriteriaBySequence(
  sequenceId: string
): Promise<{ data: Criterion[]; error: unknown }> {
  const { data, error } = await supabase
    .from('criteria')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as Criterion[]) ?? [], error }
}

// ─── Fault ────────────────────────────────────────────────────────────────────

export type CreateFaultParams = {
  tenantId    : string
  themeId     : string
  criterionId?: string | null
  label       : string
  description?: string
  sortOrder?  : number
}

export async function createFault(
  params: CreateFaultParams
): Promise<{ data: Fault | null; error: unknown }> {
  const { data, error } = await supabase
    .from('faults')
    .insert({
      tenant_id   : params.tenantId,
      theme_id    : params.themeId,
      criterion_id: params.criterionId ?? null,
      label       : params.label,
      description : params.description ?? null,
      sort_order  : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as Fault | null, error }
}

export async function listFaultsByCriterion(
  criterionId: string
): Promise<{ data: Fault[]; error: unknown }> {
  const { data, error } = await supabase
    .from('faults')
    .select('*')
    .eq('criterion_id', criterionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as Fault[]) ?? [], error }
}

// ─── Cue ──────────────────────────────────────────────────────────────────────

export type CreateCueParams = {
  tenantId    : string
  faultId     : string
  label       : string
  description?: string
  sortOrder?  : number
}

export async function createCue(
  params: CreateCueParams
): Promise<{ data: Cue | null; error: unknown }> {
  const { data, error } = await supabase
    .from('cues')
    .insert({
      tenant_id  : params.tenantId,
      fault_id   : params.faultId,
      label      : params.label,
      description: params.description ?? null,
      sort_order : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as Cue | null, error }
}

export async function listCuesByFault(
  faultId: string
): Promise<{ data: Cue[]; error: unknown }> {
  const { data, error } = await supabase
    .from('cues')
    .select('*')
    .eq('fault_id', faultId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as Cue[]) ?? [], error }
}
