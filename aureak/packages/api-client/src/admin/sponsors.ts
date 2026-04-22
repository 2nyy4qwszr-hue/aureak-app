// Epic 92 — Story 92.2 : Sponsors liés à enfants (parrainage académie)
// API admin : CRUD sponsors + lien sponsor↔enfant + autocomplete children.
// RLS : admin tenant-isolated (migration 00169). tenant_id injecté manuellement
// côté insert (pattern cohérent avec coach/recommendations, admin/coach-prospection).

import { supabase } from '../supabase'
import type {
  Sponsor,
  SponsorChildLink,
  SponsorChildLinkWithChild,
  SponsorType,
  SponsorWithCounts,
} from '@aureak/types'

// ── Helpers ────────────────────────────────────────────────────────────────

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function mapSponsorRow(r: Record<string, unknown>): Sponsor {
  return {
    id                : r.id as string,
    tenantId          : r.tenant_id as string,
    name              : r.name as string,
    sponsorType       : r.sponsor_type as SponsorType,
    annualAmountCents : (r.annual_amount_cents as number | null) ?? null,
    activeFrom        : r.active_from as string,
    activeUntil       : (r.active_until as string | null) ?? null,
    contactEmail      : (r.contact_email as string | null) ?? null,
    contactPhone      : (r.contact_phone as string | null) ?? null,
    notes             : (r.notes as string | null) ?? null,
    createdAt         : r.created_at as string,
    updatedAt         : r.updated_at as string,
    createdBy         : (r.created_by as string | null) ?? null,
  }
}

function mapLinkRow(r: Record<string, unknown>): SponsorChildLink {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    sponsorId            : r.sponsor_id as string,
    childId              : r.child_id as string,
    startedAt            : r.started_at as string,
    endedAt              : (r.ended_at as string | null) ?? null,
    allocatedAmountCents : (r.allocated_amount_cents as number | null) ?? null,
    notes                : (r.notes as string | null) ?? null,
    createdAt            : r.created_at as string,
    createdBy            : (r.created_by as string | null) ?? null,
  }
}

// ── listSponsors ───────────────────────────────────────────────────────────

export async function listSponsors(): Promise<{ data: SponsorWithCounts[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*, sponsor_child_links(ended_at)')
      .order('created_at', { ascending: false })
    if (error) throw error
    const today = todayIso()
    const rows = (data ?? []) as Array<Record<string, unknown> & { sponsor_child_links?: Array<{ ended_at: string | null }> }>
    const result: SponsorWithCounts[] = rows.map(row => {
      const base  = mapSponsorRow(row)
      const links = Array.isArray(row.sponsor_child_links) ? row.sponsor_child_links : []
      const activeChildrenCount = links.filter(l => l.ended_at === null).length
      const isActive = base.activeFrom <= today && (base.activeUntil === null || base.activeUntil >= today)
      return { ...base, activeChildrenCount, isActive }
    })
    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] listSponsors error:', err)
    return { data: [], error: err }
  }
}

// ── getSponsor ─────────────────────────────────────────────────────────────

export async function getSponsor(sponsorId: string): Promise<{ data: Sponsor | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', sponsorId)
      .maybeSingle()
    if (error) throw error
    return { data: data ? mapSponsorRow(data as Record<string, unknown>) : null, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] getSponsor error:', err)
    return { data: null, error: err }
  }
}

// ── createSponsor ──────────────────────────────────────────────────────────

export type CreateSponsorParams = {
  name              : string
  sponsorType       : SponsorType
  annualAmountCents?: number | null
  activeFrom?       : string          // ISO date, default today
  activeUntil?      : string | null
  contactEmail?     : string | null
  contactPhone?     : string | null
  notes?            : string | null
}

export async function createSponsor(
  params: CreateSponsorParams,
): Promise<{ data: Sponsor | null; error: unknown }> {
  try {
    const { userId, tenantId } = await resolveTenantId()
    const { data, error } = await supabase
      .from('sponsors')
      .insert({
        tenant_id           : tenantId,
        name                : params.name,
        sponsor_type        : params.sponsorType,
        annual_amount_cents : params.annualAmountCents ?? null,
        active_from         : params.activeFrom  ?? todayIso(),
        active_until        : params.activeUntil ?? null,
        contact_email       : params.contactEmail ?? null,
        contact_phone       : params.contactPhone ?? null,
        notes               : params.notes ?? null,
        created_by          : userId,
      })
      .select('*')
      .single()
    if (error) throw error
    return { data: mapSponsorRow(data as Record<string, unknown>), error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] createSponsor error:', err)
    return { data: null, error: err }
  }
}

// ── updateSponsor ──────────────────────────────────────────────────────────

export type UpdateSponsorPatch = Partial<{
  name              : string
  sponsorType       : SponsorType
  annualAmountCents : number | null
  activeFrom        : string
  activeUntil       : string | null
  contactEmail      : string | null
  contactPhone      : string | null
  notes             : string | null
}>

