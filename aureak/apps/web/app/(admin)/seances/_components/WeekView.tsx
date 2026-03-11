import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import type { SessionRowAdmin } from '@aureak/api-client'
import SessionCard from './SessionCard'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isToday(d: Date): boolean {
  const now = new Date()
  return toDateStr(d) === toDateStr(now)
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  sessions    : SessionRowAdmin[]
  weekStart   : Date
  coachNameMap: Map<string, string>
  groupMap    : Map<string, string>
  implantMap  : Map<string, string>
  onPress     : (id: string) => void
  onEdit      : (id: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeekView({
  sessions, weekStart, coachNameMap, groupMap, implantMap, onPress, onEdit,
}: Props) {
  const { width } = useWindowDimensions()
  const isMobile  = width < 768

  // Build the 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // Group sessions by date string
  const sessionsByDay = new Map<string, SessionRowAdmin[]>()
  for (const s of sessions) {
    const key = toDateStr(new Date(s.scheduledAt))
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, [])
    sessionsByDay.get(key)!.push(s)
  }

  const content = (
    <View style={isMobile ? st.stackedContainer : st.columnsContainer}>
      {days.map((day, idx) => {
        const key      = toDateStr(day)
        const daySess  = sessionsByDay.get(key) ?? []
        const today    = isToday(day)

        return (
          <View
            key={key}
            style={[
              isMobile ? st.dayStackedColumn : st.dayColumn,
            ]}
          >
            {/* Day header */}
            <View style={[st.dayHeader, today && st.dayHeaderToday]}>
              <AureakText style={[st.dayShort, today && st.dayShortToday]}>
                {DAYS_SHORT[idx]}
              </AureakText>
              <AureakText style={[st.dayNum, today && st.dayNumToday]}>
                {day.getDate()}
              </AureakText>
              {daySess.length > 0 && (
                <View style={[st.countBadge, today && st.countBadgeToday]}>
                  <AureakText style={[st.countText, today && st.countTextToday]}>
                    {daySess.length}
                  </AureakText>
                </View>
              )}
            </View>

            {/* Sessions */}
            <View style={st.dayBody}>
              {daySess.length === 0 ? (
                <View style={st.emptyDay}>
                  <AureakText style={st.emptyDayText}>—</AureakText>
                </View>
              ) : (
                daySess.map(s => (
                  <SessionCard
                    key={s.id}
                    session     ={s}
                    coachNameMap={coachNameMap}
                    groupMap    ={groupMap}
                    implantMap  ={implantMap}
                    onPress     ={onPress}
                    onEdit      ={onEdit}
                  />
                ))
              )}
            </View>
          </View>
        )
      })}
    </View>
  )

  // Mobile : horizontal scroll
  if (isMobile) {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{content}</ScrollView>
  }
  return content
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  columnsContainer: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    gap           : space.sm,
  },
  stackedContainer: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
  },

  dayColumn: {
    flex     : 1,
    minWidth : 120,
  },
  dayStackedColumn: {
    width    : 180,
    marginRight: space.sm,
  },

  dayHeader: {
    alignItems    : 'center',
    paddingVertical: 8,
    paddingHorizontal: space.xs,
    backgroundColor: colors.light.muted,
    borderRadius  : radius.xs,
    borderWidth   : 1,
    borderColor   : colors.border.divider,
    marginBottom  : space.xs,
    gap           : 2,
  },
  dayHeaderToday: {
    backgroundColor: colors.accent.gold + '18',
    borderColor    : colors.accent.gold,
  },
  dayShort     : { fontSize: 10, fontWeight: '700' as never, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as never },
  dayShortToday: { color: colors.accent.gold },
  dayNum       : { fontSize: 18, fontWeight: '800' as never, color: colors.text.dark, lineHeight: 20 },
  dayNumToday  : { color: colors.accent.gold },

  countBadge: {
    backgroundColor: colors.border.light,
    borderRadius   : 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop      : 1,
  },
  countBadgeToday: { backgroundColor: colors.accent.gold + '30' },
  countText      : { fontSize: 9, color: colors.text.muted, fontWeight: '600' as never },
  countTextToday : { color: colors.accent.gold },

  dayBody : { gap: space.xs },
  emptyDay: {
    paddingVertical: space.lg,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderStyle    : 'dashed' as never,
  },
  emptyDayText: { fontSize: 16, color: colors.text.subtle ?? colors.text.muted },
})
