'use client'
// Story 93.1 — AdminPageHeader : composant partagé premium (eyebrow + title + subtitle + période/action)
// Basé sur template _bmad-output/design-references/Template - page admin Dashboard.zip (app.jsx lignes 70-85).
// Tokens @aureak/theme uniquement — React Native pur (pas de DOM).
import React from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

export type AdminPageHeaderProps = {
  eyebrow      : string
  title        : string
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

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  periodButton,
  actionButton,
}: AdminPageHeaderProps) {
  const { width } = useWindowDimensions()
  const isMobile  = width < MOBILE_BREAKPOINT

  return (
    <View style={[s.container, isMobile && s.containerMobile] as never}>
      {/* Zone gauche : eyebrow + title + subtitle */}
      <View style={s.left}>
        <AureakText style={s.eyebrow as TextStyle}>{eyebrow}</AureakText>
        <AureakText style={s.title as TextStyle}>{title}</AureakText>
        {subtitle && (
          <AureakText style={[s.subtitle, isMobile && s.subtitleMobile] as never}>
            {subtitle}
          </AureakText>
        )}
      </View>

      {/* Zone droite : bouton période + bouton action (si fournis) */}
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
    alignItems       : 'flex-start',
    gap              : space.lg,
    paddingHorizontal: space.lg,
    paddingTop       : space.xl,
    paddingBottom    : space.lg,
    backgroundColor  : colors.light.primary,
  },
  containerMobile: {
    flexDirection: 'column',
    gap          : space.md,
  },
  left: {
    flex: 1,
    gap : space.xs,
  },
  eyebrow: {
    fontSize      : 11,
    fontWeight    : '600',
    letterSpacing : 1,
    textTransform : 'uppercase',
    color         : colors.text.muted,
    fontFamily    : fonts.body,
  },
  title: {
    fontSize     : 32,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: -0.5,
    lineHeight   : 38,
  },
  subtitle: {
    fontSize  : 14,
    fontWeight: '400',
    color     : colors.text.subtle,
    lineHeight: 21,
    maxWidth  : 520,
    marginTop : space.xs,
  },
  subtitleMobile: {
    maxWidth: '100%',
  },
  right: {
    flexDirection: 'row',
    alignItems   : 'flex-start',
    gap          : space.sm,
  },
  rightMobile: {
    flexWrap: 'wrap',
  },
  periodBtn: {
    backgroundColor  : 'transparent',
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : 8,
  },
  periodBtnLabel: {
    color     : colors.text.dark,
    fontWeight: '500',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  actionBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : 8,
  },
  actionBtnLabel: {
    color     : colors.text.dark,
    fontWeight: '700',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.7,
  },
})
