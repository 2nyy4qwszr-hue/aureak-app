// Story 92-2 — Sponsors : CRUD + lien enfant + capsule vidéo
// Story 92-3 — Stats clubs partenaires (getPartnershipClubStats, listPartnerClubsSummary)
import { supabase } from '../supabase'
import type { Sponsor, CreateSponsorParams, UpdateSponsorParams, SponsorshipType, CapsuleStatus } from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRow(r: Record<string, unknown>): Sponsor {
  return {
    id             : r.id               as string,
    tenantId       : r.tenant_id        as string,
    name           : r.name             as string,
    logoUrl        : (r.logo_url        as string | null) ?? null,
    contactName    : (r.contact_name    as string) ?? '',
    contactEmail   : (r.contact_email   as string) ?? '',
    contactPhone   : (r.contact_phone   as string) ?? '',
    sponsorshipType: r.sponsorship_type as SponsorshipType,
    amount         : (r.amount          as number | null) ?? null,
    currency       : (r.currency        as string) ?? 'EUR',
    startDate      : r.start_date       as string,
    endDate        : (r.end_date        as string | null) ?? null,
    linkedChildId  : (r.linked_child_id as string | null) ?? null,
    capsuleStatus  : (r.capsule_status  as CapsuleStatus | null) ?? null,
    notes          : (r.notes           as string | null) ?? null,
    createdAt      : r.created_at       as string,
    updatedAt      : r.updated_at       as string,
    deletedAt      : (r.deleted_at      as string | null) ?? null,
  }
}

// ── Types filtre ──────────────────────────────────────────────────────────

export type ListSponsorsOpts = {
  sponsorshipType?: SponsorshipType
  capsuleStatus?  : CapsuleStatus
}

// ── CRUD ──────────────────────────────────────────────────────────────────

/** Liste tous les sponsors (soft-delete exclus). Filtre optionnel type + capsule. */
export async function listSponsors(opts?: ListSponsorsOpts): Promise<Sponsor[]> {
  let query = supabase
    .from('sponsors')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (opts?.sponsorshipType) query = query.eq('sponsorship_type', opts.sponsorshipType)
  if (opts?.capsuleStatus)   query = query.eq('capsule_status', opts.capsuleStatus)

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}

