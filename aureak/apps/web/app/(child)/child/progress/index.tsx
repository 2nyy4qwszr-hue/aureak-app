'use client'
// Progression enfant — maîtrise par thème + cartes de compétence
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { getChildThemeProgression, getSkillCardCollection } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { ThemeProgressEntry, SkillCardCollectionEntry } from '@aureak/api-client'

const MASTERY_COLOR: Record<string, string> = {
  not_started: colors.text.muted,
  in_progress: colors.status.attention,
  acquired   : colors.status.present,
  review_due : colors.accent.gold,
}
const MASTERY_LABEL: Record<string, string> = {
  not_started: 'Non commencé',
  in_progress: 'En cours',
  acquired   : 'Acquis',
  review_due : 'À réviser',
}

const RARITY_COLOR: Record<string, string> = {
  common   : colors.text.muted,
  rare     : colors.text.dark,
  epic     : colors.status.attention,
  legendary: colors.accent.gold,
}
const RARITY_LABEL: Record<string, string> = {
  common   : 'Commune',
  rare     : 'Rare',
  epic     : 'Épique',
  legendary: 'Légendaire',
}

export default function ChildProgressPage() {
  const user = useAuthStore(s => s.user)

  const [themes,  setThemes]  = useState<ThemeProgressEntry[]>([])
  const [cards,   setCards]   = useState<SkillCardCollectionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getChildThemeProgression(user.id),
      getSkillCardCollection(user.id),
    ]).then(([t, c]) => {
      setThemes(t)
      setCards(c)
    }).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[progress] load error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user?.id])

  const reviewDueCount = themes.filter(t => t.reviewDue).length
  const acquiredCount  = themes.filter(t => t.masteryStatus === 'acquired').length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText variant="h2">Ma progression</AureakText>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : (
        <>
          {/* Summary KPIs */}
          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.status.present }}>{acquiredCount}</AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Acquis</AureakText>
            </View>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.text.dark }}>{themes.length}</AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Thèmes</AureakText>
            </View>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.accent.gold }}>{cards.length}</AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Cartes</AureakText>
            </View>
          </View>

          {reviewDueCount > 0 && (
            <View style={styles.reviewAlert}>
              <AureakText variant="body" style={{ color: colors.accent.gold, fontWeight: '600' }}>
                {reviewDueCount} thème{reviewDueCount > 1 ? 's' : ''} à réviser !
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Fais un quiz pour les renforcer.
              </AureakText>
            </View>
          )}

          {/* Themes list */}
          <AureakText variant="h3" style={{ marginTop: space.sm }}>Thèmes</AureakText>

          {themes.length === 0 ? (
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Aucun thème commencé pour l'instant.
            </AureakText>
          ) : (
            themes.map(theme => (
              <View key={theme.id} style={styles.themeRow}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.themeHeader}>
                    <AureakText variant="body" style={{ fontWeight: '600', flex: 1 }}>
                      {theme.name}
                      {theme.reviewDue ? ' 🔄' : ''}
                    </AureakText>
                    <AureakText
                      variant="caption"
                      style={{ color: MASTERY_COLOR[theme.masteryStatus] ?? colors.text.muted, fontWeight: '600' }}
                    >
                      {MASTERY_LABEL[theme.masteryStatus] ?? theme.masteryStatus}
                    </AureakText>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[
                      styles.progressFill,
                      {
                        width: theme.masteryStatus === 'acquired' ? ('100%' as never) : theme.masteryStatus === 'in_progress' ? ('50%' as never) : ('5%' as never),
                        backgroundColor: MASTERY_COLOR[theme.masteryStatus] ?? colors.text.muted,
                      },
                    ]} />
                  </View>
                  {theme.firstAcquiredAt && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Acquis le {new Date(theme.firstAcquiredAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </AureakText>
                  )}
                  {(theme.skillCards?.length ?? 0) > 0 && (
                    <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                      {theme.skillCards!.length} carte{theme.skillCards!.length > 1 ? 's' : ''} de compétence
                    </AureakText>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Skill cards */}
          {cards.length > 0 && (
            <>
              <AureakText variant="h3" style={{ marginTop: space.sm }}>Mes cartes de compétence</AureakText>
              <View style={styles.cardsGrid}>
                {cards.map(card => (
                  <View
                    key={card.id}
                    style={[styles.card, { borderColor: RARITY_COLOR[card.rarity] ?? colors.border.light }]}
                  >
                    <AureakText
                      variant="caption"
                      style={{ color: RARITY_COLOR[card.rarity] ?? colors.text.muted, fontWeight: '700', fontSize: 9 }}
                    >
                      {RARITY_LABEL[card.rarity] ?? card.rarity}
                    </AureakText>
                    <AureakText variant="caption" style={{ fontWeight: '600', textAlign: 'center', fontSize: 11 }}>
                      {card.name}
                    </AureakText>
                    {card.collected_at && (
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 9 }}>
                        {new Date(card.collected_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </AureakText>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },
  kpiRow       : {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  kpi          : { flex: 1, alignItems: 'center', gap: 4 },
  reviewAlert  : {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    padding        : space.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
    gap            : 4,
  },
  themeRow     : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  themeHeader  : { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden' },
  progressFill : { height: 6, borderRadius: 3 },
  cardsGrid    : { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card         : {
    width          : 90,
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    borderWidth    : 1.5,
    padding        : 8,
    alignItems     : 'center',
    gap            : 4,
  },
})
