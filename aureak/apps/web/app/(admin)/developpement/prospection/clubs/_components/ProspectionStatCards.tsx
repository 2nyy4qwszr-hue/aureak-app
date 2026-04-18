'use client'
// Story 88.2 — StatCards pipeline CRM prospects
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import type { ClubProspectListItem } from '@aureak/types'

type Props = {
  prospects: ClubProspectListItem[]
}

export function ProspectionStatCards({ prospects }: Props) {
  const total    = prospects.length
  const closing  = prospects.filter(p => p.status === 'closing').length
  const now      = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const convertisThisMon = prospects.filter(p => {
    if (p.status !== 'converti') return false
    const updated = p.updatedAt?.slice(0, 7)
    return updated === thisMonth
  }).length

  // contacts count total for all prospects
  const totalContacts = prospects.reduce((acc, p) => acc + p.contactsCount, 0)

  return (
    <View style={styles.row}>
      {/* Card 1 — TOTAL PROSPECTS */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>🏢</AureakText>
        <AureakText style={styles.statLabel}>TOTAL PROSPECTS</AureakText>
        <AureakText style={styles.statValue}>{total}</AureakText>
        <AureakText style={styles.statSub}>
          dans le pipeline
        </AureakText>
      </View>

      {/* Card 2 — EN CLOSING */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>🎯</AureakText>
        <AureakText style={styles.statLabel}>EN CLOSING</AureakText>
        <AureakText style={styles.statValue}>{closing}</AureakText>
        <AureakText style={styles.statSub}>
          en phase finale
        </AureakText>
      </View>

      {/* Card 3 — CONVERTIS CE MOIS */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>✅</AureakText>
        <AureakText style={styles.statLabel}>CONVERTIS CE MOIS</AureakText>
        <AureakText style={styles.statValue}>{convertisThisMon}</AureakText>
        <AureakText style={convertisThisMon > 0 ? styles.statSubGreen : styles.statSub}>
          {convertisThisMon > 0 ? 'Bravo !' : 'Aucun pour le moment'}
        </AureakText>
      </View>

      {/* Card 4 — CONTACTS */}
      <View style={styles.cardGold as object}>
        <View style={styles.arrowIcon as object}>
          <AureakText style={styles.arrowIconText}>↑</AureakText>
        </View>
        <AureakText style={styles.cardGoldLabel}>CONTACTS TOTAL</AureakText>
        <AureakText style={styles.cardGoldValue}>{totalContacts}</AureakText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingBottom    : space.md,
    flexWrap         : 'wrap',
  },
  card: {
    flex            : 1,
    minWidth        : 160,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    padding         : space.md,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    boxShadow       : shadows.sm,
    position        : 'relative',
  },
  statIcon: {
    fontSize    : 22,
    marginBottom: 4,
  },
  statLabel: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color        : colors.text.muted,
    marginBottom : space.sm,
  },
  statValue: {
    fontSize    : 28,
    fontWeight  : '900',
    fontFamily  : fonts.display,
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  statSub: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.accent.gold,
    marginTop : 6,
  },
  statSubGreen: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.status.success,
    marginTop : 6,
  },
  cardGold: {
    flex           : 1,
    minWidth       : 160,
    backgroundColor: colors.accent.goldDark,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 0,
    position       : 'relative',
  },
  cardGoldLabel: {
    fontSize     : 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color        : colors.accent.goldPale,
    fontFamily   : fonts.display,
    fontWeight   : '500',
    marginBottom : 8,
    marginTop    : 8,
  },
  cardGoldValue: {
    fontSize  : 20,
    fontWeight: '700',
    color     : colors.text.primary,
    fontFamily: fonts.display,
    lineHeight: 28,
  },
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
})
