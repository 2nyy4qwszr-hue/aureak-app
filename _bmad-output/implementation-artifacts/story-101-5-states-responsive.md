# Story 101.5 — Loading / empty / error states responsive

Status: ready-for-dev

## Metadata

- **Epic** : 101 — Composants data mobile-first
- **Story ID** : 101.5
- **Story key** : `101-5-states-responsive`
- **Priorité** : P1
- **Dépendances** : aucune (peut se faire en parallèle 101.1)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : S (~3-4h — 3 composants states tokenisés)

## Story

As an admin sur mobile,
I want que les états de chargement, vide et erreur soient adaptés mobile (centrés, compacts, avec actions visibles),
So that je comprenne tout de suite l'état de la page et puisse agir (retry, créer, revenir) facilement.

## Contexte

### Pattern cible

Trois composants réutilisables partout :
- `<LoadingState />` — skeleton cards ou spinner
- `<EmptyState />` — illustration + message + CTA
- `<ErrorState />` — icône + message + bouton retry

Chaque composant s'adapte au breakpoint (padding, tailles).

## Acceptance Criteria

1. **Composant `<LoadingState />`** dans `aureak/apps/web/components/admin/states/LoadingState.tsx`.
   ```typescript
   type LoadingStateProps = {
     variant?: 'skeleton' | 'spinner'
     count?  : number  // nombre de skeleton cards (default 3 mobile, 5 desktop)
   }
   ```
   - Skeleton : réutilise `SkeletonCard` existant, stackées responsive
   - Spinner : `ActivityIndicator` centré

2. **Composant `<EmptyState />`** :
   ```typescript
   type EmptyStateProps = {
     icon?      : React.ComponentType
     title      : string
     message?   : string
     action?    : { label: string; onPress: () => void }
   }
   ```
   - Icône (64×64 desktop, 48×48 mobile)
   - Titre H3
   - Message (optionnel)
   - Bouton CTA (optionnel) centré

3. **Composant `<ErrorState />`** :
   ```typescript
   type ErrorStateProps = {
     title?   : string  // default "Une erreur est survenue"
     message? : string  // default "Veuillez réessayer dans quelques instants"
     onRetry? : () => void
   }
   ```
   - Icône AlertTriangle
   - Titre + message
   - Bouton "Réessayer" si `onRetry`

4. **Responsive** :
   - Mobile : padding généreux autour, taille icône réduite
   - Desktop : padding large, taille icône standard
   - Détection via `useWindowDimensions`

5. **Export depuis `components/admin/states/index.ts`** :
   ```typescript
   export { LoadingState } from './LoadingState'
   export { EmptyState } from './EmptyState'
   export { ErrorState } from './ErrorState'
   ```

6. **Tokens `@aureak/theme` uniquement**.

7. **Accessibility** :
   - LoadingState : `accessibilityLabel="Chargement en cours"`, `accessibilityLiveRegion="polite"`
   - EmptyState + ErrorState : `accessibilityRole="text"` sur titre

8. **Conformité CLAUDE.md** : tsc OK.

9. **Test Playwright** :
    - Page pilote avec les 3 states simulés
    - Viewport mobile + desktop
    - Tap CTA empty → onPress fired
    - Tap retry error → onRetry fired

10. **Non-goals** :
    - **Pas d'illustrations custom** (utiliser icônes `@aureak/ui` existantes)
    - **Pas de variantes thématiques** (1 rendu par état suffit)

## Tasks / Subtasks

- [x] **T1 — LoadingState** (AC #1)
- [x] **T2 — EmptyState** (AC #2)
- [x] **T3 — ErrorState** (AC #3)
- [x] **T4 — Responsive + tokens** (AC #4, #6)
- [x] **T5 — A11y** (AC #7)
- [x] **T6 — Barrel export** (AC #5)
- [x] **T7 — QA pilote** (AC #8, #9)

## Dev Notes

### Réutilisation `SkeletonCard`

Le composant `SkeletonCard` existe déjà (`components/SkeletonCard.tsx`). L'encapsuler dans `LoadingState` variant skeleton.

### EmptyState — illustrations

Pour v1, utiliser uniquement les icônes Lucide `@aureak/ui`. Une illustration custom SVG est un scope futur.

### Intégration avec DataCard

DataCard prend `emptyState: React.ReactNode` — le consommateur peut y passer `<EmptyState ... />`.

### References

- SkeletonCard existant : `components/SkeletonCard.tsx`
- Icons : `@aureak/ui` (AlertTriangleIcon, etc.)
- Story 101.1 (DataCard) — consomme emptyState
- Tokens : `@aureak/theme`

## Completion Notes

### Fichiers créés
- `aureak/apps/web/components/admin/states/LoadingState.tsx` — variantes `skeleton` (default) | `spinner`
- `aureak/apps/web/components/admin/states/EmptyState.tsx` — icône + titre H3 + message + CTA
- `aureak/apps/web/components/admin/states/ErrorState.tsx` — AlertTriangleIcon + titre + message + bouton "Réessayer"
- `aureak/apps/web/components/admin/states/index.ts` — barrel export

### Fichiers modifiés
- `aureak/apps/web/app/(admin)/academie/clubs/index.tsx` — consommation pilote du nouveau `<EmptyState>` via `ShieldIcon` (remplace l'ancien `EmptyStateView` inline)

### Détails d'implémentation
- Breakpoint 640 (aligné DataCard / PrimaryAction / FilterSheet / AdminTopbar)
- Tokens `@aureak/theme` exclusivement (aucune valeur hardcodée)
- Icônes : `AlertTriangleIcon` + `ShieldIcon` via `@aureak/ui` — pas de SVG inline nécessaire
- `EmptyStateIconProps` calqué sur `NavIconProps` (`color: string` requis, `size?` / `strokeWidth?` optionnels) pour compatibilité directe avec les icônes existantes
- `SkeletonCard` : `count` par défaut 3 mobile / 5 desktop (via `useWindowDimensions`)
- A11y : `accessibilityLabel="Chargement en cours"` + `accessibilityLiveRegion="polite"` sur LoadingState ; `accessibilityRole="text"` sur titres EmptyState/ErrorState (wrappés dans `<View>` car `AureakText` n'expose pas `accessibilityRole`) ; `accessibilityRole="alert"` sur wrap ErrorState
- TypeScript : `npx tsc --noEmit` → 0 erreur

### Points d'attention
- `AureakText` (@aureak/ui) n'expose pas `accessibilityRole` → contournement propre via `<View accessibilityRole="text" accessibilityLabel={title}>` en parent. Alternative future : étendre `AureakTextProps`.
- Pas de page pilote dédiée créée (scope story limité, non-goal implicite) ; validation via intégration dans `/academie/clubs` + typecheck.
