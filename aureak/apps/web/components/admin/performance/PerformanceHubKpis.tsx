'use client'
// Hub Performance — 4 cartes KPI (taux présence, joueurs actifs, séances totales, clubs liés)
// Source : getStatsRoomKpis (Story 60.1).
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getStatsRoomKpis } from '@aureak/api-client'
import type { StatsRoomKpis } from '@aureak/api-client'

export function PerformanceHubKpis() {
  const { width }             = useWindowDimensions()
  const [data, setData]       = useState<StatsRoomKpis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await getStatsRoomKpis()
        if (!cancelled) setData(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PerformanceHubKpis] error:', err)
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

  const rate     = data?.avgAttendanceRate ?? 0
  const rateTone = rate >= 80 ? 'positive' : rate < 60 ? 'alert' : 'neutral'
  const rateMeta = rate >= 80 ? 'Objectif atteint' : rate < 60 ? "Sous l'objectif" : 'À surveiller'

  const cards: KpiCard[] = [
    { label: 'Taux présence',     value: data ? `${data.avgAttendanceRate}%` : '—', meta: rateMeta, tone: rateTone },
    { label: 'Joueurs actifs',    value: data ? String(data.activePlayers)  : '—', meta: 'Inscrits annuaire actifs' },
    { label: 'Séances totales',   value: data ? String(data.totalSessions)  : '—', meta: 'Séances non annulées' },
    { label: 'Clubs liés',        value: data ? String(data.linkedClubs)    : '—', meta: 'Actifs dans l\'annuaire' },
  ]

  return (
    <View style={[styles.grid, { gridTemplateColumns: `repeat(${cols}, 1fr)` } as never]}>
      {cards.map(c => <KpiCardView key={c.label} card={c} />)}
    </View>
  )
}

type KpiCard = {
  label: string
  value: string
  meta?: string
  tone?: 'alert' | 'positive' | 'neutral'
}

function KpiCardView({ card }: { card: KpiCard }) {
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
})
