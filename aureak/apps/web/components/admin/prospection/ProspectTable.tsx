'use client'
// Story 88.2 — Tableau CRM clubs prospects : 7 colonnes
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import type { ClubProspectListRow } from '@aureak/types'
import { ProspectStatusBadge } from './ProspectStatusBadge'

type Props = {
  rows: ClubProspectListRow[]
  /** Story 88.6 — actions rapides Converti/Perdu (mode closing). */
  onConvertClick?: (row: ClubProspectListRow) => void
  onLostClick?   : (row: ClubProspectListRow) => void
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

export function ProspectTable({ rows, onConvertClick, onLostClick }: Props) {
  const router = useRouter()
  const hasActions = !!(onConvertClick || onLostClick)

  if (rows.length === 0) {
    return (
      <View style={s.emptyState}>
        <AureakText style={s.emptyText as never}>Aucun prospect pour le moment.</AureakText>
      </View>
    )
  }

  return (
    <View style={s.wrapper}>
      <View style={s.tableHeader}>
        <View style={{ flex: 2 }}><AureakText style={s.th as never}>CLUB</AureakText></View>
        <View style={{ flex: 1 }}><AureakText style={s.th as never}>VILLE</AureakText></View>
        <View style={{ width: 170 }}><AureakText style={s.th as never}>STATUT</AureakText></View>
        <View style={{ width: 90 }}><AureakText style={s.th as never}>CONTACTS</AureakText></View>
        <View style={{ flex: 1.2 }}><AureakText style={s.th as never}>DÉCISIONNAIRE</AureakText></View>
        <View style={{ flex: 1 }}><AureakText style={s.th as never}>COMMERCIAL</AureakText></View>
        <View style={{ width: 110 }}><AureakText style={s.th as never}>DERNIÈRE ACTION</AureakText></View>
        {hasActions && <View style={{ width: 180 }}><AureakText style={s.th as never}>ACTIONS</AureakText></View>}
      </View>

      {rows.map((r, idx) => {
        const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        return (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/prospection/clubs/${r.id}` as never)}
            style={({ pressed }) => [s.row, { backgroundColor: rowBg }, pressed && { opacity: 0.75 }] as never}
          >
            <View style={{ flex: 2 }}>
              <View style={s.clubCell}>
                <AureakText style={s.clubName as never}>{r.clubName}</AureakText>
                {r.clubDirectoryId === null && (
                  <View style={s.notLinkedBadge}>
                    <AureakText style={s.notLinkedLabel as never}>NON LIÉ</AureakText>
                  </View>
                )}
              </View>
              {r.directory?.matricule && (
                <AureakText style={s.clubMatricule as never}>Matricule {r.directory.matricule}</AureakText>
              )}
            </View>
            <AureakText style={[s.cellMuted, { flex: 1 }] as never}>{r.city ?? '—'}</AureakText>
            <View style={{ width: 170 }}>
              <ProspectStatusBadge status={r.status} />
            </View>
            <AureakText style={[s.cellBold, { width: 90 }] as never}>{r.contactsCount}</AureakText>
            <AureakText style={[s.cellMuted, { flex: 1.2 }] as never}>
              {r.decisionnaireName ?? '—'}
            </AureakText>
            <AureakText style={[s.cellMuted, { flex: 1 }] as never}>
              {r.assignedDisplayName ?? '—'}
            </AureakText>
            <AureakText style={[s.cellMuted, { width: 110 }] as never}>
              {relativeDate(r.updatedAt)}
            </AureakText>
            {hasActions && (
              <View style={[s.actionsCell, { width: 180 }] as never}>
                {onConvertClick && (
                  <Pressable
                    style={s.convertBtn}
                    onPress={e => { e.stopPropagation?.(); onConvertClick(r) }}
                  >
                    <AureakText style={s.convertBtnLabel as never}>✓ Converti</AureakText>
                  </Pressable>
                )}
                {onLostClick && (
                  <Pressable
                    style={s.lostBtn}
                    onPress={e => { e.stopPropagation?.(); onLostClick(r) }}
                  >
                    <AureakText style={s.lostBtnLabel as never}>✕ Perdu</AureakText>
                  </Pressable>
                )}
              </View>
            )}
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
  clubCell: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  clubName: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '700',
  },
  clubMatricule: {
    color   : colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  notLinkedBadge: {
    paddingHorizontal: 6,
    paddingVertical  : 1,
    backgroundColor  : colors.status.amberText + '22',
    borderRadius     : radius.xs,
  },
  notLinkedLabel: {
    color        : colors.status.amberText,
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.3,
  },
  cellMuted: {
    color   : colors.text.muted,
    fontSize: 12,
  },
  cellBold: {
    color     : colors.text.dark,
    fontSize  : 13,
    fontWeight: '700',
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

  actionsCell: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  convertBtn : {
    paddingHorizontal: 10,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    backgroundColor  : colors.status.present,
  },
  convertBtnLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lostBtn : {
    paddingHorizontal: 10,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.status.absent,
  },
  lostBtnLabel: { color: colors.status.absent, fontSize: 11, fontWeight: '700' },
})
