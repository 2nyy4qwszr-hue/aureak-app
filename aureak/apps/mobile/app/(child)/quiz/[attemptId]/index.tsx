// Story 8.3 — Écran quiz enfant (acquis/non-acquis, sans score numérique)
import { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useQuiz } from '@aureak/business-logic'
import { Text } from '@aureak/ui'
import { colors } from '@aureak/theme'

type QuizOption = { id: string; text: string }
type QuizQuestion = { id: string; text: string; options: QuizOption[] }

// Les questions arrivent via les params de navigation (passées depuis l'écran précédent)
export default function QuizScreen() {
  const params   = useLocalSearchParams<{ attemptId: string; questions?: string }>()
  const { attemptId } = params
  const { submit, stop } = useQuiz(attemptId)

  const [questions, setQuestions]       = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [feedback, setFeedback]         = useState<'correct' | 'incorrect' | null>(null)
  const [explanation, setExplanation]   = useState<string | null>(null)
  const [finished, setFinished]         = useState(false)
  const [acquired, setAcquired]         = useState(false)

  useEffect(() => {
    if (params.questions) {
      try { setQuestions(JSON.parse(params.questions)) } catch { /* ignore */ }
    }
  }, [params.questions])

  const handleAnswer = async (optionId: string) => {
    if (feedback) return // éviter double-tap

    try {
      const result = await submit(questions[currentIdx].id, optionId)

      if (result.is_correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setFeedback('correct')
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setFeedback('incorrect')
      }

      // Passer à la question suivante après 1.2s
      setTimeout(() => {
        setFeedback(null)
        setExplanation(null)

        if (result.should_stop) {
          setFinished(true)
          setAcquired(result.stop_reason === 'mastered')
        } else if (currentIdx < questions.length - 1) {
          setCurrentIdx(i => i + 1)
        } else {
          // Plus de questions locales mais le serveur n'a pas stoppé
          setFinished(true)
          setAcquired(false)
        }
      }, 1200)
    } catch {
      setFeedback(null)
    }
  }

  const handleStop = async () => {
    await stop('child_stopped')
    router.back()
  }

  // ─── Écran de résultat ─────────────────────────────────────────────────────

  if (finished) {
    return (
      <View style={styles.resultContainer}>
        {acquired ? (
          <>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>ACQUIS !</Text>
            <Text style={styles.resultSub}>Bravo ! Tu maîtrises ce thème.</Text>
          </>
        ) : (
          <>
            <Text style={styles.resultEmoji}>💪</Text>
            <Text style={styles.resultTitle}>CONTINUE D'APPRENDRE</Text>
            <Text style={styles.resultSub}>Pas encore — réessaie plus tard !</Text>
          </>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!questions.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement du quiz...</Text>
      </View>
    )
  }

  const question = questions[currentIdx]

  return (
    <View style={styles.container}>
      {/* Indicateur de progression (gamifié — pas de %) */}
      <View style={styles.progressRow}>
        {questions.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= currentIdx && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>{question.text}</Text>

        {/* Options de réponse */}
        {question.options?.map(opt => {
          const isFeedback = feedback !== null
          const bg = !isFeedback ? colors.background.surface : colors.background.surface
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, { backgroundColor: bg }]}
              onPress={() => handleAnswer(opt.id)}
              disabled={!!feedback}
            >
              <Text style={styles.optionText}>{opt.text}</Text>
            </TouchableOpacity>
          )
        })}

        {/* Retour immédiat */}
        {feedback && (
          <View style={[styles.feedbackBanner, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={styles.feedbackText}>
              {feedback === 'correct' ? '✅ Bonne réponse !' : '❌ Pas encore'}
            </Text>
            {explanation && <Text style={styles.explanation}>{explanation}</Text>}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
        <Text style={styles.stopBtnText}>Arrêter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.background.primary },
  loadingText    : { color: colors.text.secondary, textAlign: 'center', marginTop: 100 },
  progressRow    : { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  progressDot    : { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.zinc },
  progressDotActive: { backgroundColor: colors.accent.gold },
  content        : { padding: 24, gap: 12 },
  question       : { color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  option         : { borderRadius: 12, padding: 16, minHeight: 56, justifyContent: 'center' },
  optionText     : { color: colors.text.primary, fontSize: 16 },
  feedbackBanner : { borderRadius: 8, padding: 16, marginTop: 8 },
  feedbackCorrect: { backgroundColor: colors.status.present },
  feedbackWrong  : { backgroundColor: colors.status.absent },
  feedbackText   : { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  explanation    : { color: colors.text.primary, fontSize: 14, marginTop: 4 },
  stopBtn        : { margin: 16, padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.accent.zinc },
  stopBtnText    : { color: colors.text.secondary, fontSize: 14 },
  // Résultat
  resultContainer: { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultEmoji    : { fontSize: 72, marginBottom: 24 },
  resultTitle    : { color: colors.text.primary, fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  resultSub      : { color: colors.text.secondary, fontSize: 16, textAlign: 'center', marginBottom: 40 },
  backBtn        : { backgroundColor: colors.accent.gold, borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14 },
  backBtnText    : { color: colors.background.primary, fontSize: 16, fontWeight: '700' },
})
