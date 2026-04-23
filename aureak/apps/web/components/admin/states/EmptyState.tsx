'use client'
// Story 101.5 — <EmptyState /> responsive
//
// Pattern : icône (64×64 desktop / 48×48 mobile) + H3 titre + message optionnel + CTA optionnel.
// Consommateur naturel : DataCard `emptyState` prop (Story 101.1) + pages /academie/*.
//
// Responsive via useWindowDimensions (breakpoint 640).
// Tokens @aureak/theme uniquement.
// A11y : `accessibilityRole="text"` sur titre.

import React from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, typography } from '@aureak/theme'

const MOBILE_MAX = 640

const ICON_SIZE_MOBILE  = 48
const ICON_SIZE_DESKTOP = 64

// Compatible avec NavIconProps (@aureak/ui) : `color` requis, `size` & `strokeWidth`
// optionnels — ainsi on peut passer directement ShieldIcon, AlertTriangleIcon, etc.
export type EmptyStateIconProps = {
  color       : string
  size?       : number
  strokeWidth?: number
}

export type EmptyStateAction = {
  label  : string
  onPress: () => void
}

export type EmptyStateProps = {
  /** Composant d'icône (reçoit { size, color }) — ex. icônes `@aureak/ui`. */
  icon?   : React.ComponentType<EmptyStateIconProps>
  /** Titre — rendu en H3 (accessibilityRole="text" + accessibilityLabel). */
  title   : string
  /** Message secondaire (optionnel). */
  message?: string
  /** CTA optionnel (bouton or primaire). */
  action? : EmptyStateAction
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < MOBILE_MAX

  const iconSize  = isMobile ? ICON_SIZE_MOBILE : ICON_SIZE_DESKTOP
  const iconColor = colors.accent.goldLight

  return (
    <View style={[s.wrap, isMobile ? s.wrapMobile : s.wrapDesktop]}>
      {Icon ? (
        <View style={s.iconBox}>
          <Icon size={iconSize} color={iconColor} />
        </View>
      ) : null}

      <View accessibilityRole="text" accessibilityLabel={title}>
        <AureakText style={[s.title, isMobile ? s.titleMobile : s.titleDesktop] as never}>
          {title}
        </AureakText>
      </View>

      {message ? (
        <AureakText style={[s.message, isMobile ? s.messageMobile : s.messageDesktop] as never}>
          {message}
        </AureakText>
      ) : null}

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed] as never}
        >
          <AureakText style={s.ctaLabel as never}>{action.label}</AureakText>
        </Pressable>
      ) : null}
    </View>
  )
}

export default EmptyState

const s = StyleSheet.create({
  // ── Container ─────────────────────────────────────────────────────────────
  wrap: {
    alignItems    : 'center',
    justifyContent: 'center',
    width         : '100%',
  },
  wrapMobile: {
    paddingVertical  : space.xl,
    paddingHorizontal: space.md,
    gap              : space.sm,
  },
  wrapDesktop: {
    paddingVertical  : space.xxl,
    paddingHorizontal: space.lg,
    gap              : space.md,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconBox: {
    alignItems    : 'center',
    justifyContent: 'center',
    marginBottom  : space.xs,
  },

  // ── Title (H3) ────────────────────────────────────────────────────────────
  title: {
    fontFamily   : typography.h3.family,
    fontWeight   : typography.h3.weight,
    color        : colors.text.dark,
    textAlign    : 'center',
    letterSpacing: typography.h3.letterSpacing,
  },
  titleMobile : { fontSize: 16 },
  titleDesktop: { fontSize: typography.h3.size },

  // ── Message ───────────────────────────────────────────────────────────────
  message: {
    fontFamily: typography.body.family,
    color     : colors.text.muted,
    textAlign : 'center',
    maxWidth  : 360,
  },
  messageMobile : { fontSize: typography.bodySm.size, lineHeight: typography.bodySm.lineHeight },
  messageDesktop: { fontSize: typography.body.size,   lineHeight: typography.body.lineHeight },

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta: {
    marginTop        : space.sm,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignSelf        : 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontFamily: typography.body.family,
    fontWeight: '700',
    fontSize  : 13,
    color     : colors.text.onGold,
  },
})
