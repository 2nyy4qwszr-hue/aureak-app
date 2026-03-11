import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, methodologyMethodColors } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { SessionType } from '@aureak/types'
import type { SessionRowAdmin } from '@aureak/api-client'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const TYPE_COLOR: Record<string, string> = {
  goal_and_player : methodologyMethodColors['Goal and Player'],
  technique       : methodologyMethodColors['Technique'],
  situationnel    : methodologyMethodColors['Situationnel'],
  decisionnel     : methodologyMethodColors['Décisionnel'],
  perfectionnement: methodologyMethodColors['Perfectionnement'],
  integration     : methodologyMethodColors['Intégration'],
  equipe          : '#94A3B8',
}

const MAX_CHIPS = 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isToday(d: Date): boolean {
  return toDateStr(d) === toDateStr(new Date())
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  sessions  : SessionRowAdmin[]
  year      : number
  month     : number   // 0-indexed (0 = janvier)
  groupMap  : Map<string, string>
  onNavigate: (sessionId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MonthView({ sessions, year, month, groupMap, onNavigate }: Props) {
  // Group sessions by day string
  const sessionsByDay = new Map<string, SessionRowAdmin[]>()
  for (const s of sessions) {
    const key = toDateStr(new Date(s.scheduledAt))
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, [])
    sessionsByDay.get(key)!.push(s)
  }

  // Compute calendar grid
  const firstDay    = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayOfWeek   = firstDay.getDay()
  const offset      = dayOfWeek === 0 ? 6 : dayOfWeek - 1  // Lun=0
  const totalCells  = Math.ceil((daysInMonth + offset) / 7) * 7

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - offset - daysInMonth).fill(null),
  ]

  return (
    <View style={st.container}>
      {/* Day headers */}
      <View style={st.headerRow}>
        {DAY_HEADERS.map((d, i) => (
          <View key={i} style={st.headerCell}>
            <AureakText style={st.headerText}>{d}</AureakText>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      <View style={st.grid}>
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <View key={`empty-${idx}`} style={[st.cell, st.cellOutside]} />
          }

          const date    = new Date(year, month, dayNum)
          const dateKey = toDateStr(date)
          const daySess = sessionsByDay.get(dateKey) ?? []
          const today   = isToday(date)
          const visible = daySess.slice(0, MAX_CHIPS)
          const overflow = daySess.length - MAX_CHIPS

          return (
            <View key={dateKey} style={[st.cell, today && st.cellToday]}>
              {/* Day number */}
              <View style={[st.dayNumWrap, today && st.dayNumWrapToday]}>
                <AureakText style={[st.dayNum, today && st.dayNumToday]}>
                  {dayNum}
                </AureakText>
              </View>

              {/* Session chips */}
              {visible.map(s => {
                const typeColor = s.sessionType
                  ? (TYPE_COLOR[s.sessionType] ?? colors.accent.gold)
                  : colors.border.light
                const label = s.sessionType
                  ? SESSION_TYPE_LABELS[s.sessionType as SessionType]
                  : (groupMap.get(s.groupId) ?? '—')

                return (
                  <Pressable
                    key={s.id}
                    style={[st.chip, { backgroundColor: typeColor + '18', borderLeftColor: typeColor }]}
                    onPress={() => onNavigate(s.id)}
                    hitSlop={{ top: 2, bottom: 2, left: 0, right: 0 }}
                  >
                    <AureakText style={[st.chipText, { color: typeColor }]} numberOfLines={1}>
                      {label}
                    </AureakText>
                  </Pressable>
                )
              })}

              {/* Overflow indicator */}
              {overflow > 0 && (
                <View style={st.overflowChip}>
                  <AureakText style={st.overflowText}>+{overflow}</AureakText>
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container : {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
  },

  headerRow : { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  headerCell: { flex: 1, paddingVertical: space.sm, alignItems: 'center' },
  headerText: { fontSize: 10, fontWeight: '700' as never, color: colors.text.muted, letterSpacing: 0.5 },

  grid      : { flexDirection: 'row', flexWrap: 'wrap' },

  cell      : {
    width          : `${100 / 7}%` as never,
    minHeight      : 80,
    borderRightWidth: 1,
    borderRightColor: colors.border.divider,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    padding        : 3,
    gap            : 2,
  },
  cellOutside: { backgroundColor: colors.light.primary },
  cellToday  : { backgroundColor: colors.accent.gold + '08' },

  dayNumWrap     : { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  dayNumWrapToday: { backgroundColor: colors.accent.gold },
  dayNum         : { fontSize: 11, fontWeight: '600' as never, color: colors.text.dark },
  dayNumToday    : { color: colors.text.dark, fontWeight: '800' as never },

  chip      : {
    borderLeftWidth: 2,
    borderRadius   : 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minHeight      : 18,
  },
  chipText  : { fontSize: 9, fontWeight: '600' as never },

  overflowChip: {
    backgroundColor: colors.light.muted,
    borderRadius   : 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    alignSelf      : 'flex-start',
  },
  overflowText: { fontSize: 9, color: colors.text.muted, fontWeight: '600' as never },
})
