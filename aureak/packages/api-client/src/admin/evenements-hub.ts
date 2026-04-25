// Hub Événements : KPIs globaux + 3 mini-widgets
// Pattern miroir de activites-hub / methodologie-hub / academie-hub.
// Source : table `stages` (event_type) + child_stage_participations.

import { supabase } from '../supabase'
import type { EventType } from '@aureak/types'

// ── Types ────────────────────────────────────────────────────────────────────

export type EvenementsHubKpis = {
  upcoming30d           : number
  upcoming30dPrev       : number
  registrationsThisWeek : number
  registrationsLastWeek : number
  averageFillRate       : number
  fillRateSampleSize    : number
  totalThisSeason       : number
  totalLastSeason       : number
}

export type EvenementsHubNextEvent = {
  eventId         : string
  eventType       : EventType
  name            : string
  startDate       : string
  endDate         : string
  location        : string | null
  implantationName: string | null
  registeredCount : number
  maxParticipants : number | null
}

export type EvenementsHubRecentRegistration = {
  participationId : string
  registeredAt    : string
  childName       : string
  eventId         : string
  eventName       : string
  eventType       : EventType
}

export type EvenementsHubAlmostFull = {
  eventId         : string
  eventType       : EventType
  name            : string
  startDate       : string
  registeredCount : number
  maxParticipants : number
  fillRate        : number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function daysFromTodayISO(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function startOfWeekISO(weeksAgo = 0): string {
  const d  = new Date()
  const dow = (d.getDay() + 6) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - dow - weeksAgo * 7)
  return d.toISOString()
}

function currentSeasonLabel(refDate = new Date()): string {
  const m = refDate.getMonth()
  const y = refDate.getFullYear()
  const startYear = m >= 6 ? y : y - 1
  return `${startYear}-${startYear + 1}`
}

function previousSeasonLabel(refDate = new Date()): string {
  const m = refDate.getMonth()
  const y = refDate.getFullYear()
  const startYear = m >= 6 ? y - 1 : y - 2
  return `${startYear}-${startYear + 1}`
}

async function resolveChildNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data } = await supabase
    .from('child_directory')
    .select('id, display_name')
    .in('id', unique)
  return new Map(
    ((data ?? []) as { id: string; display_name: string | null }[])
      .map(c => [c.id, c.display_name ?? 'Joueur']),
  )
}

// ── Endpoint 1 — KPIs globaux ────────────────────────────────────────────────

export async function getEvenementsHubKpis(): Promise<EvenementsHubKpis> {
  const today    = todayISO()
  const in30d    = daysFromTodayISO(30)
  const m30dAgo  = daysFromTodayISO(-30)
  const weekStart    = startOfWeekISO(0)
  const lastWeekStart = startOfWeekISO(1)
  const seasonNow  = currentSeasonLabel()
  const seasonPrev = previousSeasonLabel()

  const upcomingQ = supabase
    .from('stages')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('start_date', today)
    .lt('start_date',  in30d)

  const upcomingPrevQ = supabase
    .from('stages')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('start_date', m30dAgo)
    .lt('start_date',  today)

  const regsThisWeekQ = supabase
    .from('child_stage_participations')
    .select('id', { count: 'exact', head: true })
    .gte('registered_at', weekStart)

  const regsLastWeekQ = supabase
    .from('child_stage_participations')
    .select('id', { count: 'exact', head: true })
    .gte('registered_at', lastWeekStart)
    .lt('registered_at',  weekStart)

  const seasonNowQ = supabase
    .from('stages')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('season_label', seasonNow)

  const seasonPrevQ = supabase
    .from('stages')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('season_label', seasonPrev)

  const fillRateEventsQ = supabase
    .from('stages')
    .select('id, max_participants, child_stage_participations ( id )')
    .is('deleted_at', null)
    .gte('start_date', today)
    .gt('max_participants', 0)

  const [upcomingRes, upcomingPrevRes, regsThisRes, regsLastRes, seasonNowRes, seasonPrevRes, fillRateRes] =
    await Promise.all([
      upcomingQ, upcomingPrevQ, regsThisWeekQ, regsLastWeekQ, seasonNowQ, seasonPrevQ, fillRateEventsQ,
    ])

  type FillRow = { id: string; max_participants: number; child_stage_participations: unknown[] | null }
  const fillRows = (fillRateRes.data ?? []) as FillRow[]

  let fillRateSum   = 0
  let fillRateCount = 0
  for (const row of fillRows) {
    const max = row.max_participants
    if (!max || max <= 0) continue
    const reg = (row.child_stage_participations ?? []).length
    const rate = Math.min(100, Math.round((reg / max) * 100))
    fillRateSum   += rate
    fillRateCount += 1
  }

  return {
    upcoming30d           : upcomingRes.count     ?? 0,
    upcoming30dPrev       : upcomingPrevRes.count ?? 0,
    registrationsThisWeek : regsThisRes.count     ?? 0,
    registrationsLastWeek : regsLastRes.count     ?? 0,
    averageFillRate       : fillRateCount > 0 ? Math.round(fillRateSum / fillRateCount) : 0,
    fillRateSampleSize    : fillRateCount,
    totalThisSeason       : seasonNowRes.count    ?? 0,
    totalLastSeason       : seasonPrevRes.count   ?? 0,
  }
}

