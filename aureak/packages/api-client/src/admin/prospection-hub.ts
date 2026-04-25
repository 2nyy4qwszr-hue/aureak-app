// Hub Prospection — KPIs + 3 mini-widgets (vue d'ensemble /prospection)
// Pattern miroir activites-hub.ts : 4 KPIs globaux + recent actions + funnel + top commerciaux
import { supabase } from '../supabase'
import type { ClubProspectStatus, ProspectActionType, CoachProspectStatus } from '@aureak/types'

// ── Types ────────────────────────────────────────────────────────────────────

export type ProspectionHubKpis = {
  clubsActiveTotal     : number   // pipeline clubs hors converti/perdu
  clubsCreatedThisMonth: number   // ajoutés ce mois (pour trend / meta)
  clubsCreatedLastMonth: number
  clubsInClosing       : number   // rdv_qualifie + closing
  conversionsThisMonth : number
  conversionsLastMonth : number
  coachesInPipeline    : number   // identifie + info_envoyee + en_formation
  coachesActive        : number   // status = actif
}

export type HubProspectAction = {
  actionId    : string
  actionType  : ProspectActionType
  performedAt : string
  performerName: string | null
  clubName    : string
  description : string | null
}

export type HubPipelineFunnel = {
  status: ClubProspectStatus
  count : number
}

export type HubTopCommercial = {
  commercialId : string
  displayName  : string
  conversions  : number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthBounds(refDate = new Date()): { start: Date; end: Date } {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
  const end   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1)
  return { start, end }
}

async function resolveProfileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', unique)
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[prospection-hub] resolveProfileNames:', error)
    return new Map()
  }
  return new Map(
    ((data ?? []) as { user_id: string; display_name: string | null }[])
      .map(p => [p.user_id, p.display_name ?? 'Inconnu']),
  )
}

const ACTIVE_CLUB_STATUSES: ClubProspectStatus[] = [
  'premier_contact', 'mapping_orga', 'decisionnaire_identifie', 'rdv_qualifie', 'closing',
]

const COACH_PIPELINE_STATUSES: CoachProspectStatus[] = ['identifie', 'info_envoyee', 'en_formation']

// ── Endpoint 1 — KPIs globaux ────────────────────────────────────────────────

export async function getProspectionHubKpis(): Promise<ProspectionHubKpis> {
  const now      = new Date()
  const thisMo   = monthBounds(now)
  const lastMoRef = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  const lastMo   = monthBounds(lastMoRef)

  const [
    activeRes,
    createdThisMoRes,
    createdLastMoRes,
    inClosingRes,
    convertedThisMoRes,
    convertedLastMoRes,
    coachesPipelineRes,
    coachesActiveRes,
  ] = await Promise.all([
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ACTIVE_CLUB_STATUSES),
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', thisMo.start.toISOString())
      .lt('created_at',  thisMo.end.toISOString()),
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', lastMo.start.toISOString())
      .lt('created_at',  lastMo.end.toISOString()),
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['rdv_qualifie', 'closing']),
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'converti')
      .gte('updated_at', thisMo.start.toISOString())
      .lt('updated_at',  thisMo.end.toISOString()),
    supabase.from('club_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'converti')
      .gte('updated_at', lastMo.start.toISOString())
      .lt('updated_at',  lastMo.end.toISOString()),
    supabase.from('coach_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', COACH_PIPELINE_STATUSES),
    supabase.from('coach_prospects')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'actif'),
  ])

  return {
    clubsActiveTotal     : activeRes.count        ?? 0,
    clubsCreatedThisMonth: createdThisMoRes.count ?? 0,
    clubsCreatedLastMonth: createdLastMoRes.count ?? 0,
    clubsInClosing       : inClosingRes.count     ?? 0,
    conversionsThisMonth : convertedThisMoRes.count ?? 0,
    conversionsLastMonth : convertedLastMoRes.count ?? 0,
    coachesInPipeline    : coachesPipelineRes.count ?? 0,
    coachesActive        : coachesActiveRes.count   ?? 0,
  }
}

// ── Endpoint 2 — Activité récente (5 dernières prospect_actions) ─────────────

export async function getProspectionHubRecentActions(limit = 5): Promise<HubProspectAction[]> {
  const { data, error } = await supabase
    .from('prospect_actions')
    .select('id, club_prospect_id, performed_by, action_type, description, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data || data.length === 0) {
    if (error && process.env.NODE_ENV !== 'production') console.error('[prospection-hub] recent actions:', error)
    return []
  }

  type ActionRow = {
    id: string; club_prospect_id: string; performed_by: string
    action_type: ProspectActionType; description: string | null; created_at: string
  }
  const rows = data as ActionRow[]

  const clubIds    = [...new Set(rows.map(r => r.club_prospect_id))]
  const performerIds = [...new Set(rows.map(r => r.performed_by))]

  const [clubsRes, performerMap] = await Promise.all([
    supabase.from('club_prospects').select('id, club_name').in('id', clubIds),
    resolveProfileNames(performerIds),
  ])

  const clubMap = new Map(
    ((clubsRes.data ?? []) as { id: string; club_name: string }[]).map(c => [c.id, c.club_name]),
  )

  return rows.map(r => ({
    actionId     : r.id,
    actionType   : r.action_type,
    performedAt  : r.created_at,
    performerName: performerMap.get(r.performed_by) ?? null,
    clubName     : clubMap.get(r.club_prospect_id) ?? 'Club inconnu',
    description  : r.description,
  }))
}

// ── Endpoint 3 — Funnel pipeline clubs (7 statuts) ───────────────────────────

export async function getProspectionHubPipelineFunnel(): Promise<HubPipelineFunnel[]> {
  const ALL_STATUSES: ClubProspectStatus[] = [
    'premier_contact', 'mapping_orga', 'decisionnaire_identifie',
    'rdv_qualifie', 'closing', 'converti', 'perdu',
  ]

  // 1 query : on récupère tous les statuts vivants et on agrège côté client
  const { data, error } = await supabase
    .from('club_prospects')
    .select('status')
    .is('deleted_at', null)
    .limit(5000)

  if (error || !data) {
    if (error && process.env.NODE_ENV !== 'production') console.error('[prospection-hub] funnel:', error)
    return ALL_STATUSES.map(s => ({ status: s, count: 0 }))
  }

  const rows = data as { status: ClubProspectStatus }[]
  const counts = new Map<ClubProspectStatus, number>()
  for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)

  return ALL_STATUSES.map(s => ({ status: s, count: counts.get(s) ?? 0 }))
}

// ── Endpoint 4 — Top commerciaux du mois (par conversions) ──────────────────

export async function getProspectionHubTopCommercials(limit = 5): Promise<HubTopCommercial[]> {
  const thisMo = monthBounds()

  const { data, error } = await supabase
    .from('club_prospects')
    .select('assigned_commercial_id')
    .is('deleted_at', null)
    .eq('status', 'converti')
    .gte('updated_at', thisMo.start.toISOString())
    .lt('updated_at',  thisMo.end.toISOString())

  if (error || !data) {
    if (error && process.env.NODE_ENV !== 'production') console.error('[prospection-hub] top commercials:', error)
    return []
  }

  const rows = data as { assigned_commercial_id: string }[]
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.assigned_commercial_id, (counts.get(r.assigned_commercial_id) ?? 0) + 1)

  if (counts.size === 0) return []

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  const ids = sorted.map(([id]) => id)
  const nameMap = await resolveProfileNames(ids)

  return sorted.map(([id, n]) => ({
    commercialId: id,
    displayName : nameMap.get(id) ?? 'Commercial',
    conversions : n,
  }))
}
