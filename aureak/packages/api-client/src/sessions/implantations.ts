// Story 4.1 — CRUD implantations + groupes + group_staff
import { supabase } from '../supabase'
import type {
  Implantation, Group, GroupMember, AgeGroup, GroupMethod,
  GroupWithMeta, GroupStaff, GroupStaffRole, GroupStaffWithName, GroupMemberWithName,
} from '@aureak/types'

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
  tenantId        : string
  implantationId  : string
  name            : string   // titre généré par generateGroupName()
  dayOfWeek?      : string
  startHour?      : number
  startMinute?    : number
  durationMinutes?: number
  method?         : GroupMethod
  ageGroup?       : AgeGroup  // conservé pour rétrocompat
}

function mapGroupRow(row: Record<string, unknown>): Group {
  return {
    id             : row.id              as string,
    tenantId       : row.tenant_id       as string,
    implantationId : row.implantation_id as string,
    name           : row.name            as string,
    ageGroup       : (row.age_group      as AgeGroup | null) ?? null,
    dayOfWeek      : (row.day_of_week    as string  | null) ?? null,
    startHour      : (row.start_hour     as number  | null) ?? null,
    startMinute    : (row.start_minute   as number  | null) ?? null,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    method         : (row.method         as GroupMethod | null) ?? null,
    deletedAt      : (row.deleted_at     as string  | null) ?? null,
    createdAt      : row.created_at      as string,
  }
}

export async function createGroup(
  params: CreateGroupParams
): Promise<{ data: Group | null; error: unknown }> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      tenant_id        : params.tenantId,
      implantation_id  : params.implantationId,
      name             : params.name,
      age_group        : params.ageGroup        ?? null,
      day_of_week      : params.dayOfWeek       ?? null,
      start_hour       : params.startHour       ?? null,
      start_minute     : params.startMinute     ?? 0,
      duration_minutes : params.durationMinutes ?? null,
      method           : params.method          ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapGroupRow(data as Record<string, unknown>), error: null }
}

export async function updateGroup(
  id    : string,
  params: Partial<Omit<CreateGroupParams, 'tenantId' | 'implantationId'>>
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.name             !== undefined) updates['name']             = params.name
  if (params.dayOfWeek        !== undefined) updates['day_of_week']      = params.dayOfWeek
  if (params.startHour        !== undefined) updates['start_hour']       = params.startHour
  if (params.startMinute      !== undefined) updates['start_minute']     = params.startMinute
  if (params.durationMinutes  !== undefined) updates['duration_minutes'] = params.durationMinutes
  if (params.method           !== undefined) updates['method']           = params.method

  const { error } = await supabase.from('groups').update(updates).eq('id', id)
  return { error }
}

export async function deleteGroup(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  return { error }
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

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapGroupRow), error: null }
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

// ─── Extended Group functions ──────────────────────────────────────────────────

export async function getGroup(
  id: string,
): Promise<{ data: (Group & { implantationName: string }) | null; error: unknown }> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, implantations(name)')
    .eq('id', id)
    .single()

  if (error || !data) return { data: null, error }
  const row = data as Record<string, unknown>
  return {
    data: {
      ...mapGroupRow(row),
      implantationName: (row.implantations as { name: string } | null)?.name ?? '—',
    },
    error: null,
  }
}

export async function listAllGroups(): Promise<GroupWithMeta[]> {
  const { data: groupsData } = await supabase
    .from('groups')
    .select('*, implantations(name)')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (!groupsData || groupsData.length === 0) return []

  const groupIds = groupsData.map(g => (g as Record<string, unknown>).id as string)

  const { data: membersData } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds)

  const countMap: Record<string, number> = {}
  for (const m of membersData ?? []) {
    const mid = (m as Record<string, unknown>).group_id as string
    countMap[mid] = (countMap[mid] ?? 0) + 1
  }

  return groupsData.map(row => {
    const r = row as Record<string, unknown>
    return {
      ...mapGroupRow(r),
      implantationName: (r.implantations as { name: string } | null)?.name ?? '—',
      memberCount     : countMap[r.id as string] ?? 0,
    }
  })
}

// ─── Group Staff ──────────────────────────────────────────────────────────────

