import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { SessionRowAdmin } from '@aureak/api-client'
import SessionCard from './SessionCard'

type Props = {
  sessions    : SessionRowAdmin[]
  coachNameMap: Map<string, string>
  groupMap    : Map<string, string>
  implantMap  : Map<string, string>
  onPress     : (id: string) => void
  onEdit      : (id: string) => void
}

export default function DayView({
  sessions, coachNameMap, groupMap, implantMap, onPress, onEdit,
}: Props) {
  const { width } = useWindowDimensions()

  // Responsive column width
  const colWidth: `${number}%` = width >= 1024 ? '25%' : width >= 768 ? '50%' : '100%'

  if (sessions.length === 0) {
    return (
      <View style={st.empty}>
        <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucune séance ce jour</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
          Utilisez "+ Nouvelle séance" pour en créer une.
        </AureakText>
      </View>
    )
  }

  return (
    <View style={st.grid}>
      {sessions.map(s => (
        <View key={s.id} style={{ width: colWidth, padding: space.xs }}>
          <SessionCard
            session     ={s}
            coachNameMap={coachNameMap}
            groupMap    ={groupMap}
            implantMap  ={implantMap}
            onPress     ={onPress}
            onEdit      ={onEdit}
          />
        </View>
      ))}
    </View>
  )
}

const st = StyleSheet.create({
  grid : { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
  empty: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : 48,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
})
