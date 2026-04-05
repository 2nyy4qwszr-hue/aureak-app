// Story 4.1 — CRUD implantations + groupes + group_staff
import { supabase } from '../supabase'
import type {
  Implantation, Group, GroupMember, AgeGroup, GroupMethod,
  GroupWithMeta, GroupStaff, GroupStaffRole, GroupStaffWithName, GroupMemberWithName, GroupMemberWithDetails,
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

function mapImplantation(row: Record<string, unknown>): Implantation {
  return {
    id       : row.id        as string,
    tenantId : row.tenant_id as string,
    name     : row.name      as string,
    address  : (row.address    as string | null) ?? null,
    gpsLat   : (row.gps_lat    as number | null) ?? null,
    gpsLon   : (row.gps_lon    as number | null) ?? null,
    gpsRadius: (row.gps_radius as number | null) ?? 300,
    photoUrl : (row.photo_url  as string | null) ?? null,   // Story 49-6
    deletedAt: (row.deleted_at as string | null) ?? null,
    createdAt: row.created_at  as string,
  }
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

  if (error || !data) return { data: null, error }
  return { data: mapImplantation(data as Record<string, unknown>), error: null }
}

export async function listImplantations(): Promise<{ data: Implantation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('implantations')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error || !data) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapImplantation), error: null }
}

export async function updateImplantation(
  id    : string,
  params: Partial<Pick<Implantation, 'name' | 'address' | 'gpsLat' | 'gpsLon' | 'gpsRadius' | 'photoUrl'>>
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.name      !== undefined) updates['name']       = params.name
  if (params.address   !== undefined) updates['address']    = params.address
  if (params.gpsLat    !== undefined) updates['gps_lat']    = params.gpsLat
  if (params.gpsLon    !== undefined) updates['gps_lon']    = params.gpsLon
  if (params.gpsRadius !== undefined) updates['gps_radius'] = params.gpsRadius
  if (params.photoUrl  !== undefined) updates['photo_url']  = params.photoUrl  // Story 49-6

  const { error } = await supabase
    .from('implantations')
    .update(updates)
    .eq('id', id)

  return { error }
}

/**
 * Story 49-6 — Upload d'une photo vers Storage bucket 'implantation-photos'
 * Retourne l'URL publique stockée en DB, ou une erreur.
 */
export async function uploadImplantationPhoto(
  implantationId: string,
  file          : File,
): Promise<{ publicUrl: string | null; error: unknown }> {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${implantationId}/cover.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('implantation-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[uploadImplantationPhoto] upload error:', uploadError)
    return { publicUrl: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('implantation-photos')
    .getPublicUrl(path)

  const publicUrl = data.publicUrl ?? null

  const { error: dbError } = await updateImplantation(implantationId, { photoUrl: publicUrl })
  if (dbError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[uploadImplantationPhoto] DB update error:', dbError)
    return { publicUrl: null, error: dbError }
  }

  return { publicUrl, error: null }
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
    isTransient    : (row.is_transient   as boolean) ?? false,
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

/** Crée un groupe transient (is_transient=true) pour une séance ponctuelle.
 *  Ces groupes ne sont jamais exposés dans les sélecteurs UI. */
export async function createTransientGroup(params: {
  tenantId       : string
  implantationId : string
  name           : string
  method?        : GroupMethod
}): Promise<{ data: Group | null; error: unknown }> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      tenant_id      : params.tenantId,
      implantation_id: params.implantationId,
      name           : params.name,
      is_transient   : true,
      method         : params.method ?? null,
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
    .eq('is_transient', false)
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
    .eq('is_transient', false)
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

// ─── Groups by coach ─────────────────────────────────────────────────────────

export type CoachGroupEntry = {
  id          : string
  groupId     : string
  groupName   : string
  role        : GroupStaffRole
  implantationId : string | null
  implantationName: string | null
  createdAt   : string
}

export async function listGroupsByCoach(coachId: string): Promise<CoachGroupEntry[]> {
  const { data: staffRows } = await supabase
    .from('group_staff')
    .select('id, group_id, role, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  if (!staffRows || staffRows.length === 0) return []

  const groupIds = staffRows.map(s => (s as Record<string, unknown>).group_id as string)

  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, implantation_id')
    .in('id', groupIds)

  const { data: implantRows } = await supabase
    .from('implantations')
    .select('id, name')

  const groupMap: Record<string, { name: string; implantationId: string | null }> = {}
  for (const g of groupRows ?? []) {
    const gr = g as Record<string, unknown>
    groupMap[gr.id as string] = { name: gr.name as string, implantationId: gr.implantation_id as string | null }
  }

  const implantMap: Record<string, string> = {}
  for (const i of implantRows ?? []) {
    const ir = i as Record<string, unknown>
    implantMap[ir.id as string] = ir.name as string
  }

  return staffRows.map(s => {
    const r = s as Record<string, unknown>
    const group = groupMap[r.group_id as string]
    const implantId = group?.implantationId ?? null
    return {
      id              : r.id as string,
      groupId         : r.group_id as string,
      groupName       : group?.name ?? 'Groupe inconnu',
      role            : r.role as GroupStaffRole,
      implantationId  : implantId,
      implantationName: implantId ? (implantMap[implantId] ?? null) : null,
      createdAt       : r.created_at as string,
    }
  })
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

// ─── Members with details (birthDate + currentClub) — Story 44.5 ─────────────

export async function listGroupMembersWithDetails(
  groupId: string,
): Promise<GroupMemberWithDetails[]> {
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) return []

  const childIds = members.map(m => (m as Record<string, unknown>).child_id as string)

  const { data: children } = await supabase
    .from('child_directory')
    .select('id, display_name, birth_date, current_club')
    .in('id', childIds)

  const detailMap: Record<string, { displayName: string; birthDate: string | null; currentClub: string | null }> = {}
  for (const c of children ?? []) {
    const cr = c as Record<string, unknown>
    detailMap[cr.id as string] = {
      displayName: cr.display_name as string,
      birthDate  : (cr.birth_date as string | null) ?? null,
      currentClub: (cr.current_club as string | null) ?? null,
    }
  }

  return members.map(m => {
    const r      = m as Record<string, unknown>
    const detail = detailMap[r.child_id as string]
    return {
      groupId    : r.group_id   as string,
      childId    : r.child_id   as string,
      displayName: detail?.displayName ?? 'Joueur inconnu',
      joinedAt   : r.joined_at  as string,
      birthDate  : detail?.birthDate   ?? null,
      currentClub: detail?.currentClub ?? null,
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
