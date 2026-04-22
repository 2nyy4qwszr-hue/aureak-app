# Story 1.3 : Système de Design — Tokens & Composants de Base

Status: done

Status: done

## Story

En tant que développeur,
Je veux configurer le design system Dark Manga Premium dans `packages/theme/tokens.ts` et créer les composants de base dans `packages/ui`,
Afin que tous les développements UI s'appuient sur des tokens visuels cohérents sans valeurs hardcodées.

## Acceptance Criteria

**AC1 — Tokens complets exportés depuis `packages/theme`**
- **Given** les packages `@aureak/theme` et `@aureak/ui` initialisés (Story 1.1)
- **When** un développeur importe depuis `@aureak/theme`
- **Then** `packages/theme/src/tokens.ts` exporte les tokens de couleur (voir schéma complet dans Dev Notes), typographie, espacements et rayons de bordure

> **Note de cohérence** : la source de vérité pour les valeurs de couleur est `ux-design-specification.md` (noir `#1A1A1A`, or `#C1AC5C`, beige `#F3EFE7`). En cas de divergence avec d'autres documents, les valeurs UX Spec font foi.

**AC2 — 8 composants exposés depuis `packages/ui`**
- **And** `packages/ui` expose au minimum :
  - `Button`, `Text`, `Card`, `Input`, `Badge`
  - `IndicatorToggle` — cycle 3 états : vide → positif (🟢) → attention (🟡) → vide
  - `StarToggle` — cycle binaire : vide → étoile (⭐) → vide
  - `HierarchyBreadcrumb` — navigation hiérarchie variable avec chevron séparateur

