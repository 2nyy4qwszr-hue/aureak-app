// Epic 6 — Évaluations coach (event sourcing) + clôture de séance
import { supabase } from '../supabase'
import type { Evaluation, EvaluationMerged, TopSeance } from '@aureak/types'
import type { EvaluationSignal } from '@aureak/types'

// ─── apply_evaluation_event ───────────────────────────────────────────────────

export type ApplyEvaluationParams = {
  operationId : string
  sessionId   : string
  childId     : string
  receptivite : EvaluationSignal
  goutEffort  : EvaluationSignal
  attitude    : EvaluationSignal
  topSeance   : TopSeance
  note?       : string
  occurredAt  : string
  deviceId?   : string
}

export type ApplyEvaluationResult = {
  idempotent?: boolean
  snapshot?  : Evaluation
  event_id?  : string
}

export async function applyEvaluationEvent(
  params: ApplyEvaluationParams
): Promise<ApplyEvaluationResult> {
  const { data: userResult } = await supabase.auth.getUser()
  const tenantId = (userResult?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''

  const { data, error } = await supabase.rpc('apply_evaluation_event', {
    p_event: {
      operation_id: params.operationId,
      tenant_id   : tenantId,
      entity_type : 'evaluation',
      event_type  : 'EVALUATION_SET',
      occurred_at : params.occurredAt,
      source      : 'field',
      device_id   : params.deviceId ?? null,
      payload     : {
        session_id : params.sessionId,
        child_id   : params.childId,
        receptivite: params.receptivite,
        gout_effort: params.goutEffort,
        attitude   : params.attitude,
        top_seance : params.topSeance,
        note       : params.note ?? null,
      },
    },
  })

  if (error) throw error
  return data as ApplyEvaluationResult
}

// ─── Lecture évaluations ──────────────────────────────────────────────────────

export async function listEvaluationsBySession(
  sessionId: string
): Promise<{ data: Evaluation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('session_id', sessionId)

  return { data: (data as Evaluation[]) ?? [], error }
}

export async function listMergedEvaluations(
  sessionId: string
): Promise<{ data: EvaluationMerged[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_evaluations_merged')
    .select('*')
    .eq('session_id', sessionId)

  return { data: (data as EvaluationMerged[]) ?? [], error }
}

// ─── Validation (Story 6.3) ───────────────────────────────────────────────────

export async function validateSession(
  sessionId: string
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('validate_session', {
    p_session_id: sessionId,
  })

  return { data: data as string | null, error }
}

// ─── Clôture (Story 6.4) ─────────────────────────────────────────────────────

export type CloseSessionResult = {
  idempotent?: boolean
  closed?    : boolean
  event_id?  : string
}

export async function closeSession(
  sessionId  : string,
  operationId: string
): Promise<{ data: CloseSessionResult | null; error: unknown }> {
  const { data, error } = await supabase.rpc('close_session', {
    p_session_id   : sessionId,
    p_operation_id : operationId,
  })

  return { data: data as CloseSessionResult | null, error }
}

// ─── IDs des séances déjà évaluées (coach dashboard) ─────────────────────────

// ── Story 55-3 — Récentes évaluations d'un joueur pour GrowthChart ────────────

import type { EvaluationPoint } from '@aureak/types'

/**
 * Retourne les N dernières évaluations d'un enfant triées chronologiquement.
 * Scores dérivés depuis les signaux qualitatifs (receptivite/goutEffort/attitude).
 * Utilisé par GrowthChart (Story 55-3).
 */
export async function listRecentEvaluationsForChild(
  childId: string,
  limit  : number = 10,
): Promise<{ data: EvaluationPoint[]; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('updated_at, receptivite, gout_effort, attitude, sessions!evaluations_session_id_fkey(name)')
    .eq('child_id', childId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error }

  const signalVal = (s: string) => s === 'positive' ? 1 : s === 'none' ? 0.5 : 0

  const points: EvaluationPoint[] = ((data ?? []) as unknown[])
    .map((r) => {
      const row = r as {
        updated_at   : string
        receptivite  : string
        gout_effort  : string
        attitude     : string
        sessions     : { name?: string | null }[] | { name?: string | null } | null
      }
      const score = ((signalVal(row.receptivite) + signalVal(row.gout_effort) + signalVal(row.attitude)) / 3) * 10
      const sess  = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
      return {
        date       : row.updated_at,
        score      : Math.round(score * 10) / 10,
        sessionName: (sess as { name?: string | null } | null)?.name ?? undefined,
      }
    })
    .reverse() // chronologique

  return { data: points, error: null }
}

// ── Story 55-2 — Moyennes évaluations par joueur pour RadarChart ──────────────

export type PlayerAxisAverage = {
  childId: string
  axes   : Record<string, number>  // clé = 'receptivite' | 'goutEffort' | 'attitude', val 0–10
}

/**
 * Calcule les moyennes des N dernières évaluations pour un joueur sur chaque axe.
 * Axes : receptivite, goutEffort, attitude (mappés sur 0–10).
 * Utilisé par la page comparison (Story 55-2).
 */
export async function getAverageEvaluationsByPlayer(
  childId: string,
  lastN  : number = 5,
): Promise<{ data: PlayerAxisAverage | null; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('receptivite, gout_effort, attitude')
    .eq('child_id', childId)
    .order('updated_at', { ascending: false })
    .limit(lastN)

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: { childId, axes: {} }, error: null }

  const signalVal = (s: string) => s === 'positive' ? 10 : s === 'none' ? 5 : 0
  const rows = data as { receptivite: string; gout_effort: string; attitude: string }[]
  const avg  = (field: keyof typeof rows[0]) =>
    Math.round((rows.reduce((sum, r) => sum + signalVal(r[field] as string), 0) / rows.length) * 10) / 10

  return {
    data: {
      childId,
      axes: {
        'Technique'    : avg('receptivite'),  // mapping sémantique story
        'Placement'    : avg('attitude'),
        'Relance'      : avg('gout_effort'),
        'Agilité'      : avg('receptivite'),
        'Mental'       : avg('attitude'),
        'Communication': avg('gout_effort'),
      },
    },
    error: null,
  }
}

// ── Story 55-4 — isPersonalBest : record historique joueur ───────────────────

export type EvalWithPersonalBest = Evaluation & {
  isPersonalBest: boolean
}

/**
 * Retourne les évaluations d'une séance enrichies avec isPersonalBest.
 * isPersonalBest = true si la note de cette évaluation est strictement supérieure
 * à toutes les précédentes du même joueur (calcul via MAX comparatif).
 */
export async function listEvaluationsBySessionWithPB(
  sessionId: string,
): Promise<{ data: EvalWithPersonalBest[]; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('session_id', sessionId)

  if (error) return { data: [], error }

  const evals = (data ?? []) as Evaluation[]

  // Pour chaque eval, calculer le score et récupérer le max précédent
  const enriched: EvalWithPersonalBest[] = await Promise.all(
    evals.map(async (ev) => {
      const signalVal = (s: string) => s === 'positive' ? 1 : s === 'none' ? 0.5 : 0
      const currentScore = ((signalVal(ev.receptivite) + signalVal(ev.goutEffort) + signalVal(ev.attitude)) / 3) * 10

      // Chercher les évaluations antérieures du même joueur
      const { data: prevData } = await supabase
        .from('evaluations')
        .select('receptivite, gout_effort, attitude')
        .eq('child_id', ev.childId)
        .neq('id', ev.id)
        .lt('updated_at', ev.updatedAt ?? ev.createdAt)
        .limit(100)

      const prevRows = (prevData ?? []) as { receptivite: string; gout_effort: string; attitude: string }[]
      const prevScores = prevRows.map(r =>
        ((signalVal(r.receptivite) + signalVal(r.gout_effort) + signalVal(r.attitude)) / 3) * 10
      )
      const maxPrev = prevScores.length > 0 ? Math.max(...prevScores) : -Infinity
      const isPersonalBest = currentScore > maxPrev

      return { ...ev, isPersonalBest }
    })
  )

  return { data: enriched, error: null }
}

/**
 * Parmi une liste de session_ids, retourne ceux qui ont au moins une évaluation.
 * Utilisé par coach/dashboard pour calculer les séances sans évaluation.
 */
export async function listEvaluatedSessionIds(
  sessionIds: string[]
): Promise<{ data: string[]; error: unknown }> {
  if (sessionIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('session_evaluations_merged')
    .select('session_id')
    .in('session_id', sessionIds)

  if (error) return { data: [], error }
  const ids = [...new Set(
    (data ?? []).map((e: { session_id: string }) => e.session_id)
  )]
  return { data: ids, error: null }
}
