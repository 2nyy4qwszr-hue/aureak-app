'use client'
// Hub Partenariat — 4 cartes KPI (sponsors actifs, parrainages, clubs partenaires, montant annuel)
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listSponsors, listPartnerships } from '@aureak/api-client'
import type { SponsorWithCounts } from '@aureak/types'

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(cents / 100)
}

export function PartenariatHubKpis() {
  const { width }                       = useWindowDimensions()
  const [sponsors, setSponsors]         = useState<SponsorWithCounts[]>([])
  const [partnersCount, setPartnersCnt] = useState<number>(0)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [sp, pa] = await Promise.all([listSponsors(), listPartnerships()])
        if (!cancelled) {
          setSponsors(sp.data ?? [])
          setPartnersCnt((pa.data ?? []).length)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PartenariatHubKpis] error:', err)
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

  const activeSponsors = sponsors.filter(s => s.isActive)
  const activeLinks    = activeSponsors.reduce((sum, s) => sum + s.activeChildrenCount, 0)
  const annualCents    = activeSponsors.reduce((sum, s) => sum + (s.annualAmountCents ?? 0), 0)

  const cards: KpiCard[] = [
    { label: 'Sponsors actifs',      value: String(activeSponsors.length), meta: `${sponsors.length} au total` },
    { label: 'Parrainages actifs',   value: String(activeLinks),           meta: 'Enfants parrainés' },
    { label: 'Clubs partenaires',    value: String(partnersCount),         meta: 'Conventions actives' },
    { label: 'Montant annuel',       value: formatEuros(annualCents),      meta: 'Cumul sponsors actifs' },
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
}

function KpiCardView({ card }: { card: KpiCard }) {
  return (
    <View style={styles.card}>
      <AureakText style={styles.cardLabel as TextStyle}>{card.label}</AureakText>
      <AureakText style={styles.cardValue as TextStyle}>{card.value}</AureakText>
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
    color     : colors.text.dark,
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
