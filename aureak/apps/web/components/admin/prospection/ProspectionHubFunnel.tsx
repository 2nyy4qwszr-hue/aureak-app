'use client'
// Hub Prospection — widget "Funnel pipeline clubs" : 7 statuts avec count + barre proportionnelle
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getProspectionHubPipelineFunnel } from '@aureak/api-client'
import type { HubPipelineFunnel } from '@aureak/api-client'
import type { ClubProspectStatus } from '@aureak/types'

const STATUS_LABELS: Record<ClubProspectStatus, string> = {
  premier_contact         : 'Premier contact',
  mapping_orga            : 'Mapping orga',
  decisionnaire_identifie : 'Décisionnaire',
  rdv_qualifie            : 'RDV qualifié',
  closing                 : 'Closing',
  converti                : 'Converti',
  perdu                   : 'Perdu',
}

const STATUS_COLORS: Record<ClubProspectStatus, string> = {
  premier_contact         : colors.text.muted,
  mapping_orga            : colors.text.muted,
  decisionnaire_identifie : colors.accent.gold,
  rdv_qualifie            : colors.accent.gold,
  closing                 : colors.accent.gold,
  converti                : colors.status.successText,
  perdu                   : colors.status.errorText,
}

export function ProspectionHubFunnel() {
  const [items,   setItems]   = useState<HubPipelineFunnel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getProspectionHubPipelineFunnel()
        if (!cancelled) setItems(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ProspectionHubFunnel] error:', err)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const max = useMemo(() => Math.max(1, ...items.map(i => i.count)), [items])

  if (loading) return <View style={styles.skeleton} />

  return (
    <View style={styles.card}>
      <AureakText style={styles.title as TextStyle}>Pipeline clubs</AureakText>
      {items.every(i => i.count === 0) ? (
        <AureakText style={styles.empty as TextStyle}>Aucun club au pipeline</AureakText>
      ) : (
        <View style={styles.list}>
          {items.map(it => {
            const widthPct = (it.count / max) * 100
            const color    = STATUS_COLORS[it.status]
            return (
              <View key={it.status} style={styles.row}>
                <View style={styles.rowHead}>
                  <AureakText style={styles.statusLabel as TextStyle} numberOfLines={1}>
                    {STATUS_LABELS[it.status]}
                  </AureakText>
                  <AureakText style={[styles.count, { color }] as unknown as TextStyle}>
                    {it.count}
                  </AureakText>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${widthPct}%`, backgroundColor: color },
                    ] as never}
                  />
                </View>
              </View>
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
    gap: 8,
  },
  row: {
    gap: 4,
  },
  rowHead: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.dark,
    flex      : 1,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize  : 13,
    fontWeight: '700',
    minWidth  : 24,
    textAlign : 'right',
  },
  barTrack: {
    height         : 6,
    borderRadius   : 3,
    backgroundColor: colors.light.muted,
    overflow       : 'hidden',
  },
  barFill: {
    height      : 6,
    borderRadius: 3,
  },
})
