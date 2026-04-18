'use client'
// Story 92-3 — Liste résumée des clubs partenaires (lecture seule)
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import type { PartnerClubSummaryItem } from '@aureak/api-client'

type Props = {
  clubs  : PartnerClubSummaryItem[]
  loading: boolean
}

export function ClubPartnerList({ clubs, loading }: Props) {
  if (loading) {
    return <AureakText style={styles.emptyText}>Chargement...</AureakText>
  }

  if (clubs.length === 0) {
    return <AureakText style={styles.emptyText}>Aucun club partenaire trouvé</AureakText>
  }

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AureakText style={[styles.headerCell, { flex: 3 }] as never}>Club</AureakText>
        <AureakText style={[styles.headerCell, { flex: 1 }] as never}>Joueurs</AureakText>
        <AureakText style={[styles.headerCell, { flex: 2 }] as never}>Montant</AureakText>
        <AureakText style={[styles.headerCell, { flex: 2 }] as never}>Fin contrat</AureakText>
      </View>

      {/* Rows */}
      {clubs.map((c, i) => (
        <View key={c.clubId} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <AureakText style={[styles.cell, styles.cellName, { flex: 3 }] as never} numberOfLines={1}>
            {c.clubName}
          </AureakText>
          <AureakText style={[styles.cell, { flex: 1 }] as never}>
            {c.linkedPlayers}
          </AureakText>
          <AureakText style={[styles.cell, { flex: 2 }] as never}>
            {c.sponsorAmount != null ? `${c.sponsorAmount.toLocaleString('fr-BE')} EUR` : '—'}
          </AureakText>
          <AureakText style={[styles.cell, { flex: 2 }] as never}>
            {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-BE') : '—'}
          </AureakText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  headerRow: {
    flexDirection  : 'row',
    backgroundColor: colors.light.muted,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  headerCell: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color        : colors.text.muted,
  },
  row: {
    flexDirection    : 'row',
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    alignItems       : 'center',
  },
  rowAlt: {
    backgroundColor: colors.light.primary,
  },
  cell: {
    fontSize  : 13,
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  cellName: {
    fontWeight: '600',
    fontFamily: fonts.display,
  },
  emptyText: {
    color    : colors.text.muted,
    fontSize : 14,
    padding  : space.xl,
    textAlign: 'center',
  },
})
