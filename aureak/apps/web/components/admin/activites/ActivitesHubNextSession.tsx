'use client'
// Story 108.1 — Hub Activités : carte mini-widget "Prochaine séance"
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getHubNextSession } from '@aureak/api-client'
import type { HubNextSession, HubScope } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = { scope: ScopeState }

const DAYS_FR   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatStart(iso: string): string {
  const d   = new Date(iso)
  const day = DAYS_FR[d.getDay()] ?? ''
  const dd  = d.getDate()
  const mm  = MONTHS_FR[d.getMonth()] ?? ''
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${dd} ${mm} · ${hh}h${min}`
}

function toHubScope(scope: ScopeState): HubScope | undefined {
  if (scope.scope === 'implantation' && scope.implantationId) return { implantationId: scope.implantationId }
  if (scope.scope === 'groupe'       && scope.groupId)        return { groupId:        scope.groupId }
  return undefined
}

export function ActivitesHubNextSession({ scope }: Props) {
  const router                    = useRouter()
  const [data,    setData]        = useState<HubNextSession | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getHubNextSession(toHubScope(scope))
        if (!cancelled) setData(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ActivitesHubNextSession] error:', err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [scope.scope, scope.implantationId, scope.groupId])

  if (loading) {
    return <View style={styles.skeleton} />
  }

  if (!data) {
    return (
      <View style={styles.card}>
        <AureakText style={styles.title as TextStyle}>Prochaine séance</AureakText>
        <AureakText style={styles.empty as TextStyle}>Aucune séance à venir</AureakText>
      </View>
    )
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/seances/${data.sessionId}` as never)}
    >
      <AureakText style={styles.title as TextStyle}>Prochaine séance</AureakText>
      <AureakText style={styles.when as TextStyle}>{formatStart(data.startAt)}</AureakText>
      <View style={styles.metaRow}>
        {data.groupName ? (
          <AureakText style={styles.meta as TextStyle}>{data.groupName}</AureakText>
        ) : null}
        {data.implantationName ? (
          <AureakText style={styles.meta as TextStyle}>· {data.implantationName}</AureakText>
        ) : null}
      </View>
      <View style={styles.footerRow}>
        <AureakText style={styles.coach as TextStyle}>
          {data.coachName ?? 'Coach non assigné'}
        </AureakText>
        <View style={styles.badge}>
          <AureakText style={styles.badgeText as TextStyle}>{data.registeredCount} inscrit{data.registeredCount > 1 ? 's' : ''}</AureakText>
        </View>
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
    minHeight      : 156,
  },
  cardPressed: {
    backgroundColor: colors.light.hover,
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
  when: {
    fontFamily: fonts.heading,
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
    marginTop : space.xs,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    marginTop : space.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.dark,
  },
  footerRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginTop     : space.sm,
  },
  coach: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
    flex      : 1,
  },
  badge: {
    backgroundColor  : colors.accent.gold + '20',
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.accent.goldDarkText,
  },
})
