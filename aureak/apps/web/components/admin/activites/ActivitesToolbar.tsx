'use client'
// Story 93.7 — ActivitesToolbar : chips scope + bouton Filtres + segmented temporal
// Source : /tmp/aureak-template/activites.jsx Toolbar + admin.css `.toolbar` `.chip` `.segmented`.
// Remplace l'ancienne paire FiltresScope + PseudoFiltresTemporels.
import React from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts } from '@aureak/theme'
import type { ScopeState } from './FiltresScope'
import type { TemporalFilter } from './PseudoFiltresTemporels'

type ScopeKey = ScopeState['scope']

const SCOPE_CHIPS: { key: ScopeKey; label: string; hasDropdown: boolean; isGold?: boolean }[] = [
  { key: 'global',       label: 'Toutes',       hasDropdown: false, isGold: true },
  { key: 'implantation', label: 'Implantation', hasDropdown: true  },
  { key: 'groupe',       label: 'Groupe',       hasDropdown: true  },
  // Note : FiltresScope actuel n'a pas joueur/coach — placés en dropdown future
]

const TEMPORAL_OPTIONS: { key: TemporalFilter; label: string }[] = [
  { key: 'today',    label: "Aujourd'hui" },
  { key: 'upcoming', label: 'À venir'     },
  { key: 'past',     label: 'Passées'     },
]

export type ActivitesToolbarProps = {
  scope          : ScopeState
  onScopeChange  : (s: ScopeState) => void
  temporal       : TemporalFilter
  onTemporalChange: (t: TemporalFilter) => void
}

export function ActivitesToolbar({
  scope,
  onScopeChange,
  temporal,
  onTemporalChange,
}: ActivitesToolbarProps) {
  return (
    <View style={s.container}>
      {/* Chips scope (gauche) */}
      <View style={s.chipsRow}>
        {SCOPE_CHIPS.map(chip => {
          const isActive = scope.scope === chip.key
          const goldActive = isActive && chip.isGold
          const darkActive = isActive && !chip.isGold
          return (
            <Pressable
              key={chip.key}
              onPress={() => onScopeChange({ scope: chip.key } as ScopeState)}
              style={({ pressed }) => [
                s.chip,
                goldActive && s.chipGoldActive,
                darkActive && s.chipDarkActive,
                pressed && !isActive && s.chipPressed,
              ] as never}
            >
              <AureakText
                style={(goldActive ? s.chipLabelGoldActive
                  : darkActive ? s.chipLabelDarkActive
                  : s.chipLabel) as TextStyle}
              >
                {chip.label}
              </AureakText>
              {chip.hasDropdown && (
                <AureakText
                  style={(isActive ? s.chipDropdownActive : s.chipDropdown) as TextStyle}
                >
                  ▾
                </AureakText>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* Bouton Filtres + Segmented temporal (droite) */}
      <View style={s.right}>
        <Pressable style={({ pressed }) => [s.chip, pressed && s.chipPressed] as never}>
          <AureakText style={s.chipLabel as TextStyle}>⊞ Filtres</AureakText>
        </Pressable>

        <View style={s.segmented}>
          {TEMPORAL_OPTIONS.map(opt => {
            const isActive = temporal === opt.key
            return (
              <Pressable
                key={opt.key}
                onPress={() => onTemporalChange(opt.key)}
                style={[s.segmentedBtn, isActive && s.segmentedBtnActive] as never}
              >
                <AureakText
                  style={(isActive ? s.segmentedLabelActive : s.segmentedLabel) as TextStyle}
                >
                  {opt.label}
                </AureakText>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default ActivitesToolbar

const s = StyleSheet.create({
  container: {
    flexDirection : 'row',
    alignItems    : 'center',
    flexWrap      : 'wrap',
    gap           : 10,
    paddingTop    : 12,
    paddingRight  : 6,
    paddingBottom : 6,
    paddingLeft   : 6,
  },

  // Chips scope
  chipsRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    flexWrap     : 'wrap',
    gap          : 8,
  },
  chip: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 6,
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : 999,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  chipPressed: {
    borderColor: colors.text.subtle,
  },
  chipGoldActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  chipDarkActive: {
    backgroundColor: colors.text.dark,
    borderColor    : colors.text.dark,
  },
  chipLabel: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '500',
    color     : colors.text.subtle,
  },
  chipLabelGoldActive: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '500',
    color     : colors.text.onGold,
  },
  chipLabelDarkActive: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '500',
    color     : colors.text.primary,
  },
  chipDropdown: {
    color   : colors.text.muted,
    fontSize: 12,
  },
  chipDropdownActive: {
    color   : colors.overlay.lightTopbar,
    fontSize: 12,
  },

  // Right (Filtres + segmented)
  right: {
    marginLeft   : 'auto',
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 6,
    flexWrap     : 'wrap',
  },

  // Segmented temporal (template `.segmented`)
  segmented: {
    flexDirection  : 'row',
    padding        : 4,
    backgroundColor: colors.light.muted, // zinc-100
    borderRadius   : 999,
    gap            : 2,
  },
  segmentedBtn: {
    paddingHorizontal: 16,
    paddingVertical  : 7,
    borderRadius     : 999,
  },
  segmentedBtnActive: {
    backgroundColor: colors.light.surface,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow web-only
    boxShadow      : '0 1px 3px rgba(0,0,0,0.06)',
  },
  segmentedLabel: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color        : colors.text.muted,
  },
  segmentedLabelActive: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color        : colors.text.dark,
  },
})
