'use client'
// Hub Partenariat — widget "Top sponsors" : 5 sponsors actifs avec le plus de parrainages
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listSponsors } from '@aureak/api-client'
import type { SponsorWithCounts } from '@aureak/types'

function formatEuros(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(cents / 100)
}

export function PartenariatHubTopSponsors() {
  const router                = useRouter()
  const [items,   setItems]   = useState<SponsorWithCounts[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await listSponsors()
        if (!cancelled) {
          const sorted = (data ?? [])
            .filter(s => s.isActive)
            .sort((a, b) => (b.annualAmountCents ?? 0) - (a.annualAmountCents ?? 0))
            .slice(0, 5)
          setItems(sorted)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PartenariatHubTopSponsors] error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) return <View style={styles.skeleton} />

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Top sponsors · montant annuel</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucun sponsor actif</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(s => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/partenariat/sponsors/${s.id}` as never)}
            >
              <View style={styles.rowContent}>
                <AureakText style={styles.name as TextStyle} numberOfLines={1}>
                  {s.name}
                </AureakText>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {formatEuros(s.annualAmountCents)} · {s.activeChildrenCount} parrainage{s.activeChildrenCount > 1 ? 's' : ''}
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
    paddingVertical: 4,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowContent: {
    flex: 1,
    gap : 2,
  },
  name: {
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
