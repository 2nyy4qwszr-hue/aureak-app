// GrowthChart.tsx — Timeline de croissance joueur (Story 55-3)
// Graphique ligne SVG pur — courbe lissée cubic bezier, gradient zone, tooltip hover
// Web : éléments SVG JSX React. Native : fallback barres horizontales.
// Aucune librairie chart tierce.

import React, { useState } from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import type { EvaluationPoint } from '@aureak/types'
import { Text as AureakText } from './components/Text'

// ── Props ─────────────────────────────────────────────────────────────────────

export type GrowthChartProps = {
  evaluations : EvaluationPoint[]
  width?      : number
  height?     : number
}

// ── Constantes ────────────────────────────────────────────────────────────────

const PADDING_LEFT   = 32
const PADDING_RIGHT  = 16
const PADDING_TOP    = 16
const PADDING_BOTTOM = 32
const Y_MAX          = 10
const Y_MIN          = 0
const GRID_STEPS     = [0, 2, 4, 6, 8, 10]
const GOLD           = colors.accent.gold
const GOLD_LIGHT     = colors.accent.goldLight
const BORDER         = colors.border.light

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Mappe score (0–10) → coordonnée Y SVG */
function scoreToY(score: number, h: number): number {
  const innerH = h - PADDING_TOP - PADDING_BOTTOM
  return PADDING_TOP + innerH * (1 - (score - Y_MIN) / (Y_MAX - Y_MIN))
}

/** Mappe index → coordonnée X SVG */
function indexToX(idx: number, count: number, w: number): number {
  const innerW = w - PADDING_LEFT - PADDING_RIGHT
  if (count <= 1) return PADDING_LEFT + innerW / 2
  return PADDING_LEFT + (idx / (count - 1)) * innerW
}

