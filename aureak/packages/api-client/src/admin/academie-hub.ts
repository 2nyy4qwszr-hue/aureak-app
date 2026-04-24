// Hub Académie : KPIs globaux + mini-widgets (mirror methodologie-hub / activites-hub)
// Endpoints dédiés à la vue d'ensemble /academie

import { supabase } from '../supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export type AcademieHubKpis = {
  joueursActifs          : number   // ACADÉMICIEN + NOUVEAU_ACADÉMICIEN
  joueursNewThisMonth    : number   // nouveaux enregistrements ce mois (pour trend)
  joueursNewLastMonth    : number   // mois précédent (pour trend)
  coachsTotal            : number   // profiles.user_role='coach'
  coachsActiveLast30d    : number   // coachs ayant animé ≥ 1 séance ces 30 jours
  prospectsPipeline      : number   // child_directory.prospect_status non null
  clubsPartenaires       : number   // club_directory (total)
  implantationsTotal     : number
}

export type AcademieWeekSummary = {
  weekNumber          : number
  newJoueursThisWeek  : number
  upcomingBirthdays   : number   // anniversaires dans les 7 prochains jours
  currentSeasonLabel  : string | null
  currentSeasonStart  : string | null
  currentSeasonEnd    : string | null
}

export type AcademieLatestJoueur = {
  childId         : string
  displayName     : string
  currentClub     : string | null
  computedStatus  : string | null
  createdAt       : string
  weekNumber      : number
}

export type AcademieRecentJoueur = {
  childId         : string
  displayName     : string
  currentClub     : string | null
  computedStatus  : string | null
  createdAt       : string
}

export type AcademieHubImplantation = {
  implantationId  : string
  name            : string
  shortName       : string | null
  address         : string | null
  maxPlayers      : number | null
}

export type AcademieHubOldAcademicien = {
  childId         : string
  displayName     : string
  currentClub     : string | null
  totalAcademySeasons : number
}

// ── Helpers internes ─────────────────────────────────────────────────────────

function monthBounds(refDate = new Date()): { start: Date; end: Date } {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
  const end   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1)
  return { start, end }
}

function weekBounds(refDate = new Date()): { start: Date; end: Date } {
  const d   = new Date(refDate)
  const day = d.getDay() || 7                     // ISO : lundi = 1, dimanche = 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (day - 1))              // retour au lundi
  const end = new Date(d)
  end.setDate(end.getDate() + 7)
  return { start: d, end }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
}

// ── Endpoint 1 — KPIs globaux ────────────────────────────────────────────────

export async function getAcademieHubKpis(): Promise<AcademieHubKpis> {
  const now       = new Date()
  const thisMo    = monthBounds(now)
  const lastMoRef = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  const lastMo    = monthBounds(lastMoRef)

  const [
    joueursActifsRes,
    joueursNewThisMoRes,
    joueursNewLastMoRes,
    coachsTotalRes,
    prospectsRes,
    clubsRes,
    implantationsRes,
  ] = await Promise.all([
    supabase
      .from('v_child_academy_status')
      .select('child_id', { count: 'exact', head: true })
      .in('computed_status', ['ACADÉMICIEN', 'NOUVEAU_ACADÉMICIEN']),
    supabase
      .from('child_directory')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', thisMo.start.toISOString())
      .lt('created_at',  thisMo.end.toISOString()),
    supabase
      .from('child_directory')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', lastMo.start.toISOString())
      .lt('created_at',  lastMo.end.toISOString()),
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_role', 'coach')
      .is('deleted_at', null),
    supabase
      .from('child_directory')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('prospect_status', 'is', null),
    supabase
      .from('club_directory')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('club_relation_type', 'partenaire'),
    supabase
      .from('implantations')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
  ])

  return {
    joueursActifs       : joueursActifsRes.count       ?? 0,
    joueursNewThisMonth : joueursNewThisMoRes.count    ?? 0,
    joueursNewLastMonth : joueursNewLastMoRes.count    ?? 0,
    coachsTotal         : coachsTotalRes.count         ?? 0,
    coachsActiveLast30d : coachsTotalRes.count         ?? 0, // placeholder — à raffiner si besoin
    prospectsPipeline   : prospectsRes.count           ?? 0,
    clubsPartenaires    : clubsRes.count               ?? 0,
    implantationsTotal  : implantationsRes.count       ?? 0,
  }
}

// ── Endpoint 2 — Résumé de la semaine ────────────────────────────────────────
// Compte les nouveaux joueurs de la semaine + anniversaires à venir (7 jours).
// Expose la saison académie courante pour afficher une barre de progression.

