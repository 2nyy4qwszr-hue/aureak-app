'use client'
// Story 72-2 — StatCards Séances : layout bento Figma
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { listSessionsWithAttendance } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = { scope: ScopeState }

function calcStats(sessions: SessionAttendanceSummary[]) {
  const now       = new Date()
  const total     = sessions.length
  const cancelled = sessions.filter(s => s.status === 'annulée' || s.status === 'cancelled').length
  const upcoming  = sessions.filter(s => new Date(s.scheduledAt) > now).length
  const withPres  = sessions.filter(s => s.totalAttendance > 0)
  const avgPres   = withPres.length > 0
    ? Math.round(
        withPres.reduce((acc, s) => acc + (s.presentCount / s.totalAttendance) * 100, 0)
        / withPres.length
      )
    : 0
  const complete  = sessions.filter(s => s.completionStatus === 'complete').length
  const evalPct   = total > 0 ? Math.round((complete / total) * 100) : 0

  // — T1 : Trend présence (AC1) —
  const msDay   = 86_400_000
  const cutLast = new Date(now.getTime() - 30 * msDay)
  const cutPrev = new Date(now.getTime() - 60 * msDay)
  const last30  = sessions.filter(s => {
    const d = new Date(s.scheduledAt)
    return d >= cutLast && d <= now
  })
  const prev30  = sessions.filter(s => {
    const d = new Date(s.scheduledAt)
    return d >= cutPrev && d < cutLast
  })
  const avgOf = (arr: SessionAttendanceSummary[]): number | null => {
    const wp = arr.filter(s => s.totalAttendance > 0)
    return wp.length > 0
      ? wp.reduce((acc, s) => acc + (s.presentCount / s.totalAttendance) * 100, 0) / wp.length
      : null
  }
  const a1    = avgOf(last30)
  const a2    = avgOf(prev30)
  const trend = (last30.length >= 2 && prev30.length >= 2 && a1 !== null && a2 !== null)
    ? Math.round(a1 - a2)
    : null

  // — T2 : Record annulations (AC2) —
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = ym(now)
  const monthMap: Record<string, number> = {}
  for (const s of sessions) {
    if (s.status === 'annulée' || s.status === 'cancelled') {
      const m = ym(new Date(s.scheduledAt))
      monthMap[m] = (monthMap[m] ?? 0) + 1
    }
  }
  const cancelledThisMonth = monthMap[currentMonth] ?? 0
  const past6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1)
    return ym(d)
  })
  const maxCancelledPast6 = past6Months.reduce((max, m) => Math.max(max, monthMap[m] ?? 0), 0)
  const isRecord = cancelledThisMonth > 0 && maxCancelledPast6 > 0 && cancelledThisMonth >= maxCancelledPast6

  return { total, cancelled, upcoming, avgPres, evalPct, trend, isRecord }
}

