'use client'
// Story 65-1 — Activités Hub : 4 Stat Cards contextuelles
// Story 71-1 — Design : pictos + ordre picto→label→valeur + 4ème card dorée
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { listSessionsWithAttendance } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = {
  scope: ScopeState
}

function calcStats(sessions: SessionAttendanceSummary[]) {
  const total     = sessions.length
  const cancelled = sessions.filter(s => s.status === 'annulée' || s.status === 'cancelled').length
  const now       = new Date()
  const upcoming  = sessions.filter(s => new Date(s.scheduledAt) > now).length

  // Taux présence moyen sur les séances avec attendances
  const withPres = sessions.filter(s => s.totalAttendance > 0)
  const avgPres  = withPres.length > 0
    ? Math.round(
        withPres.reduce((acc, s) => {
          const rate = s.totalAttendance > 0 ? (s.presentCount / s.totalAttendance) * 100 : 0
          return acc + rate
        }, 0) / withPres.length
      )
    : 0

  const cancelPct = total > 0 ? Math.round((cancelled / total) * 100) : 0

  // % évals complètes = séances avec completionStatus = 'complete'
  const complete = sessions.filter(s => s.completionStatus === 'complete').length
  const evalPct  = total > 0 ? Math.round((complete / total) * 100) : 0

  return { total, cancelled, upcoming, avgPres, cancelPct, evalPct }
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
      {/* Présence Moyenne */}
      <View style={styles.card}>
        <AureakText style={styles.statIcon}>📈</AureakText>
        <AureakText style={styles.statLabel}>Présence Moyenne</AureakText>
        <AureakText style={styles.statValue}>{stats.avgPres}%</AureakText>
        <AureakText style={styles.statSub}>
          {stats.avgPres >= 75 ? '↑ Bonne dynamique' : '↓ À surveiller'}
        </AureakText>
      </View>

      {/* Total Séances */}
      <View style={styles.card}>
        <AureakText style={styles.statIcon}>📅</AureakText>
        <AureakText style={styles.statLabel}>Total Séances</AureakText>
        <AureakText style={styles.statValue}>{stats.total}</AureakText>
        <AureakText style={styles.statSub}>{stats.upcoming} à venir</AureakText>
      </View>

      {/* Annulées */}
      <View style={styles.card}>
        <AureakText style={styles.statIcon}>⚠️</AureakText>
        <AureakText style={styles.statLabel}>Annulées</AureakText>
        <AureakText style={styles.statValue}>{stats.cancelled}</AureakText>
        {stats.cancelPct > 0 && (
          <View style={styles.badgeOrange}>
            <AureakText style={styles.badgeOrangeText}>{stats.cancelPct}%</AureakText>
          </View>
        )}
        <AureakText style={styles.statSub}>sur {stats.total} séances</AureakText>
      </View>

      {/* Évals Complétées — card dark */}
      <View style={[styles.card, styles.cardDark]}>
        <AureakText style={styles.statIconLight}>↑</AureakText>
        <AureakText style={styles.statLabelLight}>Évals Complétées</AureakText>
        <AureakText style={styles.statValueLight}>{stats.evalPct}%</AureakText>
        <View style={[styles.progressBar, styles.progressBarDark]}>
          <View style={[styles.progressFill, { width: `${Math.min(stats.evalPct, 100)}%` as unknown as number }]} />
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
  card: {
    flex           : 1,
    minWidth       : 160,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    // Web box shadow via style object (RN web supports boxShadow)
    boxShadow      : shadows.sm,
  } as unknown as object,
  cardDark: {
    backgroundColor: colors.text.dark,
    borderColor    : colors.text.dark,
  },
  skeletonCard: {
    flex           : 1,
    minWidth       : 160,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    height         : 100,
    opacity        : 0.6,
  },
  statIcon: {
    fontSize    : 22,
    marginBottom: 4,
  },
  statIconLight: {
    fontSize    : 22,
    marginBottom: 4,
    color       : colors.text.primary,
  },
  statValue: {
    fontSize  : 28,
    fontWeight: '900',
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
    lineHeight: 36,
  },
  statValueLight: {
    fontSize  : 28,
    fontWeight: '900',
    fontFamily: 'Montserrat',
    color     : colors.text.primary,
    lineHeight: 36,
  },
  statLabel: {
    fontSize     : 10,
    fontFamily   : 'Montserrat',
    color        : colors.text.muted,
    marginTop    : 2,
    marginBottom : 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statLabelLight: {
    fontSize     : 10,
    fontFamily   : 'Montserrat',
    color        : colors.accent.goldLight,
    marginTop    : 2,
    marginBottom : 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statSub: {
    fontSize  : 12,
    fontFamily: 'Montserrat',
    color     : colors.text.subtle,
    marginTop : 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  badgeOrange: {
    alignSelf        : 'flex-start',
    backgroundColor  : colors.status.orangeBg,
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
    marginTop        : 4,
  },
  badgeOrangeText: {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color     : colors.status.orangeText,
  },
  progressBar: {
    marginTop      : space.sm,
    height         : 6,
    backgroundColor: colors.border.light,
    borderRadius   : 3,
    overflow       : 'hidden',
  },
  progressBarDark: {
    backgroundColor: colors.text.primary + '30',
  },
  progressFill: {
    height         : 6,
    backgroundColor: colors.accent.gold,
    borderRadius   : 3,
  },
})
