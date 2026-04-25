'use client'
// Hub Prospection — widget "Top commerciaux du mois" : top 5 par # conversions clubs
import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getProspectionHubTopCommercials } from '@aureak/api-client'
import type { HubTopCommercial } from '@aureak/api-client'

const RANK_COLORS = [
  colors.accent.gold,
  colors.text.muted,
  colors.text.muted,
  colors.text.muted,
  colors.text.muted,
]

export function ProspectionHubTopCommercials() {
  const [items,   setItems]   = useState<HubTopCommercial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getProspectionHubTopCommercials(5)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ProspectionHubTopCommercials] error:', err)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) return <View style={styles.skeleton} />

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Top commerciaux · mois</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucune conversion ce mois-ci</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map((it, idx) => (
            <View key={it.commercialId} style={styles.row}>
              <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[idx] + '22' }] as never}>
                <AureakText style={[styles.rankText, { color: RANK_COLORS[idx] }] as unknown as TextStyle}>
                  {idx + 1}
                </AureakText>
              </View>
              <AureakText style={styles.name as TextStyle} numberOfLines={1}>
                {it.displayName}
              </AureakText>
              <AureakText style={styles.count as TextStyle}>
                {it.conversions} conv.
              </AureakText>
            </View>
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
    minHeight      : 220,
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
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  rankBadge: {
    width         : 24,
    height        : 24,
    borderRadius  : 12,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: fonts.mono,
    fontSize  : 12,
    fontWeight: '700',
  },
  name: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
    flex      : 1,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
