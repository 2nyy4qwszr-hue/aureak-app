import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText } from './Text'
import { colors, space, radius, layout } from '@aureak/theme'

type Props = {
  icon?    : string
  title    : string
  subtitle?: string
  ctaLabel?: string
  onCta?   : () => void
}

export function EmptyState({ icon = '📭', title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.container}>
      <AureakText variant="body" style={styles.icon}>{icon}</AureakText>
      <AureakText variant="h3" style={styles.title}>{title}</AureakText>
      {subtitle && (
        <AureakText variant="caption" style={styles.subtitle}>{subtitle}</AureakText>
      )}
      {ctaLabel && onCta && (
        <Pressable onPress={onCta} style={styles.cta}>
          <AureakText variant="caption" style={styles.ctaText}>{ctaLabel}</AureakText>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems    : 'center',
    justifyContent: 'center',
    paddingVertical: layout.sectionPaddingY.editorial.mobile,
    gap           : space.sm,
  },
  icon    : { fontSize: 40, marginBottom: space.sm },
  title   : { color: colors.text.dark, textAlign: 'center' as never },
  subtitle: { color: colors.text.muted, textAlign: 'center' as never, maxWidth: 280 },
  cta     : {
    marginTop       : space.sm,
    paddingHorizontal: space.lg,
    paddingVertical  : space.xs + 2,
    borderRadius    : radius.button,
    backgroundColor : colors.accent.gold,
  },
  ctaText : { color: colors.text.dark, fontWeight: '700' as never },
})