/** Récupère un sponsor par ID. */
export async function getSponsor(id: string): Promise<Sponsor> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/** Crée un nouveau sponsor. */
export async function createSponsor(params: CreateSponsorParams): Promise<Sponsor> {
  const { data, error } = await supabase
    .from('sponsors')
    .insert({
      name            : params.name.trim(),
      logo_url        : params.logoUrl ?? null,
      contact_name    : params.contactName.trim(),
      contact_email   : params.contactEmail.trim(),
      contact_phone   : params.contactPhone?.trim() ?? '',
      sponsorship_type: params.sponsorshipType,
      amount          : params.amount ?? null,
      currency        : params.currency ?? 'EUR',
      start_date      : params.startDate,
      end_date        : params.endDate ?? null,
      linked_child_id : params.linkedChildId ?? null,
      capsule_status  : params.capsuleStatus ?? 'not_started',
      notes           : params.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/** Met à jour un sponsor existant. */
export async function updateSponsor(id: string, params: UpdateSponsorParams): Promise<Sponsor> {
  const patch: Record<string, unknown> = {}
  if (params.name            !== undefined) patch.name             = params.name.trim()
  if (params.logoUrl         !== undefined) patch.logo_url         = params.logoUrl
  if (params.contactName     !== undefined) patch.contact_name     = params.contactName.trim()
  if (params.contactEmail    !== undefined) patch.contact_email    = params.contactEmail.trim()
  if (params.contactPhone    !== undefined) patch.contact_phone    = params.contactPhone?.trim() ?? ''
  if (params.sponsorshipType !== undefined) patch.sponsorship_type = params.sponsorshipType
  if (params.amount          !== undefined) patch.amount           = params.amount
  if (params.currency        !== undefined) patch.currency         = params.currency
  if (params.startDate       !== undefined) patch.start_date       = params.startDate
  if (params.endDate         !== undefined) patch.end_date         = params.endDate
  if (params.linkedChildId   !== undefined) patch.linked_child_id  = params.linkedChildId
  if (params.capsuleStatus   !== undefined) patch.capsule_status   = params.capsuleStatus
  if (params.notes           !== undefined) patch.notes            = params.notes

  const { data, error } = await supabase
    .from('sponsors')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/** Soft-delete un sponsor. */
export async function deleteSponsor(id: string): Promise<void> {
  const { error } = await supabase
    .from('sponsors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// ── Story 92-3 — Stats clubs partenaires ──────────────────────────────────

export type PartnershipClubStats = {
  totalPartnerClubs    : number
  totalClubSponsors    : number
  totalClubRevenue     : number
  renewalsUpcoming     : number
}

export type PartnerClubSummaryItem = {
  clubId       : string
  clubName     : string
  linkedPlayers: number
  sponsorAmount: number | null
  endDate      : string | null
}

/**
 * KPIs clubs partenaires :
 * - count club_directory where club_relation_type = 'partenaire'
 * - count sponsors where sponsorship_type = 'club'
 * - sum sponsors.amount where type = 'club'
 * - count sponsors where type = 'club' and end_date < now + 90j
 */
export async function getPartnershipClubStats(): Promise<PartnershipClubStats> {
  // 1. Total clubs partenaires
  const { count: clubCount, error: e1 } = await supabase
    .from('club_directory')
    .select('*', { count: 'exact', head: true })
    .eq('club_relation_type', 'partenaire')
    .is('deleted_at', null)

  if (e1) throw e1

  // 2. Sponsors type club
  const { data: clubSponsors, error: e2 } = await supabase
    .from('sponsors')
    .select('id, amount, end_date')
    .eq('sponsorship_type', 'club')
    .is('deleted_at', null)

  if (e2) throw e2

  const sponsors = (clubSponsors ?? []) as { id: string; amount: number | null; end_date: string | null }[]
  const totalClubSponsors = sponsors.length
  const totalClubRevenue  = sponsors.reduce((sum, s) => sum + (s.amount ?? 0), 0)

  // 3. Renouvellements à venir (end_date dans les 90 jours)
  const now = new Date()
  const limit90 = new Date(now.getTime() + 90 * 86_400_000)
  const renewalsUpcoming = sponsors.filter(s => {
    if (!s.end_date) return false
    const d = new Date(s.end_date)
    return d >= now && d <= limit90
  }).length

  return {
    totalPartnerClubs: clubCount ?? 0,
    totalClubSponsors,
    totalClubRevenue,
    renewalsUpcoming,
  }
}

/**
 * Liste résumée des clubs partenaires avec nombre de joueurs liés et montant sponsoring.
 */
export async function listPartnerClubsSummary(): Promise<PartnerClubSummaryItem[]> {
  // Clubs partenaires
  const { data: clubs, error: e1 } = await supabase
    .from('club_directory')
    .select('id, nom')
    .eq('club_relation_type', 'partenaire')
    .is('deleted_at', null)
    .order('nom', { ascending: true })

  if (e1) throw e1
  if (!clubs || clubs.length === 0) return []

  const clubIds = (clubs as { id: string; nom: string }[]).map(c => c.id)

  // Joueurs liés via club_directory_child_links (type = 'current')
  const { data: links, error: e2 } = await supabase
    .from('club_directory_child_links')
    .select('club_id')
    .in('club_id', clubIds)
    .eq('link_type', 'current')

  if (e2) throw e2

  const playerCounts: Record<string, number> = {}
  for (const l of (links ?? []) as { club_id: string }[]) {
    playerCounts[l.club_id] = (playerCounts[l.club_id] ?? 0) + 1
  }

  // Sponsors type club (on ne peut pas faire de FK join direct club_directory → sponsors,
  // mais on fait le recoupement par nom de club — ou on prend tous les sponsors club)
  const { data: sponsorsData, error: e3 } = await supabase
    .from('sponsors')
    .select('name, amount, end_date')
    .eq('sponsorship_type', 'club')
    .is('deleted_at', null)

  if (e3) throw e3

  // Build lookup by sponsor name (lowercase)
  const sponsorByName: Record<string, { amount: number | null; endDate: string | null }> = {}
  for (const s of (sponsorsData ?? []) as { name: string; amount: number | null; end_date: string | null }[]) {
    sponsorByName[s.name.toLowerCase()] = { amount: s.amount, endDate: s.end_date }
  }

  return (clubs as { id: string; nom: string }[]).map(c => {
    const match = sponsorByName[c.nom.toLowerCase()]
    return {
      clubId       : c.id,
      clubName     : c.nom,
      linkedPlayers: playerCounts[c.id] ?? 0,
      sponsorAmount: match?.amount ?? null,
      endDate      : match?.endDate ?? null,
    }
  })
}
