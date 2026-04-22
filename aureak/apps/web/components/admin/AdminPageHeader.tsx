'use client'
// Story 93.1 — AdminPageHeader : composant partagé premium (eyebrow + title + subtitle + période/action)
// Story 97.3 — v2 : eyebrow/subtitle optionnels, alignItems center pour centrer les boutons sur le H1.
// Tokens @aureak/theme uniquement — React Native pur (pas de DOM).
import React from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

export type AdminPageHeaderProps = {
  title        : string
  eyebrow?     : string
  subtitle?    : string
  periodButton?: {
    label  : string
    onPress: () => void
  }
  actionButton?: {
    label  : string
    onPress: () => void
  }
}

const MOBILE_BREAKPOINT = 640
const DESKTOP_BREAKPOINT = 1024

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  periodButton,
  actionButton,
}: AdminPageHeaderProps) {
  const { width }  = useWindowDimensions()
  const isMobile   = width < MOBILE_BREAKPOINT
  const isDesktop  = width >= DESKTOP_BREAKPOINT
  const titleSize  = isDesktop ? 38 : isMobile ? 32 : 34

  return (
    <View style={[s.container, isMobile && s.containerMobile] as never}>
      <View style={s.left}>
        {eyebrow && (
          <View style={s.eyebrowRow}>
            <AureakText style={s.eyebrow as TextStyle}>{eyebrow}</AureakText>
            <View style={s.eyebrowBar} />
          </View>
        )}
        <AureakText style={[s.title, { fontSize: titleSize, lineHeight: titleSize * 1.05 }] as never}>{title}</AureakText>
        {subtitle && (
          <AureakText style={[s.subtitle, isMobile && s.subtitleMobile] as never}>
            {subtitle}
          </AureakText>
        )}
      </View>

      {(periodButton || actionButton) && (
        <View style={[s.right, isMobile && s.rightMobile] as never}>
          {periodButton && (
            <Pressable
              onPress={periodButton.onPress}
              style={({ pressed }) => [s.periodBtn, pressed && s.pressed] as never}
            >
              <AureakText style={s.periodBtnLabel as TextStyle}>
                {periodButton.label}
                {' ▾'}
              </AureakText>
            </Pressable>
          )}
          {actionButton && (
            <Pressable
              onPress={actionButton.onPress}
              style={({ pressed }) => [s.actionBtn, pressed && s.pressed] as never}
            >
              <AureakText style={s.actionBtnLabel as TextStyle}>
                {actionButton.label}
              </AureakText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}

export default AdminPageHeader

const s = StyleSheet.create({
  container: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    gap              : 24,
    paddingHorizontal: 36,
    paddingTop       : 32,
    paddingBottom    : 8,
    backgroundColor  : colors.light.primary,
  },
  containerMobile: {
    flexDirection: 'column',
    alignItems   : 'stretch',
    gap          : space.md,
  },
  left: {
    flex: 1,
    gap : space.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 10,
  },
  eyebrow: {
    fontSize      : 11,
    fontWeight    : '900',
    letterSpacing : 2.5,
    textTransform : 'uppercase',
    color         : colors.accent.gold,
    fontFamily    : fonts.body,
  },
  eyebrowBar: {
    width          : 36,
    height         : 1,
    backgroundColor: colors.accent.gold,
  },
  title: {
    fontSize     : 32,
    fontWeight   : '900',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: -1,
    lineHeight   : 38,
  },
  subtitle: {
    fontSize  : 14,
    fontWeight: '400',
    color     : colors.text.subtle,
    lineHeight: 22,
    maxWidth  : 520,
    marginTop : 10,
    fontFamily: fonts.body,
  },
  subtitleMobile: {
    maxWidth: '100%',
  },
  right: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  rightMobile: {
    flexWrap: 'wrap',
  },
  periodBtn: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.text.faint,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  periodBtnLabel: {
    color     : colors.text.dark,
    fontWeight: '600',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  actionBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  actionBtnLabel: {
    color     : colors.text.onGold,
    fontWeight: '600',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.7,
  },
})