export async function listGroupStaff(groupId: string): Promise<GroupStaffWithName[]> {
  const { data: staffRows } = await supabase
    .from('group_staff')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  if (!staffRows || staffRows.length === 0) return []

  const coachIds = staffRows.map(s => (s as Record<string, unknown>).coach_id as string)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', coachIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    const pr = p as Record<string, unknown>
    nameMap[pr.user_id as string] = pr.display_name as string
  }

  return staffRows.map(s => {
    const r = s as Record<string, unknown>
    return {
      id       : r.id        as string,
      tenantId : r.tenant_id as string,
      groupId  : r.group_id  as string,
      coachId  : r.coach_id  as string,
      role     : r.role      as GroupStaffRole,
      coachName: nameMap[r.coach_id as string] ?? 'Coach inconnu',
      createdAt: r.created_at as string,
    }
  })
}

export type AddGroupStaffParams = {
  groupId  : string
  coachId  : string
  role     : GroupStaffRole
  tenantId : string
}

export async function addGroupStaff(
  params: AddGroupStaffParams,
): Promise<{ data: GroupStaff | null; error: unknown }> {
  const { data, error } = await supabase
    .from('group_staff')
    .upsert({
      group_id  : params.groupId,
      coach_id  : params.coachId,
      role      : params.role,
      tenant_id : params.tenantId,
    }, { onConflict: 'group_id,coach_id' })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  const r = data as Record<string, unknown>
  return {
    data: {
      id       : r.id        as string,
      tenantId : r.tenant_id as string,
      groupId  : r.group_id  as string,
      coachId  : r.coach_id  as string,
      role     : r.role      as GroupStaffRole,
      createdAt: r.created_at as string,
    },
    error: null,
  }
}

export async function updateGroupStaffRole(
  id  : string,
  role: GroupStaffRole,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('group_staff')
    .update({ role })
    .eq('id', id)
  return { error }
}

export async function removeGroupStaff(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('group_staff')
    .delete()
    .eq('id', id)
  return { error }
}

// ─── Members with names ───────────────────────────────────────────────────────

export async function listGroupMembersWithProfiles(
  groupId: string,
): Promise<GroupMemberWithName[]> {
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) return []

  const childIds = members.map(m => (m as Record<string, unknown>).child_id as string)

  const { data: children } = await supabase
    .from('child_directory')
    .select('id, display_name')
    .in('id', childIds)

  const nameMap: Record<string, string> = {}
  for (const c of children ?? []) {
    const cr = c as Record<string, unknown>
    nameMap[cr.id as string] = cr.display_name as string
  }

  return members.map(m => {
    const r = m as Record<string, unknown>
    return {
      groupId    : r.group_id  as string,
      childId    : r.child_id  as string,
      displayName: nameMap[r.child_id as string] ?? 'Joueur inconnu',
      joinedAt   : r.joined_at as string,
    }
  })
}

// ─── Selector helpers ─────────────────────────────────────────────────────────

export async function listAvailableCoaches(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .eq('user_role', 'coach')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
  return (data ?? []).map(p => {
    const r = p as Record<string, unknown>
    return { id: r.user_id as string, name: r.display_name as string }
  })
}

export async function listAvailableChildren(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from('child_directory')
    .select('id, display_name')
    .eq('actif', true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
  return (data ?? []).map(p => {
    const r = p as Record<string, unknown>
    return { id: r.id as string, name: r.display_name as string }
  })
}

// ─── Sessions by group ────────────────────────────────────────────────────────

export async function listSessionsByGroup(
  groupId: string,
  opts   : { limit?: number; upcoming?: boolean } = {},
): Promise<Array<{
  id: string; scheduledAt: string; status: string; durationMinutes: number
}>> {
  const { limit = 10, upcoming = false } = opts
  let q = supabase
    .from('sessions')
    .select('id, scheduled_at, status, duration_minutes')
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: upcoming })
    .limit(limit)

  if (upcoming) {
    q = q.gte('scheduled_at', new Date().toISOString())
  }

  const { data } = await q
  return (data ?? []).map(r => {
    const row = r as Record<string, unknown>
    return {
      id             : row.id              as string,
      scheduledAt    : row.scheduled_at    as string,
      status         : row.status          as string,
      durationMinutes: row.duration_minutes as number,
    }
  })
}
