import React from 'react'
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { SessionRowAdmin } from '@aureak/api-client'
import { MONTHS_FR } from './constants'

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  sessions     : SessionRowAdmin[]
  year         : number
  onMonthClick : (monthIndex: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function YearView({ sessions, year, onMonthClick }: Props) {
  const { width } = useWindowDimensions()
  const cols      = width >= 1024 ? 4 : width >= 640 ? 3 : 2
  const cardWidth : `${number}%` = `${Math.floor(100 / cols)}%`

  // Group sessions by month index (0-11)
  const byMonth: SessionRowAdmin[][] = Array.from({ length: 12 }, () => [])
  for (const s of sessions) {
    const m = new Date(s.scheduledAt).getMonth()
    byMonth[m].push(s)
  }

  return (
    <View style={st.grid}>
      {MONTHS_FR.map((monthName, idx) => {
        const monthSess = byMonth[idx]
        const total     = monthSess.length
        const planified = monthSess.filter(s => s.status === 'planifiée').length
        const realized  = monthSess.filter(s => s.status === 'réalisée').length
        const cancelled = monthSess.filter(s => s.status === 'annulée').length
        const enCours   = monthSess.filter(s => s.status === 'en_cours').length
        const reportee  = monthSess.filter(s => s.status === 'reportée').length

        const hasAny       = total > 0
        const allRealized  = hasAny && realized === total
        const hasPlanned   = planified > 0

        const accentColor = !hasAny
          ? colors.border.light
          : allRealized
            ? colors.status.success
            : hasPlanned
              ? colors.accent.gold
              : colors.text.muted

        return (
          <Pressable
            key={idx}
            style={{ width: cardWidth, padding: space.xs }}
            onPress={() => onMonthClick(idx)}
          >
            {({ pressed }) => (
              <View style={[
                st.card,
                pressed && st.cardPressed,
                hasAny && { borderTopColor: accentColor, borderTopWidth: 3 },
              ]}>
                <AureakText style={[st.monthName, hasAny && { color: colors.text.dark }] as never}>
                  {monthName}
                </AureakText>

                {hasAny ? (
                  <>
                    <AureakText style={[st.totalCount, { color: accentColor }] as never}>
                      {`${total} séance${total > 1 ? 's' : ''}`}
                    </AureakText>
                    <View style={st.breakdown}>
                      {planified > 0 && (
                        <View style={st.breakdownRow}>
                          <View style={[st.dot, { backgroundColor: colors.accent.gold }]} />
                          <AureakText style={st.breakdownText}>{`Planifiée${planified > 1 ? 's' : ''} : ${planified}`}</AureakText>
                        </View>
                      )}
                      {enCours > 0 && (
                        <View style={st.breakdownRow}>
                          <View style={[st.dot, { backgroundColor: colors.status.info }]} />
                          <AureakText style={st.breakdownText}>{`En cours : ${enCours}`}</AureakText>
                        </View>
                      )}
                      {realized > 0 && (
                        <View style={st.breakdownRow}>
                          <View style={[st.dot, { backgroundColor: colors.status.success }]} />
                          <AureakText style={st.breakdownText}>{`Réalisée${realized > 1 ? 's' : ''} : ${realized}`}</AureakText>
                        </View>
                      )}
                      {reportee > 0 && (
                        <View style={st.breakdownRow}>
                          <View style={[st.dot, { backgroundColor: colors.status.warning }]} />
                          <AureakText style={st.breakdownText}>{`Reportée${reportee > 1 ? 's' : ''} : ${reportee}`}</AureakText>
                        </View>
                      )}
                      {cancelled > 0 && (
                        <View style={st.breakdownRow}>
                          <View style={[st.dot, { backgroundColor: colors.status.absent }]} />
                          <AureakText style={st.breakdownText}>{`Annulée${cancelled > 1 ? 's' : ''} : ${cancelled}`}</AureakText>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <AureakText style={st.noSession}>Aucune séance</AureakText>
                )}
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  grid       : { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },

  card       : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : 4,
    boxShadow: shadows.sm,
  },
  cardPressed: { backgroundColor: colors.light.hover ?? colors.light.muted },

  monthName  : { fontSize: 13, fontWeight: '700' as never, color: colors.text.muted },
  totalCount : { fontSize: 20, fontWeight: '800' as never, lineHeight: 24 },

  breakdown  : { gap: 2, marginTop: 2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot        : { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  breakdownText: { fontSize: 10, color: colors.text.muted },

  noSession  : { fontSize: 11, color: colors.text.muted, fontStyle: 'italic' as never, marginTop: 4 },
})
