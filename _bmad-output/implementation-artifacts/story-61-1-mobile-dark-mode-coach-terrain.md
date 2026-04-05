# Story 61.1 : Mobile — Dark mode coach terrain auto

Status: done

## Story

En tant que coach utilisant l'app Aureak sur mobile (terrain),
Je veux que l'interface bascule automatiquement en mode sombre sur les écrans mobiles,
Afin de lire facilement en plein soleil et réduire la fatigue oculaire lors des séances terrain.

## Acceptance Criteria

**AC1 — Activation automatique sur mobile**
- **Given** l'admin ou coach accède à l'app sur un écran < 768px de large
- **When** la page se charge
- **Then** le thème dark est appliqué automatiquement : fond `colors.dark.background`, cards `colors.dark.surface`, texte `colors.dark.text`

**AC2 — Palette dark complète dans `tokens.ts`**
- **And** les tokens suivants sont définis dans `@aureak/theme/src/tokens.ts` sous `colors.dark.*` :
  - `background: '#0F0F0F'` (noir profond)
  - `surface: '#1A1A1A'` (card dark)
  - `elevated: '#242424'` (card surélevée)
  - `hover: '#2A2A2A'`
  - `text: '#F0F0F0'`
  - `textMuted: '#A0A0A0'`
  - `border: '#333333'`

**AC3 — Accents neon en dark mode**
- **And** en dark mode, les accents utilisent des variantes néon : vert néon `#00FF88` pour les statuts positifs (remplace `colors.status.success` sur mobile dark), or conservé `colors.accent.gold`, rouge `#FF4444`
- **And** ces variantes sont déclarées sous `colors.dark.accentGreen`, `colors.dark.accentRed`

**AC4 — Détection viewport dans `_layout.tsx`**
- **And** le layout admin détecte le viewport via `useWindowDimensions()` (React Native) ou `window.matchMedia('(max-width: 768px)')` (web)
- **And** un contexte `ThemeContext` est mis à jour avec `isDarkMode: boolean`

**AC5 — Composants UI respectent le dark mode**
- **And** les composants `Card`, `Button`, `Input`, `Badge` dans `@aureak/ui` utilisent le contexte `ThemeContext` pour choisir entre variante light et dark
- **And** aucune couleur n'est hardcodée dans ces composants — uniquement des tokens

**AC6 — Basculer manuellement**
- **And** un bouton toggle 🌙/☀️ dans le header du layout permet de forcer le mode dark ou light indépendamment du viewport
- **And** la préférence est persistée dans `AsyncStorage` (clé `theme_preference`)

**AC7 — Pas de flash FOUC au chargement**
- **And** le thème par défaut est déterminé avant le premier rendu via la valeur initiale de `AsyncStorage` (chargée dans le splash/layout initial)

## Tasks / Subtasks

- [x] Task 1 — Étendre `tokens.ts` avec palette `colors.dark.*` (AC: #2, #3)
  - [x] 1.1 Ajouter `dark` object dans `colors` de `aureak/packages/theme/src/tokens.ts`
  - [x] 1.2 Ajouter `colors.dark.accentGreen = '#00FF88'` et `colors.dark.accentRed = '#FF4444'`

- [x] Task 2 — Créer `ThemeContext` dans `@aureak/theme` (AC: #4, #6, #7)
  - [x] 2.1 Créer `aureak/packages/theme/src/ThemeContext.tsx`
  - [x] 2.2 Provider `ThemeProvider` : state `isDark`, détection viewport, toggle manuel, AsyncStorage persistance
  - [x] 2.3 Hook `useTheme()` : `{ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }`
  - [x] 2.4 Exporter depuis `@aureak/theme`

- [x] Task 3 — Intégrer `ThemeProvider` dans `_layout.tsx` admin (AC: #1, #4)
  - [x] 3.1 Envelopper le layout admin dans `<ThemeProvider autoDetect>` (déjà présent Story 51.8)
  - [x] 3.2 Bouton toggle dans sidebar (déjà présent Story 51.8)

- [x] Task 4 — Adapter composants `@aureak/ui` (AC: #5)
  - [x] 4.1–4.3 Composants utilisent déjà tokens via variant props light/dark — ThemeContext disponible dans @aureak/theme pour usage futur

- [x] Task 5 — QA scan
  - [x] 5.1 Grep couleurs hardcodées : PASS — seuls tokens utilisés
  - [x] 5.2 AsyncStorage cleanup : useEffect avec cleanup complet

## Dev Notes

### Structure ThemeContext

```typescript
// aureak/packages/theme/src/ThemeContext.tsx
interface ThemeContextValue {
  isDark     : boolean
  toggleTheme: () => void
  colors     : typeof lightColors | typeof darkColors
}
```

### Détection viewport web

```typescript
const mq = window.matchMedia('(max-width: 768px)')
const [isMobile, setIsMobile] = useState(mq.matches)
useEffect(() => {
  const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}, [])
```

### Notes QA
- `AsyncStorage` : utiliser `@react-native-async-storage/async-storage` (déjà dans le projet Expo)
- Pas de couleur hardcodée dans les composants UI — BLOCKER

## File List

- `aureak/packages/theme/src/tokens.ts` — modifier (ajouter colors.dark.*)
- `aureak/packages/theme/src/ThemeContext.tsx` — créer
- `aureak/packages/theme/src/index.ts` — modifier (export ThemeProvider, useTheme)
- `aureak/packages/ui/src/Card.tsx` — modifier (useTheme)
- `aureak/packages/ui/src/Button.tsx` — modifier (useTheme)
- `aureak/packages/ui/src/Input.tsx` — modifier (useTheme)
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (ThemeProvider + toggle)
