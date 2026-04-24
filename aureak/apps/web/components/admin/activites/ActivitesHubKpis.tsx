'use client'
// Story 108.1 — Hub Activités : 4 cartes KPI globales (mois en cours + 30j + à risque)
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getActivitesHubKpis } from '@aureak/api-client'
import type { ActivitesHubKpis, HubScope } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = { scope: ScopeState }

function toHubScope(scope: ScopeState): HubScope | undefined {
  if (scope.scope === 'implantation' && scope.implantationId) return { implantationId: scope.implantationId }
  if (scope.scope === 'groupe'       && scope.groupId)        return { groupId:        scope.groupId }
  return undefined
}

function trendLabel(curr: number, prev: number): string {
  if (prev === 0 && curr === 0) return 'Pas de comparaison'
  if (prev === 0)               return 'Pas de référence'
  const delta = curr - prev
  if (delta === 0) return 'Stable vs période préc.'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta} pts vs période préc.`
}

function trendDirection(curr: number, prev: number): 'up' | 'down' | 'neutral' {
  if (prev === 0) return 'neutral'
  if (curr > prev) return 'up'
  if (curr < prev) return 'down'
  return 'neutral'
}

export function ActivitesHubKpis({ scope }: Props) {
  const { width }                 = useWindowDimensions()
  const [data,    setData]        = useState<ActivitesHubKpis | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error,   setError]       = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const result = await getActivitesHubKpis(toHubScope(scope))
        if (!cancelled) setData(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ActivitesHubKpis] error:', err)
        if (!cancelled) setError('Impossible de charger les KPIs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [scope.scope, scope.implantationId, scope.groupId])

  const cols = useMemo(() => {
    if (width >= 1024) return 4
    if (width >= 768)  return 2
    return 1
  }, [width])

  if (loading) {
    return (
      <View style={[styles.grid, { gridTemplateColumns: `repeat(${cols}, 1fr)` } as never]}>
        {[0, 1, 2, 3].map(i => <View key={i} style={styles.skeleton} />)}
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.errorBox}>
        <AureakText variant="caption" style={{ color: colors.status.errorText }}>
          {error ?? 'Données indisponibles'}
        </AureakText>
      </View>
    )
  }

  const sessionsTrend = trendLabel(data.sessionsThisMonth, data.sessionsLastMonth)
  const sessionsDir   = trendDirection(data.sessionsThisMonth, data.sessionsLastMonth)
  const attTrend      = trendLabel(data.attendanceRate30d, data.attendanceRate30dPrev)
  const attDir        = trendDirection(data.attendanceRate30d, data.attendanceRate30dPrev)
  const evalPct       = data.evaluationsExpected > 0
    ? Math.round((data.evaluationsDone / data.evaluationsExpected) * 100)
    : 0

  const cards: KpiCard[] = [
    {
      label   : 'Total séances · mois',
      value   : String(data.sessionsThisMonth),
      trend   : { label: sessionsTrend, direction: sessionsDir },
    },
    {
      label   : 'Présence · 30 jours',
      value   : `${data.attendanceRate30d}%`,
      trend   : { label: attTrend, direction: attDir },
    },
    {
      label   : 'Évaluations complétées',
      value   : `${data.evaluationsDone} / ${data.evaluationsExpected}`,
      meta    : `${evalPct}% du mois en cours`,
    },
    {
      label   : 'Joueurs à risque',
      value   : String(data.playersAtRisk),
      meta    : '≥ 3 absences consécutives',
      tone    : data.playersAtRisk > 0 ? 'alert' : 'positive',
    },
  ]

  return (
    <View style={[styles.grid, { gridTemplateColumns: `repeat(${cols}, 1fr)` } as never]}>
      {cards.map((c) => <KpiCardView key={c.label} card={c} />)}
    </View>
  )
}

type KpiCard = {
  label   : string
  value   : string
  trend?  : { label: string; direction: 'up' | 'down' | 'neutral' }
  meta?   : string
  tone?   : 'alert' | 'positive' | 'neutral'
}

function KpiCardView({ card }: { card: KpiCard }) {
  const trendColor =
    card.trend?.direction === 'up'   ? colors.status.successText :
    card.trend?.direction === 'down' ? colors.status.errorText   :
    colors.text.muted

  const valueColor =
    card.tone === 'alert'    ? colors.status.errorText :
    card.tone === 'positive' ? colors.status.successText :
    colors.text.dark

  return (
    <View style={styles.card}>
      <AureakText style={styles.cardLabel as TextStyle}>{card.label}</AureakText>
      <AureakText style={[styles.cardValue, { color: valueColor }] as unknown as TextStyle}>
        {card.value}
      </AureakText>
      {card.trend ? (
        <AureakText style={[styles.cardTrend, { color: trendColor }] as unknown as TextStyle}>
          {card.trend.label}
        </AureakText>
      ) : null}
      {card.meta ? (
        <AureakText style={styles.cardMeta as TextStyle}>{card.meta}</AureakText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingBottom    : space.md,
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.xs,
    boxShadow      : shadows.sm,
    minHeight      : 132,
  },
  cardLabel: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontFamily: fonts.mono,
    fontSize  : 32,
    fontWeight: '700',
    marginTop : space.xs,
  },
  cardTrend: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '500',
  },
  cardMeta: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  skeleton: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    minHeight      : 132,
    opacity        : 0.6,
  },
  errorBox: {
    backgroundColor  : colors.status.errorBg,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    padding          : space.md,
    marginHorizontal : space.lg,
    marginBottom     : space.md,
  },
})
