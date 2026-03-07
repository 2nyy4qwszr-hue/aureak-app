// Story 4.7 — Notes de séance coach & feedback contenu
import { supabase } from '../supabase'
import type { CoachSessionNote, CoachContentFeedback, FeedbackUnitType, FeedbackStatus } from '@aureak/types'

// ─── CoachSessionNote ─────────────────────────────────────────────────────────

export async function upsertSessionNote(
  sessionId     : string,
  coachId       : string,
  tenantId      : string,
  note          : string,
  visibleToAdmin: boolean = true
): Promise<{ data: CoachSessionNote | null; error: unknown }> {
  const { data, error } = await supabase
    .from('coach_session_notes')
    .upsert({
      session_id      : sessionId,
      coach_id        : coachId,
      tenant_id       : tenantId,
      note,
      visible_to_admin: visibleToAdmin,
      updated_at      : new Date().toISOString(),
    }, { onConflict: 'session_id,coach_id' })
    .select()
    .single()

  return { data: data as CoachSessionNote | null, error }
}

export async function getSessionNote(
  sessionId: string,
  coachId  : string
): Promise<{ data: CoachSessionNote | null; error: unknown }> {
  const { data, error } = await supabase
    .from('coach_session_notes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('coach_id', coachId)
    .maybeSingle()

  return { data: data as CoachSessionNote | null, error }
}

// ─── CoachContentFeedback ─────────────────────────────────────────────────────

export type SubmitFeedbackParams = {
  coachId  : string
  tenantId : string
  unitType : FeedbackUnitType
  unitId   : string
  content  : string
}

export async function submitContentFeedback(
  params: SubmitFeedbackParams
): Promise<{ data: CoachContentFeedback | null; error: unknown }> {
  const { data, error } = await supabase
    .from('coach_content_feedback')
    .insert({
      coach_id : params.coachId,
      tenant_id: params.tenantId,
      unit_type: params.unitType,
      unit_id  : params.unitId,
      content  : params.content,
      status   : 'submitted',
    })
    .select()
    .single()

  return { data: data as CoachContentFeedback | null, error }
}

export async function listFeedback(params?: {
  unitType?: FeedbackUnitType
  unitId?  : string
  status?  : FeedbackStatus
}): Promise<{ data: CoachContentFeedback[]; error: unknown }> {
  let query = supabase
    .from('coach_content_feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (params?.unitType) query = query.eq('unit_type', params.unitType)
  if (params?.unitId)   query = query.eq('unit_id', params.unitId)
  if (params?.status)   query = query.eq('status', params.status)

  const { data, error } = await query
  return { data: (data as CoachContentFeedback[]) ?? [], error }
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status    : FeedbackStatus
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('coach_content_feedback')
    .update({ status })
    .eq('id', feedbackId)

  return { error }
}
