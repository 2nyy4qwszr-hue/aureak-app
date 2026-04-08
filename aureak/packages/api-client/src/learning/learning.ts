// Story 8.2 — API learning : quiz adaptatif, tentatives, maîtrise
import { supabase } from '../supabase'
import type { PlayerProgress, GroupQuizResult } from '@aureak/types'

export type { GroupQuizResult }

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

// Story 8.6 — Vue coach : résultats quiz groupe pour une séance
export async function listGroupQuizResults(
  sessionId: string
): Promise<{ data: GroupQuizResult[]; error: unknown }> {
  const { data, error } = await supabase
    .from('learning_attempts')
    .select(`
      child_id,
      theme_id,
      mastery_percent,
      mastery_status,
      correct_count,
      questions_answered,
      themes(name),
      profiles!child_id(display_name)
    `)
    .eq('session_id', sessionId)
    .not('ended_at', 'is', null)

  if (error || !data) return { data: [], error }

  type RawRow = {
    child_id          : string
    theme_id          : string
    mastery_percent   : number | null
    mastery_status    : string | null
    correct_count     : number
    questions_answered: number
    themes            : { name: string } | { name: string }[] | null
    profiles          : { display_name: string } | { display_name: string }[] | null
  }

  const results: GroupQuizResult[] = (data as unknown as RawRow[]).map(row => {
    const themeName = Array.isArray(row.themes)
      ? (row.themes[0]?.name ?? '')
      : ((row.themes as { name?: string } | null)?.name ?? '')
    const displayName = Array.isArray(row.profiles)
      ? (row.profiles[0]?.display_name ?? row.child_id.slice(0, 8))
      : ((row.profiles as { display_name?: string } | null)?.display_name ?? row.child_id.slice(0, 8))
    return {
      childId          : row.child_id,
      displayName,
      themeId          : row.theme_id,
      themeName,
      masteryPercent   : row.mastery_percent,
      masteryStatus    : row.mastery_status as 'acquired' | 'not_acquired' | null,
      correctCount     : row.correct_count,
      questionsAnswered: row.questions_answered,
    }
  })

  return { data: results, error: null }
}
