'use client'
// Hub Méthodologie : widget "Dernières situations ajoutées"
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows, methodologyMethodColors } from '@aureak/theme'
import { getHubRecentSituations } from '@aureak/api-client'
import type { HubRecentSituation } from '@aureak/api-client'

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeTime(iso: string): string {
  const diffMs   = new Date(iso).getTime() - Date.now()
  const diffMin  = Math.round(diffMs / 60_000)
  const absMin   = Math.abs(diffMin)
  if (absMin < 60)          return RTF.format(diffMin, 'minute')
  if (absMin < 60 * 24)     return RTF.format(Math.round(diffMin / 60), 'hour')
  if (absMin < 60 * 24 * 7) return RTF.format(Math.round(diffMin / (60 * 24)), 'day')
  return RTF.format(Math.round(diffMin / (60 * 24 * 7)), 'week')
}

function methodColor(method: string | null): string {
  if (!method) return colors.text.muted
  return (methodologyMethodColors as Record<string, string>)[method] ?? colors.accent.gold
}

export function MethodologieHubRecentSituations() {
  const router                  = useRouter()
  const [items,   setItems]     = useState<HubRecentSituation[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getHubRecentSituations(3)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MethoHubRecentSituations] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Situations récentes</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucune situation récente</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => (
            <Pressable
              key={it.situationId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/methodologie/situations/${it.situationId}` as never)}
            >
              <View style={[styles.methodDot, { backgroundColor: methodColor(it.method) }]} />
              <View style={styles.rowContent}>
                <AureakText style={styles.itemTitle as TextStyle} numberOfLines={1}>
                  {it.title}
                </AureakText>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {it.themeName ? `${it.themeName} · ` : ''}{relativeTime(it.createdAt)}
                </AureakText>
              </View>
            </Pressable>
          ))}
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
    minHeight      : 156,
  },
  skeleton: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    minHeight      : 156,
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
  methodDot: {
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  rowContent: {
    flex: 1,
    gap : 2,
  },
  itemTitle: {
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
})
