// Story 56-1 — Card team sheet avec mini-terrain SVG et informations groupe
// Story 56-3 — Intégration PlayerAvatarGrid (avatars joueurs sur la card)
// RÈGLE : styles uniquement via @aureak/theme tokens
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import { methodologyMethodColors } from '@aureak/theme'
import type { GroupWithMeta, GroupMethod } from '@aureak/types'
import { AureakText } from './components/Text'
import { PlayerAvatarGrid } from './PlayerAvatarGrid'
import type { AvatarMember } from './PlayerAvatarGrid'
import { GroupOfMonthBadge } from './GroupOfMonthBadge'
import { CapacityIndicator } from './CapacityIndicator'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GroupCardProps {
  group      : GroupWithMeta
  onPress?   : () => void
  memberCount: number
  members?   : AvatarMember[]
  // Drag-drop support (Story 56-4)
  isDragOver? : boolean
  onDragOver? : (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?     : (e: React.DragEvent) => void
  /** Story 56-5 — Badge "Groupe du mois" */
  isGroupOfMonth?: boolean
  /** Story 56-6 — Capacité max du groupe */
  maxPlayers?: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMethodColor(method: GroupMethod | null): string {
  if (!method) return colors.accent.gold
  const map: Record<GroupMethod, keyof typeof methodologyMethodColors> = {
    'Goal and Player' : 'Goal and Player',
    'Technique'       : 'Technique',
    'Situationnel'    : 'Situationnel',
    'Décisionnel'     : 'Décisionnel',
  }
  const key = map[method]
  return key ? methodologyMethodColors[key] : colors.accent.gold
}

// ── Mini-terrain SVG ───────────────────────────────────────────────────────────
// SVG inline React via elements (pas react-native-svg, compatibilité web maximale)

function MiniPitchSVG({ methodColor }: { methodColor: string }) {
  // On utilise un <View> contenant un élément SVG natif via React web
  // @ts-ignore — les éléments SVG sont disponibles sur le web via React
  const Svg = 'svg' as unknown as React.ComponentType<React.SVGProps<SVGSVGElement>>
  // @ts-ignore
  const Rect = 'rect' as unknown as React.ComponentType<React.SVGProps<SVGRectElement>>
  // @ts-ignore
  const Line = 'line' as unknown as React.ComponentType<React.SVGProps<SVGLineElement>>
  // @ts-ignore
  const Circle = 'circle' as unknown as React.ComponentType<React.SVGProps<SVGCircleElement>>

  return (
    <View style={pitch.container}>
      {/* @ts-ignore */}
      <Svg width="100%" height="100%" viewBox="0 0 280 110" style={{ display: 'block' }}>
        {/* Fond terrain */}
        {/* @ts-ignore */}
        <Rect width={280} height={110} fill="#2A6E2A" rx={4} />
        {/* Rayures alternées */}
        {/* @ts-ignore */}
        <Rect x={0}   y={0} width={40} height={110} fill="#2D7A2D" opacity={0.5} />
        {/* @ts-ignore */}
        <Rect x={80}  y={0} width={40} height={110} fill="#2D7A2D" opacity={0.5} />
        {/* @ts-ignore */}
        <Rect x={160} y={0} width={40} height={110} fill="#2D7A2D" opacity={0.5} />
        {/* @ts-ignore */}
        <Rect x={240} y={0} width={40} height={110} fill="#2D7A2D" opacity={0.5} />
        {/* Bordure terrain */}
        {/* @ts-ignore */}
        <Rect x={6} y={6} width={268} height={98} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} rx={2} />
        {/* Ligne médiane */}
        {/* @ts-ignore */}
        <Line x1={140} y1={6} x2={140} y2={104} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
        {/* Cercle central */}
        {/* @ts-ignore */}
        <Circle cx={140} cy={55} r={18} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
        {/* @ts-ignore */}
        <Circle cx={140} cy={55} r={2}  fill="rgba(255,255,255,0.8)" />
        {/* Surface de but gauche */}
        {/* @ts-ignore */}
        <Rect x={6} y={34} width={32} height={42} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
        {/* Surface de réparation gauche */}
        {/* @ts-ignore */}
        <Rect x={6} y={22} width={60} height={66} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
        {/* Point de penalty gauche */}
        {/* @ts-ignore */}
        <Circle cx={52} cy={55} r={1.5} fill="rgba(255,255,255,0.8)" />
        {/* Surface de but droite */}
        {/* @ts-ignore */}
        <Rect x={242} y={34} width={32} height={42} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
        {/* Surface de réparation droite */}
        {/* @ts-ignore */}
        <Rect x={214} y={22} width={60} height={66} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
        {/* Point de penalty droit */}
        {/* @ts-ignore */}
        <Circle cx={228} cy={55} r={1.5} fill="rgba(255,255,255,0.8)" />
        {/* Accent méthode */}
        {/* @ts-ignore */}
        <Line x1={6} y1={102} x2={274} y2={102} stroke={methodColor} strokeWidth={2.5} opacity={0.8} />
      </Svg>
    </View>
  )
}

// ── GroupCard ──────────────────────────────────────────────────────────────────

export function GroupCard({
  group,
  onPress,
  memberCount,
  members,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isGroupOfMonth,
  maxPlayers,
}: GroupCardProps) {
  const methodColor    = getMethodColor(group.method)
  const resolvedMax    = maxPlayers ?? (group as GroupWithMeta & { maxPlayers?: number }).maxPlayers
  const isOverCapacity = resolvedMax != null && memberCount > resolvedMax

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { borderLeftColor: methodColor },
        pressed && s.cardPressed,
        isDragOver && s.cardDragOver,
      ]}
      // @ts-ignore — drag-drop HTML5 events (web only)
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      accessibilityRole="button"
      accessibilityLabel={`Groupe ${group.name}, ${memberCount} joueurs`}
    >
      {/* ── Badge "Groupe du mois" (Story 56-5) ── */}
      {isGroupOfMonth && <GroupOfMonthBadge />}

      {/* ── Badge nombre de joueurs ── */}
      <View style={[s.memberBadge, isOverCapacity && s.memberBadgeOver]}>
        <AureakText
          variant="caption"
          style={{ color: colors.text.primary, fontWeight: '700', fontSize: 10 }}
        >
          {memberCount} joueur{memberCount !== 1 ? 's' : ''}
        </AureakText>
      </View>

      {/* ── Mini-terrain SVG ── */}
      <View style={s.pitchWrapper}>
        <MiniPitchSVG methodColor={methodColor} />

        {/* Overlay nom groupe — bas du terrain, fond semi-transparent */}
        <View style={s.nameOverlay}>
          <AureakText
            variant="body"
            style={{ color: colors.text.primary, fontWeight: '700', fontSize: 13, lineHeight: 16 }}
            numberOfLines={1}
          >
            {group.name}
          </AureakText>
          <AureakText
            variant="caption"
            style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 1 }}
            numberOfLines={1}
          >
            {group.implantationName}
          </AureakText>
        </View>
      </View>

      {/* ── Avatars joueurs (Story 56-3) ── */}
      {members && members.length > 0 && (
        <View style={s.avatarRow}>
          <PlayerAvatarGrid members={members} maxVisible={8} />
        </View>
      )}

      {/* ── Footer info ── */}
      <View style={s.footer}>
        {group.method && (
          <View style={[s.methodBadge, { backgroundColor: methodColor + '18', borderColor: methodColor + '50' }]}>
            <AureakText variant="caption" style={{ color: methodColor, fontWeight: '700', fontSize: 9 }}>
              {group.method}
            </AureakText>
          </View>
        )}
        {group.dayOfWeek && (
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
            {group.dayOfWeek}
            {group.startHour !== null
              ? ` · ${String(group.startHour).padStart(2,'0')}h${String(group.startMinute ?? 0).padStart(2,'0')}`
              : ''}
          </AureakText>
        )}
        {/* Story 56-6 — Indicateur capacité compact */}
        {resolvedMax != null && (
          <CapacityIndicator memberCount={memberCount} maxPlayers={resolvedMax} compact />
        )}
        <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 10, marginLeft: 'auto' as never }}>
          Gérer →
        </AureakText>
      </View>
    </Pressable>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderLeftWidth: 3,
    overflow       : 'hidden',
    width          : 280,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardDragOver: {
    borderColor    : colors.status.success,
    borderWidth    : 2,
    backgroundColor: colors.status.success + '08',
  },
  memberBadge: {
    position         : 'absolute' as never,
    top              : space.xs,
    right            : space.xs,
    zIndex           : 10,
    backgroundColor  : 'rgba(0,0,0,0.45)',
    borderRadius     : radius.badge,
    paddingHorizontal: 7,
    paddingVertical  : 2,
  },
  memberBadgeOver: {
    backgroundColor: colors.accent.red,
  },
  pitchWrapper: {
    width   : '100%' as never,
    height  : 110,
    position: 'relative',
  },
  nameOverlay: {
    position         : 'absolute' as never,
    bottom           : 0,
    left             : 0,
    right            : 0,
    backgroundColor  : 'rgba(0,0,0,0.52)',
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  avatarRow: {
    paddingHorizontal: space.sm,
    paddingTop       : space.xs,
    paddingBottom    : 2,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  footer: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    flexWrap         : 'wrap',
  },
  methodBadge: {
    borderRadius     : radius.badge,
    paddingHorizontal: 7,
    paddingVertical  : 2,
    borderWidth      : 1,
  },
})

const pitch = StyleSheet.create({
  container: {
    width : '100%' as never,
    height: 110,
  },
})
