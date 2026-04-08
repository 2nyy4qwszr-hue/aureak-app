'use client'
// Story 75.6 — Quiz QCM enfant post-séance
import { useEffect, useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getLastSessionQuiz, createLearningAttempt, submitAnswer, stopAttempt } from '@aureak/api-client'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { ChildQuizData } from '@aureak/api-client'
import type { QuizOption } from '@aureak/types'

type Answer = {
  questionId: string
  optionId  : string
  isCorrect : boolean
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function QuizSkeleton() {
  return (
    <div style={P.page}>
      <style>{`@keyframes cp{0%,100%{opacity:.15}50%{opacity:.42}} .cs{background:${colors.light.muted};border-radius:6px;animation:cp 1.8s ease-in-out infinite}`}</style>
      <div className="cs" style={{ height: 14, width: 120, marginBottom: 20 }} />
      <div className="cs" style={{ height: 22, width: 200, marginBottom: 32 }} />
      <div className="cs" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="cs" style={{ height: 56, borderRadius: 10, marginBottom: 10 }} />
      ))}
    </div>
  )
}

// ── Encouragement ──────────────────────────────────────────────────────────────
function getEncouragement(correct: number, total: number): string {
  if (correct >= 4) return 'Excellent travail ! Tu maîtrises bien ces thèmes. 🏆'
  if (correct === 3) return "Bien joué ! Continue à t'entraîner. 💪"
  return 'Continue, tu vas y arriver ! Relis les thèmes de séance. 🎯'
}

