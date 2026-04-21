'use client'
// Story 93.3 — StatsHeroCard : card "hero" avec sparkline SVG sous la valeur
// Utilisée pour la métrique dominante (ex: "Présence moyenne · 30j").
import React from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
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

function trendColor(direction: StatsHeroCardTrend['direction']): string {
  if (direction === 'up')   return colors.status.present
  if (direction === 'down') return colors.status.absent
  return colors.text.muted
}

function trendIcon(direction: StatsHeroCardTrend['direction']): string {
  if (direction === 'up')   return '↗'
  if (direction === 'down') return '↘'
  return '↔'
}

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

      {/* Trend */}
      {trend && (
        <View style={s.trendRow}>
          <AureakText style={{ ...s.trendText, color: trendColor(trend.direction) } as TextStyle}>
            {trendIcon(trend.direction)} {trend.label}
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
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.card,
    padding        : space.lg,
    minWidth       : 240,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow supporté sur web
    boxShadow      : shadows.sm,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : space.sm,
  },
  label: {
    fontSize      : 11,
    fontWeight    : '600',
    letterSpacing : 1,
    textTransform : 'uppercase',
    color         : colors.text.muted,
    fontFamily    : fonts.body,
  },
  iconWrap: {
    width         : 28,
    height        : 28,
    borderRadius  : 8,
    backgroundColor: colors.border.goldBg, // rgba(193,172,92,0.10)
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
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: -0.5,
    lineHeight   : 52,
  },
  unit: {
    fontSize  : 18,
    fontWeight: '500',
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  trendRow: {
    marginTop: space.xs,
  },
  trendText: {
    fontSize  : 13,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  sparklineWrap: {
    marginTop: space.md,
    height   : SPARKLINE_HEIGHT,
  },
})
