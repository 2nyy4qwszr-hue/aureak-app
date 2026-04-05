// RadarChart.tsx — Radar chart 6 axes SVG pur (Story 52-10)
// Hexagonal, 6 attributs gardien : PLO/TIR/TEC/TAC/PHY/MEN
// Web : éléments SVG JSX natifs React. Native : barres horizontales de fallback.
// Aucune librairie de chart tierce.

import React from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, fonts } from '@aureak/theme'
import type { PlayerTier } from '@aureak/types'

// PlayerStats défini localement pour éviter la dépendance circulaire avec @aureak/business-logic
export type PlayerStats = {
  PLO: number
  TIR: number
  TEC: number
  TAC: number
  PHY: number
  MEN: number
}
import { Text as AureakText } from './components/Text'

export type { PlayerTier }

export type RadarChartProps = {
  stats: PlayerStats
  tier : PlayerTier
  size?: number
}

// ── Constantes ────────────────────────────────────────────────────────────────

const AXES: { key: keyof PlayerStats; label: string }[] = [
  { key: 'PLO', label: 'PLO' },
  { key: 'TIR', label: 'TIR' },
  { key: 'TEC', label: 'TEC' },
  { key: 'TAC', label: 'TAC' },
  { key: 'PHY', label: 'PHY' },
  { key: 'MEN', label: 'MEN' },
]

const MAX_VALUE = 100

/** Couleur de fond (fill) du polygone selon le tier */
const TIER_FILL: Record<PlayerTier, string> = {
  Prospect   : '#909090',
  Académicien: '#555555',
  Confirmé   : '#C1AC5C',
  Elite      : '#FFE566',
}

// ── Helpers géométriques ──────────────────────────────────────────────────────

/**
 * Convertit un angle (rad) + valeur en coordonnées cartésiennes.
 * Origine axe 0 = haut (12h), rotation sens horaire.
 * x = cx + r * sin(angle) ; y = cy - r * cos(angle)
 */
function polarToCartesian(
  angle   : number,
  value   : number,
  maxValue: number,
  radius  : number,
  cx      : number,
  cy      : number,
): { x: number; y: number } {
  const ratio = value / maxValue
  return {
    x: cx + radius * ratio * Math.sin(angle),
    y: cy - radius * ratio * Math.cos(angle),
  }
}

