// Story 58-4 — Hub Méthodologie avec tile "Thème de la semaine" + progression saison
// Remplace le simple redirect vers /methodologie/seances
'use client'
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getThemeOfWeek, listAcademySeasons } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { MethodologyTheme, AcademySeason } from '@aureak/types'

// Calcule le nombre de semaines entre deux dates
function weeksBetween(start: string, end: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.ceil(diff / msPerWeek))
}

// Calcule la semaine courante dans la saison (1-indexed)
function currentWeekInSeason(start: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = Date.now() - new Date(start).getTime()
  return Math.max(1, Math.ceil(diff / msPerWeek))
}

// Entrées de navigation hub méthodologie
const NAV_ITEMS = [
  { label: 'Séances pédagogiques', route: '/methodologie/seances',    icon: '📋', desc: 'Bibliothèque de séances réutilisables' },
  { label: 'Situations',           route: '/methodologie/situations', icon: '🎯', desc: 'Exercices et situations de jeu' },
  { label: 'Thèmes',               route: '/methodologie/themes',     icon: '📚', desc: 'Blocs thématiques de la progression' },
  { label: 'Groupes thématiques',  route: '/methodologie/theme-groups', icon: '🗂', desc: 'Organisation par groupes de thèmes' },
]

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.lg, maxWidth: 900, alignSelf: 'center' as never, width: '100%' },
  header     : { gap: space.xs },
  themeCard  : { flexDirection: 'row', backgroundColor: colors.light.surface, borderRadius: radius.card, overflow: 'hidden' as never, marginBottom: 0 },
  themeAccent: { width: 4, backgroundColor: colors.accent.gold },
  themeBody  : { flex: 1, padding: space.md, gap: space.xs },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' as never },
  progressFill: { height: '100%' as never, backgroundColor: colors.accent.gold, borderRadius: 3 },
  navGrid    : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  navCard    : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, borderWidth: 1, borderColor: colors.border.light, gap: space.xs, flex: 1, minWidth: 180 },
  navIcon    : { fontSize: 24 },
})

export default function MethodologieHub() {
  const router = useRouter()

  const [themeOfWeek,  setThemeOfWeek]  = useState<MethodologyTheme | null>(null)
  const [weekNumber,   setWeekNumber]   = useState(0)
  const [loadingTheme, setLoadingTheme] = useState(false)
  const [currentSeason, setCurrentSeason] = useState<AcademySeason | null>(null)

  useEffect(() => {
    setLoadingTheme(true)
    Promise.all([
      getThemeOfWeek(),
      listAcademySeasons(),
    ])
      .then(([themeRes, seasonRes]) => {
        setThemeOfWeek(themeRes.data)
        setWeekNumber(themeRes.weekNumber)
        // Saison courante : filtre is_current, sinon première
        const seasons = seasonRes.data ?? []
        const active = seasons.find(s => s.isCurrent) ?? seasons[0] ?? null
        setCurrentSeason(active)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production')
          console.error('[MethoHub] loadTheme error:', err)
      })
      .finally(() => setLoadingTheme(false))
  }, [])

  // Calcul barre progression saison
  const totalWeeks   = currentSeason
    ? weeksBetween(currentSeason.startDate, currentSeason.endDate)
    : 0
  const currentWeek  = currentSeason
    ? Math.min(currentWeekInSeason(currentSeason.startDate), totalWeeks)
    : 0
  const progressPct  = totalWeeks > 0 ? Math.round((currentWeek / totalWeeks) * 100) : 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Titre */}
      <View style={styles.header}>
        <AureakText variant="h2">Méthodologie</AureakText>
        <AureakText variant="body" style={{ color: colors.text.muted } as never}>
          Bibliothèque pédagogique Aureak
        </AureakText>
      </View>

      {/* Tile thème de la semaine */}
      <View style={[styles.themeCard, { boxShadow: shadows.gold } as never]}>
        <View style={styles.themeAccent} />
        <View style={styles.themeBody}>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 1, fontSize: 11 } as never}>
            {`THÈME DE LA SEMAINE${weekNumber > 0 ? ` — Semaine ${weekNumber}` : ''}`}
          </AureakText>

          {loadingTheme ? (
            <View>
              <View style={{ height: 12, width: '60%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 6 }} />
              <View style={{ height: 20, width: '90%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 6 }} />
              <View style={{ height: 14, width: '100%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 4 }} />
              <View style={{ height: 14, width: '75%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 10 }} />
              <View style={{ height: 6, width: '100%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6 }} />
            </View>
          ) : themeOfWeek ? (
            <>
              <AureakText variant="h2" style={{ fontWeight: '700', color: colors.text.dark } as never}>
                {themeOfWeek.title}
              </AureakText>
              {themeOfWeek.description && (
                <AureakText variant="body" style={{ color: colors.text.muted } as never} numberOfLines={2}>
                  {themeOfWeek.description}
                </AureakText>
              )}
              <Pressable
                style={{ marginTop: space.xs }}
                onPress={() => router.push(`/methodologie/situations?theme=${themeOfWeek.id}` as never)}
              >
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' } as never}>
                  Voir les exercices →
                </AureakText>
              </Pressable>
            </>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              <AureakText variant="body" style={{ color: colors.text.muted } as never}>
                Aucun thème configuré —
              </AureakText>
              <Pressable onPress={() => router.push('/methodologie/themes/new' as never)}>
                <AureakText variant="body" style={{ color: colors.accent.gold } as never}>
                  ajouter un thème
                </AureakText>
              </Pressable>
            </View>
          )}

          {/* Progression saison */}
          {currentSeason && totalWeeks > 0 && (
            <View style={{ marginTop: space.sm, gap: space.xs }}>
              <View style={styles.progressRow}>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, minWidth: 80 } as never}>
                  Semaine {currentWeek}/{totalWeeks}
                </AureakText>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` as unknown as number }]} />
                </View>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 } as never}>
                  {progressPct}%
                </AureakText>
              </View>
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontSize: 10 } as never}>
                Saison {currentSeason.label}
              </AureakText>
            </View>
          )}
        </View>
      </View>

      {/* Grille de navigation */}
      <AureakText variant="label" style={{ color: colors.text.muted } as never}>Sections</AureakText>
      <View style={styles.navGrid}>
        {NAV_ITEMS.map(item => (
          <Pressable
            key={item.route}
            style={styles.navCard}
            onPress={() => router.push(item.route as never)}
          >
            <AureakText style={styles.navIcon as never}>{item.icon}</AureakText>
            <AureakText variant="label" style={{ color: colors.text.dark } as never}>{item.label}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted } as never}>{item.desc}</AureakText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
