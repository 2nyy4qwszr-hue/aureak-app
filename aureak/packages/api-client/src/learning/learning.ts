// Story 8.2 — API learning : quiz adaptatif, tentatives, maîtrise
import { supabase } from '../supabase'
import type { PlayerProgress } from '@aureak/types'

export type CreateAttemptResult = {
  attempt_id: string
  questions : {
    id     : string
    text   : string
    options: { id: string; text: string }[]
  }[]
}

export type SubmitAnswerResult = {
  is_correct     : boolean
  mastery_percent: number
  should_stop    : boolean
  stop_reason    : string | null
}

export async function createLearningAttempt(
  sessionId: string | null,
  themeId  : string
): Promise<{ data: CreateAttemptResult | null; error: unknown }> {
  const { data, error } = await supabase.rpc('create_learning_attempt', {
    p_session_id: sessionId,
    p_theme_id  : themeId,
  })
  return { data: data as CreateAttemptResult | null, error }
}

export async function submitAnswer(
  attemptId       : string,
  questionId      : string,
  selectedOptionId: string
): Promise<{ data: SubmitAnswerResult | null; error: unknown }> {
  const { data, error } = await supabase.rpc('submit_answer', {
    p_attempt_id         : attemptId,
    p_question_id        : questionId,
    p_selected_option_id : selectedOptionId,
  })
  return { data: data as SubmitAnswerResult | null, error }
}

export async function stopAttempt(
  attemptId : string,
  stopReason: 'child_stopped' | 'time_limit' = 'child_stopped'
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('stop_attempt', {
    p_attempt_id : attemptId,
    p_stop_reason: stopReason,
  })
  return { error }
}

export async function getPlayerProgress(
  childId: string
): Promise<{ data: PlayerProgress | null; error: unknown }> {
  const { data, error } = await supabase
    .from('player_progress')
    .select('*')
    .eq('child_id', childId)
    .single()
  return { data: data as PlayerProgress | null, error }
}

export async function getSessionLearningReport(sessionId: string) {
  const { data: attempts, error } = await supabase
    .from('learning_attempts')
    .select(`
      id, child_id, theme_id, mastery_status, mastery_percent,
      questions_answered, correct_count, stop_reason,
      themes(name),
      learning_answers(question_id, is_correct)
    `)
    .eq('session_id', sessionId)

  type RawAttempt = {
    id: string; child_id: string; theme_id: string; mastery_status: string | null
    mastery_percent: number | null; questions_answered: number; correct_count: number
    stop_reason: string | null; themes: { name: string }[] | null
  }
  const themeStats: Record<string, { name: string; total: number; acquired: number }> = {}

  for (const a of ((attempts ?? []) as unknown as RawAttempt[])) {
    const key = a.theme_id
    const name = Array.isArray(a.themes) ? (a.themes[0]?.name ?? '') : ((a.themes as { name?: string } | null)?.name ?? '')
    if (!themeStats[key]) {
      themeStats[key] = { name, total: 0, acquired: 0 }
    }
    themeStats[key].total++
    if (a.mastery_status === 'acquired') {
      themeStats[key].acquired++
    }
  }

  return { attempts, themeStats, error }
}
