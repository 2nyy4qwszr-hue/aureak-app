'use client'
// Story 91-2 — Médiathèque : upload coachs + galerie admin validation
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import { listMediaItems } from '@aureak/api-client'
import type { MediaItem, MediaItemStatus } from '@aureak/types'
import { MEDIA_ITEM_STATUS_LABELS } from '@aureak/types'
import { UploadForm } from './components/UploadForm'
import { MediaGrid } from './components/MediaGrid'

const STATUS_FILTERS: (MediaItemStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected']

export default function MediathequePage() {
  const router = useRouter()
  const [items, setItems]           = useState<MediaItem[]>([])
  const [loading, setLoading]       = useState(false)
  const [statusFilter, setStatusFilter] = useState<MediaItemStatus | 'all'>('all')
  const [showUpload, setShowUpload] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const opts = statusFilter !== 'all' ? { status: statusFilter } : undefined
      const data = await listMediaItems(opts)
      setItems(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MediathequePage] list error:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        onPress={() => router.back()}
      >
        <AureakText style={styles.backText}>← Marketing</AureakText>
      </Pressable>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AureakText variant="h1" style={styles.title}>Médiathèque</AureakText>
          <AureakText variant="body" style={styles.sub}>
            Photos et vidéos soumises par les coachs — validation admin
          </AureakText>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={() => setShowUpload(!showUpload)}
        >
          <AureakText style={styles.addBtnText}>
            {showUpload ? 'Fermer' : '+ Ajouter un média'}
          </AureakText>
        </Pressable>
      </View>

      {/* Upload form (toggled) */}
      {showUpload && (
        <View style={styles.uploadSection}>
          <UploadForm onUploaded={() => { setShowUpload(false); fetchItems() }} />
        </View>
      )}

      {/* Status filters */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(s => {
          const active = statusFilter === s
          return (
            <Pressable
              key={s}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <AureakText style={[styles.filterChipText, active && styles.filterChipTextActive] as never}>
                {s === 'all' ? 'Tous' : MEDIA_ITEM_STATUS_LABELS[s]}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {/* Grid */}
      <MediaGrid items={items} loading={loading} onActionDone={fetchItems} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  headerRow: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    marginBottom  : space.lg,
    gap           : space.md,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  addBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.button,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
  },
  addBtnText: {
    color     : colors.text.primary,
    fontWeight: '700',
    fontSize  : 13,
    fontFamily: fonts.display,
  },
  uploadSection: {
    marginBottom: space.lg,
    maxWidth    : 480,
  },
  filterRow: {
    flexDirection: 'row',
    gap          : space.xs,
    marginBottom : space.lg,
  },
  filterChip: {
    paddingVertical  : 6,
    paddingHorizontal: 14,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  filterChipText: {
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  filterChipTextActive: {
    color: colors.text.primary,
  },
  backBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    alignSelf        : 'flex-start',
    marginBottom     : space.md,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.hover,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pressed: {
    opacity: 0.6,
  },
  backText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontWeight: '600',
  } as never,
})
