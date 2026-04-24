'use client'
// Hub Méthodologie : tile "Thème de la semaine" + progression saison (extrait de l'ancien hub)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getThemeOfWeek, listAcademySeasons } from '@aureak/api-client'
import type { MethodologyTheme, AcademySeason } from '@aureak/types'

function weeksBetween(start: string, end: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.ceil(diff / msPerWeek))
}

function currentWeekInSeason(start: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = Date.now() - new Date(start).getTime()
  return Math.max(1, Math.ceil(diff / msPerWeek))
}

export function MethodologieHubThemeOfWeek() {
  const router = useRouter()

  const [themeOfWeek,   setThemeOfWeek]   = useState<MethodologyTheme | null>(null)
  const [weekNumber,    setWeekNumber]    = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [currentSeason, setCurrentSeason] = useState<AcademySeason | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [themeRes, seasonRes] = await Promise.all([
          getThemeOfWeek(),
          listAcademySeasons(),
        ])
        if (cancelled) return
        setThemeOfWeek(themeRes.data)
        setWeekNumber(themeRes.weekNumber)
        const seasons = seasonRes.data ?? []
        const active  = seasons.find(s => s.isCurrent) ?? seasons[0] ?? null
        setCurrentSeason(active)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MethoHubThemeOfWeek] error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const totalWeeks  = currentSeason
    ? weeksBetween(currentSeason.startDate, currentSeason.endDate)
    : 0
  const currentWeek = currentSeason
    ? Math.min(currentWeekInSeason(currentSeason.startDate), totalWeeks)
    : 0
  const progressPct = totalWeeks > 0 ? Math.round((currentWeek / totalWeeks) * 100) : 0

  return (
    <View style={[styles.card, { boxShadow: shadows.gold } as never]}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <AureakText style={styles.label as TextStyle}>
          {`THÈME DE LA SEMAINE${weekNumber > 0 ? ` — Semaine ${weekNumber}` : ''}`}
        </AureakText>

        {loading ? (
          <View>
            <View style={[styles.skelLine, { width: '60%' }]} />
            <View style={[styles.skelLine, { width: '90%', height: 20 }]} />
            <View style={[styles.skelLine, { width: '100%' }]} />
            <View style={[styles.skelLine, { width: '75%' }]} />
          </View>
        ) : themeOfWeek ? (
          <>
            <AureakText style={styles.title as TextStyle}>{themeOfWeek.title}</AureakText>
            {themeOfWeek.description ? (
              <AureakText style={styles.desc as TextStyle} numberOfLines={2}>
                {themeOfWeek.description}
              </AureakText>
            ) : null}
            <Pressable
              style={styles.link}
              onPress={() => router.push(`/methodologie/situations?theme=${themeOfWeek.id}` as never)}
            >
              <AureakText style={styles.linkText as TextStyle}>
                Voir les exercices →
              </AureakText>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyRow}>
            <AureakText style={styles.desc as TextStyle}>
              Aucun thème configuré —
            </AureakText>
            <Pressable onPress={() => router.push('/methodologie/themes/new' as never)}>
              <AureakText style={[styles.desc, { color: colors.accent.gold }] as unknown as TextStyle}>
                ajouter un thème
              </AureakText>
            </Pressable>
          </View>
        )}

        {currentSeason && totalWeeks > 0 ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <AureakText style={styles.progressLabel as TextStyle}>
                Semaine {currentWeek}/{totalWeeks}
              </AureakText>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` as unknown as number }]} />
              </View>
              <AureakText style={styles.progressLabel as TextStyle}>
                {progressPct}%
              </AureakText>
            </View>
            <AureakText style={styles.seasonLabel as TextStyle}>
              Saison {currentSeason.label}
            </AureakText>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden' as never,
    minHeight      : 156,
  },
  accent: {
    width          : 4,
    backgroundColor: colors.accent.gold,
  },
  body: {
    flex   : 1,
    padding: space.lg,
    gap    : space.xs,
  },
  label: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize  : 20,
    fontWeight: '700',
    color     : colors.text.dark,
    marginTop : space.xs,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
  },
  link: {
    marginTop: space.xs,
  },
  linkText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
  emptyRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    alignItems   : 'center',
    gap          : 4,
  },
  progressWrap: {
    marginTop: space.sm,
    gap      : space.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
    minWidth  : 68,
  },
  progressBar: {
    flex           : 1,
    height         : 6,
    backgroundColor: colors.border.light,
    borderRadius   : 3,
    overflow       : 'hidden' as never,
  },
  progressFill: {
    height         : '100%' as never,
    backgroundColor: colors.accent.gold,
    borderRadius   : 3,
  },
  seasonLabel: {
    fontFamily: fonts.body,
    fontSize  : 10,
    color     : colors.text.subtle,
  },
  skelLine: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    opacity        : 0.6,
    height         : 14,
    marginBottom   : 6,
  },
})
