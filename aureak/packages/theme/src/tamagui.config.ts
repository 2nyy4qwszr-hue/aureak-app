// @aureak/theme — Configuration Tamagui avec tokens AUREAK Dark Manga Premium
// Les tokens $ (ex: $backgroundPrimary, $gold) sont utilisables dans tous les styled components

import { createFont, createTamagui, createTokens } from 'tamagui'
import { colors, space, radius } from './tokens'

// =============================================================================
// Tokens Tamagui — mapping des tokens AUREAK vers les variables $
// =============================================================================

const tamaguiTokens = createTokens({
  color: {
    backgroundPrimary : colors.background.primary,
    backgroundSurface : colors.background.surface,
    backgroundElevated: colors.background.elevated,
    gold              : colors.accent.gold,
    beige             : colors.accent.beige,
    zinc              : colors.accent.zinc,
    ivory             : colors.accent.ivory,
    statusPresent     : colors.status.present,
    statusAttention   : colors.status.attention,
    statusAbsent      : colors.status.absent,
    textPrimary       : colors.text.primary,
    textSecondary     : colors.text.secondary,
    textDark          : colors.text.dark,
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
    card  : radius.card,
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
    1: 14, 2: 16, 3: 18, 4: 22, 5: 28, 6: 36,
    true: 16,
  },
  lineHeight: {
    1: 20, 2: 24, 3: 26, 4: 30, 5: 36, 6: 44,
    true: 24,
  },
  weight: {
    4: '400', 6: '600', 7: '700',
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
    4: '400', 5: '500', 6: '600',
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
    // Tamagui requires a "light" theme to exist internally (used as fallback in useThemeState)
    light: {
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
