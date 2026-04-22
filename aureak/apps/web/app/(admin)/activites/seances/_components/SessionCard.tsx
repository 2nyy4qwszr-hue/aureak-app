import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { SessionType } from '@aureak/types'
import type { SessionRowAdmin } from '@aureak/api-client'
import { TYPE_COLOR } from '../../../../../lib/admin/seances/constants'

// ── Types ──────────────────────────────────────────────────────────────────────

export type SessionCardProps = {
  session     : SessionRowAdmin
  coachNameMap: Map<string, string>
  groupMap    : Map<string, string>
  implantMap  : Map<string, string>
  onPress     : (id: string) => void
  onEdit      : (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée', en_cours: 'En cours', réalisée: 'Réalisée',
  annulée  : 'Annulée',   reportée : 'Reportée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold', en_cours: 'present', réalisée: 'zinc',
  annulée  : 'attention', reportée: 'gold',
}

const COACH_ROLE_LABEL: Record<string, string> = {
  lead     : 'Principal',
  assistant: 'Assistant',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionCard({
  session, coachNameMap, groupMap, implantMap, onPress, onEdit,
}: SessionCardProps) {
  const isCancelled = session.status === 'annulée'
  const typeColor   = session.sessionType
    ? (TYPE_COLOR[session.sessionType] ?? colors.accent.gold)
    : colors.border.divider

  const d           = new Date(session.scheduledAt)
  const time        = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const groupName   = groupMap.get(session.groupId) ?? '—'
  const implantName = implantMap.get(session.implantationId) ?? '—'

  const locationLine = session.location
    ? `${implantName} · ${session.location}`
    : implantName

  // Coaches : lead first, then assistants
  const sortedCoaches = [...session.coaches].sort((a, b) => {
    if (a.role === 'lead') return -1
    if (b.role === 'lead') return  1
    return 0
  })

  return (
    <Pressable
      style={[st.card, isCancelled && st.cardCancelled, { borderLeftColor: isCancelled ? colors.border.divider : typeColor }]}
      onPress={() => onPress(session.id)}
    >
      {/* ── Top row : time + duration + type tag + status ── */}
      <View style={st.topRow}>
        <AureakText style={st.time}>{time}</AureakText>
        <AureakText style={st.duration}>· {fmtDuration(session.durationMinutes)}</AureakText>
        {session.sessionType ? (
          <View style={[st.typeTag, { borderColor: typeColor + '80', backgroundColor: typeColor + '18' }]}>
            <AureakText style={StyleSheet.flatten([st.typeTagText, { color: typeColor }]) as TextStyle}>
              {SESSION_TYPE_LABELS[session.sessionType as SessionType] ?? session.sessionType}
            </AureakText>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Badge
          label={STATUS_LABEL[session.status] ?? session.status}
          variant={STATUS_VARIANT[session.status] ?? 'zinc'}
        />
      </View>

      {/* ── Titre (Story 21.1) ou Groupe ── */}
      {session.label ? (
        <>
          <AureakText style={st.groupName} numberOfLines={1}>{session.label}</AureakText>
          <AureakText style={StyleSheet.flatten([st.location, { marginTop: -2 }]) as TextStyle} numberOfLines={1}>{groupName}</AureakText>
        </>
      ) : (
        <AureakText style={st.groupName} numberOfLines={1}>{groupName}</AureakText>
      )}

      {/* ── Implantation + terrain ── */}
      <AureakText style={st.location} numberOfLines={1}>{locationLine}</AureakText>

      {/* ── Coaches ── */}
      {sortedCoaches.length > 0 && (
        <View style={st.coachesRow}>
          {sortedCoaches.map((c) => {
            const name = coachNameMap.get(c.coachId) ?? '…'
            const roleLabel = COACH_ROLE_LABEL[c.role] ?? c.role
            return (
              <View key={c.coachId} style={st.coachChip}>
                <AureakText style={st.coachName}>{name}</AureakText>
                {c.role === 'lead' && (
                  <AureakText style={st.coachRole}> · {roleLabel}</AureakText>
                )}
              </View>
            )
          })}
        </View>
      )}

      {/* ── Motif annulation ── */}
      {isCancelled && !!session.cancellationReason && (
        <AureakText style={st.cancelText} numberOfLines={1}>
          Motif : {session.cancellationReason}
        </AureakText>
      )}

      {/* ── Action Modifier ── */}
      <View style={st.footer}>
        <Pressable
          style={st.editBtn}
          onPress={(e) => { e.stopPropagation?.(); onEdit(session.id) }}
        >
          <AureakText style={st.editBtnText}>Modifier</AureakText>
        </Pressable>
      </View>
    </Pressable>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderLeftWidth: 4,
    padding        : space.sm,
    gap            : 4,
    boxShadow      : shadows.sm,
  } as ViewStyle,
  cardCancelled: {
    opacity    : 0.65,
    borderColor: colors.border.divider,
  },

  topRow   : { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  time     : { fontSize: 14, fontWeight: '700' as never, color: colors.text.dark },
  duration : { fontSize: 11, color: colors.text.muted },
  typeTag  : { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  typeTagText: { fontSize: 9, fontWeight: '700' as never, letterSpacing: 0.3 },

  groupName: { fontSize: 13, fontWeight: '600' as never, color: colors.text.dark },
  location : { fontSize: 11, color: colors.text.muted },

  coachesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  coachChip : { flexDirection: 'row', alignItems: 'center' },
  coachName : { fontSize: 11, color: colors.text.dark, fontWeight: '500' as never },
  coachRole : { fontSize: 10, color: colors.text.muted },

  cancelText: { fontSize: 10, color: '#DC2626', fontStyle: 'italic' as never },

  footer : { flexDirection: 'row', justifyContent: 'flex-end', marginTop: space.xs },
  editBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  editBtnText: { fontSize: 11, color: colors.text.muted, fontWeight: '500' as never },
})
