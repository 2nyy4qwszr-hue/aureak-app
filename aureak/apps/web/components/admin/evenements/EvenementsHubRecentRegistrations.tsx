'use client'
// Hub Événements : mini-widget "Inscriptions récentes" (5 items).
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getEvenementsHubRecentRegistrations } from '@aureak/api-client'
import type { EvenementsHubRecentRegistration } from '@aureak/api-client'
import { EVENT_TYPE_META } from './eventTypeMeta'

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeTime(iso: string): string {
  const diffMs   = new Date(iso).getTime() - Date.now()
  const diffMin  = Math.round(diffMs / 60_000)
  const absMin   = Math.abs(diffMin)
  if (absMin < 60)            return RTF.format(diffMin, 'minute')
  if (absMin < 60 * 24)       return RTF.format(Math.round(diffMin / 60), 'hour')
  if (absMin < 60 * 24 * 7)   return RTF.format(Math.round(diffMin / (60 * 24)), 'day')
  return RTF.format(Math.round(diffMin / (60 * 24 * 7)), 'week')
}

export function EvenementsHubRecentRegistrations() {
  const router                 = useRouter()
  const [items,   setItems]    = useState<EvenementsHubRecentRegistration[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getEvenementsHubRecentRegistrations(5)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[EvenementsHubRecentRegistrations] error:', err)
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
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Inscriptions récentes</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucune inscription récente</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => {
            const meta = EVENT_TYPE_META[it.eventType]
            return (
              <Pressable
                key={it.participationId}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => router.push(meta.href as never)}
              >
                <View style={[styles.typeDot, { backgroundColor: meta.color }]} />
                <View style={styles.rowContent}>
                  <AureakText style={styles.childName as TextStyle} numberOfLines={1}>
                    {it.childName}
                  </AureakText>
                  <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                    {it.eventName} · {relativeTime(it.registeredAt)}
                  </AureakText>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: meta.color + '22' }]}>
                  <AureakText style={[styles.typeBadgeText, { color: meta.color }] as unknown as TextStyle} numberOfLines={1}>
                    {meta.label}
                  </AureakText>
                </View>
              </Pressable>
            )
          })}
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
    padding        : space.lg,
    gap            : space.sm,
    boxShadow      : shadows.sm,
    minHeight      : 200,
  },
  skeleton: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    minHeight      : 200,
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
    gap           : space.sm,
    paddingVertical: 4,
  },
  rowPressed: {
    opacity: 0.7,
  },
  typeDot: {
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  rowContent: {
    flex: 1,
    gap : 2,
  },
  childName: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
  },
  typeBadge: {
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    maxWidth         : 110,
  },
  typeBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '600',
  },
})
