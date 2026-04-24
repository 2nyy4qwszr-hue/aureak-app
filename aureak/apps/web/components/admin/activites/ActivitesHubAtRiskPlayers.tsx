'use client'
// Story 108.1 — Hub Activités : carte mini-widget "Joueurs à risque" (3-5 items cliquables)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getHubAtRiskPlayers } from '@aureak/api-client'
import type { HubAtRiskPlayer, HubScope } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = { scope: ScopeState }

function toHubScope(scope: ScopeState): HubScope | undefined {
  if (scope.scope === 'implantation' && scope.implantationId) return { implantationId: scope.implantationId }
  if (scope.scope === 'groupe'       && scope.groupId)        return { groupId:        scope.groupId }
  return undefined
}

export function ActivitesHubAtRiskPlayers({ scope }: Props) {
  const router                  = useRouter()
  const [items,   setItems]     = useState<HubAtRiskPlayer[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getHubAtRiskPlayers(toHubScope(scope), 5)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ActivitesHubAtRiskPlayers] error:', err)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [scope.scope, scope.implantationId, scope.groupId])

  if (loading) {
    return <View style={styles.skeleton} />
  }

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Joueurs à risque</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.emptyOk as TextStyle}>✓ Aucun joueur à risque</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(p => (
            <Pressable
              key={p.childId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/joueurs/${p.childId}` as never)}
            >
              <View style={styles.rowContent}>
                <AureakText style={styles.name as TextStyle} numberOfLines={1}>
                  {p.childName}
                </AureakText>
                {p.groupName ? (
                  <AureakText style={styles.group as TextStyle} numberOfLines={1}>{p.groupName}</AureakText>
                ) : null}
              </View>
              <View style={styles.badge}>
                <AureakText style={styles.badgeText as TextStyle}>
                  {p.consecutiveAbsences} absences
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
  name: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  group: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
  },
  badge: {
    backgroundColor  : colors.status.errorBg,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.status.errorText,
  },
})
