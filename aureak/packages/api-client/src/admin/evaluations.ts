// Admin — Liste des évaluations avec résolution des noms d'enfants
// Conformité ARCH-1 : accès Supabase centralisé hors composants UI.
// Story 55-5 — Comparaison biais coach-à-coach

import { supabase } from '../supabase'
import type { CoachBiasReport, DangerousPlayer } from '@aureak/types'

export type AdminEvalRow = {
  id         : string
  sessionId  : string
  childId    : string
  childName  : string | null
  receptivite: string
  goutEffort : string
  attitude   : string
  topSeance  : boolean
  evalAt     : string
}

/**
 * Liste les évaluations sur une plage de dates, avec le display_name de l'enfant résolu.
 * Utilisé par la page admin evaluations/index.tsx.
 */
export async function listEvaluationsAdmin(
  from: string,
  to  : string,
): Promise<{ data: AdminEvalRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      id, session_id, child_id, receptivite, gout_effort, attitude, top_seance, updated_at,
      profiles!evaluations_child_id_fkey ( display_name )
    `)
    .gte('updated_at', new Date(from + 'T00:00:00').toISOString())
    .lte('updated_at', new Date(to + 'T23:59:59').toISOString())
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) return { data: [], error }

  const rows: AdminEvalRow[] = ((data ?? []) as unknown[]).map((r) => {
    const row = r as {
      id: string; session_id: string; child_id: string
      receptivite: string; gout_effort: string; attitude: string
      top_seance: boolean; updated_at: string
      profiles: { display_name: string | null }[] | { display_name: string | null } | null
    }
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id         : row.id,
      sessionId  : row.session_id,
      childId    : row.child_id,
      childName  : (profile as { display_name: string | null } | undefined)?.display_name ?? null,
      receptivite: row.receptivite,
      goutEffort : row.gout_effort,
      attitude   : row.attitude,
      topSeance  : row.top_seance,
      evalAt     : row.updated_at,
    }
  })

  return { data: rows, error: null }
}

// ── Story 55-5 — Analyse biais coach ─────────────────────────────────────────

/** Seuil minimum d'évaluations pour calculer un delta (AC4) */
const MIN_EVAL_THRESHOLD = 5

/** Convertit un signal qualitatif en score numérique 0–10 */
function signalToScore(s: string): number {
  if (s === 'positive') return 10
  if (s === 'none')     return 5
  return 0
}

export type BiasPeriod = '30d' | '90d' | 'season'

/**
 * Calcule le biais de notation de chaque coach sur la période donnée.
 * Delta = avgScore du coach − médiane globale de tous les scores.
 * Retourne uniquement les coachs avec au moins MIN_EVAL_THRESHOLD évaluations.
 */
export async function getCoachEvaluationBias(
  period: BiasPeriod
): Promise<{ data: CoachBiasReport[]; error: unknown }> {
  // Borne temporelle inférieure
  let since: string
  const now = new Date()
  if (period === '30d') {
    since = new Date(now.getTime() - 30 * 24 * 3600_000).toISOString()
  } else if (period === '90d') {
    since = new Date(now.getTime() - 90 * 24 * 3600_000).toISOString()
  } else {
    // saison : depuis le 1er août de l'année académique courante
    const year  = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
    since = new Date(year, 7, 1).toISOString()
  }

  // 1. Récupérer toutes les évaluations de la période avec coach_id
  const { data: rawData, error } = await supabase
    .from('evaluations')
    .select('id, coach_id, receptivite, gout_effort, attitude, updated_at')
    .gte('updated_at', since)

  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getCoachEvaluationBias] fetch error:', error)
    return { data: [], error }
  }

  const rows = (rawData ?? []) as {
    id          : string
    coach_id    : string | null
    receptivite : string
    gout_effort : string
    attitude    : string
    updated_at  : string
  }[]

  if (rows.length === 0) return { data: [], error: null }

  // 2. Calculer le score composite pour chaque évaluation
  const scoredRows = rows.map(r => ({
    coachId: r.coach_id ?? 'unknown',
    score  : (signalToScore(r.receptivite) + signalToScore(r.gout_effort) + signalToScore(r.attitude)) / 3,
  }))

  // 3. Calculer la médiane globale de tous les scores
  const allScores = scoredRows.map(r => r.score).sort((a, b) => a - b)
  const midIdx    = Math.floor(allScores.length / 2)
  const globalMedian = allScores.length % 2 === 0
    ? ((allScores[midIdx - 1] ?? 0) + (allScores[midIdx] ?? 0)) / 2
    : (allScores[midIdx] ?? 0)

  // 4. Grouper par coach
  const byCoach = new Map<string, number[]>()
  for (const { coachId, score } of scoredRows) {
    const arr = byCoach.get(coachId) ?? []
    arr.push(score)
    byCoach.set(coachId, arr)
  }

  // 5. Résoudre les noms de coachs
  const coachIds = [...byCoach.keys()].filter(id => id !== 'unknown')
  let nameMap = new Map<string, string>()
  if (coachIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', coachIds)
    nameMap = new Map(
      ((profilesData ?? []) as { user_id: string; display_name: string | null }[])
        .map(p => [p.user_id, p.display_name ?? 'Coach inconnu'])
    )
  }

  // 6. Construire les rapports
  const reports: CoachBiasReport[] = []
  for (const [coachId, scores] of byCoach.entries()) {
    if (coachId === 'unknown') continue
    const evalCount = scores.length
    const avgScore  = scores.reduce((s, v) => s + v, 0) / scores.length

    if (evalCount < MIN_EVAL_THRESHOLD) {
      reports.push({
        coachId,
        coachName    : nameMap.get(coachId) ?? coachId,
        evalCount,
        avgScore     : null,
        deltaVsMedian: null,
        biasLevel    : 'insufficient',
      })
      continue
    }

    const delta = avgScore - globalMedian
    const absDelta = Math.abs(delta)
    const biasLevel: CoachBiasReport['biasLevel'] = absDelta < 0.5 ? 'neutral'
      : absDelta <= 1.5 ? 'moderate'
      : 'strong'

    reports.push({
      coachId,
      coachName    : nameMap.get(coachId) ?? coachId,
      evalCount,
      avgScore     : Math.round(avgScore * 10) / 10,
      deltaVsMedian: Math.round(delta * 10) / 10,
      biasLevel,
    })
  }

  // Trier par evalCount DESC
  reports.sort((a, b) => b.evalCount - a.evalCount)

  return { data: reports, error: null }
}

// ── Story 55-6 — Joueurs en danger ───────────────────────────────────────────

const DANGER_THRESHOLD = 5.0
const DANGER_STREAK    = 3

/**
 * Retourne les joueurs dont les DANGER_STREAK dernières évaluations ont toutes
 * un score composite < DANGER_THRESHOLD.
 * Utilise une fenêtre SQL simulée côté client : récupère les 3 dernières évals
 * par joueur et vérifie que toutes passent sous le seuil.
 */
export async function listDangerousPlayers(): Promise<{ data: DangerousPlayer[]; error: unknown }> {
  // Récupérer les dernières évaluations pour chaque enfant (limit conservateur : 10 par child)
  const { data: rawData, error } = await supabase
    .from('evaluations')
    .select('child_id, receptivite, gout_effort, attitude, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5000)   // suffisant pour tous les joueurs actifs

  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[listDangerousPlayers] fetch error:', error)
    return { data: [], error }
  }

  const rows = (rawData ?? []) as {
    child_id    : string
    receptivite : string
    gout_effort : string
    attitude    : string
    updated_at  : string
  }[]

  // Grouper les N dernières évals par joueur
  const byChild = new Map<string, { score: number; date: string }[]>()
  for (const r of rows) {
    const arr   = byChild.get(r.child_id) ?? []
    if (arr.length >= DANGER_STREAK) continue   // optimisation : pas besoin de plus
    const score = (signalToScore(r.receptivite) + signalToScore(r.gout_effort) + signalToScore(r.attitude)) / 3
    arr.push({ score, date: r.updated_at })
    byChild.set(r.child_id, arr)
  }

  // Filtrer les joueurs en danger : toutes leurs DANGER_STREAK dernières évals < seuil
  const dangerIds: { childId: string; lastScore: number; streakCount: number }[] = []
  for (const [childId, recentEvals] of byChild.entries()) {
    if (recentEvals.length < DANGER_STREAK) continue
    const allUnder = recentEvals.slice(0, DANGER_STREAK).every(e => e.score < DANGER_THRESHOLD)
    if (allUnder) {
      dangerIds.push({
        childId,
        lastScore   : Math.round((recentEvals[0]?.score ?? 0) * 10) / 10,
        streakCount : DANGER_STREAK,
      })
    }
  }

  if (dangerIds.length === 0) return { data: [], error: null }

  // Résoudre les noms depuis child_directory
  const ids = dangerIds.map(d => d.childId)
  const { data: childData } = await supabase
    .from('child_directory')
    .select('id, display_name')
    .in('id', ids)

  const nameMap = new Map(
    ((childData ?? []) as { id: string; display_name: string }[])
      .map(c => [c.id, c.display_name])
  )

  // Fallback : profiles si non trouvé dans child_directory
  const missingIds = ids.filter(id => !nameMap.has(id))
  if (missingIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', missingIds)
    for (const p of (profilesData ?? []) as { user_id: string; display_name: string | null }[]) {
      if (!nameMap.has(p.user_id)) nameMap.set(p.user_id, p.display_name ?? 'Joueur')
    }
  }

  const dangerous: DangerousPlayer[] = dangerIds.map(d => ({
    childId    : d.childId,
    displayName: nameMap.get(d.childId) ?? 'Joueur',
    lastScore  : d.lastScore,
    streakCount: d.streakCount,
  }))

  return { data: dangerous, error: null }
}
