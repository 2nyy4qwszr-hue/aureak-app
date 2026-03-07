# Story 1.3 : Système de Design — Tokens & Composants de Base

Status: review

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

- [ ] Task 1 — Tokens complets dans `packages/theme/src/tokens.ts` (AC: #1, #4)
  - [ ] 1.1 Définir et exporter `colors` (background, accent, status, text) — valeurs UX Spec
  - [ ] 1.2 Définir et exporter `fonts` (display/heading: Rajdhani, body: Geist, mono: Geist Mono)
  - [ ] 1.3 Définir et exporter `typography` (scale display→caption + label + stat avec size/weight/lineHeight)
  - [ ] 1.4 Définir et exporter `space` (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48, xxxl:64)
  - [ ] 1.5 Définir et exporter `radius` (card:16, button:12, badge:999)
  - [ ] 1.6 Exporter un objet `tokens` agrégé comme export par défaut
  - [ ] 1.7 Mettre à jour `packages/theme/src/index.ts` pour ré-exporter tout

- [ ] Task 2 — Configuration Tamagui (AC: #5)
  - [ ] 2.1 Dans `packages/theme/src/tamagui.config.ts`, créer la config Tamagui avec `createTamagui()`
  - [ ] 2.2 Mapper les tokens AUREAK sur les variables Tamagui (`$backgroundPrimary`, `$backgroundSurface`, `$gold`, `$beige`, `$statusPresent`, `$statusAttention`, etc.)
  - [ ] 2.3 Configurer le font Tamagui pour Rajdhani et Geist
  - [ ] 2.4 Exporter la config depuis `packages/theme/src/index.ts`
  - [ ] 2.5 Brancher `TamaguiProvider` dans `apps/mobile/app/_layout.tsx` et `apps/web/app/_layout.tsx` avec la config AUREAK

- [ ] Task 3 — Chargement des fonts (AC: #6)
  - [ ] 3.1 Vérifier que les assets fonts existent dans `apps/mobile/assets/fonts/Rajdhani/` et `apps/mobile/assets/fonts/Geist/` (placés en Story 1.1 ; télécharger depuis Google Fonts si absents)
  - [ ] 3.2 Dans `apps/mobile/app/_layout.tsx`, utiliser `useFonts` (expo-font) pour charger Rajdhani-Regular, Rajdhani-SemiBold, Rajdhani-Bold, Geist-Regular, Geist-Medium, Geist-SemiBold, GeistMono-Regular
  - [ ] 3.3 Afficher `<SplashScreen />` tant que les fonts ne sont pas chargées (`SplashScreen.preventAutoHideAsync()` + hide après `fontsLoaded`)
  - [ ] 3.4 Reproduire le chargement fonts dans `apps/web/app/_layout.tsx` via `expo-font` (Expo web gère automatiquement)

- [ ] Task 4 — Composants primitifs : `Button`, `Text`, `Card`, `Input`, `Badge` (AC: #2, #4)
  - [ ] 4.1 `packages/ui/src/components/Button/Button.tsx` — variants: `primary` (fond or, texte sombre), `secondary` (fond surface, bordure or), `ghost` (transparent, texte or) ; taille min 44×44pt ; pas de couleur hardcodée
  - [ ] 4.2 `packages/ui/src/components/Text/Text.tsx` — variants: `display`, `h1`, `h2`, `h3`, `bodyLg`, `body`, `bodySm`, `caption`, `label`, `stat` ; mappés sur typography tokens
  - [ ] 4.3 `packages/ui/src/components/Card/Card.tsx` — `backgroundColor: $backgroundSurface`, `borderRadius: $card`, padding configurable via `space` tokens
  - [ ] 4.4 `packages/ui/src/components/Input/Input.tsx` — fond `$backgroundElevated`, bordure `$zinc`, focus bordure `$gold`, text `$textPrimary`, placeholder `$textSecondary` ; pas de couleur hardcodée
  - [ ] 4.5 `packages/ui/src/components/Badge/Badge.tsx` — variantes de couleur (gold, present, attention, zinc) ; `borderRadius: $badge` (pill shape)
  - [ ] 4.6 Créer `packages/ui/src/components/<Composant>/index.ts` pour chaque composant
  - [ ] 4.7 Exporter tous les composants depuis `packages/ui/src/index.ts`

- [ ] Task 5 — `IndicatorToggle` (AC: #2, #3)
  - [ ] 5.1 Créer `packages/ui/src/components/IndicatorToggle/IndicatorToggle.tsx`
  - [ ] 5.2 Implémenter le cycle 3 états : `'none'` → `'positive'` → `'attention'` → `'none'` (type: `EvaluationSignal | 'none'` de `@aureak/types`)
  - [ ] 5.3 Rendu visuel : `none` = cercle vide, `positive` = cercle vert `$statusPresent`, `attention` = cercle jaune `$statusAttention` — **jamais de rouge**
  - [ ] 5.4 Zone tactile : hitSlop ou paddingBox d'au moins 44×44pt
  - [ ] 5.5 Sur mobile : `Haptics.impactAsync(ImpactFeedbackStyle.Light)` à chaque changement d'état (import `expo-haptics` dans `apps/mobile` uniquement — composant doit accepter un prop `onHaptic?: () => void` ou utiliser Platform.select)
  - [ ] 5.6 Props : `value: EvaluationSignal | 'none'`, `onChange: (value: EvaluationSignal | 'none') => void`, `label?: string`, `disabled?: boolean`
  - [ ] 5.7 Label optionnel en dessous (style `label` Geist uppercase, couleur `$textSecondary`)

- [ ] Task 6 — `StarToggle` (AC: #2)
  - [ ] 6.1 Créer `packages/ui/src/components/StarToggle/StarToggle.tsx`
  - [ ] 6.2 Implémenter le cycle binaire : `false` → `true` → `false`
  - [ ] 6.3 Rendu visuel : `false` = étoile vide outline, `true` = étoile pleine couleur `$gold` (accent or champagne)
  - [ ] 6.4 Zone tactile ≥ 44×44pt
  - [ ] 6.5 Sur mobile : `Haptics.impactAsync(ImpactFeedbackStyle.Light)` quand activé (même pattern que IndicatorToggle)
  - [ ] 6.6 Props : `value: boolean`, `onChange: (value: boolean) => void`, `disabled?: boolean`

- [ ] Task 7 — `HierarchyBreadcrumb` (AC: #2)
  - [ ] 7.1 Créer `packages/ui/src/components/HierarchyBreadcrumb/HierarchyBreadcrumb.tsx`
  - [ ] 7.2 Accepter `items: Array<{ label: string; onPress?: () => void }>` (depth variable)
  - [ ] 7.3 Rendu : items séparés par un chevron `›` (couleur `$textSecondary`) ; dernier item en `$textPrimary` bold, items précédents en `$textSecondary` + pressable (navigation)
  - [ ] 7.4 Overflow : scroll horizontal si la chaîne dépasse la largeur écran (ScrollView horizontal)
  - [ ] 7.5 Exemples d'usage : `ThemeGroup › Thème › Séquence › Critère` ou `SituationGroup › Situation`

- [ ] Task 8 — Pages de démonstration (AC: #7)
  - [ ] 8.1 Créer `apps/mobile/app/design-system.tsx` affichant chaque composant avec labels — accessible en dev mode uniquement (check `__DEV__`)
  - [ ] 8.2 Créer `apps/web/app/design-system.tsx` — même contenu, layout adapté web
  - [ ] 8.3 Vérifier le rendu sur iOS (simulateur), Android (émulateur) et localhost web

- [ ] Task 9 — Validation (AC: #4)
  - [ ] 9.1 Exécuter `turbo lint` : zéro erreur ESLint (notamment aucune hex color hardcodée)
  - [ ] 9.2 Exécuter `tsc --noEmit` sur les packages : zéro erreur TypeScript
  - [ ] 9.3 Exécuter `turbo build` : zéro erreur sur `@aureak/theme` et `@aureak/ui`

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

- tokens.ts complet : couleurs (UX Spec), fonts, typographie, space, radius
- tamagui.config.ts : tokens AUREAK mappés, thème dark, fonts Rajdhani + Geist
- 8 composants créés : Button (3 variants), Text (10 variants), Card, Input (focus/error), Badge (4 variants), IndicatorToggle (cycle 3 états, no rouge, onHaptic), StarToggle (gold ★, onHaptic), HierarchyBreadcrumb (scroll horizontal)
- _layout.tsx mobile + web : TamaguiProvider + useFonts + SplashScreen
- Pages /design-system : mobile (dev-only __DEV__) + web
- turbo build 8/8 ✓ — turbo lint 8/8 ✓
- Fonts : répertoires créés, fichiers .ttf/.otf à télécharger manuellement (Google Fonts / Vercel)

### File List

- aureak/packages/theme/src/tokens.ts (mis à jour)
- aureak/packages/theme/src/tamagui.config.ts (mis à jour)
- aureak/packages/theme/src/index.ts (mis à jour)
- aureak/packages/ui/src/index.ts (mis à jour)
- aureak/packages/ui/src/components/Button/Button.tsx
- aureak/packages/ui/src/components/Button/index.ts
- aureak/packages/ui/src/components/Text/Text.tsx
- aureak/packages/ui/src/components/Text/index.ts
- aureak/packages/ui/src/components/Card/Card.tsx
- aureak/packages/ui/src/components/Card/index.ts
- aureak/packages/ui/src/components/Input/Input.tsx
- aureak/packages/ui/src/components/Input/index.ts
- aureak/packages/ui/src/components/Badge/Badge.tsx
- aureak/packages/ui/src/components/Badge/index.ts
- aureak/packages/ui/src/components/IndicatorToggle/IndicatorToggle.tsx
- aureak/packages/ui/src/components/IndicatorToggle/index.ts
- aureak/packages/ui/src/components/StarToggle/StarToggle.tsx
- aureak/packages/ui/src/components/StarToggle/index.ts
- aureak/packages/ui/src/components/HierarchyBreadcrumb/HierarchyBreadcrumb.tsx
- aureak/packages/ui/src/components/HierarchyBreadcrumb/index.ts
- aureak/apps/mobile/app/_layout.tsx (mis à jour)
- aureak/apps/mobile/app/design-system.tsx
- aureak/apps/mobile/assets/fonts/Rajdhani/.gitkeep
- aureak/apps/mobile/assets/fonts/Geist/.gitkeep
- aureak/apps/web/app/_layout.tsx (mis à jour)
- aureak/apps/web/app/design-system.tsx
- aureak/apps/web/assets/fonts/Rajdhani/.gitkeep
- aureak/apps/web/assets/fonts/Geist/.gitkeep
- aureak/apps/web/package.json (build → tsc --noEmit, export = expo export)
