'use client'
// Story 91.2 — Card média : thumbnail + titre + badge statut + actions admin (approuver/rejeter)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { getMediaItemUrl } from '@aureak/api-client'
import type { MediaItem } from '@aureak/types'
import { MEDIA_ITEM_STATUS_LABELS } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  item       : MediaItem
  showActions: boolean
  onApprove? : (item: MediaItem) => void
  onReject?  : (item: MediaItem) => void
}

const STATUS_STYLES = {
  pending : { bg: colors.status.warningBg, text: colors.status.warningText },
  approved: { bg: colors.status.successBg, text: colors.status.successText },
  rejected: { bg: colors.status.errorBg,   text: colors.status.errorText   },
} as const

export function MediaCard({ item, showActions, onApprove, onReject }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMediaItemUrl(item.filePath)
      .then(u => { if (!cancelled) setUrl(u) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[MediaCard] url error:', err)
      })
    return () => { cancelled = true }
  }, [item.filePath])

  const statusStyle = STATUS_STYLES[item.status]
  const createdAt   = item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'

  return (
    <View style={s.card}>
      <View style={s.thumbnail}>
        {item.fileType === 'image' && url ? (
          <Image source={{ uri: url }} style={s.thumbnailImg} resizeMode="cover" />
        ) : item.fileType === 'video' && url ? (
          <video src={url} style={s.thumbnailVideo as unknown as React.CSSProperties} controls />
        ) : (
          <View style={s.thumbnailPlaceholder}>
            <AureakText style={s.thumbnailIcon as never}>
              {item.fileType === 'image' ? '🖼️' : '🎥'}
            </AureakText>
          </View>
        )}
      </View>

      <View style={s.body}>
        <View style={s.titleRow}>
          <AureakText style={s.title as never} numberOfLines={1}>{item.title}</AureakText>
          <View style={[s.badge, { backgroundColor: statusStyle.bg }]}>
            <AureakText style={[s.badgeText, { color: statusStyle.text }] as never}>
              {MEDIA_ITEM_STATUS_LABELS[item.status]}
            </AureakText>
          </View>
        </View>

        {item.description && (
          <AureakText style={s.description as never} numberOfLines={2}>
            {item.description}
          </AureakText>
        )}

        <AureakText style={s.meta as never}>
          {item.uploaderDisplayName ?? 'Coach'} · {createdAt}
        </AureakText>

        {item.status === 'rejected' && item.rejectionReason && (
          <View style={s.rejectionReason}>
            <AureakText style={s.rejectionLabel as never}>Raison du rejet</AureakText>
            <AureakText style={s.rejectionText as never}>{item.rejectionReason}</AureakText>
          </View>
        )}

        {showActions && item.status === 'pending' && (
          <View style={s.actions}>
            <Pressable style={s.btnReject} onPress={() => onReject?.(item)}>
              <AureakText style={s.btnRejectLabel as never}>Rejeter</AureakText>
            </Pressable>
            <Pressable style={s.btnApprove} onPress={() => onApprove?.(item)}>
              <AureakText style={s.btnApproveLabel as never}>Approuver</AureakText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
  },
  thumbnail: {
    width : '100%',
    height: 180,
    backgroundColor: colors.light.hover,
  },
  thumbnailImg  : { width: '100%', height: '100%' } as never,
  thumbnailVideo: { width: '100%', height: '100%' } as never,
  thumbnailPlaceholder: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: { fontSize: 48 },
  body         : { padding: space.md, gap: space.xs },
  titleRow     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  title        : { color: colors.text.dark, fontSize: 14, fontWeight: '700', flex: 1 },
  badge        : { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999 },
  badgeText    : { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  description  : { color: colors.text.muted, fontSize: 12 },
  meta         : { color: colors.text.subtle, fontSize: 11 },
  rejectionReason: {
    marginTop      : space.xs,
    padding        : space.sm,
    backgroundColor: colors.status.errorBg,
    borderRadius   : radius.xs,
    gap            : 2,
  },
  rejectionLabel: { color: colors.status.errorText, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  rejectionText : { color: colors.status.errorText, fontSize: 12 },
  actions      : { flexDirection: 'row', gap: space.xs, marginTop: space.xs, justifyContent: 'flex-end' },
  btnReject    : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    backgroundColor  : colors.status.errorBg,
  },
  btnRejectLabel: { color: colors.status.errorText, fontWeight: '700', fontSize: 12 },
  btnApprove: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    backgroundColor  : colors.status.success,
  },
  btnApproveLabel: { color: colors.light.surface, fontWeight: '700', fontSize: 12 },
})
