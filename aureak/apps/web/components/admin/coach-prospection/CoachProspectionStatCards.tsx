'use client'
// Story 90.1 — 4 StatCards pipeline prospection entraîneurs
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

export type CoachProspectionStats = {
  total          : number
  inFormation    : number
  activeQuarter  : number
  lost           : number
}

type Props = {
  stats  : CoachProspectionStats
  loading: boolean
}

function Card({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={s.card}>
      <AureakText style={s.label as never}>{label}</AureakText>
      <AureakText style={[s.value, color ? { color } : null] as never}>{value}</AureakText>
    </View>
  )
}

export function CoachProspectionStatCards({ stats, loading }: Props) {
  const display = (n: number) => (loading ? '—' : n.toLocaleString('fr-FR'))
  return (
    <View style={s.row}>
      <Card label="TOTAL PROSPECTS"      value={display(stats.total)} />
      <Card label="EN FORMATION"         value={display(stats.inFormation)}   color={colors.accent.gold} />
      <Card label="ACTIFS CE TRIMESTRE"  value={display(stats.activeQuarter)} color={colors.status.present} />
      <Card label="PERDUS"               value={display(stats.lost)}          color={colors.status.absent} />
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap          : space.md,
    flexWrap     : 'wrap',
  },
  card: {
    flex           : 1,
    minWidth       : 180,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.card,
    padding        : space.lg,
    gap            : 6,
    // @ts-ignore RN Web
    boxShadow      : shadows.sm,
  },
  label: {
    color        : colors.text.muted,
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontSize  : 28,
    fontFamily: fonts.display,
    fontWeight: '900',
    color     : colors.text.dark,
  },
})
