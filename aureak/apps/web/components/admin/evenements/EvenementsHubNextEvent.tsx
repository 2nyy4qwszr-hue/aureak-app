'use client'
// Hub Événements : mini-widget "Prochain événement" (hero card cliquable).
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getEvenementsHubNextEvent } from '@aureak/api-client'
import type { EvenementsHubNextEvent as NextEvent } from '@aureak/api-client'
import { EVENT_TYPE_META } from './eventTypeMeta'

const DAYS_FR   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatDate(iso: string): string {
  const d   = new Date(iso)
  const day = DAYS_FR[d.getDay()] ?? ''
  const dd  = d.getDate()
  const mm  = MONTHS_FR[d.getMonth()] ?? ''
  return `${day} ${dd} ${mm}`
}

function formatRange(startIso: string, endIso: string): string {
  if (startIso === endIso) return formatDate(startIso)
  const s = new Date(startIso)
  const e = new Date(endIso)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    const mm = MONTHS_FR[s.getMonth()] ?? ''
    return `${s.getDate()}–${e.getDate()} ${mm}`
  }
  return `${formatDate(startIso)} → ${formatDate(endIso)}`
}

export function EvenementsHubNextEvent() {
  const router                = useRouter()
  const [data,    setData]    = useState<NextEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getEvenementsHubNextEvent()
        if (!cancelled) setData(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[EvenementsHubNextEvent] error:', err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <View style={styles.skeleton} />
  }

  if (!data) {
    return (
      <View style={styles.card}>
        <AureakText style={styles.title as TextStyle}>Prochain événement</AureakText>
        <AureakText style={styles.empty as TextStyle}>Aucun événement à venir</AureakText>
      </View>
    )
  }

  const meta = EVENT_TYPE_META[data.eventType]
  const fillPct = data.maxParticipants && data.maxParticipants > 0
    ? Math.min(100, Math.round((data.registeredCount / data.maxParticipants) * 100))
    : null

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(meta.href as never)}
    >
      <View style={styles.header}>
        <AureakText style={styles.title as TextStyle}>Prochain événement</AureakText>
        <View style={[styles.typeBadge, { backgroundColor: meta.color + '22' }]}>
          <AureakText style={[styles.typeBadgeText, { color: meta.color }] as unknown as TextStyle}>
            {meta.picto} {meta.label}
          </AureakText>
        </View>
      </View>

      <AureakText style={styles.name as TextStyle} numberOfLines={2}>{data.name}</AureakText>
      <AureakText style={styles.when as TextStyle}>{formatRange(data.startDate, data.endDate)}</AureakText>

      {(data.location || data.implantationName) && (
        <AureakText style={styles.location as TextStyle} numberOfLines={1}>
          {data.location ?? ''}{data.location && data.implantationName ? ' · ' : ''}{data.implantationName ?? ''}
        </AureakText>
      )}

      <View style={styles.footerRow}>
        <View style={styles.fillCol}>
          <AureakText style={styles.fillLabel as TextStyle}>
            {data.registeredCount} inscrit{data.registeredCount > 1 ? 's' : ''}
            {data.maxParticipants ? ` / ${data.maxParticipants}` : ''}
          </AureakText>
          {fillPct !== null && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${fillPct}%`, backgroundColor: meta.color }] as never} />
            </View>
          )}
        </View>
        <AureakText style={styles.cta as TextStyle}>Voir →</AureakText>
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
    gap            : space.xs,
    boxShadow      : shadows.sm,
    minHeight      : 200,
  },
  cardPressed: {
    backgroundColor: colors.light.hover,
  },
  skeleton: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    minHeight      : 200,
    opacity        : 0.6,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    gap           : space.sm,
  },
  title: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  typeBadge: {
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  typeBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '700',
  },
  name: {
    fontFamily: fonts.heading,
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
    marginTop : space.xs,
  },
  when: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
    marginTop : 2,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    marginTop : space.sm,
  },
  location: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  footerRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-end',
    marginTop     : space.sm,
    gap           : space.sm,
  },
  fillCol: {
    flex: 1,
    gap : 4,
  },
  fillLabel: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
    fontWeight: '600',
  },
  progressTrack: {
    height         : 4,
    backgroundColor: colors.border.light,
    borderRadius   : 2,
    overflow       : 'hidden',
  },
  progressFill: {
    height      : 4,
    borderRadius: 2,
  },
  cta: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
