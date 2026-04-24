// Hub Méthodologie : KPIs globaux + mini-widgets (mirror activites-hub)
// Endpoints dédiés à la vue d'ensemble /methodologie
import { supabase } from '../supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export type MethodologieHubKpis = {
  trainingsTotal      : number
  trainingsThisMonth  : number
  trainingsLastMonth  : number   // pour trend
  situationsTotal     : number
  programmesActive    : number
  themeCoveragePct    : number   // 0-100 — % thèmes actifs avec ≥ 1 entraînement
  themesTotal         : number
  themesCovered       : number
}

export type HubMethodologySituationOfWeek = {
  situationId : string
  title       : string
  method      : string | null
  description : string | null
  weekNumber  : number
}

export type HubRecentTraining = {
  sessionId : string
  title     : string
  method    : string | null
  createdAt : string
}

export type HubRecentSituation = {
  situationId : string
  title       : string
  method      : string | null
  themeName   : string | null
  createdAt   : string
}

export type HubOrphanTheme = {
  themeId : string
  title   : string
  method  : string | null
}

// ── Helpers internes ─────────────────────────────────────────────────────────

function monthBounds(refDate = new Date()): { start: Date; end: Date } {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
  const end   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1)
  return { start, end }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
}

// ── Endpoint 1 — KPIs globaux ────────────────────────────────────────────────

export async function getMethodologieHubKpis(): Promise<MethodologieHubKpis> {
  const now        = new Date()
  const thisMo     = monthBounds(now)
  const lastMoRef  = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  const lastMo     = monthBounds(lastMoRef)

  const [
    trainingsTotalRes,
    trainingsThisMoRes,
    trainingsLastMoRes,
    situationsTotalRes,
    programmesActiveRes,
    themesActiveRes,
    sessionThemeLinksRes,
  ] = await Promise.all([
    supabase
      .from('methodology_sessions')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_active', true),
    supabase
      .from('methodology_sessions')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', thisMo.start.toISOString())
      .lt('created_at',  thisMo.end.toISOString()),
    supabase
      .from('methodology_sessions')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', lastMo.start.toISOString())
      .lt('created_at',  lastMo.end.toISOString()),
    supabase
      .from('methodology_situations')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_active', true),
    supabase
      .from('methodology_programmes')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_active', true),
    supabase
      .from('methodology_themes')
      .select('id')
      .is('deleted_at', null)
      .eq('is_active', true),
    supabase
      .from('methodology_session_themes')
      .select('theme_id'),
  ])

  const trainingsTotal     = trainingsTotalRes.count     ?? 0
  const trainingsThisMonth = trainingsThisMoRes.count    ?? 0
  const trainingsLastMonth = trainingsLastMoRes.count    ?? 0
  const situationsTotal    = situationsTotalRes.count    ?? 0
  const programmesActive   = programmesActiveRes.count   ?? 0

  const themesActive  = ((themesActiveRes.data ?? []) as { id: string }[]).map(t => t.id)
  const themeLinks    = ((sessionThemeLinksRes.data ?? []) as { theme_id: string }[]).map(l => l.theme_id)
  const coveredSet    = new Set(themeLinks)
  const themesCovered = themesActive.filter(id => coveredSet.has(id)).length
  const themesTotal   = themesActive.length
  const themeCoveragePct = themesTotal > 0
    ? Math.round((themesCovered / themesTotal) * 100)
    : 0

  return {
    trainingsTotal,
    trainingsThisMonth,
    trainingsLastMonth,
    situationsTotal,
    programmesActive,
    themeCoveragePct,
    themesTotal,
    themesCovered,
  }
}

// ── Endpoint 2 — Situation de la semaine ─────────────────────────────────────
// Rotation cyclique sur situations actives triées par titre (même logique que getThemeOfWeek).

export async function getHubSituationOfWeek(): Promise<HubMethodologySituationOfWeek | null> {
  const { data, error } = await supabase
    .from('methodology_situations')
    .select('id, title, method, description')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (error || !data || data.length === 0) return null
  const rows = data as { id: string; title: string; method: string | null; description: string | null }[]

  const weekNumber = getISOWeekNumber(new Date())
  const idx        = (weekNumber - 1) % rows.length
  const pick       = rows[idx]!

  return {
    situationId : pick.id,
    title       : pick.title,
    method      : pick.method,
    description : pick.description,
    weekNumber,
  }
}

// ── Endpoint 3 — Derniers entraînements créés ────────────────────────────────

export async function getHubRecentTrainings(limit = 3): Promise<HubRecentTraining[]> {
  const { data, error } = await supabase
    .from('methodology_sessions')
    .select('id, title, method, created_at')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as { id: string; title: string; method: string | null; created_at: string }[]).map(r => ({
    sessionId : r.id,
    title     : r.title,
    method    : r.method,
    createdAt : r.created_at,
  }))
}

// ── Endpoint 4 — Dernières situations ajoutées ───────────────────────────────

export async function getHubRecentSituations(limit = 3): Promise<HubRecentSituation[]> {
  const { data, error } = await supabase
    .from('methodology_situations')
    .select(`
      id, title, method, created_at, theme_id,
      methodology_themes!methodology_situations_theme_id_fkey ( title )
    `)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  type Row = {
    id: string; title: string; method: string | null; created_at: string; theme_id: string | null
    methodology_themes: { title: string } | { title: string }[] | null
  }

  return (data as Row[]).map(r => {
    const theme = Array.isArray(r.methodology_themes) ? r.methodology_themes[0] : r.methodology_themes
    return {
      situationId : r.id,
      title       : r.title,
      method      : r.method,
      themeName   : theme?.title ?? null,
      createdAt   : r.created_at,
    }
  })
}

// ── Endpoint 5 — Thèmes sans entraînement (orphelins) ────────────────────────

export async function getHubOrphanThemes(limit = 5): Promise<HubOrphanTheme[]> {
  const [themesRes, linksRes] = await Promise.all([
    supabase
      .from('methodology_themes')
      .select('id, title, method')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('title', { ascending: true }),
    supabase
      .from('methodology_session_themes')
      .select('theme_id'),
  ])

  if (themesRes.error || !themesRes.data) return []

  const themes  = themesRes.data as { id: string; title: string; method: string | null }[]
  const linkSet = new Set(((linksRes.data ?? []) as { theme_id: string }[]).map(l => l.theme_id))

  return themes
    .filter(t => !linkSet.has(t.id))
    .slice(0, limit)
    .map(t => ({ themeId: t.id, title: t.title, method: t.method }))
}
