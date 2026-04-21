'use client'
// Story 87.2 — Onglet Accès : placeholder.
// Le contenu complet (rôles assignés, overrides, historique accès) sera
// implémenté dans la story 87.3 sans changer cette interface.

import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export function AccesTab() {
  return (
    <View style={s.wrapper}>
      <AureakText variant="h2" style={s.title as TextStyle}>Accès et permissions</AureakText>
      <AureakText variant="body" style={s.body as TextStyle}>
        Cet onglet sera implémenté dans la story 87-3. Il exposera les rôles assignés,
        les overrides de permissions et l'historique des changements d'accès.
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xxl,
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    gap            : space.md,
  },
  title: { color: colors.text.dark },
  body : { color: colors.text.muted, textAlign: 'center', maxWidth: 480 },
})
