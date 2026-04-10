// TacticalEditor.tsx — Éditeur terrain schématique SVG (Story 58-2)
// Web-only : utilise <svg> natif via cast pattern (identique à TacticalBoard/GroupCard)
// Drag joueurs via onMouseDown/onMouseMove/onMouseUp
// Tracé flèches via toggle mode Flèche
// Zéro librairie externe — console.error guardé NODE_ENV

import React, { useState, useRef, useCallback } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import { AureakText, AureakButton } from '@aureak/ui'
import type { DiagramData, DiagramPlayer, DiagramArrow } from '@aureak/types'

// ── Constantes terrain SVG ────────────────────────────────────────────────────
const FIELD_W     = 400
const FIELD_H     = 280
const FIELD_COLOR = '#1a472a'
const LINE_COLOR  = 'rgba(255,255,255,0.6)'
const PLAYER_R    = 9     // rayon joueur (px) — diamètre 18px
const MAX_PLAYERS = 11    // max par équipe

// ── Cast SVG ──────────────────────────────────────────────────────────────────
const Svg     = 'svg'     as unknown as React.ComponentType<React.SVGProps<SVGSVGElement> & { ref?: React.Ref<SVGSVGElement> }>
const Rect    = 'rect'    as unknown as React.ComponentType<React.SVGProps<SVGRectElement>>
const Line    = 'line'    as unknown as React.ComponentType<React.SVGProps<SVGLineElement>>
const Circle  = 'circle'  as unknown as React.ComponentType<React.SVGProps<SVGCircleElement>>
const Defs    = 'defs'    as unknown as React.ComponentType<React.SVGProps<SVGDefsElement>>
const Marker  = 'marker'  as unknown as React.ComponentType<React.SVGProps<SVGMarkerElement>>
const Polygon = 'polygon' as unknown as React.ComponentType<React.SVGProps<SVGPolygonElement>>
const G       = 'g'       as unknown as React.ComponentType<React.SVGProps<SVGGElement>>
const Text    = 'text'    as unknown as React.ComponentType<React.SVGProps<SVGTextElement>>

// ── Types internes ────────────────────────────────────────────────────────────
type DragState = {
  playerId : string
  startX   : number
  startY   : number
  origX    : number
  origY    : number
}

