// Story 89.1 — Liste résultats recherche annuaire (child_directory)
// Mobile-first : items pleine largeur, tap-target ≥ 44 px, tokens uniquement
'use client'

import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import type { ChildDirectoryEntry, ProspectStatus } from '@aureak/types'

// ── Props ────────────────────────────────────────────────────────────────────

export type ProspectSearchResultsProps = {
  results   : ChildDirectoryEntry[]
  loading   : boolean
  /** Query courante (utilisé pour le message "aucun résultat") */
  query     : string
  onSelect  : (entry: ChildDirectoryEntry) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function birthYear(iso: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-/)
  return m ? m[1] : '—'
}

function prospectLabel(status: ProspectStatus | null): string | null {
  if (!status) return null
  const labels: Record<ProspectStatus, string> = {
    prospect: 'Prospect',
    contacte: 'Contacté',
    invite  : 'Invité',
    candidat: 'Candidat',
  }
  return labels[status] ?? status
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProspectSearchResults({ results, loading, query, onSelect }: ProspectSearchResultsProps) {
  if (loading) {
    return (
      <View style={st.loadingBox}>
        <AureakText style={st.loadingText as never}>Recherche…</AureakText>
      </View>
    )
  }
  if (query.trim().length >= 2 && results.length === 0) {
    return (
      <View style={st.emptyBox}>
        <AureakText style={st.emptyText as never}>
          Aucun gardien trouvé pour « {query.trim()} »
        </AureakText>
      </View>
    )
  }
  if (results.length === 0) return null

  return (
    <View style={st.list}>
      {results.map(entry => {
        const label = prospectLabel(entry.prospectStatus)
        return (
          <Pressable
            key={entry.id}
            style={({ hovered, pressed }) => [
              st.item,
              (hovered || pressed) && st.itemHover,
            ] as never}
            onPress={() => onSelect(entry)}
          >
            <View style={st.itemMain}>
              <AureakText style={st.itemName as never}>{entry.displayName}</AureakText>
              <AureakText style={st.itemSub as never}>
                Né(e) en {birthYear(entry.birthDate)}
                {entry.currentClub ? ` · ${entry.currentClub}` : ''}
              </AureakText>
            </View>
            {label && (
              <View style={st.badge}>
                <AureakText style={st.badgeText as never}>{label}</AureakText>
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  list: {
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    overflow         : 'hidden',
  },
  item: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 56,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    gap              : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  itemHover: {
    backgroundColor  : colors.light.hover,
  },
  itemMain: { flex: 1, gap: 2 },
  itemName: {
    color    : colors.text.dark,
    fontSize : 14,
    fontWeight: '600',
  },
  itemSub: {
    color    : colors.text.muted,
    fontSize : 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
    backgroundColor  : colors.status.amberBg,
    borderWidth      : 1,
    borderColor      : colors.status.amberDarkBg,
  },
  badgeText: {
    color     : colors.status.amberText,
    fontSize  : 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  loadingBox: {
    paddingVertical  : space.md,
    paddingHorizontal: space.md,
    alignItems       : 'center',
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  loadingText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
  emptyBox: {
    paddingVertical  : space.md,
    paddingHorizontal: space.md,
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
