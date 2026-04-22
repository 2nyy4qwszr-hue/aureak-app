'use client'
// Story 99.1 — Carte de la grille du hub /administration
import React from 'react'
import { Pressable, View, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import type { NavIconProps } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

export type AdministrationHubCardProps = {
  Icon       : React.ComponentType<NavIconProps>
  title      : string
  description: string
  count?     : number
  href       : string
}

export function AdministrationHubCard({
  Icon,
  title,
  description,
  count,
  href,
}: AdministrationHubCardProps) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={({ pressed }) => [s.card, pressed && s.pressed] as never}
    >
      <View style={s.iconRow}>
        <View style={s.iconWrap}>
          <Icon color={colors.accent.gold} size={24} strokeWidth={1.5} />
        </View>
        {typeof count === 'number' && count > 0 && (
          <View style={s.countBadge}>
            <AureakText style={s.countLabel as TextStyle}>{count}</AureakText>
          </View>
        )}
      </View>
      <AureakText style={s.title as TextStyle}>{title}</AureakText>
      <AureakText style={s.description as TextStyle}>{description}</AureakText>
      <AureakText style={s.arrow as TextStyle}>Ouvrir →</AureakText>
    </Pressable>
  )
}

export default AdministrationHubCard

const s = StyleSheet.create({
  card: {
    flex           : 1,
    minWidth       : 240,
    maxWidth       : 360,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    gap            : space.xs,
    // @ts-ignore — web only boxShadow
    boxShadow      : shadows.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  iconRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : space.sm,
  },
  iconWrap: {
    width          : 44,
    height         : 44,
    borderRadius   : radius.card,
    backgroundColor: colors.accent.gold + '12',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : 999,
    backgroundColor  : colors.accent.gold,
  },
  countLabel: {
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.text.onGold,
    fontFamily: fonts.body,
  },
  title: {
    fontSize  : 18,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  description: {
    fontSize  : 13,
    color     : colors.text.muted,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  arrow: {
    marginTop : space.sm,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.accent.gold,
    fontFamily: fonts.body,
  },
})
