// @aureak/theme — Design tokens AUREAK Dark Manga Premium
// SOURCE DE VÉRITÉ : ux-design-specification.md#Design-Tokens-AUREAK
// RÈGLE : jamais de valeur hardcodée dans les apps ou composants — toujours via ces tokens

// =============================================================================
// Couleurs
// =============================================================================

export const colors = {
  background: {
    primary : '#1A1A1A',  // noir chaud — fond principal app mobile (dark)
    surface : '#171717',  // cards, listes, rows
    elevated: '#242424',  // modals, drawers, overlays
  },
  accent: {
    gold  : '#C1AC5C',  // or champagne AUREAK — accents, Top séance ⭐, CTA premium
    beige : '#F3EFE7',  // beige/crème — warm accent, web dashboard background
    zinc  : '#424242',  // gris zinc — éléments secondaires, bordures inactives
    ivory : '#F0EDE0',  // blanc ivoire — texte sur fond sombre (variante)
  },
  status: {
    present  : '#4CAF50',  // présent 🟢 — présences ET évaluation positive
    attention: '#FFC107',  // point d'attention 🟡 — évaluation uniquement
    absent   : '#F44336',  // absent 🔴 — PRÉSENCES UNIQUEMENT, jamais en IndicatorToggle
  },
  text: {
    primary  : '#FFFFFF',
    secondary: '#A0A0A0',
    dark     : '#171717',  // sur fond beige/blanc — web dashboard
  },
} as const

// =============================================================================
// Polices
// =============================================================================

export const fonts = {
  display : 'Rajdhani',    // titres, stats clés
  heading : 'Rajdhani',    // H1, H2, H3
  body    : 'Geist',       // paragraphes, labels, descriptions
  mono    : 'Geist Mono',  // valeurs numériques, données tabulaires
} as const

// =============================================================================
// Typographie
// =============================================================================

export const typography = {
  display : { size: 36, weight: '700' as const, family: 'Rajdhani',   letterSpacing: 0.5 },
  h1      : { size: 28, weight: '700' as const, family: 'Rajdhani',   letterSpacing: 0.3 },
  h2      : { size: 22, weight: '600' as const, family: 'Rajdhani',   letterSpacing: 0.2 },
  h3      : { size: 18, weight: '600' as const, family: 'Rajdhani',   letterSpacing: 0.1 },
  bodyLg  : { size: 16, weight: '400' as const, family: 'Geist',      lineHeight: 24 },
  body    : { size: 15, weight: '400' as const, family: 'Geist',      lineHeight: 22 },
  bodySm  : { size: 13, weight: '400' as const, family: 'Geist',      lineHeight: 18 },
  caption : { size: 11, weight: '400' as const, family: 'Geist',      lineHeight: 14 },
  label   : { size: 12, weight: '600' as const, family: 'Geist',      letterSpacing: 0.8, textTransform: 'uppercase' as const },
  stat    : { size: 24, weight: '700' as const, family: 'Geist Mono' },
} as const

// =============================================================================
// Espacements
// =============================================================================

export const space = {
  xs   :  4,
  sm   :  8,
  md   : 16,
  lg   : 24,
  xl   : 32,
  xxl  : 48,
  xxxl : 64,
} as const

// =============================================================================
// Rayons de bordure
// =============================================================================

export const radius = {
  card  :  16,
  button:  12,
  badge : 999,
} as const

// =============================================================================
// Export agrégé
// =============================================================================

const tokens = { colors, fonts, typography, space, radius }
export default tokens
