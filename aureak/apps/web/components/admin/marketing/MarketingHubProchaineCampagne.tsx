'use client'
// Vue d'ensemble Marketing : widget "Prochaine campagne".
// Placeholder en attendant l'API campagnes — design aligné sur ActivitesHubNextSession.
import React from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

export function MarketingHubProchaineCampagne() {
  const router = useRouter()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push('/marketing/campagnes' as never)}
    >
      <AureakText style={styles.title as TextStyle}>Prochaine campagne</AureakText>

      <View style={styles.body}>
        <AureakText style={styles.empty as TextStyle}>
          Aucune campagne planifiée
        </AureakText>
        <AureakText style={styles.hint as TextStyle}>
          Programmer une campagne SMS ou email pour les parents et clubs partenaires.
        </AureakText>
      </View>

      <View style={styles.footer}>
        <AureakText style={styles.footerLink as TextStyle}>
          Créer une campagne →
        </AureakText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
    boxShadow      : shadows.sm,
    minHeight      : 220,
  },
  cardPressed: {
    backgroundColor: colors.light.hover,
  },
  title: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  body: {
    gap      : space.xs,
    marginTop: space.xs,
  },
  empty: {
    fontFamily: fonts.heading,
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    lineHeight: 19,
  },
  footer: {
    marginTop : 'auto',
    paddingTop: space.sm,
  },
  footerLink: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.accent.goldDarkText,
  },
})