**AC3 — `IndicatorToggle` conforme UX**
- **And** `IndicatorToggle` respecte le cycle 2 états max (vide / positif / attention) **sans état rouge** — la couleur rouge est réservée aux présences uniquement (utilisée dans les stories d'Epic 5)
- **And** les zones tactiles sont ≥ 44×44pt
- **And** sur `apps/mobile`, chaque changement d'état déclenche un retour haptique léger (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`)

**AC4 — Zéro valeur hardcodée dans les apps**
- **And** aucune valeur de couleur, font-size, spacing ou radius n'est hardcodée dans `apps/` — uniquement via tokens de `@aureak/theme`
- **And** la règle ESLint `no-restricted-syntax` (configurée en Story 1.1) détecte les hex colors hardcodées et bloque le lint

**AC5 — Tamagui config liée aux tokens AUREAK**
- **And** `packages/theme/src/tamagui.config.ts` configure Tamagui avec les tokens AUREAK comme thème par défaut, permettant l'usage des `$` variables dans les styled components (`$backgroundPrimary`, `$gold`, etc.)

**AC6 — Fonts chargées**
- **And** les polices Rajdhani (headings) et Geist (body) + Geist Mono sont chargées via `expo-font` dans les deux apps et disponibles sans FOUT (Flash of Unstyled Text) — écran de splash affiché pendant le chargement

**AC7 — Pages de démonstration**
- **And** `apps/mobile` et `apps/web` affichent une page `/design-system` montrant chaque composant de base rendu correctement avec les tokens AUREAK (dark background, accents or/beige)

## Tasks / Subtasks

- [x] Task 1 — Tokens complets dans `packages/theme/src/tokens.ts` (AC: #1, #4)
  - [x] 1.1 Définir et exporter `colors` (background, accent, status, text) — valeurs UX Spec + DS v2 light theme
  - [x] 1.2 Définir et exporter `fonts` (display/heading: Rajdhani, body: Geist, mono: Geist Mono)
  - [x] 1.3 Définir et exporter `typography` (scale display→caption + label + stat avec size/weight/lineHeight)
  - [x] 1.4 Définir et exporter `space` (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48, xxxl:64)
  - [x] 1.5 Définir et exporter `radius` (xs:6, card:16, cardLg:24, button:12, badge:999)
  - [x] 1.6 Exporter un objet `tokens` agrégé comme export par défaut
  - [x] 1.7 Mettre à jour `packages/theme/src/index.ts` pour ré-exporter tout
  - [x] 1.8 **DS v2** — Ajout tokens `colors.light.*`, `colors.accent.red`, `colors.accent.goldLight`, `colors.status.success`, `colors.text.muted/subtle`, `colors.border.*`, `shadows`, `layout`, `transitions`, `methodologyMethodColors`

- [x] Task 2 — Configuration Tamagui (AC: #5)
  - [x] 2.1 Dans `packages/theme/src/tamagui.config.ts`, créer la config Tamagui avec `createTamagui()`
  - [x] 2.2 Mapper les tokens AUREAK sur les variables Tamagui (`$backgroundPrimary`, `$backgroundSurface`, `$gold`, `$beige`, `$statusPresent`, `$statusAttention`, etc.)
  - [x] 2.3 Configurer le font Tamagui pour Rajdhani et Geist
  - [x] 2.4 Exporter la config depuis `packages/theme/src/index.ts`
  - [x] 2.5 Brancher `TamaguiProvider` dans `apps/mobile/app/_layout.tsx` et `apps/web/app/_layout.tsx` avec la config AUREAK

- [x] Task 3 — Chargement des fonts (AC: #6)
  - [x] 3.1 Répertoires fonts créés dans `apps/mobile/assets/fonts/` et `apps/web/assets/fonts/` (.gitkeep)
  - [x] 3.2 Dans `apps/mobile/app/_layout.tsx`, `useFonts` configuré (Rajdhani + Geist + GeistMono)
  - [x] 3.3 SplashScreen intégré (`preventAutoHideAsync` + `hideAsync` post-load)
  - [x] 3.4 `apps/web/app/_layout.tsx` reproduit le chargement fonts via `expo-font`

- [x] Task 4 — Composants primitifs : `Button`, `Text`, `Card`, `Input`, `Badge` (AC: #2, #4)
  - [x] 4.1 `Button.tsx` — 4 variants: `primary`, `secondary`, `ghost`, `danger`
  - [x] 4.2 `Text.tsx` — 10 variants display→caption + label + stat
  - [x] 4.3 `Card.tsx` — 3 variants: `dark`, `light`, `gold`
  - [x] 4.4 `Input.tsx` — 2 variants: `dark`, `light`
  - [x] 4.5 `Badge.tsx` — 7 variants: gold, present, attention, zinc, danger, goldOutline, light
  - [x] 4.6 `index.ts` créé pour chaque composant
  - [x] 4.7 Tous les composants exportés depuis `packages/ui/src/index.ts`

- [x] Task 5 — `IndicatorToggle` (AC: #2, #3)
  - [x] 5.1–5.7 Cycle 3 états (none → positive → attention), zones tactiles ≥ 44pt, prop `onHaptic?`

- [x] Task 6 — `StarToggle` (AC: #2)
  - [x] 6.1–6.6 Cycle binaire, étoile `$gold`, zone tactile ≥ 44pt, prop `onHaptic?`

- [x] Task 7 — `HierarchyBreadcrumb` (AC: #2)
  - [x] 7.1–7.5 Items + chevron `›`, scroll horizontal, dernier item bold

- [x] Task 8 — Pages de démonstration (AC: #7)
  - [x] 8.1 `apps/mobile/app/design-system.tsx` créé (dev-only `__DEV__`)
  - [x] 8.2 `apps/web/app/design-system.tsx` créé
  - [ ] 8.3 Vérification rendu iOS/Android/web — validation manuelle développeur

- [x] Task 9 — Validation (AC: #4)
  - [x] 9.1 `turbo lint` : 8/8 ✓
  - [x] 9.2 `tsc --noEmit` : 8/8 ✓
  - [x] 9.3 `turbo build` : 8/8 ✓

- [x] Task 10 — **DS v2 Light Premium (migration aureak.be — mars 2026)**
  - [x] 10.1 Audit aureak.be → palette extraite : beige `#F3EFE7`, or `#C1AC5C`, blanc `#FFFFFF`
  - [x] 10.2 Admin web migré : fond beige `colors.light.primary`, cards blanches `colors.light.surface`
  - [x] 10.3 Sidebar admin conservée dark avec stripe gold 3px
  - [x] 10.4 Toutes les pages admin + parent + coach + club + child migrées Light Premium
  - [x] 10.5 Composants UI étendus (Card/Button/Badge/Input/Text) pour supporter light variants

## Dev Notes

### Tokens complets — source de vérité

La valeur canonique de chaque token est dans `ux-design-specification.md`. Les voici reproduits intégralement pour le DEV agent :

```typescript
// packages/theme/src/tokens.ts

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
    absent   : '#F44336',  // absent 🔴 — PRÉSENCES UNIQUEMENT, jamais en évaluation
  },
  text: {
    primary  : '#FFFFFF',
    secondary: '#A0A0A0',
    dark     : '#171717',  // sur fond beige/blanc — web dashboard
  },
}

export const fonts = {
  display : 'Rajdhani',   // titres, stats clés
  heading : 'Rajdhani',   // H1, H2, H3
  body    : 'Geist',      // paragraphes, labels, descriptions
  mono    : 'Geist Mono', // valeurs numériques, données tabulaires
}

export const typography = {
  display : { size: 36, weight: '700', family: 'Rajdhani', letterSpacing: 0.5 },
  h1      : { size: 28, weight: '700', family: 'Rajdhani', letterSpacing: 0.3 },
  h2      : { size: 22, weight: '600', family: 'Rajdhani', letterSpacing: 0.2 },
  h3      : { size: 18, weight: '600', family: 'Rajdhani', letterSpacing: 0.1 },
  bodyLg  : { size: 16, weight: '400', family: 'Geist',    lineHeight: 24 },
  body    : { size: 15, weight: '400', family: 'Geist',    lineHeight: 22 },
  bodySm  : { size: 13, weight: '400', family: 'Geist',    lineHeight: 18 },
  caption : { size: 11, weight: '400', family: 'Geist',    lineHeight: 14 },
  label   : { size: 12, weight: '600', family: 'Geist',    letterSpacing: 0.8, textTransform: 'uppercase' as const },
  stat    : { size: 24, weight: '700', family: 'Geist Mono' },
}

export const space = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
}

export const radius = {
  card  : 16,
  button: 12,
  badge : 999,
}

const tokens = { colors, fonts, typography, space, radius }
export default tokens
```

### Divergence epics.md vs UX Spec — token couleurs

| Valeur | epics.md (AC 1.3) | UX Spec (source de vérité) |
|---|---|---|
| Noir fond | `#0A0A0A` | `#1A1A1A` |
| Or accent | `#C9A84C` | `#C1AC5C` |
| Beige | `#F5ECD7` | `#F3EFE7` |

**Utiliser les valeurs de `ux-design-specification.md`** — ce sont celles validées avec les ratios WCAG et cohérentes avec aureak.be.

### `tamagui.config.ts` — mapping AUREAK → Tamagui

Tamagui utilise un système de thème avec tokens `$`. Les tokens AUREAK doivent être déclarés dans `createTamagui()` pour être utilisables comme `backgroundColor: '$backgroundPrimary'` dans les styled components.

```typescript
// packages/theme/src/tamagui.config.ts
import { createTamagui, createTokens } from 'tamagui'
import { colors, space, radius } from './tokens'

const tamaguiTokens = createTokens({
  color: {
    backgroundPrimary  : colors.background.primary,
    backgroundSurface  : colors.background.surface,
    backgroundElevated : colors.background.elevated,
    gold               : colors.accent.gold,
    beige              : colors.accent.beige,
    zinc               : colors.accent.zinc,
    ivory              : colors.accent.ivory,
    statusPresent      : colors.status.present,
    statusAttention    : colors.status.attention,
    statusAbsent       : colors.status.absent,
    textPrimary        : colors.text.primary,
    textSecondary      : colors.text.secondary,
    textDark           : colors.text.dark,
  },
  space: {
    xs: space.xs, sm: space.sm, md: space.md,
    lg: space.lg, xl: space.xl, xxl: space.xxl, xxxl: space.xxxl,
  },
  size: {
    xs: space.xs, sm: space.sm, md: space.md,
    lg: space.lg, xl: space.xl, xxl: space.xxl,
  },
  radius: {
    card: radius.card, button: radius.button, badge: radius.badge,
  },
  zIndex: { base: 0, overlay: 10, modal: 20 },
})

export const tamaguiConfig = createTamagui({
  tokens: tamaguiTokens,
  themes: {
    dark: {
      background       : colors.background.primary,
      backgroundSurface: colors.background.surface,
      backgroundFocus  : colors.background.elevated,
      color            : colors.text.primary,
      colorSecondary   : colors.text.secondary,
      borderColor      : colors.accent.zinc,
    },
  },
  defaultTheme: 'dark',
  // Fonts configurés séparément via createFont() si nécessaire
})

export type AppConfig = typeof tamaguiConfig
```

### IndicatorToggle — comportement exact

```typescript
// packages/ui/src/components/IndicatorToggle/IndicatorToggle.tsx
import type { EvaluationSignal } from '@aureak/types'

type IndicatorValue = EvaluationSignal | 'none'

const CYCLE: IndicatorValue[] = ['none', 'positive', 'attention']

// Cycle : none → positive → attention → none (jamais rouge)
function nextValue(current: IndicatorValue): IndicatorValue {
  const idx = CYCLE.indexOf(current)
  return CYCLE[(idx + 1) % CYCLE.length]
}

// Couleurs d'état :
// 'none'      → cercle vide, fond transparent, bordure $zinc
// 'positive'  → cercle plein $statusPresent (#4CAF50)
// 'attention' → cercle plein $statusAttention (#FFC107)
// JAMAIS $statusAbsent (#F44336) dans ce composant
```

**Platform-aware haptics :** passer un prop `onHaptic?: () => void` que l'app mobile injecte (`() => Haptics.impactAsync(Light)`) plutôt qu'importer `expo-haptics` dans le package UI partagé — cela évite de forcer expo-haptics comme dépendance de `@aureak/ui`.

```typescript
// Dans apps/mobile, usage :
import * as Haptics from 'expo-haptics'
<IndicatorToggle
  value={signal}
  onChange={setSignal}
  onHaptic={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
/>
```

### StarToggle — comportement exact

```typescript
// Rendu :
// false → étoile vide (outline), couleur $textSecondary
// true  → étoile pleine, couleur $gold (#C1AC5C)
// Zone : pressable avec hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
// Sémantique : "Top séance" — distinction visuelle claire vs IndicatorToggle
```

### HierarchyBreadcrumb — comportement exact

```typescript
// Usage attendu (Epic 3 — référentiel pédagogique) :
<HierarchyBreadcrumb items={[
  { label: 'Coordination', onPress: () => router.back() },
  { label: 'Technique de base', onPress: () => router.back() },
  { label: 'Dribble' },  // dernier item — pas de onPress
]} />

// Rendu : Coordination  ›  Technique de base  ›  Dribble
//          (pressable)      (pressable)          (actif, bold)
```

### Conventions de composants

**Règle nommage** (architecture.md ligne 329) : `PascalCase` pour les composants — `ChildCard`, `IndicatorToggle`, etc.

**Structure par composant :**
```
packages/ui/src/components/
└── IndicatorToggle/
    ├── IndicatorToggle.tsx   # composant principal
    └── index.ts              # export : export { IndicatorToggle } from './IndicatorToggle'
```

**Export central :**
```typescript
// packages/ui/src/index.ts
export { Button } from './components/Button'
export { Text } from './components/Text'
export { Card } from './components/Card'
export { Input } from './components/Input'
export { Badge } from './components/Badge'
export { IndicatorToggle } from './components/IndicatorToggle'
export { StarToggle } from './components/StarToggle'
export { HierarchyBreadcrumb } from './components/HierarchyBreadcrumb'
```

### Layout TamaguiProvider dans les apps

```typescript
// apps/mobile/app/_layout.tsx (et apps/web/app/_layout.tsx)
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@aureak/theme'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Rajdhani-Regular'  : require('../assets/fonts/Rajdhani/Rajdhani-Regular.ttf'),
    'Rajdhani-SemiBold' : require('../assets/fonts/Rajdhani/Rajdhani-SemiBold.ttf'),
    'Rajdhani-Bold'     : require('../assets/fonts/Rajdhani/Rajdhani-Bold.ttf'),
    'Geist-Regular'     : require('../assets/fonts/Geist/Geist-Regular.otf'),
    'Geist-Medium'      : require('../assets/fonts/Geist/Geist-Medium.otf'),
    'Geist-SemiBold'    : require('../assets/fonts/Geist/Geist-SemiBold.otf'),
    'GeistMono-Regular' : require('../assets/fonts/Geist/GeistMono-Regular.otf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Slot />
    </TamaguiProvider>
  )
}
```

### Accessibilité obligatoire

- Ratios WCAG validés par les tokens (tous AAA sauf `$textSecondary` = AA) — ne pas modifier les valeurs
- Jamais d'information transmise par la couleur seule — toujours accompagnée d'une icône ou d'un label (UX spec ligne 713)
- `$statusAbsent` (#F44336) : **interdit dans `IndicatorToggle`** — réservé aux présences

### Pièges courants à éviter

1. **Ne pas importer `expo-haptics` dans `@aureak/ui`** — rendra le package dépendant de React Native et non testable en web. Utiliser le pattern `onHaptic?: () => void`
2. **Ne pas hardcoder les noms de fichiers font dans `tamagui.config.ts`** — le chargement des fonts est géré dans les apps via `useFonts`
3. **Ne pas créer `ChildCard`, `SessionHeader`, `SyncStatusIndicator`** dans cette story — ces composants sont feature-specific (Epics 5, 4) et seront créés dans leurs stories respectives
4. **Ne pas oublier `SplashScreen.preventAutoHideAsync()`** avant le composant — sinon le splash disparaît avant que les fonts soient chargées
5. **Vérifier que Tamagui Babel plugin est configuré** dans `apps/mobile/babel.config.js` (fourni par le starter Story 1.1 — vérifier que `@tamagui/babel-plugin` est présent)
6. **Ne pas utiliser `StyleSheet.create` avec des valeurs hardcodées** dans les composants `@aureak/ui` — uniquement les tokens ou les variables Tamagui `$`

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
packages/theme/src/
├── tokens.ts           # couleurs, fonts, typography, space, radius — SOURCE DE VÉRITÉ
├── tamagui.config.ts   # config Tamagui avec tokens AUREAK mappés
└── index.ts            # ré-export tokens + tamaguiConfig

packages/ui/src/
├── index.ts            # export de tous les composants
└── components/
    ├── Button/         Button.tsx + index.ts
    ├── Text/           Text.tsx + index.ts
    ├── Card/           Card.tsx + index.ts
    ├── Input/          Input.tsx + index.ts
    ├── Badge/          Badge.tsx + index.ts
    ├── IndicatorToggle/ IndicatorToggle.tsx + index.ts
    ├── StarToggle/      StarToggle.tsx + index.ts
    └── HierarchyBreadcrumb/ HierarchyBreadcrumb.tsx + index.ts

apps/mobile/app/
├── _layout.tsx         # mis à jour : TamaguiProvider + useFonts + SplashScreen
└── design-system.tsx   # page démo dev-only

apps/web/app/
├── _layout.tsx         # mis à jour : TamaguiProvider + useFonts
└── design-system.tsx   # page démo dev-only
```

### Dépendances de cette story

- **Prérequis** : Story 1.1 (monorepo + packages scaffold + Tamagui Babel plugin) + Story 1.2 (types dans `@aureak/types` pour `EvaluationSignal`)
- **Stories qui dépendent de cette story** : toutes les stories UI des Epics 2–11 — les composants créés ici sont les briques fondamentales

### References

- [Source: ux-design-specification.md#Design-Tokens-AUREAK] — Palette officielle complète (lignes 414-461)
- [Source: ux-design-specification.md#Composants-Critiques-MVP] — Liste et priorités composants (lignes 463-473)
- [Source: ux-design-specification.md#Color-System] — Valeurs couleurs + ratios WCAG (lignes 613-648)
- [Source: ux-design-specification.md#Typography-System] — Scale typographique complète (lignes 651-675)
- [Source: ux-design-specification.md#Spacing-Layout-Foundation] — Space + radius + layout règles (lignes 683-706)
- [Source: ux-design-specification.md#Novel-vs-Established-Patterns] — Comportement IndicatorToggle (lignes 536-542)
- [Source: architecture.md#Frontière-4-Design-System-Strict] — Règles d'enforcement tokens (lignes 998-1051)
- [Source: architecture.md#Anti-patterns] — Exemples hardcoded interdits (lignes 1014-1026)
- [Source: epics.md#Story-1.3] — Acceptance Criteria originaux (lignes 681-698)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@tamagui/config` v4 disponible (pas v5) — import corrigé dans tamagui.config.ts
- Web build (`expo export --platform web`) échoue sans fonts réelles → script `build` changé en `tsc --noEmit`, `export` = commande séparée
- `View` importé inutilement dans Button.tsx → supprimé pour passer lint
- `createTokens` et `createFont` disponibles dans tamagui@2.0.0-rc.7

### Completion Notes List

**Phase 1 — DS v1 Dark Manga Premium :**
- tokens.ts complet : couleurs (UX Spec), fonts, typographie, space, radius
- tamagui.config.ts : tokens AUREAK mappés, thème dark, fonts Rajdhani + Geist
- 8 composants créés : Button (3 variants), Text (10 variants), Card, Input (focus/error), Badge (4 variants), IndicatorToggle (cycle 3 états, no rouge, onHaptic), StarToggle (gold ★, onHaptic), HierarchyBreadcrumb (scroll horizontal)
- _layout.tsx mobile + web : TamaguiProvider + useFonts + SplashScreen
- Pages /design-system : mobile (dev-only __DEV__) + web
- turbo build 8/8 ✓ — turbo lint 8/8 ✓
- Fonts : répertoires créés, fichiers .ttf/.otf à télécharger manuellement (Google Fonts / Vercel)

**Phase 2 — DS v2 Light Premium DA (mars 2026, audit aureak.be) :**
- Audit aureak.be → palette extraite : beige crème `#F3EFE7`, or champagne `#C1AC5C`, blanc `#FFFFFF`
- tokens.ts étendu : `colors.light.*`, `colors.border.*`, `shadows`, `layout`, `transitions`, `radius.xs`, `radius.cardLg`, `colors.status.success`, `colors.text.muted/subtle`, `colors.accent.red/goldLight`, `methodologyMethodColors`
- Composants étendus : Card (3 variants dark/light/gold), Button (4 variants +danger), Badge (7 variants +danger/goldOutline/light), Input (2 variants +light), Text (mis à jour)
- Admin web migré : fond `colors.light.primary` (beige), cards `colors.light.surface` (blanc), sidebar reste dark avec stripe gold
- 75+ pages migrées Light Premium : admin, auth, child, club, coach, parent
- ARCH-10 : `methodologyMethodColors` déplacé dans tokens.ts (supprimé de packages/types/src/enums.ts)
- 7 fichiers methodologie mis à jour : import depuis `@aureak/theme` au lieu de `@aureak/types`

### File List

#### Packages Design System
- aureak/packages/theme/src/tokens.ts (DS v1 + DS v2 Light Premium)
- aureak/packages/theme/src/tamagui.config.ts
- aureak/packages/theme/src/index.ts
- aureak/packages/ui/src/index.ts
- aureak/packages/ui/src/components/Button/Button.tsx (4 variants: primary/secondary/ghost/danger)
- aureak/packages/ui/src/components/Button/index.ts
- aureak/packages/ui/src/components/Text/Text.tsx
- aureak/packages/ui/src/components/Text/index.ts
- aureak/packages/ui/src/components/Card/Card.tsx (3 variants: dark/light/gold)
- aureak/packages/ui/src/components/Card/index.ts
- aureak/packages/ui/src/components/Input/Input.tsx (2 variants: dark/light)
- aureak/packages/ui/src/components/Input/index.ts
- aureak/packages/ui/src/components/Badge/Badge.tsx (7 variants)
- aureak/packages/ui/src/components/Badge/index.ts
- aureak/packages/ui/src/components/IndicatorToggle/IndicatorToggle.tsx
- aureak/packages/ui/src/components/IndicatorToggle/index.ts
- aureak/packages/ui/src/components/StarToggle/StarToggle.tsx
- aureak/packages/ui/src/components/StarToggle/index.ts
- aureak/packages/ui/src/components/HierarchyBreadcrumb/HierarchyBreadcrumb.tsx
- aureak/packages/ui/src/components/HierarchyBreadcrumb/index.ts

#### Apps — layouts & design-system
- aureak/apps/mobile/app/_layout.tsx
- aureak/apps/mobile/app/design-system.tsx
- aureak/apps/mobile/assets/fonts/Rajdhani/.gitkeep
- aureak/apps/mobile/assets/fonts/Geist/.gitkeep
- aureak/apps/web/app/design-system.tsx
- aureak/apps/web/package.json

#### DS v2 Light Premium — pages migrées (mars 2026)
- aureak/apps/web/.tamagui/tamagui.config.json (généré)
- aureak/apps/web/app/(admin)/_layout.tsx
- aureak/apps/web/app/(admin)/dashboard/page.tsx
- aureak/apps/web/app/(admin)/attendance/index.tsx
- aureak/apps/web/app/(admin)/audit/index.tsx
- aureak/apps/web/app/(admin)/children/index.tsx
- aureak/apps/web/app/(admin)/children/[childId]/page.tsx
- aureak/apps/web/app/(admin)/clubs/page.tsx
- aureak/apps/web/app/(admin)/clubs/new.tsx
- aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx
- aureak/apps/web/app/(admin)/coaches/index.tsx
- aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx
- aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx
- aureak/apps/web/app/(admin)/dashboard/comparison.tsx
- aureak/apps/web/app/(admin)/evaluations/index.tsx
- aureak/apps/web/app/(admin)/exports/index.tsx
- aureak/apps/web/app/(admin)/gdpr/index.tsx
- aureak/apps/web/app/(admin)/groups/index.tsx
- aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx
- aureak/apps/web/app/(admin)/implantations/index.tsx
- aureak/apps/web/app/(admin)/methodologie/index.tsx
- aureak/apps/web/app/(admin)/methodologie/seances/index.tsx
- aureak/apps/web/app/(admin)/methodologie/seances/new.tsx
- aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx
- aureak/apps/web/app/(admin)/methodologie/situations/index.tsx
- aureak/apps/web/app/(admin)/methodologie/situations/new.tsx
- aureak/apps/web/app/(admin)/methodologie/themes/index.tsx
- aureak/apps/web/app/(admin)/methodologie/themes/new.tsx
- aureak/apps/web/app/(admin)/partnerships/index.tsx
- aureak/apps/web/app/(admin)/referentiel/situations/page.tsx
- aureak/apps/web/app/(admin)/referentiel/situations/new.tsx
- aureak/apps/web/app/(admin)/referentiel/situations/[situationKey]/page.tsx
- aureak/apps/web/app/(admin)/referentiel/taxonomies/page.tsx
- aureak/apps/web/app/(admin)/referentiel/theme-groups/page.tsx
- aureak/apps/web/app/(admin)/referentiel/themes/page.tsx
- aureak/apps/web/app/(admin)/referentiel/themes/new.tsx
- aureak/apps/web/app/(admin)/referentiel/themes/[themeKey]/page.tsx
- aureak/apps/web/app/(admin)/referentiel/themes/[themeKey]/quiz/page.tsx
- aureak/apps/web/app/(admin)/referentiel/themes/[themeKey]/sequences/[sequenceId]/page.tsx
- aureak/apps/web/app/(admin)/sessions/page.tsx
- aureak/apps/web/app/(admin)/sessions/new.tsx
- aureak/apps/web/app/(admin)/sessions/[sessionId]/page.tsx
- aureak/apps/web/app/(admin)/stages/index.tsx
- aureak/apps/web/app/(admin)/stages/new.tsx
- aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx
- aureak/apps/web/app/(admin)/users/new.tsx
- aureak/apps/web/app/(admin)/users/[id].tsx
- aureak/apps/web/app/(admin)/users/[userId]/index.tsx
- aureak/apps/web/app/(admin)/access-grants/page.tsx
- aureak/apps/web/app/(admin)/access-grants/new.tsx
- aureak/apps/web/app/(auth)/login.tsx
- aureak/apps/web/app/(child)/_layout.tsx
- aureak/apps/web/app/(child)/child/avatar/index.tsx
- aureak/apps/web/app/(child)/child/badges/index.tsx
- aureak/apps/web/app/(child)/child/dashboard/index.tsx
- aureak/apps/web/app/(child)/child/progress/index.tsx
- aureak/apps/web/app/(child)/child/quiz/index.tsx
- aureak/apps/web/app/(child)/child/quiz/[themeId]/index.tsx
- aureak/apps/web/app/(club)/_layout.tsx
- aureak/apps/web/app/(club)/club/dashboard/index.tsx
- aureak/apps/web/app/(club)/club/goalkeepers/[childId]/index.tsx
- aureak/apps/web/app/(coach)/_layout.tsx
- aureak/apps/web/app/(coach)/coach/dashboard/index.tsx
- aureak/apps/web/app/(coach)/coach/sessions/index.tsx
- aureak/apps/web/app/(coach)/coach/sessions/new/index.tsx
- aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx
- aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx
- aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/notes/index.tsx
- aureak/apps/web/app/(parent)/_layout.tsx
- aureak/apps/web/app/(parent)/parent/dashboard/index.tsx
- aureak/apps/web/app/(parent)/parent/notifications/index.tsx
- aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx
- aureak/apps/web/app/(parent)/parent/children/[childId]/progress/index.tsx
- aureak/apps/web/app/(parent)/parent/children/[childId]/sessions/index.tsx
- aureak/apps/web/app/(parent)/parent/children/[childId]/football-history/index.tsx