// ── Endpoint 2 — Prochain événement ──────────────────────────────────────────

export async function getEvenementsHubNextEvent(): Promise<EvenementsHubNextEvent | null> {
  const today = todayISO()
  const { data, error } = await supabase
    .from('stages')
    .select(`
      id, name, event_type, start_date, end_date, location, max_participants,
      implantations ( name ),
      child_stage_participations ( id )
    `)
    .is('deleted_at', null)
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)

  if (error || !data || data.length === 0) return null

  const raw = data[0] as {
    id: string; name: string; event_type: EventType
    start_date: string; end_date: string
    location: string | null; max_participants: number | null
    implantations: { name: string } | { name: string }[] | null
    child_stage_participations: unknown[] | null
  }
  const impl = Array.isArray(raw.implantations) ? raw.implantations[0] : raw.implantations

  return {
    eventId         : raw.id,
    eventType       : (raw.event_type ?? 'stage') as EventType,
    name            : raw.name,
    startDate       : raw.start_date,
    endDate         : raw.end_date,
    location        : raw.location,
    implantationName: impl?.name ?? null,
    registeredCount : (raw.child_stage_participations ?? []).length,
    maxParticipants : raw.max_participants,
  }
}

// ── Endpoint 3 — Inscriptions récentes ───────────────────────────────────────

export async function getEvenementsHubRecentRegistrations(
  limit = 5,
): Promise<EvenementsHubRecentRegistration[]> {
  const { data, error } = await supabase
    .from('child_stage_participations')
    .select(`
      id, child_id, stage_id, registered_at,
      stages ( id, name, event_type )
    `)
    .order('registered_at', { ascending: false })
    .limit(limit)

  if (error || !data || data.length === 0) return []

  type Row = {
    id: string; child_id: string; stage_id: string; registered_at: string
    stages: { id: string; name: string; event_type: EventType } | { id: string; name: string; event_type: EventType }[] | null
  }
  const rows = data as unknown as Row[]

  const childIds = rows.map(r => r.child_id)
  const childMap = await resolveChildNames(childIds)

  return rows.map(r => {
    const ev = Array.isArray(r.stages) ? r.stages[0] : r.stages
    return {
      participationId: r.id,
      registeredAt   : r.registered_at,
      childName      : childMap.get(r.child_id) ?? 'Joueur',
      eventId        : ev?.id ?? r.stage_id,
      eventName      : ev?.name ?? 'Événement',
      eventType      : (ev?.event_type ?? 'stage') as EventType,
    }
  })
}

// ── Endpoint 4 — Événements bientôt complets ─────────────────────────────────

export async function getEvenementsHubAlmostFull(
  threshold = 80,
  limit = 3,
): Promise<EvenementsHubAlmostFull[]> {
  const today = todayISO()
  const { data, error } = await supabase
    .from('stages')
    .select(`
      id, name, event_type, start_date, max_participants,
      child_stage_participations ( id )
    `)
    .is('deleted_at', null)
    .gte('start_date', today)
    .gt('max_participants', 0)
    .order('start_date', { ascending: true })
    .limit(50)

  if (error || !data || data.length === 0) return []

  type Row = {
    id: string; name: string; event_type: EventType
    start_date: string; max_participants: number
    child_stage_participations: unknown[] | null
  }
  const rows = data as unknown as Row[]

  return rows
    .map(r => {
      const reg = (r.child_stage_participations ?? []).length
      const fillRate = Math.min(100, Math.round((reg / r.max_participants) * 100))
      return {
        eventId        : r.id,
        eventType      : (r.event_type ?? 'stage') as EventType,
        name           : r.name,
        startDate      : r.start_date,
        registeredCount: reg,
        maxParticipants: r.max_participants,
        fillRate,
      }
    })
    .filter(e => e.fillRate >= threshold)
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, limit)
}