// ── ResultsScreen ──────────────────────────────────────────────────────────────
function ResultsScreen({
  answers,
  total,
  onBack,
}: {
  answers: Answer[]
  total  : number
  onBack : () => void
}) {
  const correctCount = answers.filter(a => a.isCorrect).length
  return (
    <div style={P.page}>
      <div style={P.card}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {correctCount >= 4 ? '🏆' : correctCount >= 3 ? '💪' : '🎯'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Résultats
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: colors.accent.gold, lineHeight: 1, marginBottom: 8 }}>
            {correctCount} / {total}
          </div>
          <div style={{ fontSize: 15, color: colors.text.dark, lineHeight: 1.5 }}>
            {getEncouragement(correctCount, total)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
          {answers.map((a, i) => (
            <div
              key={a.questionId}
              style={{
                display        : 'flex',
                alignItems     : 'center',
                gap            : 10,
                padding        : '8px 12px',
                borderRadius   : radius.xs,
                backgroundColor: a.isCorrect ? colors.status.present + '18' : colors.status.absent + '18',
                border         : `1px solid ${a.isCorrect ? colors.status.present + '50' : colors.status.absent + '50'}`,
              }}
            >
              <span style={{ fontSize: 16 }}>{a.isCorrect ? '✓' : '✗'}</span>
              <span style={{ fontSize: 13, color: colors.text.dark, fontWeight: 600 }}>
                Question {i + 1}
              </span>
            </div>
          ))}
        </div>

        <button
          style={{
            ...P.ctaButton,
            marginTop: 24,
          }}
          onClick={onBack}
        >
          Retour à la fiche
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [quizData,        setQuizData]        = useState<ChildQuizData | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [currentIndex,    setCurrentIndex]    = useState(0)
  const [selectedOption,  setSelectedOption]  = useState<string | null>(null)
  const [showResult,      setShowResult]      = useState(false)
  const [answers,         setAnswers]         = useState<Answer[]>([])
  const [attemptId,       setAttemptId]       = useState<string | null>(null)
  const [attemptStarted,  setAttemptStarted]  = useState(false)
  const [showFinalResult, setShowFinalResult] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getLastSessionQuiz(childId)
        setQuizData(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[QuizPage] load error:', err)
        setQuizData({ sessionId: null, firstThemeId: null, questions: [], error: err })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [childId])

  const handleSelectOption = useCallback(async (opt: QuizOption) => {
    if (showResult || !quizData) return

    setSelectedOption(opt.id)
    setShowResult(true)

    // Démarrer la tentative sur la première réponse (évite tentatives vides)
    let currentAttemptId = attemptId
    if (!attemptStarted && quizData.sessionId && quizData.firstThemeId) {
      setAttemptStarted(true)
      try {
        const { data: attemptData, error: attemptError } = await createLearningAttempt(
          quizData.sessionId,
          quizData.firstThemeId
        )
        if (attemptError) {
          if (process.env.NODE_ENV !== 'production') console.error('[QuizPage] createLearningAttempt error:', attemptError)
        } else if (attemptData) {
          currentAttemptId = attemptData.attempt_id
          setAttemptId(attemptData.attempt_id)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[QuizPage] createLearningAttempt exception:', err)
      }
    }

    const currentQuestion = quizData.questions[currentIndex]
    const isCorrect = opt.isCorrect

    setAnswers(prev => [...prev, { questionId: currentQuestion.id, optionId: opt.id, isCorrect }])

    // Soumettre la réponse
    if (currentAttemptId) {
      try {
        await submitAnswer(currentAttemptId, currentQuestion.id, opt.id)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[QuizPage] submitAnswer error:', err)
      }
    }
  }, [showResult, quizData, attemptId, attemptStarted, currentIndex])

  const handleNext = useCallback(async () => {
    if (!quizData) return
    const isLast = currentIndex >= quizData.questions.length - 1

    if (isLast) {
      // Fin du quiz — stopper la tentative et afficher les résultats
      if (attemptId) {
        try {
          await stopAttempt(attemptId, 'child_stopped')
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.error('[QuizPage] stopAttempt error:', err)
        }
      }
      setShowFinalResult(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowResult(false)
    }
  }, [quizData, currentIndex, attemptId])

  if (loading) return <QuizSkeleton />

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div style={P.page}>
        <button style={P.back} onClick={() => router.push(`/parent/children/${childId}` as never)}>
          ← Fiche enfant
        </button>
        <div style={P.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark, marginBottom: 8 }}>
            Aucune question disponible
          </div>
          <div style={{ fontSize: 14, color: colors.text.muted, lineHeight: 1.5 }}>
            Aucune question disponible pour la dernière séance.
          </div>
        </div>
      </div>
    )
  }

  if (showFinalResult) {
    return (
      <ResultsScreen
        answers={answers}
        total={quizData.questions.length}
        onBack={() => router.push(`/parent/children/${childId}` as never)}
      />
    )
  }

  const currentQuestion = quizData.questions[currentIndex]
  const total           = quizData.questions.length
  const progress        = ((currentIndex + 1) / total) * 100

  const optionBg = (opt: QuizOption) => {
    if (!showResult || selectedOption !== opt.id) return colors.light.surface
    return opt.isCorrect ? colors.status.present + '22' : colors.status.absent + '22'
  }
  const optionBorder = (opt: QuizOption) => {
    if (!showResult || selectedOption !== opt.id) return colors.border.light
    return opt.isCorrect ? colors.status.present : colors.status.absent
  }

  const isLastQuestion = currentIndex >= total - 1
  const canProgress    = selectedOption !== null

  return (
    <div style={P.page}>
      <button style={P.back} onClick={() => router.push(`/parent/children/${childId}` as never)}>
        ← Fiche enfant
      </button>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quiz post-séance
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent.gold }}>
            {currentIndex + 1} / {total}
          </span>
        </div>
        <div style={{ height: 4, backgroundColor: colors.light.muted, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height         : '100%',
            width          : `${progress}%`,
            backgroundColor: colors.accent.gold,
            borderRadius   : 2,
            transition     : 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={P.card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.accent.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Question {currentIndex + 1}
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: colors.text.dark, lineHeight: 1.5, margin: 0 }}>
          {currentQuestion.questionText}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {currentQuestion.options.map((opt: QuizOption) => {
          const isSelected = selectedOption === opt.id
          const showFeedback = showResult && isSelected
          return (
            <button
              key={opt.id}
              disabled={showResult}
              style={{
                display        : 'flex',
                alignItems     : 'center',
                gap            : 12,
                width          : '100%',
                padding        : '14px 16px',
                borderRadius   : radius.card,
                backgroundColor: optionBg(opt),
                border         : `1.5px solid ${optionBorder(opt)}`,
                cursor         : showResult ? 'default' : 'pointer',
                textAlign      : 'left',
                transition     : 'background-color 0.2s, border-color 0.2s',
                minHeight      : 52,
              }}
              onClick={() => handleSelectOption(opt)}
            >
              {showFeedback && (
                <span style={{
                  fontSize  : 16,
                  fontWeight: 700,
                  color     : opt.isCorrect ? colors.status.present : colors.status.absent,
                  flexShrink: 0,
                }}>
                  {opt.isCorrect ? '✓' : '✗'}
                </span>
              )}
              <span style={{
                fontSize  : 14,
                fontWeight: isSelected ? 700 : 500,
                color     : showFeedback
                  ? (opt.isCorrect ? colors.status.present : colors.status.absent)
                  : colors.text.dark,
                lineHeight: 1.4,
              }}>
                {opt.optionText}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explication si disponible et réponse donnée */}
      {showResult && currentQuestion.explanation && (
        <div style={{
          padding        : '12px 14px',
          borderRadius   : radius.xs,
          backgroundColor: colors.light.elevated,
          border         : `1px solid ${colors.border.light}`,
          marginBottom   : 16,
          fontSize       : 13,
          color          : colors.text.muted,
          lineHeight     : 1.5,
        }}>
          💡 {currentQuestion.explanation}
        </div>
      )}

      {/* CTA */}
      <button
        disabled={!canProgress}
        style={{
          ...P.ctaButton,
          backgroundColor: canProgress ? colors.accent.gold : colors.light.muted,
          cursor         : canProgress ? 'pointer' : 'default',
          color          : canProgress ? colors.text.dark : colors.text.muted,
        }}
        onClick={handleNext}
      >
        {isLastQuestion ? 'Voir les résultats' : 'Question suivante →'}
      </button>
    </div>
  )
}

const P: Record<string, React.CSSProperties> = {
  page      : { padding: '28px 24px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 600 },
  back      : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, transition: 'color 0.15s' },
  card      : { backgroundColor: colors.light.surface, borderRadius: radius.card, border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, padding: '20px 20px', marginBottom: 20 },
  ctaButton : { display: 'block', width: '100%', padding: '16px', borderRadius: radius.card, border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'Montserrat, sans-serif', transition: 'background-color 0.2s, opacity 0.2s' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', backgroundColor: colors.light.surface, borderRadius: radius.cardLg, border: `1px solid ${colors.border.light}`, marginTop: 40 },
}
