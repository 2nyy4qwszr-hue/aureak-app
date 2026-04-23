'use client'
// Story 101.5 — <ErrorState /> responsive
//
// Pattern : AlertTriangleIcon (rouge) + titre + message + bouton "Réessayer" optionnel.
// Responsive via useWindowDimensions (breakpoint 640).
// Tokens @aureak/theme uniquement.
// A11y : `accessibilityRole="text"` sur titre, `accessibilityRole="alert"` sur wrap.

import React from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { AlertTriangleIcon, AureakText } from '@aureak/ui'
import { colors, space, radius, typography } from '@aureak/theme'

const MOBILE_MAX = 640

const ICON_SIZE_MOBILE  = 48
const ICON_SIZE_DESKTOP = 64

export type ErrorStateProps = {
  /** Titre — défaut : "Une erreur est survenue". */
  title?   : string
  /** Message secondaire — défaut : "Veuillez réessayer dans quelques instants". */
  message? : string
  /** Callback au clic "Réessayer". Si absent : pas de bouton rendu. */
  onRetry? : () => void
}

const DEFAULT_TITLE   = 'Une erreur est survenue'
const DEFAULT_MESSAGE = 'Veuillez réessayer dans quelques instants'

export function ErrorState({
  title   = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  onRetry,
}: ErrorStateProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < MOBILE_MAX

  const iconSize = isMobile ? ICON_SIZE_MOBILE : ICON_SIZE_DESKTOP

  return (
    <View
      accessibilityRole="alert"
      style={[s.wrap, isMobile ? s.wrapMobile : s.wrapDesktop]}
    >
      <View style={s.iconBox}>
        <AlertTriangleIcon size={iconSize} color={colors.status.absent} strokeWidth={1.5} />
      </View>

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

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          style={({ pressed }) => [s.retry, pressed && s.retryPressed] as never}
        >
          <AureakText style={s.retryLabel as never}>Réessayer</AureakText>
        </Pressable>
      ) : null}
    </View>
  )
}

export default ErrorState

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

  // ── Retry button (primary CTA, accent gold) ───────────────────────────────
  retry: {
    marginTop        : space.sm,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignSelf        : 'center',
  },
  retryPressed: {
    opacity: 0.85,
  },
  retryLabel: {
    fontFamily: typography.body.family,
    fontWeight: '700',
    fontSize  : 13,
    color     : colors.text.onGold,
  },
})
