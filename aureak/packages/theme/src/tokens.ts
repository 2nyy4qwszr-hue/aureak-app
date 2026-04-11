// @aureak/theme — Design tokens AUREAK
// SOURCE DE VÉRITÉ : ux-design-specification.md + aureak.be DA audit
// RÈGLE : jamais de valeur hardcodée dans les apps ou composants — toujours via ces tokens

// =============================================================================
// Couleurs
// =============================================================================

export const colors = {
  // ── Dark theme (mobile, sidebar) ──────────────────────────────────────────
  background: {
    primary : '#111111',  // noir hero aureak.be — fond sidebar + dark areas
    surface : '#171717',  // cards, listes, rows (dark)
    elevated: '#242424',  // modals, drawers, overlays (dark)
  },
  // ── Sidebar admin (brun chaud intermédiaire) ──────────────────────────────
  sidebar: {
    bg    : '#2D2318',  // brun chaud — fond sidebar admin (entre #1A1A1A et beige)
    border: '#3D3020',  // bordure latérale sidebar
  },
  // ── Light theme (admin web, aligné site homepage) ─────────────────────────
  // Story 83.2 : fond blanc par défaut, beige en alterné (warm)
  light: {
    primary : '#FFFFFF',  // blanc pur — fond principal admin web (défaut)
    surface : '#FFFFFF',  // cards blanches
    elevated: '#FFFFFF',  // modals blancs
    hover   : '#F8F8F8',  // gris très léger — hover neutre
    muted   : '#FAFAFA',  // surface atténuée neutre (table headers, panels)
    warm    : '#F3EFE7',  // beige crème — sections alternées "premium" (hero, featured cards)
  },
  // ── Dark theme (admin web dark mode — Story 51.8 + 61.1) ─────────────────────────
  dark: {
    primary   : '#1A1A1A',  // noir chaud — fond principal dark mode admin
    background: '#0F0F0F',  // noir profond — fond dark mode terrain (Story 61.1 AC2)
    surface   : '#1A1A1A',  // card dark (Story 61.1 AC2)
    elevated  : '#242424',  // card surélevée (Story 61.1 AC2)
    hover     : '#2A2A2A',  // hover state dark (Story 61.1 AC2)
    muted     : '#1E1E1E',  // surface atténuée dark (table headers, panels)
    text      : '#F0F0F0',  // texte principal dark mode (Story 61.1 AC2)
    textMuted : '#A0A0A0',  // texte secondaire dark mode (Story 61.1 AC2)
    border    : '#333333',  // bordure dark mode (Story 61.1 AC2)
    accentGreen: '#00FF88', // vert néon statuts positifs dark (Story 61.1 AC3)
    accentRed  : '#FF4444', // rouge néon statuts négatifs dark (Story 61.1 AC3)
  },
  accent: {
    gold     : '#C1AC5C',  // or champagne AUREAK — signature, accents, badges
    goldLight: '#D6C98E',  // or clair — featured sections, highlight doux
    beige    : '#F3EFE7',  // beige/crème — warm accent, web admin background
    zinc     : '#424242',  // gris zinc — éléments secondaires, bordures inactives (dark)
    ivory    : '#F0EDE0',  // blanc ivoire — texte sur fond sombre (variante)
    // Grades métalliques coach
    bronze   : '#CD7F32',  // bronze
    silver      : '#9CA3AF',  // argent
    silverPodium: '#C0C0C0',  // argent classique podium — podium classements progression
    platinum : '#E5E4E2',  // platine
    // Or sombre / pâle — fond card premium (Story 74-1)
    goldDark : '#6e5d14',  // or sombre — fond card Évals Complétées
    goldPale : '#F9E28C',  // or pâle — texte sur fond gold sombre
    // Équipe B (TacticalEditor)
    teamB    : '#B03030',  // rouge foncé équipe B
  },
  status: {
    present  : '#4CAF50',  // présent 🟢 — présences ET évaluation positive
    attention: '#FFC107',  // point d'attention 🟡 — évaluation uniquement
    absent   : '#F44336',  // absent 🔴 — PRÉSENCES UNIQUEMENT
    success  : '#10B981',  // émeraude — checkmarks validation (site web)
    warning  : '#F59E0B',  // ambre — alertes non-critiques
    info     : '#60A5FA',  // bleu ciel — informations neutres
    neutral  : '#9CA3AF',  // gris — état indéterminé
    injured  : '#CE93D8',  // lilas — blessure / indisponibilité joueur
    // Fonds sémantiques pour bandeaux / alertes
    successBg: '#D1FAE5',  // fond vert émeraude clair — success banners
    successText: '#065F46', // texte sur fond successBg (vert foncé)
    successTextSub: '#059669', // texte secondaire sur fond successBg
    warningBg: '#FFFBEB',  // fond ambre clair — warning banners
    warningText: '#92400E', // texte sur fond warningBg (ambre foncé)
    errorBg  : '#FEF2F2',  // fond rouge clair — error banners
    errorText : '#B91C1C',  // texte sur fond errorBg (rouge foncé)
    errorBorder: '#FECACA', // bordure sur fond errorBg
    errorBorderSevere: '#FEE2E2', // fond rouge plus marqué
    errorStrong: '#E05252', // rouge erreur sémantique (bannières, validation forms, états destructifs) — jamais accent brand
    infoBg   : '#EFF6FF',  // fond bleu clair — info banners
    infoText : '#1D4ED8',  // texte sur fond infoBg (bleu foncé)
    orangeBg : '#FFF7ED',  // fond orange clair — blessure légère
    orangeBorder: '#FED7AA', // bordure orange légère
    orangeText: '#9A3412',  // texte sur fond orangeBg
  },
  overlay: {
    dark : 'rgba(0,0,0,0.5)',          // fond modal standard
    modal: 'rgba(0,0,0,0.7)',          // fond modal plein écran
    light: 'rgba(255,255,255,0.85)',   // surface translucide sur fond sombre
  },
  // Story 47-7 — Couleurs terrain football (gradients implantation / pitch)
  terrain: {
    darkForest : '#1a472a',  // vert forêt sombre — base gradient terrain
    midGreen   : '#2d6a4f',  // vert moyen terrain
    lightGreen : '#40916c',  // vert clair accent terrain
    deepForest : '#1B4332',  // vert forêt profond — variante header
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
    goldBg  : 'rgba(193,172,92,0.10)',  // fond doré très subtil (banners, highlights)
    goldSolid: 'rgba(193,172,92,0.5)',  // bordure dorée plus visible
    dark    : '#424242',          // = zinc, bordures sur fond sombre
    divider : '#E8E4DC',         // séparateur sur fond beige
  },
} as const

