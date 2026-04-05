// ComparisonRadarChart.tsx — Radar chart comparaison 2 joueurs (Story 55-2)
// SVG pur 6 axes gardien : Technique, Placement, Relance, Agilité, Mental, Communication
// Superposition 2 polygones colorés : gold (joueur A) + bleu (joueur B)
// Aucune librairie chart tierce.

import React, { useState } from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import { Text as AureakText } from './components/Text'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Profil radar d'un joueur : valeurs par axe (0–10) */
export type RadarPlayer = {
  name  : string
  scores: Record<string, number>  // clé = axe label
}

export type ComparisonRadarChartProps = {
  players : RadarPlayer[]   // max 2 joueurs
  axes    : string[]        // labels des 6 axes
  size?   : number
}

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAYER_A_COLOR = colors.accent.gold     // '#C1AC5C'
const PLAYER_B_COLOR = '#3B82F6'              // bleu — non disponible dans tokens

// ── Helpers géométriques ──────────────────────────────────────────────────────

function polarToXY(
  angle: number, value: number, maxValue: number,
  r: number, cx: number, cy: number,
): { x: number; y: number } {
  const ratio = value / maxValue
  return {
    x: cx + r * ratio * Math.sin(angle),
    y: cy - r * ratio * Math.cos(angle),
  }
}

