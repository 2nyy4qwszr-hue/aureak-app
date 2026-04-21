'use client'
// Story 87.2 — Module "Contenus marketing" (conditionnel role === 'marketeur')
// Placeholder pur — les tables marketing (Epic 91) ne sont pas déployées.
// TODO(epic-91): remplacer par un appel API quand le schéma marketing sera prêt.

import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import type { UserRow } from '@aureak/api-client'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from '../card'

type ContenusMarketingModuleProps = {
  profile: UserRow
}

export function ContenusMarketingModule({ profile }: ContenusMarketingModuleProps) {
  if (profile.userRole !== 'marketeur') return null

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Contenus marketing</AureakText>
      <View style={s.body}>
        <AureakText style={s.value as TextStyle}>—</AureakText>
        <AureakText style={s.sub as TextStyle}>CONTENUS PUBLIÉS</AureakText>
        <AureakText style={cardStyles.subLabel as TextStyle}>À venir — Epic 91 non déployé</AureakText>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  body : { alignItems: 'center', gap: 4, paddingVertical: space.sm },
  value: { fontSize: 32, fontWeight: '900', color: colors.text.muted, fontFamily: fonts.display },
  sub  : { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' },
})
