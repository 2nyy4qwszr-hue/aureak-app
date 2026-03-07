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
