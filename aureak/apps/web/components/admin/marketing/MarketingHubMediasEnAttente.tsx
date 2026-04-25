'use client'
// Vue d'ensemble Marketing : widget "Médias en attente de validation".
// Design aligné sur ActivitesHubNextSession (carte cliquable, padding lg, shadow sm).
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listMediaItems } from '@aureak/api-client'
import type { MediaItem } from '@aureak/types'

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatRelative(iso: string): string {
  const d  = new Date(iso)
  const dd = d.getDate()
  const mm = MONTHS_FR[d.getMonth()] ?? ''
  return `${dd} ${mm}`
}

export function MarketingHubMediasEnAttente() {
  const router                = useRouter()
  const [items, setItems]     = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await listMediaItems({ status: 'pending' })
        if (!cancelled) setItems(result.slice(0, 3))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MarketingHubMediasEnAttente] error:', err)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <View style={styles.skeleton} />
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push('/marketing/mediatheque' as never)}
    >
      <AureakText style={styles.title as TextStyle}>Médias en attente</AureakText>

      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucun média à valider</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(item => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowMain}>
                <AureakText style={styles.rowTitle as TextStyle} numberOfLines={1}>
                  {item.title}
                </AureakText>
                <AureakText style={styles.rowMeta as TextStyle}>
                  {item.uploaderDisplayName ?? 'Auteur inconnu'} · {formatRelative(item.createdAt)}
                </AureakText>
              </View>
              <View style={styles.badge}>
                <AureakText style={styles.badgeText as TextStyle}>{item.fileType}</AureakText>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <AureakText style={styles.footerLink as TextStyle}>
          {items.length > 0 ? 'Voir tous les médias →' : 'Ouvrir la médiathèque →'}
        </AureakText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
    boxShadow      : shadows.sm,
    minHeight      : 220,
  },
  cardPressed: {
    backgroundColor: colors.light.hover,
  },
  skeleton: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    minHeight      : 220,
    opacity        : 0.6,
  },
  title: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  empty: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    marginTop : space.sm,
  },
  list: {
    gap: space.sm,
  },
  row: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
    paddingVertical: 4,
  },
  rowMain: {
    flex: 1,
    gap : 2,
  },
  rowTitle: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  badge: {
    backgroundColor  : colors.accent.gold + '20',
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  badgeText: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    color        : colors.accent.goldDarkText,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop : 'auto',
    paddingTop: space.sm,
  },
  footerLink: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.accent.goldDarkText,
  },
})
