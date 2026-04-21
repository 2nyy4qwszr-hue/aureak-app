import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions, Pressable } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import type { SessionRowAdmin } from '@aureak/api-client'
import SessionCard from './SessionCard'
import { toDateStr, isToday, TYPE_COLOR } from '../../../../lib/admin/seances/constants'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Plages horaires visibles dans la grille (7h→21h)
const HOUR_START = 7
const HOUR_END   = 21
const HOURS      = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
const SLOT_H     = 52    // hauteur en px par tranche horaire d'1h

// Couleurs charge hebdo
const LOAD_COLOR_LOW    = '#10B981'  // ≤10 séances
const LOAD_COLOR_MEDIUM = '#F59E0B'  // 11–15
const LOAD_COLOR_HIGH   = '#EF4444'  // >15

const STORAGE_KEY = 'aureak_weekview_mode'

// ── Props ─────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid'

type Props = {
  sessions    : SessionRowAdmin[]
  weekStart   : Date
  coachNameMap: Map<string, string>
  groupMap    : Map<string, string>
  implantMap  : Map<string, string>
  onPress     : (id: string) => void
  onEdit      : (id: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLocalStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

function setLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
  } catch {
    // silently ignore
  }
}

/** Extrait l'heure fractionnaire (en heures) depuis un ISO datetime string ou "HH:MM" */
function parseHourFraction(scheduledAt: string): number {
  try {
    const d = new Date(scheduledAt)
    if (!isNaN(d.getTime())) {
      return d.getHours() + d.getMinutes() / 60
    }
  } catch {
    // fallthrough
  }
  return 9 // fallback 9h
}

// ── TacticalBoardGrid ─────────────────────────────────────────────────────────

