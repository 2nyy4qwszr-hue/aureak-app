'use client'
// Story 93.3 — StatsStandardCard : card secondaire (3 variants : bars | progress | none)
import React from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

export type StatsStandardCardTrend = {
  direction: 'up' | 'down' | 'neutral'
  label    : string
}

export type StatsStandardCardFooter =
  | { type: 'bars'    ; bars: number[]; dayLabels?: string[] }
  | { type: 'progress'; progress: number /* 0-100 */         }
  | { type: 'none'                                            }

export type StatsStandardCardProps = {
  label    : string
  value    : number | string
  unit?    : string
  meta?    : string
  trend?   : StatsStandardCardTrend
  footer?  : StatsStandardCardFooter
  icon?    : React.ReactNode
  iconTone?: 'gold' | 'red' | 'neutral'
}

function trendColor(direction: StatsStandardCardTrend['direction']): string {
  // Story 93.6 — trend down rouge template (colors.accent.red), up vert succès, neutral muted
  if (direction === 'up')   return colors.status.success
  if (direction === 'down') return colors.accent.red
  return colors.text.muted
}

function trendIcon(direction: StatsStandardCardTrend['direction']): string {
  if (direction === 'up')   return '↗'
  if (direction === 'down') return '↘'
  return '↔'
}

function iconBackgroundColor(tone: StatsStandardCardProps['iconTone']): string {
  if (tone === 'red')     return colors.status.errorBg
  if (tone === 'neutral') return colors.light.hover
  return colors.border.goldBg
}

function iconForegroundColor(tone: StatsStandardCardProps['iconTone']): string {
  if (tone === 'red')     return colors.status.absent
  if (tone === 'neutral') return colors.text.muted
  return colors.accent.gold
}

export function StatsStandardCard({
  label,
  value,
  unit,
  meta,
  trend,
  footer,
  icon,
  iconTone = 'gold',
}: StatsStandardCardProps) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <AureakText style={s.label as TextStyle}>{label}</AureakText>
        {icon && (
          <View style={{
            ...s.iconWrap,
            backgroundColor: iconBackgroundColor(iconTone),
          }}>
            <View style={{ opacity: 1, ...({ color: iconForegroundColor(iconTone) } as object) }}>
              {icon}
            </View>
          </View>
        )}
      </View>

      <View style={s.valueRow}>
        <AureakText style={s.value as TextStyle}>{value}</AureakText>
        {unit && <AureakText style={s.unit as TextStyle}>{unit}</AureakText>}
      </View>

      {trend && (
        <AureakText style={{ ...s.trendText, color: trendColor(trend.direction) } as TextStyle}>
          {trendIcon(trend.direction)} {trend.label}
        </AureakText>
      )}

      {meta && <AureakText style={s.meta as TextStyle}>{meta}</AureakText>}

      {footer?.type === 'bars' && <BarsFooter bars={footer.bars} dayLabels={footer.dayLabels} />}
      {footer?.type === 'progress' && <ProgressFooter progress={footer.progress} />}
    </View>
  )
}

function BarsFooter({ bars, dayLabels }: { bars: number[]; dayLabels?: string[] }) {
  const max = Math.max(...bars, 0.01)
  return (
    <View style={s.footerBlock}>
      <View style={s.barsRow}>
        {bars.map((v, i) => {
          const ratio  = v / max
          const height = Math.max(6, ratio * 32)
          const active = ratio > 0.5
          return (
            <View
              key={i}
              style={{
                ...s.bar,
                height,
                backgroundColor: active ? colors.accent.gold : colors.border.gold,
              }}
            />
          )
        })}
      </View>
      {dayLabels && (
        <AureakText style={s.dayLabels as TextStyle}>
          {dayLabels.join(' ')}
        </AureakText>
      )}
    </View>
  )
}

function ProgressFooter({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <View style={s.footerBlock}>
      <View
        style={s.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
      >
        <View style={{ ...s.progressFill, width: `${clamped}%` }} />
      </View>
    </View>
  )
}

export default StatsStandardCard

const s = StyleSheet.create({
  card: {
    flex           : 1,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.card,
    padding        : space.md,
    minWidth       : 160,
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
    // Story 93.6 — typo alignée template (700/10px/2.2 letterSpacing)
    fontSize      : 10,
    fontWeight    : '700',
    letterSpacing : 2.2,
    textTransform : 'uppercase',
    color         : colors.text.muted,
    fontFamily    : fonts.body,
  },
  iconWrap: {
    width         : 24,
    height        : 24,
    borderRadius  : 6,
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
    // Story 93.6 — value Montserrat 900 + letterSpacing -1.8
    fontSize     : 28,
    fontWeight   : '900',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: -1.8,
    lineHeight   : 34,
  },
  unit: {
    // Story 93.6 — unit 700/24px aligné template
    fontSize  : 24,
    fontWeight: '700',
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  trendText: {
    // Story 93.6 — trend 600/11px aligné template
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop : 2,
  },
  meta: {
    fontSize  : 11,
    color     : colors.text.muted,
    fontFamily: fonts.body,
    marginTop : 2,
  },
  footerBlock: {
    marginTop: space.sm,
  },
  barsRow: {
    flexDirection: 'row',
    gap          : 4,
    alignItems   : 'flex-end',
    height       : 32,
  },
  bar: {
    flex        : 1,
    borderRadius: 2,
  },
  dayLabels: {
    marginTop    : 4,
    fontSize     : 10,
    color        : colors.text.muted,
    fontFamily   : fonts.mono,
    letterSpacing: 1.5,
  },
  progressTrack: {
    height        : 4,
    backgroundColor: colors.light.hover,
    borderRadius  : 2,
    overflow      : 'hidden',
  },
  progressFill: {
    height        : 4,
    backgroundColor: colors.accent.gold,
    borderRadius  : 2,
  },
})