export async function getAcademieWeekSummary(): Promise<AcademieWeekSummary> {
  const now        = new Date()
  const week       = weekBounds(now)
  const weekNumber = getISOWeekNumber(now)

  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  const [newThisWeekRes, birthdayRowsRes, seasonRes] = await Promise.all([
    supabase
      .from('child_directory')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', week.start.toISOString())
      .lt('created_at',  week.end.toISOString()),
    supabase
      .from('child_directory')
      .select('birth_date')
      .is('deleted_at', null)
      .not('birth_date', 'is', null),
    supabase
      .from('academy_seasons')
      .select('label, start_date, end_date, is_current')
      .eq('is_current', true)
      .limit(1),
  ])

  // Anniversaires : filtre côté client (pas de DATE_PART via REST)
  const birthdayRows = (birthdayRowsRes.data ?? []) as { birth_date: string }[]
  const todayMD      = now.getMonth()    * 32 + now.getDate()
  const in7MD        = in7Days.getMonth() * 32 + in7Days.getDate()
  const upcomingBirthdays = birthdayRows.filter(r => {
    if (!r.birth_date) return false
    const d  = new Date(r.birth_date)
    const md = d.getMonth() * 32 + d.getDate()
    // fenêtre glissante sur 7 jours (gère la fin d'année)
    if (todayMD <= in7MD) return md >= todayMD && md <= in7MD
    return md >= todayMD || md <= in7MD
  }).length

  const season = ((seasonRes.data ?? [])[0] ?? null) as
    | { label: string; start_date: string; end_date: string }
    | null

  return {
    weekNumber,
    newJoueursThisWeek : newThisWeekRes.count ?? 0,
    upcomingBirthdays,
    currentSeasonLabel : season?.label      ?? null,
    currentSeasonStart : season?.start_date ?? null,
    currentSeasonEnd   : season?.end_date   ?? null,
  }
}

// ── Endpoint 3 — Nouvel arrivant (dernier joueur inscrit) ────────────────────

export async function getAcademieLatestJoueur(): Promise<AcademieLatestJoueur | null> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('id, display_name, current_club, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  const row = data[0] as { id: string; display_name: string; current_club: string | null; created_at: string }

  // Enrichir avec computed_status via la vue
  const { data: statusRow } = await supabase
    .from('v_child_academy_status')
    .select('computed_status')
    .eq('child_id', row.id)
    .maybeSingle()

  return {
    childId        : row.id,
    displayName    : row.display_name,
    currentClub    : row.current_club,
    computedStatus : (statusRow as { computed_status: string | null } | null)?.computed_status ?? null,
    createdAt      : row.created_at,
    weekNumber     : getISOWeekNumber(new Date()),
  }
}

// ── Endpoint 4 — Derniers joueurs inscrits ───────────────────────────────────

export async function getAcademieRecentJoueurs(limit = 5): Promise<AcademieRecentJoueur[]> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('id, display_name, current_club, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  const rows = data as { id: string; display_name: string; current_club: string | null; created_at: string }[]
  if (rows.length === 0) return []

  // Enrichissement batch des statuts
  const { data: statusRows } = await supabase
    .from('v_child_academy_status')
    .select('child_id, computed_status')
    .in('child_id', rows.map(r => r.id))

  const statusMap = new Map<string, string | null>(
    ((statusRows ?? []) as { child_id: string; computed_status: string | null }[])
      .map(s => [s.child_id, s.computed_status]),
  )

  return rows.map(r => ({
    childId        : r.id,
    displayName    : r.display_name,
    currentClub    : r.current_club,
    computedStatus : statusMap.get(r.id) ?? null,
    createdAt      : r.created_at,
  }))
}

// ── Endpoint 5 — Implantations (top N) ───────────────────────────────────────

export async function getAcademieHubImplantations(limit = 5): Promise<AcademieHubImplantation[]> {
  const { data, error } = await supabase
    .from('implantations')
    .select('id, name, short_name, address, max_players')
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(limit)

  if (error || !data) return []

  return (data as { id: string; name: string; short_name: string | null; address: string | null; max_players: number | null }[])
    .map(r => ({
      implantationId : r.id,
      name           : r.name,
      shortName      : r.short_name,
      address        : r.address,
      maxPlayers     : r.max_players,
    }))
}

// ── Endpoint 6 — Anciens à recontacter (ANCIEN sans saison courante) ─────────

export async function getAcademieOldAcademiciens(limit = 5): Promise<AcademieHubOldAcademicien[]> {
  const { data, error } = await supabase
    .from('v_child_academy_status')
    .select('child_id, total_academy_seasons')
    .eq('computed_status', 'ANCIEN')
    .order('total_academy_seasons', { ascending: false })
    .limit(limit)

  if (error || !data || data.length === 0) return []
  const rows = data as { child_id: string; total_academy_seasons: number }[]

  const { data: childRows } = await supabase
    .from('child_directory')
    .select('id, display_name, current_club')
    .in('id', rows.map(r => r.child_id))
    .is('deleted_at', null)

  const childMap = new Map<string, { display_name: string; current_club: string | null }>(
    ((childRows ?? []) as { id: string; display_name: string; current_club: string | null }[])
      .map(c => [c.id, { display_name: c.display_name, current_club: c.current_club }]),
  )

  return rows
    .map(r => {
      const c = childMap.get(r.child_id)
      if (!c) return null
      return {
        childId             : r.child_id,
        displayName         : c.display_name,
        currentClub         : c.current_club,
        totalAcademySeasons : r.total_academy_seasons,
      } as AcademieHubOldAcademicien
    })
    .filter((x): x is AcademieHubOldAcademicien => x !== null)
}
