// Story 87.2 — Styles communs pour les cards de la fiche universelle.
// Exporté partagé pour garder une identité visuelle cohérente entre modules.

import { StyleSheet } from 'react-native'
import { colors, fonts, space, radius } from '@aureak/theme'

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.lg,
    gap            : space.md,
  },
  title: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1,
    fontFamily   : fonts.display,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize  : 14,
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  muted: {
    color   : colors.text.muted,
    fontSize: 13,
  },
  subLabel: {
    fontSize  : 11,
    color     : colors.text.muted,
    fontStyle : 'italic',
  },
})
