'use client'
// @aureak/ui — HeatmapGrid (Story 60.3)
// Grille 7 jours × 24h — SVG pur, zéro dépendance externe
// RÈGLE : styles via @aureak/theme tokens uniquement

import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors, radius, transitions } from '@aureak/theme'
import type { HeatmapCell } from '@aureak/types'

// ── Constantes locales de couleur ─────────────────────────────────────────────
const HEATMAP_EMPTY  = colors.light.muted
const HEATMAP_WARM   = '#F5E6C0'
const HEATMAP_MID    = colors.accent.goldLight
const HEATMAP_HOT    = '#B45309'

// ── Calcul couleur par cellule ────────────────────────────────────────────────
function getCellColor(count: number, max: number): string {
  if (count === 0) return HEATMAP_EMPTY
  const ratio = count / Math.max(max, 1)
  if (ratio < 0.3) return HEATMAP_WARM
  if (ratio < 0.6) return HEATMAP_MID
  if (ratio < 0.9) return colors.accent.gold
  return HEATMAP_HOT
}

// ── Jours ─────────────────────────────────────────────────────────────────────
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

// ── Props ─────────────────────────────────────────────────────────────────────
export interface HeatmapGridProps {
  data         : HeatmapCell[][]   // [7][24]
  showAllHours?: boolean
}

interface TooltipState {
  day   : number
  hour  : number
  count : number
  groups: string[]
  x     : number
  y     : number
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function HeatmapGrid({ data, showAllHours: externalShowAll }: HeatmapGridProps) {
  const [internalShowAll, setInternalShowAll] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const showAllHours = externalShowAll ?? internalShowAll

  // Heures affichées
  const HOUR_START = showAllHours ? 0  : 7
  const HOUR_END   = showAllHours ? 23 : 21
  const hours      = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

  // Max count pour interpolation relative
  const max = Math.max(1, ...data.flatMap(dayArr => hours.map(h => dayArr[h]?.count ?? 0)))

  const CELL_W = 36
  const CELL_H = 24
  const LABEL_W = 56
  const LABEL_H = 28

  const totalW = LABEL_W + 7 * CELL_W
  const totalH = LABEL_H + hours.length * CELL_H

  return (
    <View style={{ position: 'relative' }}>
      {/* Toggle button */}
      {externalShowAll === undefined && (
        <Pressable
          onPress={() => setInternalShowAll(v => !v)}
          style={{
            alignSelf       : 'flex-end',
            marginBottom    : 8,
            paddingVertical : 4,
            paddingHorizontal: 10,
            borderRadius    : radius.xs,
            backgroundColor : colors.light.muted,
            borderWidth     : 1,
            borderColor     : colors.border.light,
          } as never}
        >
          <Text style={{ fontSize: 11, color: colors.text.muted }}>
            {internalShowAll ? 'Masquer les heures de nuit' : 'Afficher toutes les heures'}
          </Text>
        </Pressable>
      )}

      {/* Grid SVG */}
      <svg
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{ display: 'block', overflow: 'visible', maxWidth: '100%' } as never}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* En-têtes jours */}
        {DAY_LABELS.map((day, di) => (
          <text
            key={day}
            x={LABEL_W + di * CELL_W + CELL_W / 2}
            y={LABEL_H - 6}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            fill={colors.text.muted}
          >
            {day}
          </text>
        ))}

        {/* Lignes heures */}
        {hours.map((hour, hi) => {
          const y = LABEL_H + hi * CELL_H
          return (
            <g key={hour}>
              {/* Label heure */}
              <text
                x={LABEL_W - 6}
                y={y + CELL_H / 2 + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.text.muted}
              >
                {String(hour).padStart(2, '0')}h
              </text>

              {/* Cellules jour × heure */}
              {data.map((dayArr, di) => {
                const cell  = dayArr[hour] ?? { day: di, hour, count: 0, groups: [] }
                const color = getCellColor(cell.count, max)
                const cx    = LABEL_W + di * CELL_W
                return (
                  <rect
                    key={di}
                    x={cx + 1}
                    y={y + 1}
                    width={CELL_W - 2}
                    height={CELL_H - 2}
                    rx={3}
                    fill={color}
                    style={{ cursor: 'default', transition: `fill ${transitions.fast}` } as never}
                    onMouseEnter={(e: React.MouseEvent) => {
                      setTooltip({ day: di, hour, count: cell.count, groups: cell.groups, x: e.clientX, y: e.clientY })
                    }}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <View
          style={{
            position       : 'absolute' as never,
            top            : 0,
            left           : 0,
            backgroundColor: colors.background.elevated,
            borderRadius   : radius.xs,
            padding        : 10,
            minWidth       : 180,
            boxShadow      : '0 4px 12px rgba(0,0,0,0.25)',
            zIndex         : 20,
            pointerEvents  : 'none' as never,
          } as never}
        >
          <Text style={{ color: colors.accent.gold, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
            {DAY_LABELS[tooltip.day]} — {String(tooltip.hour).padStart(2, '0')}h00–{String(tooltip.hour + 1).padStart(2, '0')}h00
          </Text>
          <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700' }}>
            {tooltip.count} séance{tooltip.count !== 1 ? 's' : ''}
          </Text>
          {tooltip.groups.slice(0, 3).map(g => (
            <Text key={g} style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2 }}>• {g}</Text>
          ))}
          {tooltip.groups.length > 3 && (
            <Text style={{ color: colors.text.muted, fontSize: 10, marginTop: 2 }}>+{tooltip.groups.length - 3} autres</Text>
          )}
        </View>
      )}

      {/* Légende */}
      <HeatmapLegend />
    </View>
  )
}

// ── Légende densité ───────────────────────────────────────────────────────────
function HeatmapLegend() {
  const levels = [
    { color: HEATMAP_EMPTY, label: '0' },
    { color: HEATMAP_WARM,  label: '1–2' },
    { color: colors.accent.gold, label: '3–4' },
    { color: HEATMAP_HOT,  label: '5+' },
  ]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
      <Text style={{ fontSize: 11, color: colors.text.muted, marginRight: 4 }}>Densité :</Text>
      {levels.map(l => (
        <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: l.color, borderWidth: 1, borderColor: colors.border.light }} />
          <Text style={{ fontSize: 11, color: colors.text.muted }}>{l.label}</Text>
        </View>
      ))}
    </View>
  )
}
