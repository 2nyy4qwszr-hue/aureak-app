'use client'
// Story 93.7 T8 — TodaySessionCards : grid de cards pour temporalFilter === 'today'
// Source : template `activites.jsx` + `admin.css` `.next-session` simplifié.
// Une card par séance du jour, layout responsive (1 colonne mobile, grid 2 colonnes desktop).
import React from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, radius, shadows, space } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'

type EnrichedLike = SessionAttendanceSummary & {
  badgeCount?: number
  hasAnomaly?: boolean
}

export type TodaySessionCardsProps = {
  sessions  : EnrichedLike[]
  groupNames: Map<string, string>
  coachNames: Map<string, string>
}

const DESKTOP_BREAKPOINT = 1024

function formatTimeRange(scheduledAt: string, durationMinutes?: number | null): string {
  const d   = new Date(scheduledAt)
  const hh  = d.getHours().toString().padStart(2, '0')
  const mm  = d.getMinutes().toString().padStart(2, '0')
  const dur = durationMinutes ?? 90
  const end = new Date(d.getTime() + dur * 60_000)
  const eh  = end.getHours().toString().padStart(2, '0')
  const em  = end.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm} — ${eh}:${em}`
}

function formatStatus(status: string): { label: string; bg: string; fg: string } {
  if (status === 'réalisée' || status === 'terminée') {
    return { label: 'Réalisée', bg: colors.status.successBg, fg: colors.status.successText }
  }
  if (status === 'en_cours') {
    return { label: 'En cours', bg: colors.border.gold, fg: colors.accent.goldDarkText }
  }
  if (status === 'annulée' || status === 'cancelled') {
    return { label: 'Annulée', bg: colors.status.errorBg, fg: colors.status.errorText }
  }
  return { label: 'Planifiée', bg: colors.border.divider, fg: colors.text.dark }
}

export function TodaySessionCards({ sessions, groupNames, coachNames }: TodaySessionCardsProps) {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= DESKTOP_BREAKPOINT

  return (
    <View style={[s.grid, isDesktop && s.gridDesktop] as never}>
      {sessions.map(session => {
        const groupName = groupNames.get(session.groupId) ?? session.groupName ?? '—'
        const coachId   = session.coachIds?.[0]
        const coachName = coachId ? (coachNames.get(coachId) ?? '—') : '—'
        const statusCfg = formatStatus(session.status as string)
        const presence  = session.totalAttendance > 0
          ? `${session.presentCount}/${session.totalAttendance}`
          : '—'

        return (
          <Pressable
            key={session.sessionId}
            onPress={() => router.push(`/activites/seances/${session.sessionId}` as never)}
            style={({ pressed }) => [s.card, pressed && s.cardPressed] as never}
          >
            {/* Status pill */}
            <View style={[s.statusPill, { backgroundColor: statusCfg.bg }] as never}>
              <AureakText style={{ ...s.statusLabel, color: statusCfg.fg } as TextStyle}>
                {statusCfg.label}
              </AureakText>
            </View>

            {/* Title (group name) */}
            <AureakText style={s.title as TextStyle}>{groupName}</AureakText>

            {/* Time range */}
            <View style={s.timeRow}>
              <View style={s.blob} />
              <AureakText style={s.timeText as TextStyle}>
                {formatTimeRange(session.scheduledAt, session.durationMinutes)}
              </AureakText>
            </View>

            {/* Details grid 2×2 */}
            <View style={s.detailsGrid}>
              <View style={s.detailItem}>
                <AureakText style={s.detailLabel as TextStyle}>Coach</AureakText>
                <AureakText style={s.detailValue as TextStyle}>{coachName}</AureakText>
              </View>
              <View style={s.detailItem}>
                <AureakText style={s.detailLabel as TextStyle}>Présence</AureakText>
                <AureakText style={s.detailValue as TextStyle}>{presence}</AureakText>
              </View>
              {session.badgeCount !== undefined && session.badgeCount > 0 && (
                <View style={s.detailItem}>
                  <AureakText style={s.detailLabel as TextStyle}>Badges</AureakText>
                  <AureakText style={s.detailValue as TextStyle}>🏆 {session.badgeCount}</AureakText>
                </View>
              )}
              {session.hasAnomaly && (
                <View style={s.detailItem}>
                  <AureakText style={s.detailLabel as TextStyle}>Anomalie</AureakText>
                  <AureakText style={{ ...s.detailValue, color: colors.accent.red } as TextStyle}>⚠ Détectée</AureakText>
                </View>
              )}
            </View>

            {/* CTA */}
            <View style={s.ctaRow}>
              <View style={s.ctaPill}>
                <AureakText style={s.ctaLabel as TextStyle}>Ouvrir la séance ›</AureakText>
              </View>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

export default TodaySessionCards

const s = StyleSheet.create({
  grid: {
    flexDirection : 'column',
    gap           : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.lg,
  },
  card: {
    flex            : 1,
    minWidth        : 320,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    padding         : space.lg,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    gap             : space.sm,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow web-only
    boxShadow       : shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  statusPill: {
    alignSelf        : 'flex-start',
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 999,
  },
  statusLabel: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily   : fonts.display,
    fontSize     : 22,
    fontWeight   : '700',
    color        : colors.text.dark,
    letterSpacing: -0.5,
    lineHeight   : 28,
    marginTop    : 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginTop    : 2,
  },
  blob: {
    width          : 8,
    height         : 8,
    borderRadius   : 4,
    backgroundColor: colors.status.present,
  },
  timeText: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '500',
    color     : colors.text.subtle,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    marginTop    : space.sm,
  },
  detailItem: {
    flex    : 1,
    minWidth: 120,
    gap     : 2,
  },
  detailLabel: {
    fontFamily   : fonts.body,
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color        : colors.text.muted,
  },
  detailValue: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  ctaRow: {
    marginTop    : space.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  ctaPill: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  ctaLabel: {
    color     : colors.text.onGold,
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize  : 13,
  },
})
