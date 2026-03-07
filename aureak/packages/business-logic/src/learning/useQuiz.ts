// Story 8.2 — Hook useQuiz : moteur quiz adaptatif côté client
import { submitAnswer, stopAttempt } from '@aureak/api-client'
import type { SubmitAnswerResult } from '@aureak/api-client'

export function useQuiz(attemptId: string) {
  const submit = async (
    questionId: string,
    optionId  : string
  ): Promise<SubmitAnswerResult> => {
    const { data, error } = await submitAnswer(attemptId, questionId, optionId)
    if (error) throw error
    return data!
  }

  const stop = async (reason: 'child_stopped' | 'time_limit' = 'child_stopped') => {
    const { error } = await stopAttempt(attemptId, reason)
    if (error) throw error
  }

  return { submit, stop }
}
