'use client'
// Story 72-2 — StatCards Séances : layout bento Figma
// Story 93-3 — Migration vers StatsHero (1 card hero sparkline + 3 cards variants bars/progress/trend)
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { listSessionsWithAttendance } from '@aureak/api-client'
import { colors, radius, space } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

import { StatsHero } from '../../_components/stats'
import { buildActivitesSparklineData, buildWeeklySessionsData } from './sparkline-data'

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

  return { total, cancelled, upcoming, avgPres, evalPct, trend }
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
  const sparkline = useMemo(() => buildActivitesSparklineData(sessions), [sessions])
  const weeklyBars = useMemo(() => buildWeeklySessionsData(sessions), [sessions])

  if (loading) {
    return (
      <View style={loaderStyles.row}>
        {[0, 1, 2, 3].map(i => <View key={i} style={loaderStyles.skeletonCard} />)}
      </View>
    )
  }

  const trendDirection =
    stats.trend === null ? 'neutral'
      : stats.trend > 0 ? 'up'
      : stats.trend < 0 ? 'down'
      : 'neutral'

  const trendLabel =
    stats.trend === null ? 'Données insuffisantes'
      : stats.trend === 0 ? 'Stable sur 30 jours'
      : `${stats.trend > 0 ? '+' : ''}${stats.trend} pts vs mois dernier`

  return (
    <StatsHero
      hero={{
        label             : 'Présence moyenne · 30j',
        value             : stats.avgPres,
        unit              : '%',
        trend             : { direction: trendDirection, label: trendLabel },
        sparkline         : sparkline,
        sparklineAriaLabel: `Évolution présence moyenne sur 30 jours, de ${Math.min(...sparkline)}% à ${Math.max(...sparkline)}%`,
      }}
      cards={[
        {
          label  : 'Total séances',
          value  : stats.total,
          meta   : `${stats.upcoming} à venir cette semaine`,
          footer : { type: 'bars', bars: weeklyBars, dayLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] },
          iconTone: 'gold',
        },
        {
          label   : 'Annulées',
          value   : stats.cancelled,
          meta    : stats.total > 0 ? `sur ${stats.total} séances · taux ${Math.round((stats.cancelled / stats.total) * 100)}%` : 'sur 0 séance',
          iconTone: 'red',
        },
        {
          label  : 'Évaluations complétées',
          value  : stats.evalPct,
          unit   : '%',
          trend  : stats.evalPct === 100
            ? { direction: 'up', label: 'Toutes saisies' }
            : { direction: 'neutral', label: `${stats.evalPct}% · en attente des coachs` },
          footer : { type: 'progress', progress: stats.evalPct },
          iconTone: 'gold',
        },
      ]}
    />
  )
}

const loaderStyles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingBottom    : space.md,
    flexWrap         : 'wrap',
  },
  skeletonCard: {
    flex           : 1,
    minWidth       : 160,
    height         : 160,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    opacity        : 0.6,
  },
})
