'use client'
// Epic 90 — Story 90.2 : Liste des recommandations entraîneur du coach courant.
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { listMyRecommendations } from '@aureak/api-client'
import type { CoachProspectListRow, CoachProspectStatus } from '@aureak/types'
import { COACH_PROSPECT_STATUS_LABELS } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'

const STATUS_TONE: Record<CoachProspectStatus, { bg: string; text: string }> = {
  identifie    : { bg: colors.light.muted,      text: colors.text.muted },
  info_envoyee : { bg: colors.status.amberBg,   text: colors.status.amberText },
  en_formation : { bg: colors.border.goldBg,    text: colors.accent.gold },
  actif        : { bg: colors.status.successBg, text: colors.status.successText },
  perdu        : { bg: colors.status.redBg,     text: colors.status.redText },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

type Props = {
  /** Sous-composant peut être re-rendu après création — passer un trigger */
  refreshKey?: number
}

export function MyCoachRecommendations({ refreshKey }: Props) {
  const [rows, setRows]       = useState<CoachProspectListRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listMyRecommendations()
      setRows(list)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[MyCoachRecommendations] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  if (loading) {
    return (
      <View style={s.empty}>
        <AureakText style={s.emptyText as never}>Chargement…</AureakText>
      </View>
    )
  }

  if (rows.length === 0) {
    return (
      <View style={s.empty}>
        <AureakText style={s.emptyText as never}>Tu n'as pas encore recommandé d'entraîneur.</AureakText>
      </View>
    )
  }

  return (
    <View style={s.list}>
      {rows.map(r => {
        const tone = STATUS_TONE[r.status]
        return (
          <View key={r.id} style={s.row}>
            <View style={s.rowMain}>
              <AureakText style={s.name as never}>{r.firstName} {r.lastName}</AureakText>
              <AureakText style={s.meta as never}>
                {r.city ?? '—'} · {formatDate(r.createdAt)}
              </AureakText>
            </View>
            <View style={[s.badge, { backgroundColor: tone.bg }] as never}>
              <AureakText style={[s.badgeText, { color: tone.text }] as never}>
                {COACH_PROSPECT_STATUS_LABELS[r.status]}
              </AureakText>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  list: {
    gap            : space.xs,
  },
  row: {
    flexDirection   : 'row',
    alignItems      : 'center',
    justifyContent  : 'space-between',
    backgroundColor : colors.light.surface,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderRadius    : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical : space.sm,
    gap             : space.md,
  },
  rowMain: { flex: 1, gap: 2 },
  name   : { color: colors.text.dark, fontSize: 14, fontWeight: '700', fontFamily: fonts.body },
  meta   : { color: colors.text.muted, fontSize: 12 },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : radius.xs,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  empty: {
    backgroundColor : colors.light.surface,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderRadius    : radius.xs,
    padding         : space.md,
    alignItems      : 'center',
  },
  emptyText: { color: colors.text.muted, fontSize: 12, fontStyle: 'italic' },
})