/** Retourne la string SVG `points` pour le polygone de données */
function computePolygonPoints(
  stats   : PlayerStats,
  maxValue: number,
  radius  : number,
  cx      : number,
  cy      : number,
): string {
  return AXES.map((axis, i) => {
    const angle = (i * Math.PI * 2) / AXES.length  // 0, PI/3, 2PI/3 …
    const { x, y } = polarToCartesian(angle, stats[axis.key], maxValue, radius, cx, cy)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

/** Retourne la string SVG `points` pour un anneau de grille à pct% du rayon */
function computeGridPoints(
  pct   : number,
  radius: number,
  cx    : number,
  cy    : number,
): string {
  return AXES.map((_, i) => {
    const angle = (i * Math.PI * 2) / AXES.length
    const r = radius * pct
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

// ── Implémentation Web (SVG JSX natif) ────────────────────────────────────────

function RadarChartWeb({ stats, tier, size }: Required<RadarChartProps>) {
  const cx     = size / 2
  const cy     = size / 2
  const radius = (size / 2) * 0.72  // marge pour les labels

  const dataPoints   = computePolygonPoints(stats, MAX_VALUE, radius, cx, cy)
  const grid33       = computeGridPoints(0.33, radius, cx, cy)
  const grid66       = computeGridPoints(0.66, radius, cx, cy)
  const grid100      = computeGridPoints(1,    radius, cx, cy)
  const fillColor    = TIER_FILL[tier]
  const strokeColor  = fillColor

  return (
    <View style={{ width: size, height: size }}>
      {/* @ts-ignore — éléments SVG JSX natifs React valides en Expo Router web */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' } as never}
      >
        {/* ── Grille hexagonale concentriques ── */}
        {/* @ts-ignore */}
        <polygon
          points={grid33}
          fill="none"
          stroke={colors.border.light}
          strokeWidth={0.5}
        />
        {/* @ts-ignore */}
        <polygon
          points={grid66}
          fill="none"
          stroke={colors.border.light}
          strokeWidth={0.5}
        />
        {/* @ts-ignore */}
        <polygon
          points={grid100}
          fill="none"
          stroke={colors.border.light}
          strokeWidth={0.5}
        />

        {/* ── Axes du centre vers l'extrémité ── */}
        {AXES.map((_, i) => {
          const angle = (i * Math.PI * 2) / AXES.length
          const ex = cx + radius * Math.sin(angle)
          const ey = cy - radius * Math.cos(angle)
          return (
            // @ts-ignore
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={ex.toFixed(2)}
              y2={ey.toFixed(2)}
              stroke={colors.border.light}
              strokeWidth={0.5}
            />
          )
        })}

        {/* ── Polygone des données joueur ── */}
        {/* @ts-ignore */}
        <polygon
          points={dataPoints}
          fill={fillColor + '4D'}   // 30% opacité (hex 4D ≈ 0.30)
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* ── Labels axes + valeurs ── */}
        {AXES.map((axis, i) => {
          const angle  = (i * Math.PI * 2) / AXES.length
          const labelR = radius * 1.22  // juste au-delà de la grille
          const lx     = cx + labelR * Math.sin(angle)
          const ly     = cy - labelR * Math.cos(angle)

          // Alignement textuel selon la position angulaire
          const anchors = ['middle', 'start', 'start', 'middle', 'end', 'end'] as const
          const textAnchor = anchors[i] ?? 'middle'

          return (
            // @ts-ignore
            <text
              key={axis.key}
              x={lx.toFixed(2)}
              y={(ly - 4).toFixed(2)}
              textAnchor={textAnchor}
              fontSize={9}
              fontFamily={fonts.mono}
              fill={colors.text.muted}
            >
              {axis.label}
              {/* @ts-ignore */}
              <tspan
                x={lx.toFixed(2)}
                dy="10"
                fontSize={8}
                fill={colors.text.subtle}
              >
                {stats[axis.key]}
              </tspan>
            </text>
          )
        })}
      </svg>
    </View>
  )
}

// ── Implémentation native — barres horizontales (fallback sans react-native-svg) ──

function RadarChartNative({ stats, size }: { stats: PlayerStats; size: number }) {
  return (
    <View style={[native.container, { width: size }]}>
      {AXES.map(axis => {
        const value  = stats[axis.key]
        const fillPct = (value / MAX_VALUE) * 100
        return (
          <View key={axis.key} style={native.row}>
            <AureakText style={native.label as never}>{axis.label}</AureakText>
            <View style={native.track}>
              <View style={[native.fill, { width: `${fillPct}%` as never }]} />
            </View>
            <AureakText style={native.value as never}>{value}</AureakText>
          </View>
        )
      })}
    </View>
  )
}

const native = StyleSheet.create({
  container: { gap: 6, paddingVertical: 8 },
  row      : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label    : { width: 36, fontSize: 10, color: colors.text.muted, fontWeight: '600' as never },
  track    : { flex: 1, height: 6, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' as never },
  fill     : { height: '100%' as never, backgroundColor: colors.accent.gold, borderRadius: 3 },
  value    : { width: 28, fontSize: 10, color: colors.text.dark, textAlign: 'right' as never },
})

// ── RadarChart — composant principal ─────────────────────────────────────────

export function RadarChart({ stats, tier, size = 200 }: RadarChartProps) {
  if (Platform.OS === 'web') {
    return <RadarChartWeb stats={stats} tier={tier} size={size} />
  }
  return <RadarChartNative stats={stats} size={size} />
}
