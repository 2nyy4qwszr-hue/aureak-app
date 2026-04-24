'use client'
// Hub Académie : widget "Derniers joueurs inscrits" (mirror MethodologieHubRecentTrainings)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getAcademieRecentJoueurs } from '@aureak/api-client'
import type { AcademieRecentJoueur } from '@aureak/api-client'

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

const STATUS_COLORS: Record<string, string> = {
  ACADÉMICIEN        : colors.accent.gold,
  NOUVEAU_ACADÉMICIEN: colors.status.successText,
  ANCIEN             : colors.text.muted,
  STAGE_UNIQUEMENT   : colors.text.muted,
  PROSPECT           : colors.status.warning,
}

const STATUS_SHORT: Record<string, string> = {
  ACADÉMICIEN        : 'Académicien',
  NOUVEAU_ACADÉMICIEN: 'Nouveau',
  ANCIEN             : 'Ancien',
  STAGE_UNIQUEMENT   : 'Stage',
  PROSPECT           : 'Prospect',
}

export function AcademieHubRecentJoueurs() {
  const router                = useRouter()
  const [items,   setItems]   = useState<AcademieRecentJoueur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getAcademieRecentJoueurs(3)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieHubRecentJoueurs] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Derniers inscrits</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucun joueur récent</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => {
            const statusColor = it.computedStatus ? (STATUS_COLORS[it.computedStatus] ?? colors.text.muted) : colors.text.muted
            const statusLabel = it.computedStatus ? (STATUS_SHORT[it.computedStatus] ?? it.computedStatus) : null
            return (
              <Pressable
                key={it.childId}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => router.push(`/children/${it.childId}` as never)}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={styles.rowContent}>
                  <AureakText style={styles.itemTitle as TextStyle} numberOfLines={1}>
                    {it.displayName}
                  </AureakText>
                  <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                    {it.currentClub ?? '—'} · {relativeTime(it.createdAt)}
                  </AureakText>
                </View>
                {statusLabel ? (
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                    <AureakText
                      style={[styles.statusBadgeText, { color: statusColor }] as unknown as TextStyle}
                      numberOfLines={1}
                    >
                      {statusLabel}
                    </AureakText>
                  </View>
                ) : null}
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
  statusDot: {
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
  statusBadge: {
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    maxWidth         : 100,
  },
  statusBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '600',
  },
})
