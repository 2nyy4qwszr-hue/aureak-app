// Story 3.5 — CRUD quiz questions & options (Workflow Draft/Published)
import { supabase } from '../supabase'
import type { QuizQuestion, QuizOption } from '@aureak/types'

// ─── QuizQuestion ─────────────────────────────────────────────────────────────

export type CreateQuestionParams = {
  themeId     : string
  tenantId    : string
  questionText: string
  explanation?: string
  sortOrder?  : number
}

export async function createQuestion(
  params: CreateQuestionParams
): Promise<{ data: QuizQuestion | null; error: unknown }> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      theme_id     : params.themeId,
      tenant_id    : params.tenantId,
      question_text: params.questionText,
      explanation  : params.explanation ?? null,
      sort_order   : params.sortOrder ?? null,
      status       : 'draft',
    })
    .select()
    .single()

  return { data: data as QuizQuestion | null, error }
}

export async function publishQuestion(
  questionId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('quiz_questions')
    .update({ status: 'published' })
    .eq('id', questionId)

  return { error }
}

export async function unpublishQuestion(
  questionId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('quiz_questions')
    .update({ status: 'draft' })
    .eq('id', questionId)

  return { error }
}

export async function listPublishedByTheme(
  themeId: string
): Promise<{ data: QuizQuestion[]; error: unknown }> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('theme_id', themeId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as QuizQuestion[]) ?? [], error }
}

export async function listAllByTheme(
  themeId: string
): Promise<{ data: QuizQuestion[]; error: unknown }> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('theme_id', themeId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as QuizQuestion[]) ?? [], error }
}

// ─── QuizOption ───────────────────────────────────────────────────────────────

export type AddOptionParams = {
  questionId: string
  optionText: string
  isCorrect : boolean
  sortOrder?: number
}

export async function addOption(
  params: AddOptionParams
): Promise<{ data: QuizOption | null; error: unknown }> {
  const { data, error } = await supabase
    .from('quiz_options')
    .insert({
      question_id: params.questionId,
      option_text: params.optionText,
      is_correct : params.isCorrect,
      sort_order : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as QuizOption | null, error }
}

export async function listOptionsByQuestion(
  questionId: string
): Promise<{ data: QuizOption[]; error: unknown }> {
  const { data, error } = await supabase
    .from('quiz_options')
    .select('*')
    .eq('question_id', questionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as QuizOption[]) ?? [], error }
}

/** Charge toutes les options pour plusieurs questions en une seule requête */
export async function listOptionsByQuestionIds(
  questionIds: string[],
): Promise<QuizOption[]> {
  if (questionIds.length === 0) return []
  const { data } = await supabase
    .from('quiz_options')
    .select('*')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return (data as QuizOption[]) ?? []
}

export async function deleteOption(id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('quiz_options')
    .delete()
    .eq('id', id)

  return { error }
}
