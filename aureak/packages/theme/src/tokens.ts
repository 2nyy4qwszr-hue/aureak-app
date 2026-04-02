// @aureak/theme — Design tokens AUREAK
// SOURCE DE VÉRITÉ : ux-design-specification.md + aureak.be DA audit
// RÈGLE : jamais de valeur hardcodée dans les apps ou composants — toujours via ces tokens

// =============================================================================
// Couleurs
// =============================================================================

export const colors = {
  // ── Dark theme (mobile, sidebar) ──────────────────────────────────────────
  background: {
    primary : '#1A1A1A',  // noir chaud — fond principal app mobile (dark)
    surface : '#171717',  // cards, listes, rows (dark)
    elevated: '#242424',  // modals, drawers, overlays (dark)
  },
  // ── Light theme (admin web, inspiré aureak.be) ────────────────────────────
  light: {
    primary : '#F3EFE7',  // beige crème — fond principal admin web
    surface : '#FFFFFF',  // cards blanches
    elevated: '#FFFFFF',  // modals blancs
    hover   : '#EDE9DF',  // beige légèrement plus foncé pour hover
    muted   : '#F8F6F1',  // surface atténuée (table headers, panels)
  },
  accent: {
    gold     : '#C1AC5C',  // or champagne AUREAK — signature, accents, badges
    goldLight: '#D6C98E',  // or clair — featured sections, highlight doux
    beige    : '#F3EFE7',  // beige/crème — warm accent, web admin background
    zinc     : '#424242',  // gris zinc — éléments secondaires, bordures inactives (dark)
    ivory    : '#F0EDE0',  // blanc ivoire — texte sur fond sombre (variante)
    red      : '#E05252',  // rouge CTA — boutons d'action uniquement
  },
  status: {
    present  : '#4CAF50',  // présent 🟢 — présences ET évaluation positive
    attention: '#FFC107',  // point d'attention 🟡 — évaluation uniquement
    absent   : '#F44336',  // absent 🔴 — PRÉSENCES UNIQUEMENT
    success  : '#10B981',  // émeraude — checkmarks validation (site web)
  },
  text: {
    primary  : '#FFFFFF',         // texte principal sur fond sombre
    secondary: '#A0A0A0',         // texte secondaire sur fond sombre
    dark     : '#18181B',         // texte principal sur fond clair (zinc-900)
    muted    : '#71717A',         // texte atténué sur fond clair (zinc-500)
    subtle   : '#A1A1AA',        // labels discrets sur fond clair (zinc-400)
  },
  border: {
    light   : '#E5E7EB',         // bordures inputs/tables fond clair
    gold    : 'rgba(193,172,92,0.25)',  // bordure dorée subtile (badges, profils)
    goldSolid: 'rgba(193,172,92,0.5)',  // bordure dorée plus visible
    dark    : '#424242',          // = zinc, bordures sur fond sombre
    divider : '#E8E4DC',         // séparateur sur fond beige
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
  display : { size: 36, weight: '900' as const, family: 'Rajdhani',   letterSpacing: 0.5 },
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
  xs    :   6,  // inputs, petits éléments
  card  :  16,  // cards (site = rounded-2xl)
  cardLg:  24,  // cards navigation (site = rounded-3xl)
  button:  12,  // boutons (site = rounded-xl)
  badge : 999,  // pills (site = rounded-full)
} as const

// =============================================================================
// Ombres (3 niveaux — inspiré aureak.be)
// =============================================================================

export const shadows = {
  sm : '0 1px 2px rgba(0,0,0,0.06)',                                     // cards au repos
  md : '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',        // cards hover
  lg : '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',       // modals, éléments élevés
  gold: '0 2px 12px rgba(193,172,92,0.15)',                               // accent premium
} as const

// =============================================================================
// Layout (admin web)
// =============================================================================

export const layout = {
  containerMaxWidth: 1152,
  sidebarWidth     : 220,
  sectionPaddingY  : { mobile: 24, desktop: 32 },
  contentPaddingX  : { mobile: 16, tablet: 24, desktop: 32 },
} as const

// =============================================================================
// Transitions
// =============================================================================

export const transitions = {
  fast   : '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal : '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow   : '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// =============================================================================
// Couleurs des méthodes pédagogiques
// Source de vérité pour METHODOLOGY_METHOD_COLOR (ARCH-10 : hex uniquement dans tokens.ts)
// =============================================================================

export const methodologyMethodColors = {
  'Goal and Player' : '#FFB800',
  'Technique'       : '#4FC3F7',
  'Situationnel'    : '#66BB6A',
  'Performance'     : '#EF4444',
  'Décisionnel'     : '#CE93D8',
  'Intégration'     : '#F97316',
  'Perfectionnement': '#EC4899',
} as const

// =============================================================================
// Export agrégé
// =============================================================================

const tokens = { colors, fonts, typography, space, radius, shadows, layout, transitions, methodologyMethodColors }
export default tokens
