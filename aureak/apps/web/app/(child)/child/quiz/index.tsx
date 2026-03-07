'use client'
// Sélection du thème pour lancer un quiz
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getChildThemeProgression } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { ThemeProgressEntry } from '@aureak/api-client'

const MASTERY_LABEL: Record<string, string> = {
  not_started   : 'Non commencé',
  in_progress   : 'En cours',
  acquired      : 'Acquis',
  review_due    : 'À réviser',
}
const MASTERY_COLOR: Record<string, string> = {
  not_started: colors.text.secondary,
  in_progress: colors.status.attention,
  acquired   : colors.status.present,
  review_due : colors.accent.gold,
}

export default function ChildQuizIndexPage() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const [themes,  setThemes]  = useState<ThemeProgressEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getChildThemeProgression(user.id).then(entries => {
      setThemes(entries)
      setLoading(false)
    })
  }, [user?.id])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText variant="h2">Quiz</AureakText>
      <AureakText variant="body" style={{ color: colors.text.secondary }}>
        Choisis un thème pour démarrer un quiz.
      </AureakText>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      ) : themes.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucun thème disponible pour le moment.
        </AureakText>
      ) : (
        themes.map(theme => (
          <Pressable
            key={theme.id}
            onPress={() => router.push(`/child/quiz/${theme.id}` as never)}
          >
            <View style={styles.themeCard}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>{theme.name}</AureakText>
                <AureakText
                  variant="caption"
                  style={{ color: MASTERY_COLOR[theme.masteryStatus] ?? colors.text.secondary }}
                >
                  {MASTERY_LABEL[theme.masteryStatus] ?? theme.masteryStatus}
                  {theme.reviewDue ? ' · Révision recommandée' : ''}
                </AureakText>
              </View>
              <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' }}>
                Commencer →
              </AureakText>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.background.primary },
  content   : { padding: space.xl, gap: space.sm },
  themeCard : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    backgroundColor: colors.background.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
})
