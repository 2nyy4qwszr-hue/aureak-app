'use client'
// Story 91-2 — Carte média avec badge statut + actions admin
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import { approveMediaItem, rejectMediaItem, getMediaSignedUrl } from '@aureak/api-client'
import type { MediaItem, MediaItemStatus } from '@aureak/types'

const STATUS_BADGE: Record<MediaItemStatus, { bg: string; color: string; label: string }> = {
  draft   : { bg: colors.light.muted,      color: colors.text.muted,    label: 'Brouillon' },
  pending : { bg: colors.status.warningBg,  color: colors.status.warning, label: 'En attente' },
  approved: { bg: colors.status.successBg,  color: colors.status.success, label: 'Approuvé' },
  rejected: { bg: colors.status.errorBg,     color: colors.status.absent,  label: 'Rejeté' },
}

type Props = {
  item: MediaItem
  onActionDone: () => void
}

export function MediaCard({ item, onActionDone }: Props) {
  const [acting, setActing]     = useState(false)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const badge = STATUS_BADGE[item.status]

  useEffect(() => {
    if (item.fileType === 'image') {
      getMediaSignedUrl(item.filePath)
        .then(setThumbUrl)
        .catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.error('[MediaCard] signed url error:', err)
        })
    }
  }, [item.filePath, item.fileType])

  async function handleApprove() {
    setActing(true)
    try {
      await approveMediaItem(item.id)
      onActionDone()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MediaCard] approve error:', err)
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    setActing(true)
    try {
      await rejectMediaItem(item.id)
      onActionDone()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MediaCard] reject error:', err)
    } finally {
      setActing(false)
    }
  }

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {item.fileType === 'image' && thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <AureakText style={styles.thumbIcon}>{item.fileType === 'video' ? '🎬' : '🖼️'}</AureakText>
          </View>
        )}
      </View>

      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <AureakText style={[styles.badgeText, { color: badge.color }] as never}>{badge.label}</AureakText>
      </View>

      {/* Info */}
      <AureakText style={styles.title} numberOfLines={1}>{item.title}</AureakText>
      {item.description ? (
        <AureakText style={styles.desc} numberOfLines={2}>{item.description}</AureakText>
      ) : null}
      <AureakText style={styles.meta}>
        {item.fileType === 'image' ? 'Image' : 'Vidéo'} — {new Date(item.createdAt).toLocaleDateString('fr-BE')}
      </AureakText>

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnApprove, pressed && { opacity: 0.7 }]}
            onPress={handleApprove}
            disabled={acting}
          >
            <AureakText style={styles.btnApproveText}>Approuver</AureakText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnReject, pressed && { opacity: 0.7 }]}
            onPress={handleReject}
            disabled={acting}
          >
            <AureakText style={styles.btnRejectText}>Rejeter</AureakText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
  },
  thumbWrap: {
    width : '100%',
    height: 140,
  },
  thumb: {
    width : '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width          : '100%',
    height         : '100%',
    backgroundColor: colors.light.muted,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  thumbIcon: {
    fontSize: 36,
  },
  badge: {
    alignSelf        : 'flex-start',
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
    marginTop        : space.sm,
    marginLeft       : space.sm,
  },
  badgeText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  title: {
    fontSize      : 14,
    fontWeight    : '700',
    fontFamily    : fonts.display,
    color         : colors.text.dark,
    paddingHorizontal: space.sm,
    marginTop     : space.xs,
  },
  desc: {
    fontSize      : 12,
    color         : colors.text.muted,
    paddingHorizontal: space.sm,
    marginTop     : 2,
  },
  meta: {
    fontSize      : 11,
    color         : colors.text.subtle,
    paddingHorizontal: space.sm,
    marginTop     : 4,
    marginBottom  : space.sm,
    fontFamily    : fonts.body,
  },
  actions: {
    flexDirection    : 'row',
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    gap              : space.xs,
  },
  btnApprove: {
    flex           : 1,
    backgroundColor: colors.status.successBg,
    borderRadius   : radius.button,
    paddingVertical: 6,
    alignItems     : 'center',
  },
  btnApproveText: {
    color     : colors.status.success,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  btnReject: {
    flex           : 1,
    backgroundColor: colors.status.errorBg,
    borderRadius   : radius.button,
    paddingVertical: 6,
    alignItems     : 'center',
  },
  btnRejectText: {
    color     : colors.status.absent,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
})
