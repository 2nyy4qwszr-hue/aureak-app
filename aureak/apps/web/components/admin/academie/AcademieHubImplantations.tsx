'use client'
// Hub Académie : widget "Implantations" (mirror MethodologieHubRecentSituations)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getAcademieHubImplantations } from '@aureak/api-client'
import type { AcademieHubImplantation } from '@aureak/api-client'

export function AcademieHubImplantations() {
  const router                = useRouter()
  const [items,   setItems]   = useState<AcademieHubImplantation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getAcademieHubImplantations(4)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieHubImplantations] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Implantations</AureakText>
      {items.length === 0 ? (
        <View>
          <AureakText style={styles.empty as TextStyle}>Aucune implantation</AureakText>
          <Pressable
            onPress={() => router.push('/academie/implantations' as never)}
            style={styles.linkWrap}
          >
            <AureakText style={styles.link as TextStyle}>
              Créer une implantation →
            </AureakText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map(it => (
            <Pressable
              key={it.implantationId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/academie/implantations/${it.implantationId}` as never)}
            >
              <View style={styles.rowContent}>
                <AureakText style={styles.itemTitle as TextStyle} numberOfLines={1}>
                  {it.name}
                </AureakText>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {it.shortName ?? it.address ?? '—'}
                </AureakText>
              </View>
              {it.maxPlayers ? (
                <View style={styles.capBadge}>
                  <AureakText style={styles.capBadgeText as TextStyle}>
                    {it.maxPlayers} max
                  </AureakText>
                </View>
              ) : null}
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push('/academie/implantations' as never)}
            style={styles.linkWrap}
          >
            <AureakText style={styles.link as TextStyle}>
              Tout voir →
            </AureakText>
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
    gap: space.xs,
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
  capBadge: {
    backgroundColor  : colors.accent.gold + '18',
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  capBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '600',
    color     : colors.accent.gold,
  },
  linkWrap: {
    marginTop: space.xs,
  },
  link: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
