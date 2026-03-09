// @aureak/theme — Configuration Tamagui avec tokens AUREAK
// Les tokens $ (ex: $backgroundPrimary, $gold) sont utilisables dans tous les styled components

import { createFont, createTamagui, createTokens } from 'tamagui'
import { colors, space, radius } from './tokens'

// =============================================================================
// Tokens Tamagui — mapping des tokens AUREAK vers les variables $
// =============================================================================

const tamaguiTokens = createTokens({
  color: {
    // Dark backgrounds
    backgroundPrimary : colors.background.primary,
    backgroundSurface : colors.background.surface,
    backgroundElevated: colors.background.elevated,
    // Light backgrounds
    lightPrimary      : colors.light.primary,
    lightSurface      : colors.light.surface,
    lightElevated     : colors.light.elevated,
    lightHover        : colors.light.hover,
    lightMuted        : colors.light.muted,
    // Accent
    gold              : colors.accent.gold,
    goldLight         : colors.accent.goldLight,
    beige             : colors.accent.beige,
    zinc              : colors.accent.zinc,
    ivory             : colors.accent.ivory,
    red               : colors.accent.red,
    // Status
    statusPresent     : colors.status.present,
    statusAttention   : colors.status.attention,
    statusAbsent      : colors.status.absent,
    statusSuccess     : colors.status.success,
    // Text
    textPrimary       : colors.text.primary,
    textSecondary     : colors.text.secondary,
    textDark          : colors.text.dark,
    textMuted         : colors.text.muted,
    textSubtle        : colors.text.subtle,
    // Borders
    borderLight       : colors.border.light,
    borderGold        : colors.border.gold,
    borderGoldSolid   : colors.border.goldSolid,
    borderDark        : colors.border.dark,
    borderDivider     : colors.border.divider,
  },
  space: {
    $xs   : space.xs,
    $sm   : space.sm,
    $md   : space.md,
    $lg   : space.lg,
    $xl   : space.xl,
    $xxl  : space.xxl,
    $xxxl : space.xxxl,
    // Tamagui requires these numeric tokens
    0: 0, 1: 4, 2: 8, 3: 16, 4: 24, 5: 32,
    true: space.md,
  },
  size: {
    $xs: space.xs, $sm: space.sm, $md: space.md,
    $lg: space.lg, $xl: space.xl, $xxl: space.xxl,
    0: 0, 1: 4, 2: 8, 3: 16, 4: 24, 5: 32,
    true: space.md,
  },
  radius: {
    xs    : radius.xs,
    card  : radius.card,
    cardLg: radius.cardLg,
    button: radius.button,
    badge : radius.badge,
    0: 0, 1: 4, 2: 8,
    true: radius.card,
  },
  zIndex: {
    base   :  0,
    overlay: 10,
    modal  : 20,
    0: 0, 1: 10, 2: 20,
    true: 0,
  },
})

// =============================================================================
// Fonts Tamagui — chargement via useFonts dans les apps (_layout.tsx)
// =============================================================================

const rajdhaniFont = createFont({
  family: 'Rajdhani',
  size: {
    1: 14, 2: 16, 3: 18, 4: 22, 5: 28, 6: 36, 7: 48,
    true: 16,
  },
  lineHeight: {
    1: 20, 2: 24, 3: 26, 4: 30, 5: 36, 6: 44, 7: 52,
    true: 24,
  },
  weight: {
    4: '400', 6: '600', 7: '700', 9: '900',
    true: '400',
  },
  letterSpacing: {
    1: 0.1, 2: 0.2, 3: 0.3, 4: 0.5,
    true: 0,
  },
})

const geistFont = createFont({
  family: 'Geist',
  size: {
    1: 11, 2: 12, 3: 13, 4: 15, 5: 16, 6: 18,
    true: 15,
  },
  lineHeight: {
    1: 14, 2: 16, 3: 18, 4: 22, 5: 24, 6: 26,
    true: 22,
  },
  weight: {
    4: '400', 5: '500', 6: '600', 7: '700',
    true: '400',
  },
  letterSpacing: {
    1: 0, 2: 0.3, 3: 0.8,
    true: 0,
  },
})

// =============================================================================
// Config Tamagui
// =============================================================================

export const tamaguiConfig = createTamagui({
  tokens: tamaguiTokens,
  themes: {
    // ── Dark theme — mobile, sidebar ──────────────────────────────────────
    dark: {
      background       : colors.background.primary,
      backgroundHover  : colors.background.surface,
      backgroundFocus  : colors.background.elevated,
      backgroundPress  : colors.background.elevated,
      backgroundStrong : colors.background.elevated,
      backgroundTransparent: 'transparent',
      color            : colors.text.primary,
      colorHover       : colors.accent.gold,
      colorPress       : colors.accent.gold,
      colorFocus       : colors.accent.gold,
      colorTransparent : 'transparent',
      borderColor      : colors.accent.zinc,
      borderColorHover : colors.accent.gold,
      borderColorFocus : colors.accent.gold,
      borderColorPress : colors.accent.gold,
      placeholderColor : colors.text.secondary,
    },
    // ── Light theme — admin web (inspiré aureak.be) ──────────────────────
    light: {
      background       : colors.light.primary,
      backgroundHover  : colors.light.hover,
      backgroundFocus  : colors.light.surface,
      backgroundPress  : colors.light.hover,
      backgroundStrong : colors.light.muted,
      backgroundTransparent: 'transparent',
      color            : colors.text.dark,
      colorHover       : colors.accent.gold,
      colorPress       : colors.accent.gold,
      colorFocus       : colors.accent.gold,
      colorTransparent : 'transparent',
      borderColor      : colors.border.light,
      borderColorHover : colors.accent.gold,
      borderColorFocus : colors.accent.gold,
      borderColorPress : colors.accent.gold,
      placeholderColor : colors.text.subtle,
    },
  },
  defaultTheme: 'dark',
  fonts: {
    heading: rajdhaniFont,
    body   : geistFont,
  },
  settings: {
    allowedStyleValues: 'somewhat-strict',
    autocompleteSpecificTokens: true,
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
