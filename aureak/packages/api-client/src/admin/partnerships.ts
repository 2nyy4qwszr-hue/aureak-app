// Story 11.3 — API partenariats clubs
import { supabase } from '../supabase'

export type PartnershipAccessLevel = 'read_catalogue' | 'read_bronze' | 'read_silver' | 'full_read'

export type ClubPartnership = {
  id               : string
  partner_name     : string
  partner_tenant_id: string | null
  access_level     : PartnershipAccessLevel
  active_from      : string
  active_until     : string | null
  notes            : string | null
  created_at       : string
}

export type CreatePartnershipParams = {
  partnerName    : string
  partnerTenantId?: string
  accessLevel    : PartnershipAccessLevel
  activeFrom?    : string
  activeUntil?   : string
  notes?         : string
}

export async function listPartnerships(): Promise<{ data: ClubPartnership[]; error: unknown }> {
  const { data, error } = await supabase
    .from('club_partnerships')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data as ClubPartnership[]) ?? [], error }
}

export async function createPartnership(
  params: CreatePartnershipParams,
): Promise<{ data: ClubPartnership | null; error: unknown }> {
  const { data, error } = await supabase
    .from('club_partnerships')
    .insert({
      partner_name     : params.partnerName,
      partner_tenant_id: params.partnerTenantId ?? null,
      access_level     : params.accessLevel,
      active_from      : params.activeFrom ?? new Date().toISOString().split('T')[0],
      active_until     : params.activeUntil ?? null,
      notes            : params.notes ?? null,
    })
    .select()
    .single()
  return { data: data as ClubPartnership | null, error }
}

export async function updatePartnership(
  id   : string,
  patch: Partial<Pick<ClubPartnership, 'access_level' | 'active_until' | 'notes'>>,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_partnerships')
    .update(patch)
    .eq('id', id)
  return { error }
}

export async function listPartnerAccessStats(
  partnershipId: string,
  days = 30,
): Promise<{ count: number; error: unknown }> {
  const from = new Date(Date.now() - days * 86400000).toISOString()
  const { count, error } = await supabase
    .from('club_access_logs')
    .select('*', { count: 'exact', head: true })
    .eq('partnership_id', partnershipId)
    .gte('accessed_at', from)
  return { count: count ?? 0, error }
}
