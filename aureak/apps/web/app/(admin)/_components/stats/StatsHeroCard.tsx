'use client'
// Story 93.3 — StatsHeroCard : card "hero" avec sparkline SVG sous la valeur
// Story 93.6 — variant dark premium : gradient noir + glow doré radial + typo Montserrat 900
import React from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { buildSparklinePath } from './sparkline'

export type StatsHeroCardTrend = {
  direction: 'up' | 'down' | 'neutral'
  label    : string
}

export type StatsHeroCardProps = {
  label      : string
  value      : number | string
  unit?      : string
  trend?     : StatsHeroCardTrend
  sparkline? : number[]
  icon?      : React.ReactNode
  /** Label accessible décrivant la courbe (ex: "Évolution présence 30 jours"). */
  sparklineAriaLabel?: string
}

const SPARKLINE_WIDTH  = 280
const SPARKLINE_HEIGHT = 50

export function StatsHeroCard({
  label,
  value,
  unit,
  trend,
  sparkline,
  icon,
  sparklineAriaLabel,
}: StatsHeroCardProps) {
  const hasSparkline = sparkline && sparkline.length >= 2
  const { linePath, areaPath } = hasSparkline
    ? buildSparklinePath(sparkline!, SPARKLINE_WIDTH, SPARKLINE_HEIGHT)
    : { linePath: '', areaPath: '' }

  return (
    <View style={s.card}>
      {/* Story 93.6 — Overlay radial doré (web-only, fallback no-op natif) */}
      <View pointerEvents="none" style={s.glowOverlay} />

      {/* Header row : label + icon */}
      <View style={s.header}>
        <AureakText style={s.label as TextStyle}>{label}</AureakText>
        {icon && <View style={s.iconWrap}>{icon}</View>}
      </View>

      {/* Value */}
      <View style={s.valueRow}>
        <AureakText style={s.value as TextStyle}>{value}</AureakText>
        {unit && <AureakText style={s.unit as TextStyle}>{unit}</AureakText>}
      </View>

      {/* Trend — Story 93.6 : toujours doré sur variant hero (ignore direction) */}
      {trend && (
        <View style={s.trendRow}>
          <AureakText style={s.trendText as TextStyle}>
            {trend.label}
          </AureakText>
        </View>
      )}

      {/* Sparkline */}
      {hasSparkline && (
        <View style={s.sparklineWrap} accessibilityLabel={sparklineAriaLabel ?? 'Évolution de la métrique'}>
          <Svg
            viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
            width="100%"
            height={SPARKLINE_HEIGHT}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%"   stopColor={colors.accent.gold} stopOpacity="0.32" />
                <Stop offset="100%" stopColor={colors.accent.gold} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#sparkGradient)" />
            <Path d={linePath} stroke={colors.accent.gold} strokeWidth={2} fill="none" />
          </Svg>
        </View>
      )}
    </View>
  )
}

export default StatsHeroCard

const s = StyleSheet.create({
  card: {
    flex           : 2,
    // Story 93.6 — variant dark : fallback solide natif + gradient web via background
    backgroundColor: colors.ink.premiumDark,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — background CSS web-only (gradient non typé RN)
    background     : `linear-gradient(135deg, ${colors.ink.premiumDark} 0%, ${colors.ink.premiumWarm} 100%)`,
    borderWidth    : 1,
    borderColor    : 'transparent',
    borderRadius   : radius.card,
    padding        : space.lg,
    minWidth       : 240,
    overflow       : 'hidden',
    position       : 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top     : 0,
    left    : 0,
    right   : 0,
    bottom  : 0,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — radial-gradient CSS web-only
    background: 'radial-gradient(600px 200px at 100% 0%, rgba(193,172,92,0.22), transparent 60%)',
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : space.sm,
  },
  label: {
    fontSize      : 10,
    fontWeight    : '700',
    letterSpacing : 2,
    textTransform : 'uppercase',
    color         : colors.text.onDarkMuted,
    fontFamily    : fonts.body,
  },
  iconWrap: {
    width         : 28,
    height        : 28,
    borderRadius  : 8,
    backgroundColor: colors.border.goldBg,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems   : 'baseline',
    gap          : space.xs,
    marginBottom : space.xs,
  },
  value: {
    fontSize     : 44,
    fontWeight   : '900',
    fontFamily   : fonts.display,
    color        : colors.text.primary,
    letterSpacing: -1.8,
    lineHeight   : 52,
  },
  unit: {
    fontSize  : 24,
    fontWeight: '700',
    color     : colors.text.onDarkMuted,
    fontFamily: fonts.body,
  },
  trendRow: {
    marginTop: space.xs,
  },
  trendText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.accent.gold,
  },
  sparklineWrap: {
    marginTop: space.md,
    height   : SPARKLINE_HEIGHT,
  },
})
