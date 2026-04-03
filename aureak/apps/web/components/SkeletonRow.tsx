import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius } from '@aureak/theme'

interface SkeletonRowProps {
  columns?: number
  height?  : number
}

const PULSE_STYLE: React.CSSProperties = {
  animation: 'skeletonPulse 1.5s ease-in-out infinite',
}

export function SkeletonRow({ columns = 4, height = 44 }: SkeletonRowProps) {
  const widths = [40, 25, 20, 15, 10]
  return (
    <View style={[styles.row, { height }]}>
      {Array.from({ length: columns }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.cell,
            { flex: widths[i % widths.length] ?? 20 },
          ]}
        >
          <div
            style={{
              height          : 14,
              backgroundColor : colors.light.muted,
              borderRadius    : radius.xs,
              width           : `${60 + (i * 13) % 30}%`,
              ...PULSE_STYLE,
            }}
          />
        </View>
      ))}
    </View>
  )
}

export function SkeletonTable({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <View style={styles.table}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} height={i === 0 ? 36 : 44} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row : {
    flexDirection    : 'row',
    alignItems       : 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: 16,
  },
  cell: {
    paddingHorizontal: 8,
  },
  table: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    overflow       : 'hidden',
  },
})

export default SkeletonRow