export async function updateSponsor(
  sponsorId: string,
  patch    : UpdateSponsorPatch,
): Promise<{ data: Sponsor | null; error: unknown }> {
  try {
    const dbPatch: Record<string, unknown> = {}
    if (patch.name              !== undefined) dbPatch.name                = patch.name
    if (patch.sponsorType       !== undefined) dbPatch.sponsor_type        = patch.sponsorType
    if (patch.annualAmountCents !== undefined) dbPatch.annual_amount_cents = patch.annualAmountCents
    if (patch.activeFrom        !== undefined) dbPatch.active_from         = patch.activeFrom
    if (patch.activeUntil       !== undefined) dbPatch.active_until        = patch.activeUntil
    if (patch.contactEmail      !== undefined) dbPatch.contact_email       = patch.contactEmail
    if (patch.contactPhone      !== undefined) dbPatch.contact_phone       = patch.contactPhone
    if (patch.notes             !== undefined) dbPatch.notes               = patch.notes

    const { data, error } = await supabase
      .from('sponsors')
      .update(dbPatch)
      .eq('id', sponsorId)
      .select('*')
      .single()
    if (error) throw error
    return { data: mapSponsorRow(data as Record<string, unknown>), error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] updateSponsor error:', err)
    return { data: null, error: err }
  }
}

// ── listSponsorChildren ────────────────────────────────────────────────────

export async function listSponsorChildren(
  sponsorId: string,
  opts     : { includeEnded?: boolean } = {},
): Promise<{ data: SponsorChildLinkWithChild[]; error: unknown }> {
  try {
    let query = supabase
      .from('sponsor_child_links')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .order('started_at', { ascending: false })
    if (!opts.includeEnded) query = query.is('ended_at', null)
    const { data, error } = await query
    if (error) throw error

    const links = ((data ?? []) as Record<string, unknown>[]).map(mapLinkRow)
    if (links.length === 0) return { data: [], error: null }

    const childIds = Array.from(new Set(links.map(l => l.childId)))
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, birth_date')
      .in('user_id', childIds)
    if (profilesError) throw profilesError

    const byId = new Map<string, { user_id: string; display_name: string; birth_date: string | null }>()
    for (const p of (profiles ?? []) as Array<{ user_id: string; display_name: string; birth_date: string | null }>) {
      byId.set(p.user_id, p)
    }

    const result: SponsorChildLinkWithChild[] = links.map(link => {
      const p = byId.get(link.childId)
      return {
        ...link,
        child: {
          userId      : p?.user_id      ?? link.childId,
          displayName : p?.display_name ?? 'Enfant inconnu',
          birthDate   : p?.birth_date   ?? null,
        },
      }
    })
    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] listSponsorChildren error:', err)
    return { data: [], error: err }
  }
}

// ── linkChildToSponsor ─────────────────────────────────────────────────────

export type LinkChildToSponsorParams = {
  sponsorId              : string
  childId                : string
  startedAt?             : string         // ISO date, default today
  endedAt?               : string | null
  allocatedAmountCents?  : number | null
  notes?                 : string | null
}

export async function linkChildToSponsor(
  params: LinkChildToSponsorParams,
): Promise<{ data: SponsorChildLink | null; error: unknown }> {
  try {
    const { userId, tenantId } = await resolveTenantId()
    const { data, error } = await supabase
      .from('sponsor_child_links')
      .insert({
        tenant_id              : tenantId,
        sponsor_id             : params.sponsorId,
        child_id               : params.childId,
        started_at             : params.startedAt ?? todayIso(),
        ended_at               : params.endedAt ?? null,
        allocated_amount_cents : params.allocatedAmountCents ?? null,
        notes                  : params.notes ?? null,
        created_by             : userId,
      })
      .select('*')
      .single()
    if (error) throw error
    return { data: mapLinkRow(data as Record<string, unknown>), error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] linkChildToSponsor error:', err)
    return { data: null, error: err }
  }
}

// ── unlinkChildFromSponsor (soft-delete via ended_at) ──────────────────────

export async function unlinkChildFromSponsor(
  linkId: string,
): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase
      .from('sponsor_child_links')
      .update({ ended_at: todayIso() })
      .eq('id', linkId)
    if (error) throw error
    return { error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] unlinkChildFromSponsor error:', err)
    return { error: err }
  }
}

// ── searchChildrenForSponsor (autocomplete) ────────────────────────────────

export type SponsorCandidateChild = {
  userId      : string
  displayName : string
  birthDate   : string | null
}

export async function searchChildrenForSponsor(
  query: string,
  limit = 20,
): Promise<{ data: SponsorCandidateChild[]; error: unknown }> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return { data: [], error: null }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, birth_date')
      .eq('user_role', 'child')
      .is('deleted_at', null)
      .ilike('display_name', `%${trimmed}%`)
      .order('display_name', { ascending: true })
      .limit(limit)
    if (error) throw error
    const rows = (data ?? []) as Array<{ user_id: string; display_name: string; birth_date: string | null }>
    return {
      data: rows.map(r => ({
        userId      : r.user_id,
        displayName : r.display_name,
        birthDate   : r.birth_date,
      })),
      error: null,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] searchChildrenForSponsor error:', err)
    return { data: [], error: err }
  }
}
