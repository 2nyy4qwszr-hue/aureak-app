'use client'
// Story 93.3 — StatsHero : orchestrateur 1 card hero + 3 cards standard, responsive
import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { space } from '@aureak/theme'
import { StatsHeroCard, type StatsHeroCardProps } from './StatsHeroCard'
import { StatsStandardCard, type StatsStandardCardProps } from './StatsStandardCard'

export type StatsHeroProps = {
  hero : StatsHeroCardProps
  cards: [StatsStandardCardProps, StatsStandardCardProps, StatsStandardCardProps]
}

const DESKTOP_BREAKPOINT = 1024
const TABLET_BREAKPOINT  = 640

export function StatsHero({ hero, cards }: StatsHeroProps) {
  const { width } = useWindowDimensions()
  const isDesktop = width >= DESKTOP_BREAKPOINT
  const isTablet  = width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT

  return (
    <View style={s.wrapper}>
      {isDesktop && (
        <View style={s.rowDesktop}>
          <StatsHeroCard {...hero} />
          {cards.map((c, i) => (
            <StatsStandardCard key={i} {...c} />
          ))}
        </View>
      )}

      {isTablet && (
        <View style={s.containerTablet}>
          <View style={s.heroFullWidth}>
            <StatsHeroCard {...hero} />
          </View>
          <View style={s.rowDesktop}>
            {cards.map((c, i) => (
              <StatsStandardCard key={i} {...c} />
            ))}
          </View>
        </View>
      )}

      {!isDesktop && !isTablet && (
        <View style={s.column}>
          <StatsHeroCard {...hero} />
          {cards.map((c, i) => (
            <StatsStandardCard key={i} {...c} />
          ))}
        </View>
      )}
    </View>
  )
}

export default StatsHero

const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
  },
  rowDesktop: {
    flexDirection: 'row',
    gap          : space.md,
    flexWrap     : 'wrap',
  },
  containerTablet: {
    gap: space.md,
  },
  heroFullWidth: {
    flexDirection: 'row', // permet au StatsHeroCard (flex:2) de prendre 100% width
  },
  column: {
    flexDirection: 'column',
    gap          : space.md,
  },
})
