// Story 56-6 — Indicateur de capacité groupe avec seuils de couleur
// Seuils : < 80% neutre, 80–99% orange, 100% rouge, > 100% rouge vif
// RÈGLE : styles uniquement via @aureak/theme tokens
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import { AureakText } from './components/Text'

// ── Seuils couleur ────────────────────────────────────────────────────────────

const COLOR_NORMAL    = colors.text.muted
const COLOR_WARNING   = '#F59E0B'   // orange attention
const COLOR_FULL      = colors.status.errorStrong
const COLOR_OVERFLOW  = '#DC2626'   // rouge vif surplein

export type CapacityStatus = 'normal' | 'warning' | 'full' | 'overflow'

export function getCapacityStatus(memberCount: number, maxPlayers: number): CapacityStatus {
  const rate = maxPlayers > 0 ? memberCount / maxPlayers : 0
  if (memberCount > maxPlayers) return 'overflow'
  if (rate >= 1)                return 'full'
  if (rate >= 0.8)              return 'warning'
  return 'normal'
}

export function getCapacityColor(status: CapacityStatus): string {
  switch (status) {
    case 'overflow': return COLOR_OVERFLOW
    case 'full':     return COLOR_FULL
    case 'warning':  return COLOR_WARNING
    default:         return COLOR_NORMAL
  }
}

export function getCapacityTooltip(memberCount: number, maxPlayers: number): string {
  if (memberCount > maxPlayers) return `Surplein — ${memberCount - maxPlayers} joueur(s) en trop`
  if (memberCount === maxPlayers) return 'Groupe complet — plus d\'inscriptions possibles'
  const free = maxPlayers - memberCount
  return `${free} place(s) disponible(s)`
}

// ── Composant ─────────────────────────────────────────────────────────────────

export interface CapacityIndicatorProps {
  memberCount: number
  maxPlayers : number
  /** Mode compact pour la GroupCard (pas de badge textuel, juste texte coloré) */
  compact?   : boolean
}

export function CapacityIndicator({ memberCount, maxPlayers, compact = false }: CapacityIndicatorProps) {
  const status  = getCapacityStatus(memberCount, maxPlayers)
  const color   = getCapacityColor(status)
  const tooltip = getCapacityTooltip(memberCount, maxPlayers)

  return (
    // @ts-ignore — title HTML natif pour tooltip web
    <View style={s.row} title={tooltip} accessibilityLabel={tooltip}>
      <AureakText
        variant="caption"
        style={{ ...s.text, color }}
      >
        {memberCount}/{maxPlayers} joueurs
      </AureakText>

      {!compact && status === 'full' && (
        <View style={[s.badge, { backgroundColor: COLOR_FULL + '18', borderColor: COLOR_FULL + '50' }]}>
          <AureakText variant="caption" style={{ ...s.badgeText, color: COLOR_FULL }}>
            Groupe complet
          </AureakText>
        </View>
      )}
      {!compact && status === 'overflow' && (
        <View style={[s.badge, { backgroundColor: COLOR_OVERFLOW + '18', borderColor: COLOR_OVERFLOW + '50' }]}>
          <AureakText variant="caption" style={{ ...s.badgeText, color: COLOR_OVERFLOW }}>
            ⚠ Surplein
          </AureakText>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
    flexWrap     : 'wrap',
  },
  text: {
    fontSize  : 11,
    fontWeight: '600',
  },
  badge: {
    borderRadius     : radius.badge,
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderWidth      : 1,
  },
  badgeText: {
    fontSize  : 9,
    fontWeight: '700',
  },
})