function TacticalBoardGrid({
  sessions, days, groupMap, onPress,
}: {
  sessions : SessionRowAdmin[]
  days     : Date[]
  groupMap : Map<string, string>
  onPress  : (id: string) => void
}) {
  const totalH = SLOT_H * HOURS.length

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={gs.gridWrapper}>
        {/* Header colonnes */}
        <View style={gs.headerRow}>
          {/* Colonne heures */}
          <View style={gs.timeColHeader} />
          {days.map((day, idx) => {
            const today = isToday(day)
            return (
              <View key={idx} style={[gs.colHeader, today && gs.colHeaderToday]}>
                <AureakText style={[gs.colDayShort, today && gs.colDayShortToday] as never}>
                  {DAYS_SHORT[idx]}
                </AureakText>
                <AureakText style={[gs.colDayNum, today && gs.colDayNumToday] as never}>
                  {day.getDate()}
                </AureakText>
              </View>
            )
          })}
        </View>

        {/* Grille */}
        <View style={{ flexDirection: 'row' }}>
          {/* Colonne heures */}
          <View style={gs.timeCol}>
            {HOURS.map(h => (
              <View key={h} style={[gs.timeSlot, { height: SLOT_H }]}>
                <AureakText style={gs.timeLabel}>{`${h}h`}</AureakText>
              </View>
            ))}
          </View>

          {/* Colonnes jours */}
          {days.map((day, colIdx) => {
            const dayStr  = toDateStr(day)
            const daySess = sessions.filter(s => toDateStr(new Date(s.scheduledAt)) === dayStr)

            return (
              <View
                key={colIdx}
                style={[gs.dayCol, { height: totalH }, isToday(day) && gs.dayColToday]}
              >
                {/* Lignes horizontales fond */}
                {HOURS.map(h => (
                  <View key={h} style={[gs.hourLine, { top: (h - HOUR_START) * SLOT_H }]} />
                ))}

                {/* Séances positionnées */}
                {daySess.map(s => {
                  const hourF   = parseHourFraction(s.scheduledAt)
  const clampedStart = Math.max(HOUR_START, Math.min(HOUR_END, hourF))
                  const top     = (clampedStart - HOUR_START) * SLOT_H
                  const height  = Math.max(24, (s.durationMinutes / 60) * SLOT_H)
                  const color   = s.sessionType ? (TYPE_COLOR[s.sessionType] ?? colors.accent.gold) : colors.accent.gold
                  const name    = groupMap.get(s.groupId) ?? (s.label ?? 'Séance')
                  const truncated = name.length > 20 ? name.slice(0, 20) + '…' : name
                  const timeLabel = (() => {
                    try {
                      const d = new Date(s.scheduledAt)
                      return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
                    } catch {
                      return ''
                    }
                  })()

                  const statusDot: Record<string, string> = {
                    planifiée: '◉', en_cours: '▶', réalisée: '✓', annulée: '✕', reportée: '↪',
                  }

                  return (
                    <Pressable
                      key={s.id}
                      style={[gs.sessionBlock, {
                        top,
                        height,
                        backgroundColor: color + '25',
                        borderLeftColor: color,
                      }]}
                      onPress={() => onPress(s.id)}
                    >
                      <AureakText style={[gs.blockName, { color }] as never} numberOfLines={1}>
                        {truncated}
                      </AureakText>
                      {height > 28 && (
                        <AureakText style={gs.blockTime}>{timeLabel}</AureakText>
                      )}
                      {height > 40 && (
                        <AureakText style={[gs.blockStatus, { color }] as never}>
                          {statusDot[s.status] ?? '·'} {s.status}
                        </AureakText>
                      )}
                    </Pressable>
                  )
                })}

                {/* Message vide */}
                {daySess.length === 0 && (
                  <View style={gs.emptyOverlay} pointerEvents="none">
                    <AureakText style={gs.emptyOverlayText}>—</AureakText>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

// ── LoadBar ───────────────────────────────────────────────────────────────────

function LoadBar({ sessions }: { sessions: SessionRowAdmin[] }) {
  const total        = sessions.length
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
  const loadColor    = total <= 10 ? LOAD_COLOR_LOW : total <= 15 ? LOAD_COLOR_MEDIUM : LOAD_COLOR_HIGH
  const progress     = Math.min(1, total / 15)

  return (
    <View style={lb.container}>
      <View style={lb.row}>
        <AureakText style={lb.label}>Charge hebdo</AureakText>
        <AureakText style={lb.stats}>{total} séance{total !== 1 ? 's' : ''} · {totalMinutes} min</AureakText>
      </View>
      <View style={lb.track}>
        <View style={[lb.fill, { width: `${progress * 100}%` as never, backgroundColor: loadColor }]} />
      </View>
    </View>
  )
}

const lb = StyleSheet.create({
  container: {
    marginTop     : space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.light.surface,
    borderRadius  : radius.xs,
    borderWidth   : 1,
    borderColor   : colors.border.light,
    gap           : space.xs,
  },
  row  : { flexDirection: 'row', justifyContent: 'space-between' as never, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '700' as never, color: colors.text.muted, textTransform: 'uppercase' as never, letterSpacing: 0.5 },
  stats: { fontSize: 11, color: colors.text.dark, fontWeight: '600' as never },
  track: { height: 6, backgroundColor: colors.border.light, borderRadius: 3, overflow: 'hidden' as never },
  fill : { height: 6, borderRadius: 3 },
})

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeekView({
  sessions, weekStart, coachNameMap, groupMap, implantMap, onPress, onEdit,
}: Props) {
  const { width } = useWindowDimensions()
  const isMobile  = width < 768

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = getLocalStorage(STORAGE_KEY)
    return (saved === 'list' || saved === 'grid') ? saved : 'grid'
  })

  useEffect(() => {
    setLocalStorage(STORAGE_KEY, viewMode)
  }, [viewMode])

  // Build the 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // Group sessions by date string (for list mode)
  const sessionsByDay = new Map<string, SessionRowAdmin[]>()
  for (const s of sessions) {
    const key = toDateStr(new Date(s.scheduledAt))
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, [])
    sessionsByDay.get(key)!.push(s)
  }

  // Toggle header
  const toggleHeader = (
    <View style={th.row}>
      <AureakText style={th.label}>Vue semaine</AureakText>
      <View style={th.toggleGroup}>
        {(['list', 'grid'] as ViewMode[]).map(mode => (
          <Pressable
            key={mode}
            style={[th.toggleBtn, viewMode === mode && th.toggleBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <AureakText style={[th.toggleText, viewMode === mode && th.toggleTextActive] as never}>
              {mode === 'list' ? '☰ Liste' : '⊞ Grille'}
            </AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )

  // ── Grid mode ──────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <View style={{ gap: space.sm }}>
        {toggleHeader}
        {sessions.length === 0 ? (
          <View style={st.emptyGrid}>
            <AureakText style={st.emptyGridText}>Aucune séance cette semaine</AureakText>
          </View>
        ) : null}
        <TacticalBoardGrid
          sessions ={sessions}
          days     ={days}
          groupMap ={groupMap}
          onPress  ={onPress}
        />
        <LoadBar sessions={sessions} />
      </View>
    )
  }

  // ── List mode (existant) ───────────────────────────────────────────────────
  const content = (
    <View style={{ gap: space.sm }}>
      {toggleHeader}
      <View style={isMobile ? st.stackedContainer : st.columnsContainer}>
        {days.map((day, idx) => {
          const key     = toDateStr(day)
          const daySess = sessionsByDay.get(key) ?? []
          const today   = isToday(day)

          return (
            <View
              key={key}
              style={[
                isMobile ? st.dayStackedColumn : st.dayColumn,
              ]}
            >
              {/* Day header */}
              <View style={[st.dayHeader, today && st.dayHeaderToday]}>
                <AureakText style={[st.dayShort, today && st.dayShortToday] as never}>
                  {DAYS_SHORT[idx]}
                </AureakText>
                <AureakText style={[st.dayNum, today && st.dayNumToday] as never}>
                  {day.getDate()}
                </AureakText>
                {daySess.length > 0 && (
                  <View style={[st.countBadge, today && st.countBadgeToday]}>
                    <AureakText style={[st.countText, today && st.countTextToday] as never}>
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
      <LoadBar sessions={sessions} />
    </View>
  )

  if (isMobile) {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{content}</ScrollView>
  }
  return content
}

// ── Styles toggle header ───────────────────────────────────────────────────────

const th = StyleSheet.create({
  row        : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' as never, marginBottom: space.xs },
  label      : { fontSize: 11, fontWeight: '700' as never, color: colors.text.muted, textTransform: 'uppercase' as never, letterSpacing: 0.5 },
  toggleGroup: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, overflow: 'hidden' as never },
  toggleBtn  : { paddingHorizontal: space.sm, paddingVertical: 5, backgroundColor: colors.light.surface },
  toggleBtnActive: { backgroundColor: colors.accent.gold },
  toggleText : { fontSize: 11, color: colors.text.muted },
  toggleTextActive: { color: colors.text.dark, fontWeight: '700' as never },
})

// ── Styles grille ──────────────────────────────────────────────────────────────

const GRID_COL_W  = 120
const TIME_COL_W  = 40

const gs = StyleSheet.create({
  gridWrapper : { flexDirection: 'column' as never },

  headerRow: {
    flexDirection : 'row',
    marginBottom  : 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  timeColHeader: { width: TIME_COL_W },
  colHeader: {
    width          : GRID_COL_W,
    alignItems     : 'center',
    paddingVertical: 6,
    backgroundColor: colors.light.muted,
  },
  colHeaderToday: { backgroundColor: colors.accent.gold + '18' },
  colDayShort   : { fontSize: 10, fontWeight: '700' as never, color: colors.text.muted, textTransform: 'uppercase' as never },
  colDayShortToday: { color: colors.accent.gold },
  colDayNum     : { fontSize: 16, fontWeight: '800' as never, color: colors.text.dark },
  colDayNumToday: { color: colors.accent.gold },

  timeCol  : { width: TIME_COL_W },
  timeSlot : { justifyContent: 'flex-start', paddingTop: 2 },
  timeLabel: { fontSize: 9, color: colors.text.subtle ?? colors.text.muted, textAlign: 'right' as never, paddingRight: 4 },

  dayCol: {
    width          : GRID_COL_W,
    position       : 'relative' as never,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.divider,
  },
  dayColToday: { backgroundColor: colors.accent.gold + '06' },

  hourLine: {
    position       : 'absolute' as never,
    left           : 0,
    right          : 0,
    height         : 1,
    backgroundColor: colors.border.divider,
  },

  sessionBlock: {
    position        : 'absolute' as never,
    left            : 2,
    right           : 2,
    borderLeftWidth : 3,
    borderRadius    : 4,
    padding         : 3,
    overflow        : 'hidden' as never,
  },
  blockName  : { fontSize: 10, fontWeight: '700' as never },
  blockTime  : { fontSize: 9, color: colors.text.muted },
  blockStatus: { fontSize: 8, marginTop: 1 },

  emptyOverlay: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 0,
    right         : 0,
    bottom        : 0,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  emptyOverlayText: { fontSize: 14, color: colors.border.divider },
})

// ── Styles list mode ──────────────────────────────────────────────────────────

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

  emptyGrid: {
    paddingVertical: space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderStyle    : 'dashed' as never,
  },
  emptyGridText: { fontSize: 13, color: colors.text.muted },
})
