'use client'
// @aureak/ui — LineChart SVG pur (Story 60.2)
// RÈGLE : zéro accès Supabase, zéro librairie chart externe — SVG manuellement rendu
// RÈGLE : styles via @aureak/theme tokens uniquement

import React, { useState, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors, radius, transitions } from '@aureak/theme'
import type { LineChartSeries, LineChartPoint } from '@aureak/types'

// ── Palette par défaut ────────────────────────────────────────────────────────
export const SERIES_COLORS: string[] = [
  colors.accent.gold,
  colors.status.success,
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#F59E0B',
  '#06B6D4',
  colors.accent.red,
]

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LineChartProps {
  data       : LineChartSeries[]
  width?     : number
  height?    : number
  showLegend?: boolean
}

interface TooltipData {
  month : string
  values: { label: string; color: string; value: number; sessionCount?: number }[]
  x     : number
}

// ── Formatage mois ────────────────────────────────────────────────────────────
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const idx = parseInt(month, 10) - 1
  return `${MONTHS_FR[idx] ?? month} ${year}`
}

// ── Composant principal ───────────────────────────────────────────────────────
export function LineChart({ data, width = 600, height = 280, showLegend = true }: LineChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip]           = useState<TooltipData | null>(null)

  const toggleSeries = useCallback((id: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Extraire tous les mois présents dans les données
  const allMonths = Array.from(
    new Set(data.flatMap(s => s.points.map(p => p.month)))
  ).sort()

  const PAD_LEFT   = 48
  const PAD_RIGHT  = 16
  const PAD_TOP    = 16
  const PAD_BOTTOM = 32
  const chartW = width  - PAD_LEFT - PAD_RIGHT
  const chartH = height - PAD_TOP  - PAD_BOTTOM

  const nMonths = allMonths.length
  const xStep   = nMonths > 1 ? chartW / (nMonths - 1) : chartW

  const getX = (idx: number) => PAD_LEFT + idx * xStep
  const getY = (val: number) => PAD_TOP  + chartH - (val / 100) * chartH

  // Grid Y labels
  const Y_TICKS = [0, 25, 50, 75, 100]

  const handleMouseMove = useCallback((monthIdx: number, clientX: number) => {
    const month  = allMonths[monthIdx]
    if (!month) return
    const values = data
      .filter(s => !hiddenSeries.has(s.id))
      .map(s => {
        const pt = s.points.find(p => p.month === month)
        return {
          label       : s.label,
          color       : s.color,
          value       : pt?.value ?? 0,
          sessionCount: (pt?.meta?.sessionCount as number | undefined),
        }
      })
    setTooltip({ month, values, x: clientX })
  }, [allMonths, data, hiddenSeries])

  if (data.length === 0 || allMonths.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height, backgroundColor: colors.light.surface, borderRadius: radius.card }}>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>Aucune donnée de présence sur cette période</Text>
      </View>
    )
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* SVG Chart */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grille Y */}
        {Y_TICKS.map(tick => {
          const y = getY(tick)
          return (
            <g key={tick}>
              <line
                x1={PAD_LEFT} y1={y} x2={PAD_LEFT + chartW} y2={y}
                stroke={colors.border.light}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.text.muted}
              >
                {tick}%
              </text>
            </g>
          )
        })}

        {/* Labels X — mois */}
        {allMonths.map((m, idx) => {
          // Sur mobile (width < 500) : afficher 1 sur 2
          if (width < 500 && idx % 2 !== 0) return null
          return (
            <text
              key={m}
              x={getX(idx)}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill={colors.text.muted}
            >
              {formatMonth(m).slice(0, 6)}
            </text>
          )
        })}

        {/* Lignes séries */}
        {data.map(series => {
          if (hiddenSeries.has(series.id)) return null
          const pts = allMonths.map((m, idx) => {
            const pt = series.points.find(p => p.month === m)
            return `${getX(idx)},${getY(pt?.value ?? 0)}`
          })
          return (
            <polyline
              key={series.id}
              points={pts.join(' ')}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )
        })}

        {/* Points interactifs */}
        {data.map(series => {
          if (hiddenSeries.has(series.id)) return null
          return allMonths.map((m, idx) => {
            const pt = series.points.find(p => p.month === m)
            if (!pt) return null
            return (
              <circle
                key={`${series.id}-${m}`}
                cx={getX(idx)}
                cy={getY(pt.value)}
                r={4}
                fill={series.color}
                stroke={colors.light.surface}
                strokeWidth={2}
              />
            )
          })
        })}

        {/* Zones hover invisibles (colonnes mois) */}
        {allMonths.map((m, idx) => {
          const x0 = getX(idx) - xStep / 2
          const w0 = idx === 0 ? xStep / 2 : (idx === allMonths.length - 1 ? xStep / 2 : xStep)
          return (
            <rect
              key={`hover-${m}`}
              x={Math.max(PAD_LEFT, x0)}
              y={PAD_TOP}
              width={w0}
              height={chartH}
              fill="transparent"
              onMouseEnter={(e) => handleMouseMove(idx, e.clientX)}
            />
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <View
          style={{
            position       : 'absolute' as never,
            top            : 0,
            left           : Math.min(tooltip.x, width - 160),
            backgroundColor: colors.background.elevated,
            borderRadius   : radius.xs,
            padding        : 10,
            minWidth       : 140,
            boxShadow      : '0 4px 12px rgba(0,0,0,0.2)',
            zIndex         : 10,
            pointerEvents  : 'none' as never,
          } as never}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
            {formatMonth(tooltip.month)}
          </Text>
          {tooltip.values.map(v => (
            <View key={v.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: v.color, marginRight: 6 }} />
              <Text style={{ color: colors.text.secondary, fontSize: 11, flex: 1 }}>{v.label}</Text>
              <Text style={{ color: colors.text.primary, fontSize: 11, fontWeight: '700' }}>{v.value}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Légende */}
      {showLegend && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
          {data.map(series => (
            <Pressable
              key={series.id}
              onPress={() => toggleSeries(series.id)}
              style={{
                flexDirection : 'row',
                alignItems    : 'center',
                paddingVertical : 4,
                paddingHorizontal: 8,
                borderRadius  : radius.xs,
                backgroundColor: hiddenSeries.has(series.id) ? colors.light.muted : colors.light.surface,
                borderWidth   : 1,
                borderColor   : colors.border.light,
                opacity       : hiddenSeries.has(series.id) ? 0.5 : 1,
              } as never}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: series.color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: colors.text.dark }}>{series.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

export type { LineChartSeries, LineChartPoint }
