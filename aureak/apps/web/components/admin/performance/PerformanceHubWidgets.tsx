'use client'
// Hub Performance — 3 widgets : sessions live, raccourcis exploration, comparaisons
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText, LiveCounter } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { useLiveSessionCounts } from '@aureak/api-client'

// ── Widget 1 : Live sessions ──────────────────────────────────────────────────
export function PerformanceHubLive() {
  const router  = useRouter()
  const counts  = useLiveSessionCounts()
  const hasLive = counts.sessionCount > 0

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Séances en direct</AureakText>
      {hasLive ? (
        <View style={styles.liveBox}>
          <LiveCounter
            sessionCount={counts.sessionCount}
            presentCount={counts.presentCount}
            totalCount={counts.totalCount}
            isLive={counts.isLive}
          />
        </View>
      ) : (
        <AureakText style={styles.empty as TextStyle}>Aucune séance en cours</AureakText>
      )}
      <Pressable
        onPress={() => router.push('/performance/presences' as never)}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <AureakText style={styles.ctaLabel as TextStyle}>Voir les présences →</AureakText>
      </Pressable>
    </View>
  )
}

// ── Widget 2 : Exploration raccourcis ─────────────────────────────────────────
const SHORTCUTS: { title: string; href: string; subtitle: string }[] = [
  { title: 'Charge',        href: '/performance/charge',       subtitle: 'Heatmap jours/heures' },
  { title: 'Clubs',         href: '/performance/clubs',        subtitle: 'Classement implantations' },
  { title: 'Présences',     href: '/performance/presences',    subtitle: 'Taux par groupe' },
  { title: 'Progression',   href: '/performance/progression',  subtitle: 'Niveaux et maîtrise' },
  { title: 'Implantations', href: '/performance/implantation', subtitle: 'Dashboard analytique' },
]

export function PerformanceHubExploration() {
  const router = useRouter()
  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Explorer en détail</AureakText>
      <View style={styles.list}>
        {SHORTCUTS.map(sc => (
          <Pressable
            key={sc.href}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(sc.href as never)}
          >
            <View style={styles.rowContent}>
              <AureakText style={styles.rowTitle as TextStyle}>{sc.title}</AureakText>
              <AureakText style={styles.rowSubline as TextStyle} numberOfLines={1}>
                {sc.subtitle}
              </AureakText>
            </View>
            <AureakText style={styles.arrow as TextStyle}>→</AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// ── Widget 3 : Comparaisons ───────────────────────────────────────────────────
const COMPARES: { title: string; href: string; subtitle: string }[] = [
  { title: 'Comparaison évaluations',   href: '/performance/comparaisons/evaluations',   subtitle: 'Radar 2 joueurs · 6 axes' },
  { title: 'Comparaison implantations', href: '/performance/comparaisons/implantations', subtitle: 'Côte-à-côte · métriques clés' },
]

export function PerformanceHubComparaisons() {
  const router = useRouter()
  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Comparaisons</AureakText>
      <View style={styles.list}>
        {COMPARES.map(c => (
          <Pressable
            key={c.href}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(c.href as never)}
          >
            <View style={styles.rowContent}>
              <AureakText style={styles.rowTitle as TextStyle}>{c.title}</AureakText>
              <AureakText style={styles.rowSubline as TextStyle} numberOfLines={1}>
                {c.subtitle}
              </AureakText>
            </View>
            <AureakText style={styles.arrow as TextStyle}>→</AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
    boxShadow      : shadows.sm,
    minHeight      : 220,
  },
  title: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  empty: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    marginTop : space.sm,
  },
  liveBox: {
    paddingVertical: space.sm,
  },
  cta: {
    marginTop: 'auto',
    paddingVertical: 4,
  },
  ctaPressed: { opacity: 0.7 },
  ctaLabel: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.accent.gold,
  },
  list: { gap: space.xs },
  row: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowPressed: { opacity: 0.7 },
  rowContent: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  rowSubline: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
  },
  arrow: {
    fontFamily: fonts.body,
    fontSize  : 14,
    color     : colors.text.muted,
  },
})
