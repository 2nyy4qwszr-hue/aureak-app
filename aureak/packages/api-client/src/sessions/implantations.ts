// Story 4.1 — CRUD implantations + groupes
import { supabase } from '../supabase'
import type { Implantation, Group, GroupMember, AgeGroup } from '@aureak/types'

// ─── Implantation ─────────────────────────────────────────────────────────────

export type CreateImplantationParams = {
  tenantId  : string
  name      : string
  address?  : string
  gpsLat?   : number
  gpsLon?   : number
  gpsRadius?: number
}

export async function createImplantation(
  params: CreateImplantationParams
): Promise<{ data: Implantation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('implantations')
    .insert({
      tenant_id : params.tenantId,
      name      : params.name,
      address   : params.address ?? null,
      gps_lat   : params.gpsLat ?? null,
      gps_lon   : params.gpsLon ?? null,
      gps_radius: params.gpsRadius ?? 300,
    })
    .select()
    .single()

  return { data: data as Implantation | null, error }
}

export async function listImplantations(): Promise<{ data: Implantation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('implantations')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return { data: (data as Implantation[]) ?? [], error }
}

export async function updateImplantation(
  id    : string,
  params: Partial<Pick<Implantation, 'name' | 'address' | 'gpsLat' | 'gpsLon' | 'gpsRadius'>>
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.name      !== undefined) updates['name']       = params.name
  if (params.address   !== undefined) updates['address']    = params.address
  if (params.gpsLat    !== undefined) updates['gps_lat']    = params.gpsLat
  if (params.gpsLon    !== undefined) updates['gps_lon']    = params.gpsLon
  if (params.gpsRadius !== undefined) updates['gps_radius'] = params.gpsRadius

  const { error } = await supabase
    .from('implantations')
    .update(updates)
    .eq('id', id)

  return { error }
}

export async function deleteImplantation(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('implantations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error }
}

// ─── Group ────────────────────────────────────────────────────────────────────

export type CreateGroupParams = {
  tenantId       : string
  implantationId : string
  name           : string
  ageGroup?      : AgeGroup
}

export async function createGroup(
  params: CreateGroupParams
): Promise<{ data: Group | null; error: unknown }> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      tenant_id      : params.tenantId,
      implantation_id: params.implantationId,
      name           : params.name,
      age_group      : params.ageGroup ?? null,
    })
    .select()
    .single()

  return { data: data as Group | null, error }
}

export async function listGroupsByImplantation(
  implantationId: string
): Promise<{ data: Group[]; error: unknown }> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('implantation_id', implantationId)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return { data: (data as Group[]) ?? [], error }
}

// ─── GroupMember ──────────────────────────────────────────────────────────────

export async function addGroupMember(
  groupId : string,
  childId : string,
  tenantId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, child_id: childId, tenant_id: tenantId })

  return { error }
}

export async function removeGroupMember(
  groupId: string,
  childId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('child_id', childId)

  return { error }
}

export async function listGroupMembers(
  groupId: string
): Promise<{ data: GroupMember[]; error: unknown }> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  return { data: (data as GroupMember[]) ?? [], error }
}