// =============================================================================
// Gradients pré-construits (terrain football — story 47-7)
// =============================================================================

export const TERRAIN_GRADIENT_DARK   = `linear-gradient(135deg, ${colors.terrain.darkForest} 0%, ${colors.terrain.midGreen} 60%, ${colors.terrain.darkForest} 100%)`
export const TERRAIN_GRADIENT_HEADER = `linear-gradient(135deg, ${colors.terrain.deepForest} 0%, ${colors.terrain.midGreen} 50%, ${colors.terrain.lightGreen} 100%)`

// =============================================================================
// Polices
// =============================================================================

export const fonts = {
  display : 'Montserrat',  // titres, stats clés — weight 900 (Black)
  heading : 'Montserrat',  // H1, H2, H3 — weights 700/600
  body    : 'Poppins',     // paragraphes, UI, CTA, labels — weights 400/500/600 (aligné site marketing)
  mono    : 'Geist Mono',  // valeurs numériques, données tabulaires
} as const

// =============================================================================
// Typographie
// =============================================================================

export const typography = {
  display : { size: 36, weight: '900' as const, family: 'Montserrat', letterSpacing: -0.4, lineHeight: 40 },
  h1      : { size: 28, weight: '900' as const, family: 'Montserrat', letterSpacing: -0.3 },
  h2      : { size: 22, weight: '900' as const, family: 'Montserrat', letterSpacing: -0.2 },
  h3      : { size: 18, weight: '800' as const, family: 'Montserrat', letterSpacing: 0.1 },
  bodyLg  : { size: 16, weight: '400' as const, family: 'Poppins', lineHeight: 28, maxWidth: 560 },
  body    : { size: 15, weight: '400' as const, family: 'Poppins', lineHeight: 27, maxWidth: 560 },
  bodySm  : { size: 13, weight: '400' as const, family: 'Poppins', lineHeight: 22 },
  caption : { size: 11, weight: '400' as const, family: 'Poppins', lineHeight: 16 },
  label   : { size: 12, weight: '600' as const, family: 'Poppins', letterSpacing: 0.8, textTransform: 'uppercase' as const },
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
  // Story 83.4 : spacing premium aligné site homepage (py-24 mini = 96px).
  // Trois niveaux selon densité d'info de l'écran.
  sectionPaddingY  : {
    // Écrans éditoriaux : hero, landing, onboarding, empty states premium — py-16/py-30 site
    editorial: { mobile: 64, desktop: 120 },
    // Écrans standards : détail joueur header, dashboard hero — niveau intermédiaire
    standard : { mobile: 32, desktop: 64 },
    // Écrans data-dense : tables admin, listes — compact, densité d'info prioritaire
    dense    : { mobile: 16, desktop: 24 },
  },
  contentPaddingX  : { mobile: 16, tablet: 24, desktop: 32 },
  // Mesure de lecture optimale (50ch à 16px) pour paragraphes longs
  proseMaxWidth    : 560,
} as const

// =============================================================================
// Transitions
// =============================================================================

export const transitions = {
  fast   : '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal : '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow   : '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slide  : '0.25s cubic-bezier(0.4, 0, 0.2, 1)',  // transitions de route, slide-in panels
} as const

