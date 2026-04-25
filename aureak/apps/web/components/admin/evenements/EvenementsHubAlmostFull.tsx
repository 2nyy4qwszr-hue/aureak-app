'use client'
// Hub Événements : mini-widget "Bientôt complets" (top 3 événements >= 80%).
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getEvenementsHubAlmostFull } from '@aureak/api-client'
import type { EvenementsHubAlmostFull } from '@aureak/api-client'
import { EVENT_TYPE_META } from './eventTypeMeta'

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()] ?? ''}`
}

export function EvenementsHubAlmostFullWidget() {
  const router                 = useRouter()
  const [items,   setItems]    = useState<EvenementsHubAlmostFull[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getEvenementsHubAlmostFull(80, 3)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[EvenementsHubAlmostFull] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Bientôt complets</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucun événement à plus de 80%</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => {
            const meta = EVENT_TYPE_META[it.eventType]
            const fillColor =
              it.fillRate >= 100 ? colors.status.errorText :
              it.fillRate >= 90  ? colors.accent.gold      :
              colors.status.successText
            return (
              <Pressable
                key={it.eventId}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => router.push(meta.href as never)}
              >
                <View style={styles.rowHeader}>
                  <AureakText style={styles.eventName as TextStyle} numberOfLines={1}>
                    {it.name}
                  </AureakText>
                  <AureakText style={[styles.fillPct, { color: fillColor }] as unknown as TextStyle}>
                    {it.fillRate}%
                  </AureakText>
                </View>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {meta.picto} {meta.label} · {formatDate(it.startDate)} · {it.registeredCount}/{it.maxParticipants}
                </AureakText>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${it.fillRate}%`, backgroundColor: fillColor }] as never} />
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
    gap: space.md,
  },
  row: {
    gap: 4,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowHeader: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    gap           : space.sm,
  },
  eventName: {
    flex      : 1,
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  fillPct: {
    fontFamily: fonts.mono,
    fontSize  : 13,
    fontWeight: '700',
  },
  subline: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
  },
  progressTrack: {
    height         : 4,
    backgroundColor: colors.border.light,
    borderRadius   : 2,
    overflow       : 'hidden',
    marginTop      : 2,
  },
  progressFill: {
    height      : 4,
    borderRadius: 2,
  },
})
