// Story 54-6 — Heatmap mensuelle de présences par joueur
// Composant pur React Native (web) — pas de canvas ni librairie externe
import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { AureakText } from './components/Text'
import { colors, space } from '@aureak/theme'
import type { AttendanceHistoryRow } from '@aureak/api-client'

export type { AttendanceHistoryRow }

const MONTHS_SHORT_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31]

const STATUS_COLOR: Record<string, string> = {
  present: '#059669',   // vert foncé AC3
  absent : '#E05252',   // rouge AC3
  late   : '#F59E0B',   // orange AC3
  trial  : '#F59E0B',   // orange (équivalent late pour la heatmap)
}

function getDaysInMonth(year: number, month: number): number {
  // month = 0-11
  if (month === 1) {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28
  }
  return DAYS_IN_MONTH[month]
}

export type AttendanceHeatmapProps = {
  data          : AttendanceHistoryRow[]
  referenceYear : number
  referenceMonth: number   // 0-11
}

export function AttendanceHeatmap({ data, referenceYear, referenceMonth }: AttendanceHeatmapProps) {
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    row: AttendanceHistoryRow
    x  : number
    y  : number
  } | null>(null)

  // Construire un index date → sessions
  const dateIndex = useMemo(() => {
    const map = new Map<string, AttendanceHistoryRow[]>()
    data.forEach(row => {
      const d = row.sessionDate.slice(0, 10)   // YYYY-MM-DD
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(row)
    })
    return map
  }, [data])

  // Générer les 12 mois rétroactifs depuis referenceMonth/referenceYear
  const months = useMemo(() => {
    const result: { year: number; month: number }[] = []
    for (let i = 11; i >= 0; i--) {
      let m = referenceMonth - i
      let y = referenceYear
      while (m < 0) { m += 12; y-- }
      result.push({ year: y, month: m })
    }
    return result
  }, [referenceYear, referenceMonth])

  if (data.length === 0) {
    return (
      <View style={hm.emptyWrap}>
        <AureakText style={hm.emptyText}>Aucune séance enregistrée sur cette période</AureakText>
      </View>
    )
  }

  // Résumé chiffré global (sur toutes les données)
  const presentCount = data.filter(r => r.status === 'present').length
  const totalCount   = data.length
  const pct          = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <View style={hm.wrapper}>
      {/* Légende */}
      <View style={hm.legend}>
        <View style={[hm.legendDot, { backgroundColor: '#059669' }] as never} />
        <AureakText style={hm.legendText}>présent</AureakText>
        <View style={[hm.legendDot, { backgroundColor: '#E05252' }] as never} />
        <AureakText style={hm.legendText}>absent</AureakText>
        <View style={[hm.legendDot, { backgroundColor: '#F59E0B' }] as never} />
        <AureakText style={hm.legendText}>retard</AureakText>
        <View style={[hm.legendDot, { backgroundColor: '#E5E2DA' }] as never} />
        <AureakText style={hm.legendText}>pas de séance</AureakText>
      </View>

      {/* Grille heatmap */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={hm.grid}>
          {/* Header jours 1→31 */}
          <View style={hm.headerRow}>
            <View style={hm.monthLabel} />
            {Array.from({ length: 31 }, (_, i) => (
              <View key={i} style={hm.dayHeader}>
                <AureakText style={hm.dayHeaderText}>{i + 1}</AureakText>
              </View>
            ))}
          </View>

          {/* Lignes mois */}
          {months.map(({ year, month }) => {
            const daysInMonth = getDaysInMonth(year, month)
            return (
              <View key={`${year}-${month}`} style={hm.monthRow}>
                <View style={hm.monthLabel}>
                  <AureakText style={hm.monthLabelText}>
                    {MONTHS_SHORT_FR[month]} {String(year).slice(2)}
                  </AureakText>
                </View>
                {Array.from({ length: 31 }, (_, dayIdx) => {
                  const day = dayIdx + 1
                  if (day > daysInMonth) {
                    // Jour hors mois — cellule vide transparente
                    return <View key={dayIdx} style={hm.cell} />
                  }
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const sessions = dateIndex.get(dateStr) ?? []
                  const hasSession = sessions.length > 0
                  // Si plusieurs séances ce jour, prendre le pire statut (absent > late > present)
                  let cellColor: string = '#E5E2DA'   // fallback gris (pas de séance)
                  if (hasSession) {
                    const statuses = sessions.map(s => s.status)
                    if (statuses.includes('absent')) cellColor = STATUS_COLOR['absent']!
                    else if (statuses.includes('late') || statuses.includes('trial')) cellColor = STATUS_COLOR['late']!
                    else cellColor = STATUS_COLOR['present']!
                  }
                  return (
                    <Pressable
                      key={dayIdx}
                      style={[hm.cell, { backgroundColor: cellColor }]}
                      onPress={e => {
                        if (hasSession) {
                          const native = e as unknown as { nativeEvent: { pageX: number; pageY: number } }
                          setTooltip(t =>
                            t?.row.sessionDate === sessions[0].sessionDate
                              ? null
                              : { row: sessions[0], x: native.nativeEvent?.pageX ?? 0, y: native.nativeEvent?.pageY ?? 0 }
                          )
                        } else {
                          setTooltip(null)
                        }
                      }}
                    />
                  )
                })}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Tooltip */}
      {tooltip && (
        <Pressable style={hm.tooltipOverlay} onPress={() => setTooltip(null)}>
          <View style={hm.tooltip}>
            <AureakText style={hm.tooltipDate}>
              {new Date(tooltip.row.sessionDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </AureakText>
            {tooltip.row.groupName ? (
              <AureakText style={hm.tooltipGroup}>{tooltip.row.groupName}</AureakText>
            ) : null}
            {tooltip.row.sessionType ? (
              <AureakText style={hm.tooltipType}>{tooltip.row.sessionType}</AureakText>
            ) : null}
            <AureakText style={[hm.tooltipStatus, { color: STATUS_COLOR[tooltip.row.status] ?? '#6B7280' }] as never}>
              {tooltip.row.status === 'present' ? '✓ Présent' :
               tooltip.row.status === 'absent'  ? '✗ Absent'  :
               tooltip.row.status === 'late'    ? '⏱ Retard'  :
               tooltip.row.status === 'trial'   ? '👀 Essai'  :
               tooltip.row.status}
            </AureakText>
          </View>
        </Pressable>
      )}

      {/* Résumé chiffré */}
      <View style={hm.summary}>
        <AureakText style={hm.summaryText}>
          {`${presentCount} présence${presentCount !== 1 ? 's' : ''} / ${totalCount} séance${totalCount !== 1 ? 's' : ''} (${pct}%)`}
        </AureakText>
      </View>
    </View>
  )
}

const hm = StyleSheet.create({
  wrapper       : { gap: space.sm },
  emptyWrap     : { paddingVertical: space.md },
  emptyText     : { fontSize: 13, color: colors.text.muted, fontStyle: 'italic' as never },
  legend        : { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as never },
  legendDot     : { width: 10, height: 10, borderRadius: 5 },
  legendText    : { fontSize: 10, color: colors.text.muted },
  grid          : { gap: 3 },
  headerRow     : { flexDirection: 'row', alignItems: 'center', gap: 2 },
  monthLabel    : { width: 44, marginRight: 4 },
  monthLabelText: { fontSize: 9, fontWeight: '700' as never, color: colors.text.muted },
  dayHeader     : { width: 14, alignItems: 'center' as never },
  dayHeaderText : { fontSize: 7, color: colors.text.muted },
  monthRow      : { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cell          : { width: 14, height: 14, borderRadius: 3 },
  // Tooltip
  tooltipOverlay: { position: 'absolute' as never, top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  tooltip       : {
    position       : 'absolute' as never,
    top            : 40,
    left           : 48,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : 8,
    padding        : space.sm,
    gap            : 3,
    minWidth       : 180,
    zIndex         : 51,
    boxShadow      : '0 2px 8px rgba(0,0,0,0.12)',
  } as never,
  tooltipDate  : { fontSize: 12, fontWeight: '700' as never, color: colors.text.dark },
  tooltipGroup : { fontSize: 11, color: colors.text.muted },
  tooltipType  : { fontSize: 11, color: colors.text.muted },
  tooltipStatus: { fontSize: 12, fontWeight: '700' as never },
  // Résumé
  summary      : { paddingTop: space.xs },
  summaryText  : { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' as never },
})