/**
 * Calcule le chemin SVG cubic bezier lissé à partir des points.
 * Utilise des points de contrôle à 1/3 de la distance horizontale entre voisins.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`

  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const cpDx = (curr.x - prev.x) / 3
    const cp1x = (prev.x + cpDx).toFixed(2)
    const cp1y = prev.y.toFixed(2)
    const cp2x = (curr.x - cpDx).toFixed(2)
    const cp2y = curr.y.toFixed(2)
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
  }
  return d
}

/** Chemin fermé pour la zone sous la courbe (avec gradient) */
function areaPath(points: { x: number; y: number }[], h: number): string {
  if (points.length < 2) return ''
  const base = (h - PADDING_BOTTOM).toFixed(2)
  const open = `${points[0]!.x.toFixed(2)},${base}`
  const close = `${points[points.length - 1]!.x.toFixed(2)},${base}`
  let d = `M ${open} L ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const cpDx = (curr.x - prev.x) / 3
    const cp1x = (prev.x + cpDx).toFixed(2)
    const cp1y = prev.y.toFixed(2)
    const cp2x = (curr.x - cpDx).toFixed(2)
    const cp2y = curr.y.toFixed(2)
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
  }
  d += ` L ${close} Z`
  return d
}

/** Formate une date ISO en label court "14 jan" */
function shortDate(iso: string): string {
  try {
    const d = new Date(iso)
    const day = d.getDate()
    const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    return `${day} ${month}`
  } catch {
    return ''
  }
}

// ── État vide ─────────────────────────────────────────────────────────────────

function EmptyGrowthChart() {
  return (
    <View style={emptyStyles.container}>
      <AureakText style={emptyStyles.icon as never}>📈</AureakText>
      <AureakText style={emptyStyles.title as never}>Pas assez de données</AureakText>
      <AureakText style={emptyStyles.sub as never}>
        Au moins 2 évaluations sont nécessaires pour afficher la progression.
      </AureakText>
    </View>
  )
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems    : 'center' as never,
    justifyContent: 'center' as never,
    padding       : space.xl,
    gap           : space.xs,
  },
  icon : { fontSize: 32 },
  title: { fontSize: 14, fontWeight: '600' as never, color: colors.text.dark, textAlign: 'center' as never },
  sub  : { fontSize: 12, color: colors.text.muted, textAlign: 'center' as never, maxWidth: 240 },
})

// ── Implémentation web (SVG JSX natif) ────────────────────────────────────────

function GrowthChartWeb({
  evaluations,
  width  = 400,
  height = 200,
}: Required<GrowthChartProps>) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; score: number; date: string; name?: string
  } | null>(null)

  const pts = evaluations.map((ev, i) => ({
    x    : indexToX(i, evaluations.length, width),
    y    : scoreToY(ev.score, height),
    score: ev.score,
    date : ev.date,
    name : ev.sessionName,
  }))

  const linePath = smoothPath(pts)
  const fillPath = areaPath(pts, height)
  const gradId   = 'growthGrad'

  return (
    <View style={{ width, height, position: 'relative' as never }}>
      {/* @ts-ignore */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' } as never}
      >
        {/* ── Définitions ── */}
        {/* @ts-ignore */}
        <defs>
          {/* @ts-ignore */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            {/* @ts-ignore */}
            <stop offset="0%"   stopColor={GOLD}  stopOpacity={0.25} />
            {/* @ts-ignore */}
            <stop offset="100%" stopColor={GOLD}  stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* ── Grille horizontale ── */}
        {GRID_STEPS.map(val => {
          const y = scoreToY(val, height)
          return (
            <React.Fragment key={val}>
              {/* @ts-ignore */}
              <line
                x1={PADDING_LEFT} y1={y.toFixed(2)}
                x2={width - PADDING_RIGHT} y2={y.toFixed(2)}
                stroke={BORDER} strokeWidth={0.8} strokeDasharray="4 3"
              />
              {/* @ts-ignore */}
              <text
                x={(PADDING_LEFT - 4).toFixed(2)} y={(y + 4).toFixed(2)}
                fontSize={9} textAnchor="end" fill={colors.text.muted}
              >
                {val}
              </text>
            </React.Fragment>
          )
        })}

        {/* ── Zone sous la courbe ── */}
        {/* @ts-ignore */}
        <path d={fillPath} fill={`url(#${gradId})`} />

        {/* ── Ligne de tendance ── */}
        {/* @ts-ignore */}
        <path
          d={linePath}
          fill="none"
          stroke={GOLD}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Points + labels X + zones hover ── */}
        {pts.map((pt, i) => (
          <React.Fragment key={i}>
            {/* Zone hover invisible */}
            {/* @ts-ignore */}
            <rect
              x={(pt.x - 16).toFixed(2)}
              y={PADDING_TOP}
              width={32}
              height={height - PADDING_TOP - PADDING_BOTTOM}
              fill="transparent"
              style={{ cursor: 'pointer' } as never}
              onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, score: pt.score, date: pt.date, name: pt.name })}
              onMouseLeave={() => setTooltip(null)}
            />
            {/* Cercle point */}
            {/* @ts-ignore */}
            <circle
              cx={pt.x.toFixed(2)} cy={pt.y.toFixed(2)}
              r={5} fill={GOLD} stroke="#FFFFFF" strokeWidth={1.5}
            />
            {/* Label X date */}
            {/* @ts-ignore */}
            <text
              x={pt.x.toFixed(2)}
              y={(height - PADDING_BOTTOM + 14).toFixed(2)}
              fontSize={8} textAnchor="middle" fill={colors.text.muted}
            >
              {shortDate(pt.date)}
            </text>
          </React.Fragment>
        ))}

        {/* ── Tooltip hover ── */}
        {tooltip && (() => {
          const ttW = 110
          const ttH = 44
          const ttX = Math.min(
            Math.max(tooltip.x - ttW / 2, PADDING_LEFT),
            width - PADDING_RIGHT - ttW
          )
          const ttY = tooltip.y - ttH - 10

          return (
            <>
              {/* @ts-ignore */}
              <rect
                x={ttX.toFixed(2)} y={ttY.toFixed(2)}
                width={ttW} height={ttH}
                rx={6} ry={6}
                fill="#18181B" opacity={0.88}
              />
              {/* @ts-ignore */}
              <text
                x={(ttX + ttW / 2).toFixed(2)} y={(ttY + 15).toFixed(2)}
                fontSize={11} fontWeight="700" textAnchor="middle" fill={GOLD_LIGHT}
              >
                {tooltip.score.toFixed(1)}/10
              </text>
              {/* @ts-ignore */}
              <text
                x={(ttX + ttW / 2).toFixed(2)} y={(ttY + 27).toFixed(2)}
                fontSize={8} textAnchor="middle" fill="#A0A0A0"
              >
                {new Date(tooltip.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
              </text>
              {tooltip.name && (
                // @ts-ignore
                <text
                  x={(ttX + ttW / 2).toFixed(2)} y={(ttY + 38).toFixed(2)}
                  fontSize={8} textAnchor="middle" fill="#A0A0A0"
                >
                  {tooltip.name.slice(0, 16)}
                </text>
              )}
            </>
          )
        })()}
      </svg>
    </View>
  )
}

// ── Implémentation native — barres horizontales (fallback) ────────────────────

function GrowthChartNative({ evaluations, width = 320 }: GrowthChartProps) {
  return (
    <View style={[native.container, { width }]}>
      {evaluations.map((ev, i) => (
        <View key={i} style={native.row}>
          <AureakText style={native.date as never}>{shortDate(ev.date)}</AureakText>
          <View style={native.track}>
            <View style={[native.fill, { width: `${(ev.score / 10) * 100}%` as never }]} />
          </View>
          <AureakText style={native.score as never}>{ev.score.toFixed(1)}</AureakText>
        </View>
      ))}
    </View>
  )
}

const native = StyleSheet.create({
  container: { gap: 6, paddingVertical: 8 },
  row      : { flexDirection: 'row' as never, alignItems: 'center' as never, gap: 8 },
  date     : { width: 44, fontSize: 9, color: colors.text.muted },
  track    : { flex: 1, height: 6, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' as never },
  fill     : { height: '100%' as never, backgroundColor: colors.accent.gold, borderRadius: 3 },
  score    : { width: 28, fontSize: 10, color: colors.text.dark, textAlign: 'right' as never },
})

// ── GrowthChart — composant principal ─────────────────────────────────────────

export function GrowthChart({
  evaluations,
  width  = 400,
  height = 200,
}: GrowthChartProps) {
  if (evaluations.length < 2) return <EmptyGrowthChart />

  if (Platform.OS === 'web') {
    return <GrowthChartWeb evaluations={evaluations} width={width} height={height} />
  }
  return <GrowthChartNative evaluations={evaluations} width={width} height={height} />
}
