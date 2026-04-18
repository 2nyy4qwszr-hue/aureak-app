'use client'
// Story 92-3 — StatCards KPI clubs partenaires (pattern StatCards activités)
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import type { PartnershipClubStats } from '@aureak/api-client'

type Props = {
  stats  : PartnershipClubStats | null
  loading: boolean
}

export function ClubPartnerStatCards({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => <View key={i} style={styles.skeletonCard} />)}
      </View>
    )
  }

  return (
    <View style={styles.row}>
      {/* Card 1 — Clubs partenaires */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>🏟️</AureakText>
        <AureakText style={styles.statLabel}>CLUBS PARTENAIRES</AureakText>
        <AureakText style={styles.statValue}>{stats.totalPartnerClubs}</AureakText>
        <AureakText style={styles.statSub}>clubs actifs</AureakText>
      </View>

      {/* Card 2 — Sponsors club */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>🤝</AureakText>
        <AureakText style={styles.statLabel}>SPONSORS CLUB</AureakText>
        <AureakText style={styles.statValue}>{stats.totalClubSponsors}</AureakText>
        <AureakText style={styles.statSub}>contrats actifs</AureakText>
      </View>

      {/* Card 3 — Revenus */}
      <View style={styles.card as object}>
        <AureakText style={styles.statIcon}>💰</AureakText>
        <AureakText style={styles.statLabel}>REVENUS SPONSORING</AureakText>
        <AureakText style={styles.statValue}>
          {stats.totalClubRevenue.toLocaleString('fr-BE')} EUR
        </AureakText>
        <AureakText style={styles.statSub}>total cumulé</AureakText>
      </View>

      {/* Card 4 — Renouvellements — fond gold */}
      <View style={styles.cardGold as object}>
        <View style={styles.arrowIcon as object}>
          <AureakText style={styles.arrowIconText}>⏰</AureakText>
        </View>
        <AureakText style={styles.cardGoldLabel}>RENOUVELLEMENTS</AureakText>
        <AureakText style={styles.cardGoldValue}>{stats.renewalsUpcoming}</AureakText>
        <AureakText style={styles.cardGoldSub}>dans les 90 jours</AureakText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    marginBottom     : space.lg,
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
  },
  skeletonCard: {
    flex           : 1,
    minWidth       : 160,
    height         : 120,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    opacity        : 0.6,
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
  cardGoldSub: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.accent.goldPale,
    marginTop : 4,
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
    fontSize : 24,
    color    : colors.accent.goldPale,
  },
})
