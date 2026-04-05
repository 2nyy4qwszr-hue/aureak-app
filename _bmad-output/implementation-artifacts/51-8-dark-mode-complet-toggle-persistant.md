# Story 51.8 : Dark mode complet + toggle persistant

Status: done

## Story

En tant qu'administrateur,
Je veux pouvoir basculer entre le mode clair (Light Premium) et le mode sombre (Dark) de l'interface admin, avec une préférence sauvegardée et la détection automatique de `prefers-color-scheme`,
Afin de travailler confortablement selon les conditions de luminosité et mes préférences personnelles.

## Contexte & Décisions de Design

### État actuel du design system
Le thème actuel est "Light Premium" : fond `colors.light.primary` (#F3EFE7), cards `colors.light.surface` (#FFFFFF), sidebar dark. Les tokens dark existent mais ne sont pas utilisés dans l'admin web (seulement mobile).

### Architecture du dark mode
1. **Token set `dark.*`** dans `@aureak/theme/tokens.ts` — miroir sémantique de `light.*`
2. **`ThemeContext`** — context React exposant `theme: 'light' | 'dark'`, `toggleTheme()`, `setTheme()`
3. **`ThemeProvider`** — wrappé au niveau `_layout.tsx`, lit `localStorage` et `prefers-color-scheme`
4. **Pattern de consommation** : les composants utilisent `useTheme()` pour lire `theme` et sélectionner les tokens appropriés

### Stratégie de migration
Plutôt que de refactorer toutes les pages (effort énorme), cette story :
1. Crée les tokens dark et le context
2. Met à jour `_layout.tsx` (sidebar, zone contenu, topbar mobile) pour être theme-aware
3. Fournit un utilitaire `useThemeColors()` retournant les bons tokens selon le thème actuel
4. Les pages individuelles seront migrées au fur et à mesure (hors scope de cette story)

### Tokens dark
```
dark.primary   → '#1A1A1A'  (= background.primary actuel)
dark.surface   → '#242424'  (= background.elevated)
dark.elevated  → '#2C2C2C'
dark.hover     → '#2E2E2E'
dark.muted     → '#1E1E1E'
```

### Toggle
Bouton dans le pied de la sidebar (à côté du profil admin). Icône soleil/lune SVG. État persisté dans `localStorage('aureak-theme')`. Par défaut : `prefers-color-scheme`.

### Sidebar en dark mode
La sidebar est DÉJÀ dark (fond `colors.background.primary`). En dark mode, elle reste identique. Seule la zone de contenu change de fond et de couleurs.

## Acceptance Criteria

**AC1 — Tokens dark dans `@aureak/theme`**
- **Given** le fichier `tokens.ts` est importé
- **When** on accède à `colors.dark.*`
- **Then** les tokens `primary`, `surface`, `elevated`, `hover`, `muted` existent avec les bonnes valeurs hex
- **And** les valeurs sont cohérentes avec le design dark existant (mobile app)

**AC2 — ThemeContext et hook `useTheme()`**
- **Given** l'app est wrappée dans `<ThemeProvider>`
- **When** un composant appelle `useTheme()`
- **Then** il reçoit `{ theme, toggleTheme, setTheme }` où `theme: 'light' | 'dark'`
- **And** `toggleTheme()` bascule entre 'light' et 'dark'

**AC3 — Détection `prefers-color-scheme` au premier chargement**
- **Given** l'utilisateur n'a pas de préférence sauvegardée dans localStorage
- **When** l'app se charge
- **Then** le thème initial est `'dark'` si `window.matchMedia('(prefers-color-scheme: dark)').matches`, sinon `'light'`

**AC4 — Persistance localStorage**
- **Given** l'admin change de thème via le toggle
- **When** il recharge la page
- **Then** le thème sélectionné est restauré depuis `localStorage('aureak-theme')`
- **And** la clé localStorage est `'aureak-theme'` avec valeur `'light'` ou `'dark'`

**AC5 — Zone contenu admin theme-aware**
- **Given** le dark mode est actif
- **When** l'admin navigue dans l'interface admin
- **Then** la zone de contenu principale a le fond `colors.dark.primary` (#1A1A1A)
- **And** la topbar mobile utilise `colors.dark.surface` comme fond
- **And** les separators et bordures utilisent les tokens dark correspondants

**AC6 — Toggle visible dans la sidebar**
- **Given** la sidebar est en mode expanded
- **When** l'admin regarde le pied de sidebar
- **Then** un bouton toggle thème est visible (icône soleil en light / lune en dark)
- **And** en mode collapsed : le bouton est réduit à l'icône seule (sans label)

**AC7 — Transition douce au changement de thème**
- **Given** l'admin clique sur le toggle
- **When** le thème change
- **Then** la transition est visible et douce (pas un saut brutal)
- **And** la transition dure 200ms via `transition: 'background-color 0.2s ease'`

**AC8 — Hook `useThemeColors()` pour consommation simplifiée**
- **Given** un composant veut être theme-aware
- **When** il appelle `useThemeColors()`
- **Then** il reçoit un objet `{ bg, surface, elevated, hover, muted, textDark, textMuted, border }` avec les bonnes valeurs selon le thème courant
- **And** ce hook est exporté depuis `@aureak/theme` ou depuis `apps/web/hooks/`

**AC9 — Sidebar reste dark en dark mode**
- **Given** le dark mode est actif
- **When** l'admin voit la sidebar
- **Then** la sidebar reste sur son fond dark `colors.background.primary` (#1A1A1A)
- **And** aucun changement visuel sur la sidebar entre light et dark mode (elle est déjà dark)

## Tasks / Subtasks

- [x] Task 1 — Tokens `colors.dark.*` dans `@aureak/theme/tokens.ts`
  - [x] 1.1 Ajouter `dark` key dans le `colors` object :
    ```typescript
    dark: {
      primary : '#1A1A1A',
      surface : '#242424',
      elevated: '#2C2C2C',
      hover   : '#2E2E2E',
      muted   : '#1E1E1E',
    }
    ```
  - [x] 1.2 Vérifier `npx tsc --noEmit` — aucun conflit avec les types existants

- [x] Task 2 — `ThemeContext` et `ThemeProvider`
  - [x] 2.1 Créer `aureak/apps/web/app/contexts/ThemeContext.tsx`
  - [x] 2.2 Définir `type AppTheme = 'light' | 'dark'`
  - [x] 2.3 Context : `{ theme: AppTheme, toggleTheme: () => void, setTheme: (t: AppTheme) => void }`
  - [x] 2.4 `ThemeProvider` : init state depuis `localStorage('aureak-theme')` → fallback `prefers-color-scheme` → fallback `'light'`
  - [x] 2.5 `useEffect` pour sauvegarder dans localStorage à chaque changement
  - [x] 2.6 Exporter `useTheme` hook

- [x] Task 3 — Hook `useThemeColors()`
  - [x] 3.1 Créer `aureak/apps/web/app/hooks/useThemeColors.ts`
  - [x] 3.2 Consomme `useTheme()` et retourne les tokens appropriés :
    ```typescript
    const useThemeColors = () => {
      const { theme } = useTheme()
      const isLight = theme === 'light'
      return {
        bg      : isLight ? colors.light.primary   : colors.dark.primary,
        surface : isLight ? colors.light.surface   : colors.dark.surface,
        elevated: isLight ? colors.light.elevated  : colors.dark.elevated,
        hover   : isLight ? colors.light.hover     : colors.dark.hover,
        muted   : isLight ? colors.light.muted     : colors.dark.muted,
        textPrimary: isLight ? colors.text.dark    : colors.text.primary,
        textMuted  : isLight ? colors.text.muted   : colors.text.secondary,
        border  : isLight ? colors.border.light    : colors.border.dark,
        divider : isLight ? colors.border.divider  : colors.border.dark,
      }
    }
    ```

- [x] Task 4 — Icônes SunIcon et MoonIcon
  - [x] 4.1 Créer `aureak/packages/ui/src/icons/SunIcon.tsx` — icône soleil SVG outline
  - [x] 4.2 Créer `aureak/packages/ui/src/icons/MoonIcon.tsx` — icône lune SVG outline
  - [x] 4.3 Exporter depuis `@aureak/ui/src/icons/index.ts`

- [x] Task 5 — Bouton toggle dans la sidebar `_layout.tsx`
  - [x] 5.1 Importer `useTheme`, `SunIcon`, `MoonIcon`
  - [x] 5.2 Ajouter un `Pressable` dans le pied de sidebar (entre user pill et Déconnexion)
  - [x] 5.3 En mode expanded : icône + label "Mode sombre" / "Mode clair"
  - [x] 5.4 En mode collapsed : icône seule (sun/moon), centrée
  - [x] 5.5 Appelle `toggleTheme()` au press

- [x] Task 6 — Zone contenu admin theme-aware dans `_layout.tsx`
  - [x] 6.1 Remplacer `backgroundColor={colors.light.primary}` de la YStack contenu principale par `style.backgroundColor=themeColors.bg`
  - [x] 6.2 Mettre à jour la topbar mobile pour utiliser `themeColors.surface` et `themeColors.border`
  - [x] 6.3 Ajouter `transition: 'background-color 0.2s ease'` sur les éléments theme-aware

- [x] Task 7 — Intégration `ThemeProvider` dans `_layout.tsx`
  - [x] 7.1 Wrapper le layout dans `<ThemeProvider>` — `AdminLayout` (export default) = provider, `AdminLayoutInner` = consommateur
  - [x] 7.2 Pas de FOUC — pas de SSR, initialisation synchrone dans `useState()`

- [x] Task 8 — QA
  - [x] 8.1 `npx tsc --noEmit` sans erreur (0 erreur)
  - [x] 8.2 Console guard présent sur try/catch localStorage
  - [x] 8.3 Sidebar reste dark dans les deux modes (aucune modification des couleurs sidebar)

## Dev Notes

### Initialisation thème sans FOUC (best effort)

La lecture `localStorage` côté client est synchrone. Avec React Native Web / Expo Router, le composant est côté client uniquement — pas de SSR → pas de FOUC serveur. La lecture dans `useState` initial suffit.

```typescript
const [theme, setTheme] = useState<AppTheme>(() => {
  try {
    const saved = localStorage.getItem('aureak-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* noop */ }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
})
```

### Consommation dans un composant page (exemple futur)

```typescript
// Dans n'importe quelle page admin
const tc = useThemeColors()

<YStack backgroundColor={tc.bg}>
  <YStack backgroundColor={tc.surface} style={{ boxShadow: shadows.sm }}>
    <Text color={tc.textPrimary}>...</Text>
  </YStack>
</YStack>
```

### Nota bene : migration des pages

Cette story ne migre que `_layout.tsx`. Les pages individuelles utilisent encore `colors.light.*` hardcodés. La migration complète des pages est une dette technique à planifier par itération ou via une story dédiée (Epic 51-9 potentielle).

Le hook `useThemeColors()` est prêt pour faciliter cette migration future.

## File List

### New Files
- `aureak/apps/web/app/contexts/ThemeContext.tsx` — ThemeProvider + useTheme hook
- `aureak/apps/web/app/hooks/useThemeColors.ts` — mapping tokens selon thème
- `aureak/packages/ui/src/icons/SunIcon.tsx` — icône soleil SVG
- `aureak/packages/ui/src/icons/MoonIcon.tsx` — icône lune SVG

### Modified Files
- `aureak/packages/theme/src/tokens.ts` — `colors.dark.*` ajouté
- `aureak/packages/ui/src/icons/index.ts` — exports SunIcon, MoonIcon
- `aureak/apps/web/app/(admin)/_layout.tsx` — ThemeProvider wrapper + toggle bouton + zone contenu theme-aware

## Dev Agent Record

- [ ] Story créée le 2026-04-04
- [ ] Dépendances : Story 51-1 (icônes SVG disponibles pour sun/moon), Story 51-7 (sidebar déjà animée — transition 0.2s s'y intègre bien)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
