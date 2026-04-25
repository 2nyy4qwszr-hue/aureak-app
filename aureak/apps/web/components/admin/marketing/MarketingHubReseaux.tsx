'use client'
// Vue d'ensemble Marketing : widget "Réseaux sociaux".
// Placeholder en attendant l'API analytics — design aligné sur ActivitesHubAtRiskPlayers.
import React from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', followers: '—', delta: '—' },
  { key: 'facebook',  label: 'Facebook',  followers: '—', delta: '—' },
  { key: 'tiktok',    label: 'TikTok',    followers: '—', delta: '—' },
] as const

export function MarketingHubReseaux() {
  const router = useRouter()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push('/marketing/reseaux' as never)}
    >
      <AureakText style={styles.title as TextStyle}>Réseaux sociaux</AureakText>

      <View style={styles.list}>
        {PLATFORMS.map(p => (
          <View key={p.key} style={styles.row}>
            <View style={styles.rowMain}>
              <AureakText style={styles.rowLabel as TextStyle}>{p.label}</AureakText>
              <AureakText style={styles.rowMeta as TextStyle}>
                {p.followers} abonnés
              </AureakText>
            </View>
            <AureakText style={styles.rowDelta as TextStyle}>{p.delta}</AureakText>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <AureakText style={styles.footerLink as TextStyle}>
          Voir les réseaux →
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
  list: {
    gap: space.sm,
  },
  row: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
    paddingVertical: 4,
  },
  rowMain: {
    flex: 1,
    gap : 2,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  rowDelta: {
    fontFamily: fonts.mono,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.muted,
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
