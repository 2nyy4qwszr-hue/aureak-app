'use client'
// Hub Partenariat — widget "Clubs partenaires" : 5 derniers clubs partenaires (créés récemment)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listPartnerships } from '@aureak/api-client'
import type { ClubPartnership } from '@aureak/api-client'

const ACCESS_LABELS: Record<ClubPartnership['access_level'], string> = {
  read_catalogue: 'Catalogue',
  read_bronze   : 'Bronze',
  read_silver   : 'Silver',
  full_read     : 'Full read',
}

export function PartenariatHubRecentPartners() {
  const router                = useRouter()
  const [items,   setItems]   = useState<ClubPartnership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await listPartnerships()
        if (!cancelled) setItems((data ?? []).slice(0, 5))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PartenariatHubRecentPartners] error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) return <View style={styles.skeleton} />

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Clubs partenaires</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucun club partenaire</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(p => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push('/partenariat/clubs' as never)}
            >
              <View style={styles.dot} />
              <View style={styles.rowContent}>
                <AureakText style={styles.name as TextStyle} numberOfLines={1}>
                  {p.partner_name}
                </AureakText>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {ACCESS_LABELS[p.access_level]} · depuis {new Date(p.active_from).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
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
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: 4,
  },
  rowPressed: {
    opacity: 0.7,
  },
  dot: {
    width          : 8,
    height         : 8,
    borderRadius   : 4,
    backgroundColor: colors.status.info,
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
