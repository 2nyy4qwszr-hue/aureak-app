// Story 75.6 — Quiz QCM enfant post-séance
import { supabase } from '../supabase'
import { listPublishedByTheme, listOptionsByQuestionIds } from '../referentiel/quiz'
import type { QuizQuestion, QuizOption } from '@aureak/types'

export type ChildQuizData = {
  sessionId    : string | null
  firstThemeId : string | null
  questions    : (QuizQuestion & { options: QuizOption[] })[]
  error        : unknown
}

/**
 * Récupère jusqu'à 5 questions publiées issues des thèmes de la dernière séance de l'enfant.
 * Étapes : session_attendees → sessions (dernière) → session_themes → quiz_questions + quiz_options
 */
export async function getLastSessionQuiz(childId: string): Promise<ChildQuizData> {
  try {
    // Step 1 : dernière séance de l'enfant
    const { data: attendeeRows, error: attError } = await supabase
      .from('session_attendees')
      .select('session_id')
      .eq('child_id', childId)

    if (attError) return { sessionId: null, firstThemeId: null, questions: [], error: attError }

    const sessionIds = (attendeeRows ?? []).map((r: { session_id: string }) => r.session_id)
    if (sessionIds.length === 0) {
      return { sessionId: null, firstThemeId: null, questions: [], error: null }
    }

    const { data: sessions, error: sessError } = await supabase
      .from('sessions')
      .select('id, scheduled_at')
      .in('id', sessionIds)
      .order('scheduled_at', { ascending: false })
      .limit(1)

    if (sessError) return { sessionId: null, firstThemeId: null, questions: [], error: sessError }

    const lastSession = sessions?.[0]
    if (!lastSession) return { sessionId: null, firstThemeId: null, questions: [], error: null }

    // Step 2 : thèmes de la séance
    const { data: themeLinks, error: themeError } = await supabase
      .from('session_themes')
      .select('theme_id')
      .eq('session_id', lastSession.id)
      .order('sort_order', { ascending: true })

    if (themeError) return { sessionId: lastSession.id, firstThemeId: null, questions: [], error: themeError }

    const themeIds = (themeLinks ?? []).map((r: { theme_id: string }) => r.theme_id)
    if (themeIds.length === 0) {
      return { sessionId: lastSession.id, firstThemeId: null, questions: [], error: null }
    }

    // Step 3 : questions publiées des thèmes (max 5)
    const allQuestions: (QuizQuestion & { options: QuizOption[] })[] = []
    for (const themeId of themeIds) {
      const { data: qs } = await listPublishedByTheme(themeId)
      if (qs && qs.length > 0) {
        const qIds = qs.map((q: QuizQuestion) => q.id)
        const opts = await listOptionsByQuestionIds(qIds)
        const optMap = new Map<string, QuizOption[]>()
        for (const opt of opts) {
          if (!optMap.has(opt.questionId)) optMap.set(opt.questionId, [])
          optMap.get(opt.questionId)!.push(opt)
        }
        for (const q of qs) {
          allQuestions.push({ ...q, options: optMap.get(q.id) ?? [] })
          if (allQuestions.length >= 5) break
        }
      }
      if (allQuestions.length >= 5) break
    }

    return {
      sessionId    : lastSession.id,
      firstThemeId : themeIds[0],
      questions    : allQuestions.slice(0, 5),
      error        : null,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[getLastSessionQuiz] error:', err)
    return { sessionId: null, firstThemeId: null, questions: [], error: err }
  }
}

/**
 * Récupère jusqu'à 5 questions publiées issues des thèmes d'une séance spécifique.
 * Étapes : session_themes (filtré par sessionId) → quiz_questions + quiz_options
 */
export async function getSessionQuiz(sessionId: string): Promise<ChildQuizData> {
  try {
    // Step 1 : thèmes de la séance
    const { data: themeLinks, error: themeError } = await supabase
      .from('session_themes')
      .select('theme_id')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true })

    if (themeError) return { sessionId, firstThemeId: null, questions: [], error: themeError }

    const themeIds = (themeLinks ?? []).map((r: { theme_id: string }) => r.theme_id)
    if (themeIds.length === 0) {
      return { sessionId, firstThemeId: null, questions: [], error: null }
    }

    // Step 2 : questions publiées des thèmes (max 5)
    const allQuestions: (QuizQuestion & { options: QuizOption[] })[] = []
    for (const themeId of themeIds) {
      const { data: qs } = await listPublishedByTheme(themeId)
      if (qs && qs.length > 0) {
        const qIds = qs.map((q: QuizQuestion) => q.id)
        const opts = await listOptionsByQuestionIds(qIds)
        const optMap = new Map<string, QuizOption[]>()
        for (const opt of opts) {
          if (!optMap.has(opt.questionId)) optMap.set(opt.questionId, [])
          optMap.get(opt.questionId)!.push(opt)
        }
        for (const q of qs) {
          allQuestions.push({ ...q, options: optMap.get(q.id) ?? [] })
          if (allQuestions.length >= 5) break
        }
      }
      if (allQuestions.length >= 5) break
    }

    return {
      sessionId,
      firstThemeId : themeIds[0],
      questions    : allQuestions.slice(0, 5),
      error        : null,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[getSessionQuiz] error:', err)
    return { sessionId, firstThemeId: null, questions: [], error: err }
  }
}