export function StatCards({ scope }: Props) {
  const [sessions, setSessions] = useState<SessionAttendanceSummary[]>([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const params: { implantationId?: string; groupId?: string } = {}
        if (scope.scope === 'implantation' && scope.implantationId) {
          params.implantationId = scope.implantationId
        } else if (scope.scope === 'groupe' && scope.groupId) {
          params.groupId = scope.groupId
        }
        const data = await listSessionsWithAttendance(params)
        setSessions(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[StatCards] listSessionsWithAttendance error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [scope.scope, scope.implantationId, scope.groupId])

  const stats = useMemo(() => calcStats(sessions), [sessions])

  if (loading) {
    return (
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => <View key={i} style={styles.skeletonCard} />)}
      </View>
    )
  }

  return (
    <View style={styles.row}>

      {/* Card 1 — PRÉSENCE MOYENNE */}
      <View style={styles.card as object}>
        {/* Badge trend haut droite — conditionnel (AC1) */}
        {stats.trend !== null && (
          <View style={styles.badgeTrend as object}>
            <AureakText style={styles.badgeTrendText}>
              {stats.trend >= 0 ? `+${stats.trend}%` : `${stats.trend}%`}
            </AureakText>
          </View>
        )}
        {/* Picto */}
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>📈</AureakText>
        </View>
        <AureakText style={styles.statLabel}>PRÉSENCE MOYENNE</AureakText>
        <AureakText style={styles.statValue}>{stats.avgPres}%</AureakText>
        <AureakText style={stats.avgPres >= 75 ? styles.statSubGreen : styles.statSub}>
          {stats.avgPres >= 75 ? '↑ Bonne dynamique' : '↓ À surveiller'}
        </AureakText>
      </View>

      {/* Card 2 — TOTAL SÉANCES */}
      <View style={styles.card as object}>
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>📅</AureakText>
        </View>
        <AureakText style={styles.statLabel}>TOTAL SÉANCES</AureakText>
        <AureakText style={styles.statValue}>{stats.total}</AureakText>
        <AureakText style={styles.statSub}>{stats.upcoming} à venir</AureakText>
      </View>

      {/* Card 3 — ANNULÉES */}
      <View style={styles.card as object}>
        {/* Badge "Record" haut droite — conditionnel (AC2) */}
        {stats.isRecord && (
          <View style={styles.badgeViolet as object}>
            <AureakText style={styles.badgeVioletText}>Record</AureakText>
          </View>
        )}
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>⚠️</AureakText>
        </View>
        <AureakText style={styles.statLabel}>ANNULÉES</AureakText>
        <AureakText style={styles.statValue}>{stats.cancelled}</AureakText>
        <AureakText style={styles.statSub}>sur {stats.total} séances</AureakText>
      </View>

      {/* Card 4 — ÉVALS COMPLÉTÉES — fond gold solid */}
      <View style={styles.cardGold as object}>
        {/* Icône flèche haut droite */}
        <View style={styles.arrowIcon as object}>
          <AureakText style={styles.arrowIconText}>↑</AureakText>
        </View>
        <AureakText style={styles.cardGoldLabel}>ÉVALS COMPLÉTÉES</AureakText>
        <AureakText style={styles.cardGoldValue}>{stats.evalPct}%</AureakText>
        {/* Barre de progression */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(stats.evalPct, 100)}%` as unknown as number,
                // RN Web supporte les propriétés CSS inline via style object
                background: `linear-gradient(90deg, ${colors.accent.gold} 0%, ${colors.accent.goldPale} 100%)`,
              } as object,
            ]}
          />
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingBottom    : space.md,
    flexWrap         : 'wrap',
  },

  // ── Cards 1–3 (fond blanc)
  card: {
    flex            : 1,
    minWidth        : 160,
    minHeight       : 174,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.cardLg,  // 24
    padding         : 16,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    boxShadow       : shadows.sm,
    position        : 'relative',
  },

  skeletonCard: {
    flex           : 1,
    minWidth       : 160,
    minHeight      : 174,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.cardLg,
    opacity        : 0.6,
  },

  // Zone picto 41×41px
  pictoBox: {
    width          : 41,
    height         : 41,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : 12,
  },
  pictoText: {
    fontSize: 26,
  },

  // Badge trend or (card 1)
  badgeTrend: {
    position        : 'absolute',
    top             : 16,
    right           : 16,
    backgroundColor : colors.border.gold,
    paddingHorizontal: 8,
    paddingVertical : 4,
    borderRadius    : 12,
  },
  badgeTrendText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color     : colors.accent.gold,
  },

  // Badge "Record" (card 3) — ambre/warning (violet exclu de la charte)
  badgeViolet: {
    position        : 'absolute',
    top             : 16,
    right           : 16,
    backgroundColor : colors.status.warningBg,
    paddingHorizontal: 8,
    paddingVertical : 4,
    borderRadius    : 12,
  },
  badgeVioletText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color     : colors.status.warning,
  },

  // Label commun (uppercase, Montserrat 14px)
  statLabel: {
    fontSize     : 14,
    fontFamily   : 'Montserrat',
    fontWeight   : '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color        : colors.text.muted,
    marginBottom : 6,
  },

  // Valeur commun (30px bold)
  statValue: {
    fontSize  : 30,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
    lineHeight : 38,
  },

  // Sous-label or (neutre/négatif)
  statSub: {
    fontSize  : 12,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    color     : colors.accent.gold,
    marginTop : 6,
  },

  // Sous-label vert (positif)
  statSubGreen: {
    fontSize  : 12,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    color     : colors.status.success,
    marginTop : 6,
  },

  // ── Card 4 (fond gold solid goldDark)
  cardGold: {
    flex           : 1,
    minWidth       : 160,
    minHeight      : 174,
    backgroundColor: colors.accent.goldDark,
    borderRadius   : 24,
    padding        : 16,
    borderWidth    : 0,
    position       : 'relative',
  },
  cardGoldLabel: {
    fontSize     : 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color        : colors.accent.goldPale,
    fontFamily   : 'Montserrat',
    fontWeight   : '500',
    marginBottom : 8,
    marginTop    : 8,
  },
  cardGoldValue: {
    fontSize  : 20,
    fontWeight: '700',
    color     : colors.text.primary,
    fontFamily: 'Montserrat',
    lineHeight : 28,
  },

  // Icône flèche card 4 (position absolue haut droite, 76×44px)
  arrowIcon: {
    position      : 'absolute',
    top           : 0,
    right         : 0,
    width         : 76,
    height        : 44,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  arrowIconText: {
    fontSize  : 28,
    color     : colors.accent.goldPale,
    fontWeight: '700',
  },

  // Barre de progression card 4
  progressBar: {
    marginTop      : space.sm,
    height         : 8,
    backgroundColor: colors.border.light,
    borderRadius   : 4,
    overflow       : 'hidden',
  },
  progressFill: {
    height        : 8,
    borderRadius  : 4,
    // gradient appliqué via style inline dans le JSX
  },
})
