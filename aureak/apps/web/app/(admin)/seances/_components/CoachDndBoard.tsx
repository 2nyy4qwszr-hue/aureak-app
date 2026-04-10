'use client'
// Story 53-10 — Assignation coach drag-and-drop natif HTML5
// Pas de librairie DnD externe — events HTML5 natifs via props DOM (web only)
import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Platform } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

// ── Types ──────────────────────────────────────────────────────────────────────

export type CoachDndBoardProps = {
  availableCoaches : { id: string; name: string }[]
  assignedCoachIds : string[]
  onAssign         : (coachId: string) => void
  onUnassign       : (coachId: string) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// ── CoachCard ──────────────────────────────────────────────────────────────────

function CoachCard({
  id, name, zone, isDragging, onToggle,
  onDragStart, onDragEnd,
}: {
  id         : string
  name       : string
  zone       : 'available' | 'assigned'
  isDragging : boolean
  onToggle   : () => void
  onDragStart: () => void
  onDragEnd  : () => void
}) {
  const isWeb = Platform.OS === 'web'

  // Props DnD HTML5 (web uniquement via cast)
  const dndProps: Record<string, unknown> = isWeb ? {
    draggable   : true,
    onDragStart : onDragStart,
    onDragEnd   : onDragEnd,
  } : {}

  return (
    <View
      style={[cc.card, isDragging && cc.cardDragging]}
      {...dndProps as object}
    >
      {/* Avatar initiales */}
      <View style={cc.avatar}>
        <AureakText style={cc.avatarText}>{initials(name)}</AureakText>
      </View>

      {/* Nom */}
      <AureakText style={cc.name} numberOfLines={1}>{name}</AureakText>

      {/* Bouton fallback clavier (+/-) */}
      <Pressable
        style={[cc.actionBtn, zone === 'assigned' && cc.actionBtnRemove]}
        onPress={onToggle}
      >
        <AureakText style={[cc.actionText, zone === 'assigned' && cc.actionTextRemove] as never}>
          {zone === 'available' ? '+' : '−'}
        </AureakText>
      </Pressable>
    </View>
  )
}

const cc = StyleSheet.create({
  card         : {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : space.xs,
    backgroundColor: colors.light.surface,
    borderWidth   : 1,
    borderColor   : colors.border.light,
    borderRadius  : radius.xs,
    padding       : space.sm,
  },
  cardDragging : { opacity: 0.45 },
  avatar       : {
    width : 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accent.gold + '30',
    borderWidth: 1, borderColor: colors.accent.gold,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText   : { fontSize: 11, fontWeight: '700' as never, color: colors.accent.gold },
  name         : { flex: 1, fontSize: 12, fontWeight: '600' as never, color: colors.text.dark },
  actionBtn    : {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent.gold + '20',
    borderWidth: 1, borderColor: colors.accent.gold,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBtnRemove: { backgroundColor: (colors.status.errorStrong ?? '#E05252') + '18', borderColor: colors.status.errorStrong ?? '#E05252' },
  actionText     : { fontSize: 16, fontWeight: '700' as never, color: colors.accent.gold, lineHeight: 20 },
  actionTextRemove: { color: colors.status.errorStrong ?? '#E05252' },
})

// ── DropZone ───────────────────────────────────────────────────────────────────

function DropZone({
  title, count, isDragOver, onDragOver, onDragLeave, onDrop, children,
}: {
  title     : string
  count     : number
  isDragOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop    : () => void
  children  : React.ReactNode
}) {
  const isWeb = Platform.OS === 'web'
  const dndProps: Record<string, unknown> = isWeb ? {
    onDragOver : (e: Event) => { e.preventDefault(); onDragOver() },
    onDragLeave: onDragLeave,
    onDrop     : (e: Event) => { e.preventDefault(); onDrop() },
  } : {}

  return (
    <View
      style={[dz.zone, isDragOver && dz.zoneHighlight]}
      {...dndProps as object}
    >
      <AureakText style={dz.title}>{title} ({count})</AureakText>
      <View style={dz.list}>
        {children}
      </View>
      {isDragOver && (
        <View style={dz.dropHint}>
          <AureakText style={dz.dropHintText}>↓ Déposer ici</AureakText>
        </View>
      )}
    </View>
  )
}

const dz = StyleSheet.create({
  zone         : {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderWidth: 1, borderColor: colors.border.light,
    borderRadius: 12, padding: space.sm, gap: space.xs,
    minHeight: 160,
  },
  zoneHighlight: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold + '10',
  },
  title        : { fontSize: 11, fontWeight: '700' as never, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as never },
  list         : { gap: space.xs },
  dropHint     : {
    borderWidth: 1.5, borderColor: colors.accent.gold + '60', borderRadius: 8,
    borderStyle: 'dashed' as never, padding: space.sm, alignItems: 'center',
  },
  dropHintText : { fontSize: 11, color: colors.accent.gold + 'AA' },
})

// ── CoachDndBoard ──────────────────────────────────────────────────────────────

export default function CoachDndBoard({
  availableCoaches, assignedCoachIds, onAssign, onUnassign,
}: CoachDndBoardProps) {
  const [draggedId,   setDraggedId]   = useState<string | null>(null)
  const [dragSource,  setDragSource]  = useState<'available' | 'assigned' | null>(null)
  const [dragOverZone, setDragOverZone] = useState<'available' | 'assigned' | null>(null)

  const assignedSet   = new Set(assignedCoachIds)
  const assignedList  = availableCoaches.filter(c => assignedSet.has(c.id))
  const availableList = availableCoaches.filter(c => !assignedSet.has(c.id))

  const handleDragStart = (id: string, zone: 'available' | 'assigned') => {
    setDraggedId(id)
    setDragSource(zone)
  }
  const handleDragEnd = () => {
    setDraggedId(null)
    setDragSource(null)
    setDragOverZone(null)
  }

  const handleDropOnAssigned = () => {
    if (draggedId && dragSource === 'available') onAssign(draggedId)
    handleDragEnd()
  }
  const handleDropOnAvailable = () => {
    if (draggedId && dragSource === 'assigned') onUnassign(draggedId)
    handleDragEnd()
  }

  return (
    <View style={board.row}>
      {/* Zone Disponibles */}
      <DropZone
        title      ="Disponibles"
        count      ={availableList.length}
        isDragOver ={dragOverZone === 'available'}
        onDragOver ={() => setDragOverZone('available')}
        onDragLeave={() => setDragOverZone(null)}
        onDrop     ={handleDropOnAvailable}
      >
        {availableList.length === 0 ? (
          <AureakText style={board.emptyText}>Tous les coaches sont assignés</AureakText>
        ) : (
          availableList.map(c => (
            <CoachCard
              key       ={c.id}
              id        ={c.id}
              name      ={c.name}
              zone      ="available"
              isDragging={draggedId === c.id}
              onToggle  ={() => onAssign(c.id)}
              onDragStart={() => handleDragStart(c.id, 'available')}
              onDragEnd  ={handleDragEnd}
            />
          ))
        )}
      </DropZone>

      {/* Zone Assignés */}
      <DropZone
        title      ="Assignés"
        count      ={assignedList.length}
        isDragOver ={dragOverZone === 'assigned'}
        onDragOver ={() => setDragOverZone('assigned')}
        onDragLeave={() => setDragOverZone(null)}
        onDrop     ={handleDropOnAssigned}
      >
        {assignedList.length === 0 ? (
          <AureakText style={board.emptyText}>Glisser un coach ici</AureakText>
        ) : (
          assignedList.map(c => (
            <CoachCard
              key       ={c.id}
              id        ={c.id}
              name      ={c.name}
              zone      ="assigned"
              isDragging={draggedId === c.id}
              onToggle  ={() => onUnassign(c.id)}
              onDragStart={() => handleDragStart(c.id, 'assigned')}
              onDragEnd  ={handleDragEnd}
            />
          ))
        )}
      </DropZone>
    </View>
  )
}

const board = StyleSheet.create({
  row      : { flexDirection: 'row', gap: space.sm },
  emptyText: { fontSize: 11, color: colors.text.muted, fontStyle: 'italic' as never, padding: space.xs },
})