function polygonPoints(
  scores: Record<string, number>, axes: string[],
  maxValue: number, r: number, cx: number, cy: number,
): string {
  return axes.map((ax, i) => {
    const angle = (i * Math.PI * 2) / axes.length
    const value = scores[ax] ?? 0
    const { x, y } = polarToXY(angle, value, maxValue, r, cx, cy)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

function gridPoints(pct: number, axes: string[], r: number, cx: number, cy: number): string {
  return axes.map((_, i) => {
    const angle = (i * Math.PI * 2) / axes.length
    const x = cx + r * pct * Math.sin(angle)
    const y = cy - r * pct * Math.cos(angle)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

// ── Implémentation Web (SVG JSX natif) ────────────────────────────────────────

function ComparisonRadarWeb({
  players, axes, size = 300,
}: Required<ComparisonRadarChartProps>) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)
  const cx  = size / 2
  const cy  = size / 2
  const r   = (size / 2) * 0.68
  const max = 10

  const grid25  = gridPoints(0.25, axes, r, cx, cy)
  const grid50  = gridPoints(0.5,  axes, r, cx, cy)
  const grid75  = gridPoints(0.75, axes, r, cx, cy)
  const grid100 = gridPoints(1,    axes, r, cx, cy)

  const playerColors = [PLAYER_A_COLOR, PLAYER_B_COLOR]

  return (
    <View style={{ width: size }}>
      {/* @ts-ignore */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' } as never}
      >
        {/* ── Grilles concentriques ── */}
        {[grid25, grid50, grid75, grid100].map((pts, gi) => (
          // @ts-ignore
          <polygon
            key={gi}
            points={pts}
            fill="none"
            stroke={colors.border.light}
            strokeWidth={gi === 3 ? 1 : 0.6}
          />
        ))}

        {/* ── Axes du centre ── */}
        {axes.map((_, i) => {
          const angle = (i * Math.PI * 2) / axes.length
          const ex = cx + r * Math.sin(angle)
          const ey = cy - r * Math.cos(angle)
          return (
            // @ts-ignore
            <line
              key={i}
              x1={cx} y1={cy}
              x2={ex.toFixed(2)} y2={ey.toFixed(2)}
              stroke={colors.border.light} strokeWidth={0.6}
            />
          )
        })}

        {/* ── Polygones des joueurs ── */}
        {players.slice(0, 2).map((player, pi) => {
          const color = playerColors[pi]!
          const pts   = polygonPoints(player.scores, axes, max, r, cx, cy)
          return (
            // @ts-ignore
            <polygon
              key={pi}
              points={pts}
              fill={color + '4D'}       // 30% opacité
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )
        })}

        {/* ── Labels axes + scores permanents ── */}
        {axes.map((ax, i) => {
          const angle   = (i * Math.PI * 2) / axes.length
          const labelR  = r * 1.25
          const lx      = cx + labelR * Math.sin(angle)
          const ly      = cy - labelR * Math.cos(angle)
          const anchors = ['middle', 'start', 'start', 'middle', 'end', 'end'] as const
          const anchor  = anchors[i] ?? 'middle'

          return (
            <React.Fragment key={ax}>
              {/* Label axe */}
              {/* @ts-ignore */}
              <text
                x={lx.toFixed(2)} y={(ly - 4).toFixed(2)}
                textAnchor={anchor}
                fontSize={9} fill={colors.text.muted}
              >
                {ax}
              </text>

              {/* Scores joueurs sur l'axe (permanents) */}
              {players.slice(0, 2).map((player, pi) => {
                const color  = playerColors[pi]!
                const val    = player.scores[ax] ?? 0
                const pPt    = polarToXY((i * Math.PI * 2) / axes.length, val, max, r, cx, cy)
                return (
                  <React.Fragment key={pi}>
                    {/* Zone hover pour tooltip */}
                    {/* @ts-ignore */}
                    <circle
                      cx={pPt.x.toFixed(2)} cy={pPt.y.toFixed(2)}
                      r={6} fill={color} stroke="#FFFFFF" strokeWidth={1.5}
                      style={{ cursor: 'pointer' } as never}
                      onMouseEnter={() => setTooltip({
                        x: pPt.x, y: pPt.y,
                        label: `${player.name} — ${ax} : ${val.toFixed(1)}`,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}

        {/* ── Tooltip ── */}
        {tooltip && (() => {
          const ttW = 140
          const ttH = 30
          const ttX = Math.min(Math.max(tooltip.x - ttW / 2, 0), size - ttW)
          const ttY = tooltip.y - ttH - 8
          return (
            <>
              {/* @ts-ignore */}
              <rect x={ttX} y={ttY} width={ttW} height={ttH} rx={6} fill="#18181B" opacity={0.9} />
              {/* @ts-ignore */}
              <text x={ttX + ttW / 2} y={ttY + 19} textAnchor="middle" fontSize={10} fill="#FFFFFF">
                {tooltip.label}
              </text>
            </>
          )
        })()}
      </svg>

      {/* ── Légende ── */}
      <View style={legendStyles.row}>
        {players.slice(0, 2).map((player, pi) => (
          <View key={pi} style={legendStyles.item}>
            <View style={[legendStyles.dot, { backgroundColor: playerColors[pi]! }]} />
            <AureakText style={legendStyles.name as never} numberOfLines={1}>
              {player.name}
            </AureakText>
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Implémentation native — barres de comparaison (fallback) ──────────────────

function ComparisonRadarNative({ players, axes, size = 300 }: ComparisonRadarChartProps) {
  return (
    <View style={[native.container, { width: size }]}>
      {axes.map(ax => {
        const scores = players.slice(0, 2).map(p => p.scores[ax] ?? 0)
        return (
          <View key={ax} style={native.row}>
            <AureakText style={native.label as never}>{ax}</AureakText>
            <View style={native.bars}>
              {scores.map((s, pi) => (
                <View key={pi} style={native.track}>
                  <View
                    style={[
                      native.fill,
                      {
                        width: `${(s / 10) * 100}%` as never,
                        backgroundColor: pi === 0 ? PLAYER_A_COLOR : PLAYER_B_COLOR,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const native = StyleSheet.create({
  container: { gap: 8 },
  row      : { flexDirection: 'row' as never, alignItems: 'center' as never, gap: 8 },
  label    : { width: 88, fontSize: 10, color: colors.text.muted },
  bars     : { flex: 1, gap: 3 },
  track    : { height: 5, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' as never },
  fill     : { height: '100%' as never, borderRadius: 3 },
})

const legendStyles = StyleSheet.create({
  row : { flexDirection: 'row' as never, justifyContent: 'center' as never, gap: space.lg, marginTop: space.sm },
  item: { flexDirection: 'row' as never, alignItems: 'center' as never, gap: space.xs },
  dot : { width: 10, height: 10, borderRadius: radius.badge },
  name: { fontSize: 12, color: colors.text.dark },
})

// ── ComparisonRadarChart — composant principal ────────────────────────────────

export function ComparisonRadarChart({
  players,
  axes,
  size = 300,
}: ComparisonRadarChartProps) {
  if (Platform.OS === 'web') {
    return <ComparisonRadarWeb players={players} axes={axes} size={size} />
  }
  return <ComparisonRadarNative players={players} axes={axes} size={size} />
}
