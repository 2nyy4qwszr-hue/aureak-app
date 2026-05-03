import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius, shadows } from '@aureak/theme'

interface SkeletonCardProps {
  height?: number
}

const PULSE_STYLE: React.CSSProperties = {
  animation: 'skeletonPulse 1.5s ease-in-out infinite',
}

export function SkeletonCard({ height = 180 }: SkeletonCardProps) {
  return (
    <View style={[styles.card, { height }]}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
      {/* Avatar / image placeholder */}
      <View style={styles.topRow}>
        <div
          style={{
            width          : 48,
            height         : 48,
            borderRadius   : '50%',
            backgroundColor: colors.light.muted,
            flexShrink     : 0,
            ...PULSE_STYLE,
          }}
        />
        <View style={styles.textBlock}>
          <div style={{ height: 16, backgroundColor: colors.light.muted, borderRadius: radius.xs, width: '70%', marginBottom: 8, ...PULSE_STYLE }} />
          <div style={{ height: 12, backgroundColor: colors.light.muted, borderRadius: radius.xs, width: '50%', ...PULSE_STYLE }} />
        </View>
      </View>

      {/* Content lines */}
      <View style={styles.lines}>
        <div style={{ height: 12, backgroundColor: colors.light.muted, borderRadius: radius.xs, width: '90%', marginBottom: 8, ...PULSE_STYLE }} />
        <div style={{ height: 12, backgroundColor: colors.light.muted, borderRadius: radius.xs, width: '75%', marginBottom: 8, ...PULSE_STYLE }} />
        <div style={{ height: 12, backgroundColor: colors.light.muted, borderRadius: radius.xs, width: '60%', ...PULSE_STYLE }} />
      </View>
    </View>
  )
}

export function SkeletonCardGrid({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div
      style={{
        display            : 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap                : 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : 16,
    elevation      : 1,
    overflow       : 'hidden',
    // Story 110.10 — boxShadow web
    // @ts-ignore web-only
    boxShadow      : '0 1px 2px rgba(0,0,0,0.06)',
  },
  topRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : 12,
    marginBottom  : 16,
  },
  textBlock: {
    flex: 1,
  },
  lines: {
    gap: 0,
  },
})

export default SkeletonCard
