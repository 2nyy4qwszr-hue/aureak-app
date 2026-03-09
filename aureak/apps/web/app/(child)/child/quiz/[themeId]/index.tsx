'use client'
// Session de quiz adaptative pour un thème donné
import { useEffect, useState, useRef } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { createLearningAttempt, submitAnswer, stopAttempt } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { CreateAttemptResult, SubmitAnswerResult } from '@aureak/api-client'

type QuizPhase = 'loading' | 'question' | 'feedback' | 'result'

type QuizState = {
  attemptId      : string
  questions      : CreateAttemptResult['questions']
  currentIndex   : number
  phase          : QuizPhase
  lastResult     : SubmitAnswerResult | null
  correctCount   : number
  masteryPercent : number
  stopReason     : string | null
}

export default function ChildQuizSessionPage() {
  const { themeId } = useLocalSearchParams<{ themeId: string }>()
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)

  const [quiz,    setQuiz]    = useState<QuizState | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const stopped = useRef(false)

  // We need a sessionId — use a placeholder; in real use it comes from an active session
  // For standalone practice, we pass 'practice' as sessionId
  useEffect(() => {
    if (!user?.id || !themeId) return
    const init = async () => {
      try {
        const result = await createLearningAttempt('practice', themeId)
        if (!result.questions || result.questions.length === 0) {
          setError('Aucune question disponible pour ce thème.')
          setLoading(false)
          return
        }
        setQuiz({
          attemptId     : result.attempt_id,
          questions     : result.questions,
          currentIndex  : 0,
          phase         : 'question',
          lastResult    : null,
          correctCount  : 0,
          masteryPercent: 0,
          stopReason    : null,
        })
      } catch {
        setError('Impossible de démarrer le quiz.')
      }
      setLoading(false)
    }
    init()
  }, [user?.id, themeId])

  const handleAnswer = async (optionId: string) => {
    if (!quiz || quiz.phase !== 'question') return
    const q = quiz.questions[quiz.currentIndex]
    const res = await submitAnswer(quiz.attemptId, q.id, optionId)

    const nextCorrect = quiz.correctCount + (res.is_correct ? 1 : 0)

    if (res.should_stop) {
      stopped.current = true
      await stopAttempt(quiz.attemptId, res.stop_reason ?? 'completed')
      setQuiz({
        ...quiz,
        phase         : 'result',
        lastResult    : res,
        correctCount  : nextCorrect,
        masteryPercent: res.mastery_percent,
        stopReason    : res.stop_reason ?? null,
      })
      return
    }

    const nextIndex = quiz.currentIndex + 1
    if (nextIndex >= quiz.questions.length) {
      stopped.current = true
      await stopAttempt(quiz.attemptId, 'completed')
      setQuiz({
        ...quiz,
        phase         : 'result',
        lastResult    : res,
        correctCount  : nextCorrect,
        masteryPercent: res.mastery_percent,
        stopReason    : 'completed',
      })
      return
    }

    setQuiz({
      ...quiz,
      phase        : 'feedback',
      lastResult   : res,
      correctCount : nextCorrect,
      currentIndex : nextIndex,
      masteryPercent: res.mastery_percent,
    })
  }

  const handleNext = () => {
    if (!quiz) return
    setQuiz({ ...quiz, phase: 'question', lastResult: null })
  }

  const handleQuit = async () => {
    if (quiz && !stopped.current) {
      stopped.current = true
      await stopAttempt(quiz.attemptId, 'abandoned')
    }
    router.push('/child/quiz' as never)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      </View>
    )
  }

  if (error || !quiz) {
    return (
      <View style={styles.center}>
        <AureakText variant="body" style={{ color: colors.status.absent }}>{error ?? 'Erreur'}</AureakText>
        <Pressable onPress={() => router.push('/child/quiz' as never)}>
          <AureakText variant="body" style={{ color: colors.accent.gold, marginTop: space.md }}>
            ← Retour
          </AureakText>
        </Pressable>
      </View>
    )
  }

  // ── Result screen ──
  if (quiz.phase === 'result') {
    const acquired = quiz.masteryPercent >= 70
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.resultCard, { borderColor: acquired ? colors.status.present : colors.status.attention }]}>
          <AureakText variant="h2" style={{ textAlign: 'center', fontSize: 36 }}>
            {acquired ? '🏆' : '💪'}
          </AureakText>
          <AureakText
            variant="h2"
            style={{ textAlign: 'center', color: acquired ? colors.status.present : colors.status.attention }}
          >
            {acquired ? 'Thème ACQUIS !' : 'Continue tes efforts !'}
          </AureakText>
          <AureakText variant="body" style={{ textAlign: 'center', color: colors.text.muted }}>
            Maîtrise : {quiz.masteryPercent}%
          </AureakText>
          <AureakText variant="body" style={{ textAlign: 'center', color: colors.text.muted }}>
            {quiz.correctCount} bonne{quiz.correctCount !== 1 ? 's' : ''} réponse{quiz.correctCount !== 1 ? 's' : ''}
          </AureakText>
        </View>

        <Pressable style={styles.btn} onPress={() => router.push('/child/quiz' as never)}>
          <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
            Choisir un autre thème
          </AureakText>
        </Pressable>
        <Pressable onPress={() => router.push('/child/dashboard' as never)}>
          <AureakText variant="body" style={{ color: colors.accent.gold, textAlign: 'center' }}>
            Retour à l'accueil
          </AureakText>
        </Pressable>
      </ScrollView>
    )
  }

  const q = quiz.questions[quiz.currentIndex]

  // ── Feedback screen ──
  if (quiz.phase === 'feedback' && quiz.lastResult) {
    const res = quiz.lastResult
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.feedbackCard, {
          borderColor: res.is_correct ? colors.status.present : colors.status.attention,
        }]}>
          <AureakText variant="h2" style={{ fontSize: 32, textAlign: 'center' }}>
            {res.is_correct ? '✓' : '✗'}
          </AureakText>
          <AureakText
            variant="body"
            style={{ fontWeight: '700', textAlign: 'center',
              color: res.is_correct ? colors.status.present : colors.status.attention }}
          >
            {res.is_correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' }}>
            Maîtrise : {res.mastery_percent}%
          </AureakText>
        </View>

        <Pressable style={styles.btn} onPress={handleNext}>
          <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
            Question suivante →
          </AureakText>
        </Pressable>
      </ScrollView>
    )
  }

  // ── Question screen ──
  const options = q.options as { id: string; text: string }[] | undefined
  const progress = Math.round(((quiz.currentIndex) / quiz.questions.length) * 100)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` as never }]} />
      </View>
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        Question {quiz.currentIndex + 1} / {quiz.questions.length}
      </AureakText>

      {/* Question */}
      <View style={styles.questionCard}>
        <AureakText variant="body" style={{ fontWeight: '700', fontSize: 16 }}>
          {(q as { text?: string }).text ?? 'Question'}
        </AureakText>
      </View>

      {/* Options */}
      {options?.map(opt => (
        <Pressable key={opt.id} onPress={() => handleAnswer(opt.id)}>
          <View style={styles.optionCard}>
            <AureakText variant="body">{opt.text}</AureakText>
          </View>
        </Pressable>
      ))}

      <Pressable onPress={handleQuit}>
        <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' }}>
          Abandonner le quiz
        </AureakText>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },
  center       : { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: colors.light.primary },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden' },
  progressFill : { height: 6, backgroundColor: colors.accent.gold, borderRadius: 3 },
  questionCard : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.lg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  optionCard   : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  feedbackCard : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xl,
    borderWidth    : 2,
    gap            : space.sm,
  },
  resultCard   : {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.xl,
    borderWidth    : 2,
    gap            : space.sm,
    alignItems     : 'center',
  },
  btn          : {
    backgroundColor: colors.accent.gold,
    borderRadius   : 8,
    padding        : space.md,
    alignItems     : 'center',
  },
})
