'use client'
// Story 88.3 — Timeline verticale des actions sur un prospect
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import type { ProspectAction } from '@aureak/types'
import { PROSPECT_ACTION_TYPE_LABELS, PROSPECT_ACTION_TYPE_ICONS } from '@aureak/types'

type Props = {
  actions: ProspectAction[]
  loading: boolean
}

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min    = 60 * 1000
  const hour   = 60 * min
  const day    = 24 * hour
  if (diffMs < min)    return 'À l\'instant'
  if (diffMs < hour)   return `Il y a ${Math.floor(diffMs / min)} min`
  if (diffMs < day)    return `Il y a ${Math.floor(diffMs / hour)} h`
  const days = Math.floor(diffMs / day)
  if (days === 1)      return 'Hier'
  if (days < 7)        return `Il y a ${days} j`
  if (days < 30)       return `Il y a ${Math.floor(days / 7)} sem`
  return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProspectTimeline({ actions, loading }: Props) {
  if (loading) {
    return <AureakText style={s.loading as never}>Chargement de l'historique…</AureakText>
  }

  if (actions.length === 0) {
    return (
      <View style={s.emptyState}>
        <AureakText style={s.emptyText as never}>
          Aucune action enregistrée. Ajoutez-en une pour commencer à tracer le travail commercial.
        </AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {actions.map((a, idx) => {
        const isLast = idx === actions.length - 1
        return (
          <View key={a.id} style={s.row}>
            <View style={s.leftCol}>
              <View style={s.dot}>
                <AureakText style={s.dotIcon as never}>{PROSPECT_ACTION_TYPE_ICONS[a.actionType]}</AureakText>
              </View>
              {!isLast && <View style={s.line} />}
            </View>
            <View style={s.contentCol}>
              <View style={s.cardHeader}>
                <AureakText style={s.actionType as never}>
                  {PROSPECT_ACTION_TYPE_LABELS[a.actionType]}
                </AureakText>
                <AureakText style={s.date as never}>{relativeDate(a.createdAt)}</AureakText>
              </View>
              <AureakText style={s.performer as never}>
                {a.performerDisplayName ?? 'Utilisateur inconnu'}
              </AureakText>
              {a.description && (
                <AureakText style={s.description as never}>{a.description}</AureakText>
              )}
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll  : { maxHeight: 500 },
  content : { gap: 0 },
  loading : { color: colors.text.muted, fontStyle: 'italic', fontSize: 13, padding: space.md },

  emptyState: {
    padding        : space.lg,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },

  row     : { flexDirection: 'row', gap: space.md, paddingVertical: space.xs },
  leftCol : { alignItems: 'center', width: 32 },
  dot     : {
    width          : 32,
    height         : 32,
    borderRadius   : 16,
    backgroundColor: colors.accent.gold + '22',
    borderWidth    : 2,
    borderColor    : colors.accent.gold,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  dotIcon : { fontSize: 14 },
  line    : { width: 2, flex: 1, backgroundColor: colors.border.divider, marginVertical: 4, minHeight: 20 },

  contentCol: {
    flex           : 1,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : 4,
    marginBottom   : space.sm,
  },
  cardHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  actionType : { color: colors.text.dark, fontSize: 13, fontWeight: '700', fontFamily: fonts.display },
  date       : { color: colors.text.subtle, fontSize: 11 },
  performer  : { color: colors.text.muted, fontSize: 12 },
  description: { color: colors.text.dark, fontSize: 13, marginTop: 4, lineHeight: 18 },
})
