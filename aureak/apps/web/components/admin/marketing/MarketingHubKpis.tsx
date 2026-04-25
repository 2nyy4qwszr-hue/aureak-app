'use client'
// Vue d'ensemble Marketing : 4 cartes KPI globales (médias en attente / publiés / campagnes / engagement).
// Design aligné sur ActivitesHubKpis (mêmes tokens, même grille responsive).
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listMediaItems } from '@aureak/api-client'

type KpiData = {
  pendingMedia     : number
  approvedThisMonth: number
  approvedPrevMonth: number
}

function trendLabel(curr: number, prev: number): string {
  if (prev === 0 && curr === 0) return 'Pas de comparaison'
  if (prev === 0)               return 'Pas de référence'
  const delta = curr - prev
  if (delta === 0) return 'Stable vs mois préc.'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta} vs mois préc.`
}

function trendDirection(curr: number, prev: number): 'up' | 'down' | 'neutral' {
  if (prev === 0) return 'neutral'
  if (curr > prev) return 'up'
  if (curr < prev) return 'down'
  return 'neutral'
}

export function MarketingHubKpis() {
  const { width }             = useWindowDimensions()
  const [data, setData]       = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const [pending, approved] = await Promise.all([
          listMediaItems({ status: 'pending'  }),
          listMediaItems({ status: 'approved' }),
        ])
        if (cancelled) return

        const now            = new Date()
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(),     1)
        const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endPrevMonth   = startThisMonth

        const approvedThisMonth = approved.filter(m => {
          const a = m.approvedAt ? new Date(m.approvedAt) : null
          return a !== null && a >= startThisMonth
        }).length

        const approvedPrevMonth = approved.filter(m => {
          const a = m.approvedAt ? new Date(m.approvedAt) : null
          return a !== null && a >= startPrevMonth && a < endPrevMonth
        }).length

        setData({
          pendingMedia : pending.length,
          approvedThisMonth,
          approvedPrevMonth,
        })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MarketingHubKpis] error:', err)
        if (!cancelled) setError('Impossible de charger les KPIs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

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

  const approvedTrend = trendLabel(data.approvedThisMonth, data.approvedPrevMonth)
  const approvedDir   = trendDirection(data.approvedThisMonth, data.approvedPrevMonth)

  const cards: KpiCard[] = [
    {
      label: 'Médias en attente',
      value: String(data.pendingMedia),
      meta : data.pendingMedia > 0 ? 'À valider' : 'Tout est à jour',
      tone : data.pendingMedia > 0 ? 'alert' : 'positive',
    },
    {
      label: 'Médias publiés · mois',
      value: String(data.approvedThisMonth),
      trend: { label: approvedTrend, direction: approvedDir },
    },
    {
      label: 'Campagnes actives',
      value: '0',
      meta : 'Aucune campagne en cours',
    },
    {
      label: 'Engagement · 30j',
      value: '—',
      meta : 'Bientôt disponible',
    },
  ]

  return (
    <View style={[styles.grid, { gridTemplateColumns: `repeat(${cols}, 1fr)` } as never]}>
      {cards.map(c => <KpiCardView key={c.label} card={c} />)}
    </View>
  )
}

type KpiCard = {
  label : string
  value : string
  trend?: { label: string; direction: 'up' | 'down' | 'neutral' }
  meta? : string
  tone? : 'alert' | 'positive' | 'neutral'
}

function KpiCardView({ card }: { card: KpiCard }) {
  const trendColor =
    card.trend?.direction === 'up'   ? colors.status.successText :
    card.trend?.direction === 'down' ? colors.status.errorText   :
    colors.text.muted

  const valueColor =
    card.tone === 'alert'    ? colors.status.errorText   :
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
    backgroundColor : colors.status.errorBg,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.status.errorBorder,
    padding         : space.md,
    marginHorizontal: space.lg,
    marginBottom    : space.md,
  },
})
