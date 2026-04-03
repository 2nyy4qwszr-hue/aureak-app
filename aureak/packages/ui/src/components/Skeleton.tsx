// Skeleton — composants de chargement animés (shimmer)
import React from 'react'
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native'
import { colors, space, radius } from '@aureak/theme'

// ── Base ──────────────────────────────────────────────────────────────────────

function SkeletonBox({ width, height, style }: { width?: DimensionValue; height: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        styles.box,
        { width: width ?? '100%', height },
        style,
      ]}
    />
  )
}

// ── DetailSkeleton — fiche de détail ─────────────────────────────────────────

export function DetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Back button placeholder */}
      <SkeletonBox width={80} height={14} style={{ marginBottom: space.sm }} />

      {/* Title */}
      <SkeletonBox width={200} height={28} style={{ marginBottom: space.xs }} />
      <SkeletonBox width={140} height={14} style={{ marginBottom: space.xl }} />

      {/* Section 1 */}
      <SkeletonBox height={1} style={{ marginBottom: space.md, opacity: 0.5 }} />
      <SkeletonBox width={100} height={10} style={{ marginBottom: space.sm }} />
      <SkeletonBox height={44} style={{ marginBottom: space.sm }} />
      <SkeletonBox height={44} style={{ marginBottom: space.xl }} />

      {/* Section 2 */}
      <SkeletonBox height={1} style={{ marginBottom: space.md, opacity: 0.5 }} />
      <SkeletonBox width={120} height={10} style={{ marginBottom: space.sm }} />
      <SkeletonBox height={44} style={{ marginBottom: space.sm }} />
      <SkeletonBox height={44} />
    </View>
  )
}

// ── ListRowSkeleton — ligne de liste ─────────────────────────────────────────

export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox width={40} height={40} style={{ borderRadius: 20, marginRight: space.sm }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width='60%' height={14} />
            <SkeletonBox width='40%' height={11} />
          </View>
        </View>
      ))}
    </View>
  )
}

// ── CardSkeleton — card grille ────────────────────────────────────────────────

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width={64} height={64} style={{ borderRadius: 32, alignSelf: 'center', marginBottom: space.sm }} />
          <SkeletonBox width='70%' height={14} style={{ alignSelf: 'center', marginBottom: 6 }} />
          <SkeletonBox width='50%' height={11} style={{ alignSelf: 'center' }} />
        </View>
      ))}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
  },
  container: {
    padding: space.xl,
  },
  listContainer: {
    gap: space.xs,
  },
  row: {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  card: {
    width          : 160,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
})
