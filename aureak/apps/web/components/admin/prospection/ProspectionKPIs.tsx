// Epic 85 — Story 85.3 — Compteurs KPI prospection
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'

export type ProspectionStats = {
  total        : number
  contacted    : number
  enCours      : number
  neverContacted: number
  partenaires  : number
  blocked?     : number
}

interface ProspectionKPIsProps {
  stats: ProspectionStats
}

interface KpiCardProps {
  label: string
  value: number
  color?: string
}

function KpiCard({ label, value, color }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <AureakText variant="h1" style={{ ...styles.kpiValue, ...(color ? { color } : {}) }}>
        {value}
      </AureakText>
      <AureakText variant="caption" style={styles.kpiLabel}>{label}</AureakText>
    </View>
  )
}

export function ProspectionKPIs({ stats }: ProspectionKPIsProps) {
  return (
    <View style={styles.row}>
      <KpiCard label="Total clubs"      value={stats.total} />
      <KpiCard label="Contactés"        value={stats.contacted}      color={colors.accent.gold} />
      <KpiCard label="En cours"         value={stats.enCours}        color={colors.status.amberText} />
      <KpiCard label="Jamais contactés" value={stats.neverContacted} color={colors.text.muted} />
      {stats.blocked !== undefined && stats.blocked > 0 && (
        <KpiCard label="Bloqués (>14j)" value={stats.blocked} color={colors.status.redText} />
      )}
      <KpiCard label="Partenaires"      value={stats.partenaires}    color={colors.accent.gold} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    marginBottom : space.xl,
  },
  kpiCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    minWidth       : 130,
    alignItems     : 'center',
    // @ts-ignore — web only boxShadow
    boxShadow      : shadows.sm,
  },
  kpiValue: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  kpiLabel: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
