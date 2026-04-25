'use client'
// Hub Prospection — widget "Activité récente" : 5 dernières prospect_actions
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getProspectionHubRecentActions } from '@aureak/api-client'
import type { HubProspectAction } from '@aureak/api-client'
import type { ProspectActionType } from '@aureak/types'

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeTime(iso: string): string {
  const diffMs   = new Date(iso).getTime() - Date.now()
  const diffMin  = Math.round(diffMs / 60_000)
  const absMin   = Math.abs(diffMin)
  if (absMin < 60)         return RTF.format(diffMin, 'minute')
  if (absMin < 60 * 24)    return RTF.format(Math.round(diffMin / 60), 'hour')
  if (absMin < 60 * 24 * 7) return RTF.format(Math.round(diffMin / (60 * 24)), 'day')
  return RTF.format(Math.round(diffMin / (60 * 24 * 7)), 'week')
}

const ACTION_LABELS: Record<ProspectActionType, string> = {
  premier_contact         : 'Premier contact',
  relance                 : 'Relance',
  identification_contact  : 'Contact identifié',
  obtention_rdv           : 'RDV obtenu',
  presentation            : 'Présentation',
  closing                 : 'Closing',
  note                    : 'Note',
  changement_statut       : 'Changement statut',
}

const ACTION_COLORS: Record<ProspectActionType, string> = {
  premier_contact         : colors.text.muted,
  relance                 : colors.accent.gold,
  identification_contact  : colors.accent.gold,
  obtention_rdv           : colors.status.successText,
  presentation            : colors.status.successText,
  closing                 : colors.status.successText,
  note                    : colors.text.muted,
  changement_statut       : colors.accent.gold,
}

export function ProspectionHubRecentActions() {
  const router                  = useRouter()
  const [items,   setItems]     = useState<HubProspectAction[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getProspectionHubRecentActions(5)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ProspectionHubRecentActions] error:', err)
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
      <AureakText style={styles.title as TextStyle}>Activité récente</AureakText>
      {items.length === 0 ? (
        <AureakText style={styles.empty as TextStyle}>Aucune action récente</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => (
            <Pressable
              key={it.actionId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push('/prospection/clubs' as never)}
            >
              <View style={[styles.dot, { backgroundColor: ACTION_COLORS[it.actionType] }]} />
              <View style={styles.rowContent}>
                <AureakText style={styles.club as TextStyle} numberOfLines={1}>
                  {it.clubName}
                </AureakText>
                <AureakText style={styles.subline as TextStyle} numberOfLines={1}>
                  {ACTION_LABELS[it.actionType]} · {it.performerName ?? '—'} · {relativeTime(it.performedAt)}
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
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  rowContent: {
    flex: 1,
    gap : 2,
  },
  club: {
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
