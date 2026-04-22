'use client'
// Story 91.2 — Galerie admin/marketeur : filtres statut + grille MediaCard + actions validation
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { listMediaItems, approveMediaItem, rejectMediaItem } from '@aureak/api-client'
import type { MediaItem, MediaItemStatus } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { MediaCard } from './MediaCard'
import { RejectModal } from './RejectModal'

type FilterKey = 'all' | MediaItemStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'pending' , label: 'En attente' },
  { key: 'approved', label: 'Validés'    },
  { key: 'rejected', label: 'Rejetés'    },
  { key: 'all'     , label: 'Tous'       },
]

export function MediaGrid() {
  const { width } = useWindowDimensions()
  const columns = width < 600 ? 2 : width < 1024 ? 3 : 4
  const [filter, setFilter] = useState<FilterKey>('pending')
  const [items, setItems]   = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<MediaItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMediaItems(filter === 'all' ? {} : { status: filter })
      setItems(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MediaGrid] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    let cancelled = false
    void load().finally(() => {
      if (cancelled && process.env.NODE_ENV !== 'production') {
        console.debug('[MediaGrid] load cancelled')
      }
    })
    return () => { cancelled = true }
  }, [load])

  async function handleApprove(item: MediaItem) {
    try {
      await approveMediaItem(item.id)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MediaGrid] approve error:', err)
    }
  }

  async function handleRejectSubmit(reason: string) {
    if (!rejectTarget) return
    await rejectMediaItem(rejectTarget.id, reason)
    await load()
  }

  return (
    <View style={s.wrapper}>
      <View style={s.filters}>
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <Pressable
              key={f.key}
              style={[s.pill, active && s.pillActive] as never}
              onPress={() => setFilter(f.key)}
            >
              <AureakText style={[s.pillLabel, active && s.pillLabelActive] as never}>
                {f.label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {loading && items.length === 0 ? (
        <View style={s.stateBox}>
          <AureakText style={s.stateText as never}>Chargement…</AureakText>
        </View>
      ) : items.length === 0 ? (
        <View style={s.stateBox}>
          <AureakText style={s.stateText as never}>Aucun média pour ce filtre.</AureakText>
        </View>
      ) : (
        <View style={s.grid}>
          {items.map(item => (
            <View key={item.id} style={[s.cell, { flexBasis: `${100 / columns}%` }] as never}>
              <MediaCard
                item={item}
                showActions
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            </View>
          ))}
        </View>
      )}

      <RejectModal
        visible={rejectTarget !== null}
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: { gap: space.md },
  filters: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : 999,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  pillActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  pillLabel     : { color: colors.text.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillLabelActive: { color: colors.light.surface },
  grid     : { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -(space.xs) } as never,
  cell     : { padding: space.xs },
  stateBox : {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  stateText: { color: colors.text.muted },
})
