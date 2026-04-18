'use client'
// Story 91-2 — Grille de médias avec filtres par statut
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { MediaItem } from '@aureak/types'
import { MediaCard } from './MediaCard'

type Props = {
  items      : MediaItem[]
  loading    : boolean
  onActionDone: () => void
}

export function MediaGrid({ items, loading, onActionDone }: Props) {
  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <AureakText style={styles.emptyText}>Chargement...</AureakText>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <AureakText style={styles.emptyText}>Aucun média trouvé</AureakText>
      </View>
    )
  }

  return (
    <View style={styles.grid}>
      {items.map(item => (
        <View key={item.id} style={styles.gridItem}>
          <MediaCard item={item} onActionDone={onActionDone} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  gridItem: {
    minWidth : 220,
    maxWidth : 280,
    flex     : 1,
  },
  emptyWrap: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    color   : colors.text.muted,
    fontSize: 14,
  },
})