// =============================================================================
// Couleurs des méthodes pédagogiques
// Source de vérité pour METHODOLOGY_METHOD_COLOR (ARCH-10 : hex uniquement dans tokens.ts)
// =============================================================================

export const methodologyMethodColors = {
  'Goal and Player' : '#FFB800',
  'Technique'       : '#4FC3F7',
  'Situationnel'    : '#66BB6A',
  'Performance'     : '#26A69A',
  'Décisionnel'     : '#CE93D8',
  'Intégration'     : '#F97316',
  'Perfectionnement': '#EC4899',
} as const

// =============================================================================
// Gamification — XP system, niveaux, badges, animations
// =============================================================================

export const gamification = {
  xp: {
    barHeight  : 8,
    barRadius  : 4,
    fillColor  : '#C1AC5C',               // gold AUREAK
    trackColor : '#E5E7EB',               // gris clair
    glowColor  : 'rgba(193,172,92,0.4)',  // halo gold actif
  },
  statLabels: ['PLO', 'TIR', 'TEC', 'TAC', 'PHY', 'MEN'] as const,
  levels: {
    bronze  : { color: '#CD7F32', label: 'Bronze',  min: 0,     max: 499    },
    silver  : { color: '#9BA0A7', label: 'Argent',  min: 500,   max: 1499   },
    gold    : { color: '#C1AC5C', label: 'Or',      min: 1500,  max: 3499   },
    platinum: { color: '#60A5FA', label: 'Platine', min: 3500,  max: 6999   },
    diamond : { color: '#A78BFA', label: 'Diamant', min: 7000,  max: 9999   },
    legend  : { color: '#F97316', label: 'Légende', min: 10000, max: 999999 },
  },
  badge: {
    lockedOpacity : 0.35,
    lockedFilter  : 'grayscale(100%)',
    unlockedShadow: '0 0 8px rgba(193,172,92,0.5)',
    size: { sm: 32, md: 48, lg: 64 },
  },
  animations: {
    badgeUnlock: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',  // spring bounce unlock
    xpFill     : '0.6s cubic-bezier(0.4, 0, 0.2, 1)',       // fill XP bar
    levelUp    : '0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',  // level up flash
  },
} as const

/** Résout le tier de niveau pour un score XP donné. Retourne 'bronze' si hors plage. */
export function resolveLevel(xp: number): keyof typeof gamification.levels {
  const entries = Object.entries(gamification.levels) as [keyof typeof gamification.levels, { min: number; max: number }][]
  return entries.find(([, { min, max }]) => xp >= min && xp <= max)?.[0] ?? 'bronze'
}

// =============================================================================
// Player Cards FUT-style — Tiers visuels (Epic 52 — Story 52-1)
// Palette spécifique aux cartes joueurs, séparée des tokens globaux
// =============================================================================

export const playerTiers = {
  /**
   * Prospect — joueur en attente ou stagiaire
   * Fond gris neutre, texte sombre, bordure argent
   */
  prospect: {
    bg        : '#E8E8E8',
    border    : '#C0C0C0',
    badgeBg   : '#D4D4D4',
    badgeText : '#71717A',  // = colors.text.muted
    overlay   : 'transparent',
  },
  /**
   * Académicien — joueur actif en académie
   * Fond blanc, texte sombre, accent bleu
   */
  academicien: {
    bg        : '#FFFFFF',  // = colors.light.surface
    border    : '#E5E7EB',  // = colors.border.light
    badgeBg   : '#EFF6FF',
    badgeText : '#3B82F6',
    overlay   : 'transparent',
  },
  /**
   * Confirmé — ancien joueur (ANCIEN statut)
   * Fond or clair, bordure dorée, accent gold
   */
  confirme: {
    bg        : '#FFF8E8',
    border    : 'rgba(193,172,92,0.25)',  // = colors.border.gold
    badgeBg   : '#FEF3C7',
    badgeText : '#C1AC5C',               // = colors.accent.gold
    overlay   : 'transparent',
  },
  /**
   * Elite — tier supérieur (calculé via stats en story 52-2)
   * Fond sombre or-noir, texte clair, bordure or solid
   */
  elite: {
    bg        : '#2A2006',
    border    : '#C1AC5C',               // = colors.accent.gold solid
    badgeBg   : '#C1AC5C',               // = colors.accent.gold
    badgeText : '#1A1600',               // contraste sur badgeBg gold
    overlay   : 'rgba(74,58,10,0.3)',    // dégradé simulé top de card
  },
  /**
   * Palette couleurs avatar (initiales) — partagée avec PhotoAvatar
   */
  avatarPalette: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'] as string[],
} as const

// =============================================================================
// Export agrégé
// =============================================================================

const tokens = { colors, fonts, typography, space, radius, shadows, layout, transitions, methodologyMethodColors, gamification, playerTiers }
export default tokens
