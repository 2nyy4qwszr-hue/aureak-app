'use client'
// Story 90.1 — Tableau pipeline coach prospects : 6 colonnes
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import type { CoachProspectListRow } from '@aureak/types'
import { CoachProspectStatusBadge } from './CoachProspectStatusBadge'

type Props = {
  rows: CoachProspectListRow[]
}

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const day    = 24 * 60 * 60 * 1000
  const days   = Math.floor(diffMs / day)
  if (days === 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  if (days < 7)   return `Il y a ${days} j`
  if (days < 30)  return `Il y a ${Math.floor(days / 7)} sem`
  return `Il y a ${Math.floor(days / 30)} mois`
}

export function CoachProspectTable({ rows }: Props) {
  const router = useRouter()

  if (rows.length === 0) {
    return (
      <View style={s.emptyState}>
        <AureakText style={s.emptyText as never}>Aucun prospect entraîneur pour le moment.</AureakText>
      </View>
    )
  }

  return (
    <View style={s.wrapper}>
      <View style={s.tableHeader}>
        <View style={{ flex: 2 }}><AureakText style={s.th as never}>PRÉNOM NOM</AureakText></View>
        <View style={{ flex: 1 }}><AureakText style={s.th as never}>VILLE</AureakText></View>
        <View style={{ width: 150 }}><AureakText style={s.th as never}>STATUT</AureakText></View>
        <View style={{ flex: 1.2 }}><AureakText style={s.th as never}>SPÉCIALITÉ</AureakText></View>
        <View style={{ flex: 1 }}><AureakText style={s.th as never}>COMMERCIAL</AureakText></View>
        <View style={{ width: 130 }}><AureakText style={s.th as never}>DERNIÈRE ACTION</AureakText></View>
      </View>

      {rows.map((r, idx) => {
        const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const lastAction = r.lastActionAt ?? r.updatedAt
        return (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/developpement/prospection/entraineurs/${r.id}` as never)}
            style={({ pressed }) => [s.row, { backgroundColor: rowBg }, pressed && { opacity: 0.75 }] as never}
          >
            <View style={{ flex: 2 }}>
              <AureakText style={s.name as never}>
                {r.firstName} {r.lastName}
              </AureakText>
              {r.currentClub && (
                <AureakText style={s.subline as never}>Club actuel : {r.currentClub}</AureakText>
              )}
            </View>
            <AureakText style={[s.cellMuted, { flex: 1 }] as never}>{r.city ?? '—'}</AureakText>
            <View style={{ width: 150 }}>
              <CoachProspectStatusBadge status={r.status} />
            </View>
            <AureakText style={[s.cellMuted, { flex: 1.2 }] as never}>
              {r.specialite ?? '—'}
            </AureakText>
            <AureakText style={[s.cellMuted, { flex: 1 }] as never}>
              {r.assignedDisplayName ?? '—'}
            </AureakText>
            <AureakText style={[s.cellMuted, { width: 130 }] as never}>
              {relativeDate(lastAction)}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    backgroundColor: colors.light.surface,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  th: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  name: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '700',
  },
  subline: {
    color    : colors.text.muted,
    fontSize : 11,
    marginTop: 2,
  },
  cellMuted: {
    color   : colors.text.muted,
    fontSize: 12,
  },
  emptyState: {
    padding        : space.xxl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyText: {
    color    : colors.text.muted,
    fontSize : 13,
    fontStyle: 'italic',
  },
})
