import { colors } from '@aureak/theme'
import { useTheme } from '../contexts/ThemeContext'

// ── useThemeColors ────────────────────────────────────────────────────────────
// Retourne les tokens de couleur adaptés au thème courant (light | dark).
// Utilisation : `const tc = useThemeColors()` dans n'importe quel composant admin.
// Dépendance : le composant doit être à l'intérieur de <ThemeProvider>.

export interface ThemeColors {
  /** Fond principal de la zone de contenu */
  bg        : string
  /** Cards, surfaces de premier niveau */
  surface   : string
  /** Modals, drawers, surfaces élevées */
  elevated  : string
  /** Hover state */
  hover     : string
  /** Surface atténuée (table headers, panels) */
  muted     : string
  /** Texte principal */
  textPrimary: string
  /** Texte secondaire / atténué */
  textMuted : string
  /** Bordures standard */
  border    : string
  /** Séparateurs */
  divider   : string
}

export function useThemeColors(): ThemeColors {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return {
    bg         : isLight ? colors.light.primary  : colors.dark.primary,
    surface    : isLight ? colors.light.surface  : colors.dark.surface,
    elevated   : isLight ? colors.light.elevated : colors.dark.elevated,
    hover      : isLight ? colors.light.hover    : colors.dark.hover,
    muted      : isLight ? colors.light.muted    : colors.dark.muted,
    textPrimary: isLight ? colors.text.dark      : colors.text.primary,
    textMuted  : isLight ? colors.text.muted     : colors.text.secondary,
    border     : isLight ? colors.border.light   : colors.border.dark,
    divider    : isLight ? colors.border.divider : colors.border.dark,
  }
}