type ArrowDraft = {
  x1: number; y1: number
  x2: number; y2: number
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function toPercent(px: number, max: number): number {
  return clamp((px / max) * 100, 0, 100)
}

function toPx(pct: number, max: number): number {
  return (pct / 100) * max
}

// ── Props ─────────────────────────────────────────────────────────────────────
export type TacticalEditorProps = {
  value    : DiagramData | null
  onChange : (data: DiagramData) => void
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function TacticalEditor({ value, onChange }: TacticalEditorProps) {
  const [players,      setPlayers]      = useState<DiagramPlayer[]>(value?.players ?? [])
  const [arrows,       setArrows]       = useState<DiagramArrow[]>(value?.arrows ?? [])
  const [arrowMode,    setArrowMode]    = useState(false)
  const [arrowDraft,   setArrowDraft]   = useState<ArrowDraft | null>(null)
  const [clearPending, setClearPending] = useState(false)

  const dragRef = useRef<DragState | null>(null)
  const svgRef  = useRef<SVGSVGElement | null>(null)

  // ── Sync vers parent ────────────────────────────────────────────────────────
  const emit = useCallback((p: DiagramPlayer[], a: DiagramArrow[]) => {
    onChange({ players: p, arrows: a })
  }, [onChange])

  // ── Coordonnées SVG depuis MouseEvent ──────────────────────────────────────
  const getSvgPoint = (e: React.MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ── Ajouter joueur ──────────────────────────────────────────────────────────
  const addPlayer = useCallback((team: 'A' | 'B') => {
    const teamPlayers = players.filter(p => p.team === team)
    if (teamPlayers.length >= MAX_PLAYERS) return
    const newPlayer: DiagramPlayer = {
      id  : uuid(),
      team,
      x   : team === 'A' ? 25 : 75,
      y   : 20 + (teamPlayers.length % 5) * 15,
    }
    const next = [...players, newPlayer]
    setPlayers(next)
    emit(next, arrows)
  }, [players, arrows, emit])

  // ── Drag joueurs ────────────────────────────────────────────────────────────
  const handlePlayerMouseDown = useCallback((
    e: React.MouseEvent<SVGElement>,
    playerId: string,
  ) => {
    if (arrowMode) return
    e.preventDefault()
    e.stopPropagation()
    const pt = getSvgPoint(e as unknown as React.MouseEvent)
    if (!pt) return
    const player = players.find(p => p.id === playerId)
    if (!player) return
    dragRef.current = { playerId, startX: pt.x, startY: pt.y, origX: player.x, origY: player.y }
  }, [arrowMode, players])

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGElement>) => {
    const pt = getSvgPoint(e as unknown as React.MouseEvent)
    if (!pt) return

    if (dragRef.current) {
      const { playerId, startX, startY, origX, origY } = dragRef.current
      const dx   = pt.x - startX
      const dy   = pt.y - startY
      const newX = clamp(origX + (dx / FIELD_W) * 100, 0, 100)
      const newY = clamp(origY + (dy / FIELD_H) * 100, 0, 100)
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, x: newX, y: newY } : p))
      return
    }

    if (arrowMode && arrowDraft) {
      setArrowDraft(prev =>
        prev
          ? { ...prev, x2: toPercent(pt.x, FIELD_W), y2: toPercent(pt.y, FIELD_H) }
          : null
      )
    }
  }, [arrowMode, arrowDraft])

  const handleSvgMouseUp = useCallback((e: React.MouseEvent<SVGElement>) => {
    const pt = getSvgPoint(e as unknown as React.MouseEvent)

    if (dragRef.current && pt) {
      emit(players, arrows)
      dragRef.current = null
      return
    }

    if (arrowMode && arrowDraft && pt) {
      const newArrow: DiagramArrow = {
        id: uuid(),
        x1: arrowDraft.x1, y1: arrowDraft.y1,
        x2: toPercent(pt.x, FIELD_W), y2: toPercent(pt.y, FIELD_H),
      }
      const next = [...arrows, newArrow]
      setArrows(next)
      setArrowDraft(null)
      emit(players, next)
    }
  }, [arrowMode, arrowDraft, players, arrows, emit])

  const handleSvgMouseDown = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!arrowMode) return
    const pt = getSvgPoint(e as unknown as React.MouseEvent)
    if (!pt) return
    setArrowDraft({
      x1: toPercent(pt.x, FIELD_W), y1: toPercent(pt.y, FIELD_H),
      x2: toPercent(pt.x, FIELD_W), y2: toPercent(pt.y, FIELD_H),
    })
  }, [arrowMode])

  // ── Effacer ─────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    if (!clearPending) { setClearPending(true); return }
    setPlayers([])
    setArrows([])
    setArrowDraft(null)
    setClearPending(false)
    emit([], [])
  }, [clearPending, emit])

  // ── Géométrie terrain ───────────────────────────────────────────────────────
  const FW   = FIELD_W
  const FH   = FIELD_H
  const boxW = FW * 0.32
  const boxH = FH * 0.40
  const boxY = (FH - boxH) / 2

  const countA = players.filter(p => p.team === 'A').length
  const countB = players.filter(p => p.team === 'B').length

  return (
    <View style={s.wrapper}>
      {/* Barre d'outils */}
      <View style={s.toolbar}>
        <View style={s.toolbarLeft}>
          <Pressable
            style={[s.toolBtn, { opacity: countA >= MAX_PLAYERS ? 0.4 : 1 }]}
            onPress={() => addPlayer('A')}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 12 } as never}>
              + Joueur A
            </AureakText>
          </Pressable>

          <Pressable
            style={[s.toolBtn, { opacity: countB >= MAX_PLAYERS ? 0.4 : 1 }]}
            onPress={() => addPlayer('B')}
          >
            <AureakText variant="caption" style={{ color: colors.status.errorStrong, fontSize: 12 } as never}>
              + Joueur B
            </AureakText>
          </Pressable>

          <Pressable
            style={[s.toolBtn, arrowMode && { backgroundColor: colors.accent.gold }]}
            onPress={() => { setArrowMode(m => !m); setArrowDraft(null) }}
          >
            <AureakText variant="caption" style={{ color: arrowMode ? '#1a1a1a' : colors.text.dark, fontSize: 12 } as never}>
              {arrowMode ? '↗ Flèche (actif)' : '↗ Flèche'}
            </AureakText>
          </Pressable>
        </View>

        <Pressable
          style={[s.toolBtn, clearPending && { backgroundColor: colors.status.errorStrong }]}
          onPress={handleClear}
        >
          <AureakText variant="caption" style={{ color: clearPending ? '#FFFFFF' : colors.status.errorStrong, fontSize: 12 } as never}>
            {clearPending ? 'Confirmer ?' : 'Effacer'}
          </AureakText>
        </Pressable>
      </View>

      {/* Canvas SVG terrain */}
      <View style={s.svgContainer}>
        <Svg
          ref={svgRef}
          width={FW}
          height={FH}
          style={{ cursor: arrowMode ? 'crosshair' : 'default', userSelect: 'none' } as React.CSSProperties}
          onMouseDown={handleSvgMouseDown as never}
          onMouseMove={handleSvgMouseMove as never}
          onMouseUp={handleSvgMouseUp as never}
          onMouseLeave={() => {
            dragRef.current = null
            if (arrowMode) setArrowDraft(null)
          }}
        >
          {/* Fond terrain */}
          <Rect x={0} y={0} width={FW} height={FH} fill={FIELD_COLOR} rx={6} />

          {/* Ligne médiane */}
          <Line x1={FW / 2} y1={0} x2={FW / 2} y2={FH} stroke={LINE_COLOR} strokeWidth={1.5} />

          {/* Cercle central */}
          <Circle cx={FW / 2} cy={FH / 2} r={Math.min(FW, FH) * 0.12} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
          <Circle cx={FW / 2} cy={FH / 2} r={3} fill={LINE_COLOR} />

          {/* Surface de réparation gauche */}
          <Rect x={0} y={boxY} width={boxW} height={boxH} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
          <Circle cx={FW * 0.16} cy={FH / 2} r={3} fill={LINE_COLOR} />

          {/* Surface de réparation droite */}
          <Rect x={FW - boxW} y={boxY} width={boxW} height={boxH} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
          <Circle cx={FW * 0.84} cy={FH / 2} r={3} fill={LINE_COLOR} />

          {/* Marqueur flèche */}
          <Defs>
            <Marker id="arrowhead" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
              <Polygon points="0 0, 8 3, 0 6" fill={colors.accent.gold} />
            </Marker>
          </Defs>

          {/* Flèches */}
          {arrows.map(a => (
            <Line
              key={a.id}
              x1={toPx(a.x1, FW)} y1={toPx(a.y1, FH)}
              x2={toPx(a.x2, FW)} y2={toPx(a.y2, FH)}
              stroke={colors.accent.gold}
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          ))}

          {/* Flèche draft */}
          {arrowDraft && (
            <Line
              x1={toPx(arrowDraft.x1, FW)} y1={toPx(arrowDraft.y1, FH)}
              x2={toPx(arrowDraft.x2, FW)} y2={toPx(arrowDraft.y2, FH)}
              stroke={colors.accent.gold}
              strokeWidth={2}
              strokeDasharray="4 3"
              markerEnd="url(#arrowhead)"
            />
          )}

          {/* Joueurs */}
          {players.map(player => (
            <G
              key={player.id}
              style={{ cursor: arrowMode ? 'default' : 'grab' } as React.CSSProperties}
              onMouseDown={(e: React.MouseEvent<SVGElement>) => handlePlayerMouseDown(e, player.id)}
            >
              <Circle
                cx={toPx(player.x, FW)}
                cy={toPx(player.y, FH)}
                r={PLAYER_R}
                fill={player.team === 'A' ? colors.light.surface : colors.status.errorStrong}
                stroke={player.team === 'A' ? colors.border.light : colors.accent.teamB}
                strokeWidth={1.5}
              />
              <Text
                x={toPx(player.x, FW)}
                y={toPx(player.y, FH) + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="bold"
                fill={player.team === 'A' ? '#1a1a1a' : '#FFFFFF'}
                style={{ pointerEvents: 'none', userSelect: 'none' } as React.CSSProperties}
              >
                {player.team}
              </Text>
            </G>
          ))}
        </Svg>
      </View>

      {/* Légende */}
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 } as never}>
        {countA}/{MAX_PLAYERS} A · {countB}/{MAX_PLAYERS} B · {arrows.length} flèche{arrows.length !== 1 ? 's' : ''}
      </AureakText>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper     : { gap: space.sm },
  toolbar     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.xs },
  toolbarLeft : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  toolBtn     : { paddingHorizontal: space.sm, paddingVertical: 6, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  svgContainer: { borderRadius: radius.card, overflow: 'hidden' as never, alignSelf: 'flex-start' as never },
})
