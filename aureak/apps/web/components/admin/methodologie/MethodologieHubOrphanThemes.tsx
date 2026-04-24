'use client'
// Hub Méthodologie : widget "Thèmes sans entraînement" (mirror AtRiskPlayers)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getHubOrphanThemes } from '@aureak/api-client'
import type { HubOrphanTheme } from '@aureak/api-client'

export function MethodologieHubOrphanThemes() {
  const router                  = useRouter()
  const [items,   setItems]     = useState<HubOrphanTheme[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getHubOrphanThemes(5)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MethoHubOrphanThemes] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Thèmes sans entraînement</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.emptyOk as TextStyle}>✓ Tous les thèmes sont couverts</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(t => (
            <Pressable
              key={t.themeId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/methodologie/themes/${t.themeId}` as never)}
            >
              <View style={styles.rowContent}>
                <AureakText style={styles.itemTitle as TextStyle} numberOfLines={1}>
                  {t.title}
                </AureakText>
                {t.method ? (
                  <AureakText style={styles.method as TextStyle} numberOfLines={1}>{t.method}</AureakText>
                ) : null}
              </View>
              <View style={styles.badge}>
                <AureakText style={styles.badgeText as TextStyle}>0 entr.</AureakText>
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
  emptyOk: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.status.successText,
    fontWeight: '600',
    marginTop : space.sm,
  },
  list: {
    gap: space.xs,
  },
  row: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
    paddingVertical: 4,
  },
  rowPressed: {
    opacity: 0.7,
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
  method: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
  },
  badge: {
    backgroundColor  : colors.status.warningBg ?? (colors.accent.gold + '20'),
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.text.muted,
  },
})
