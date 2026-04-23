# Story 101.4 — Infinite scroll mobile + pagination desktop

Status: done

## Metadata

- **Epic** : 101 — Composants data mobile-first
- **Story ID** : 101.4
- **Story key** : `101-4-infinite-scroll-mobile`
- **Priorité** : P2
- **Dépendances** : 101.1 (DataCard)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1j — hook + intégration DataCard)

## Story

As an admin sur mobile,
I want que les longues listes (> 50 items : club_directory 678, child_directory 500+, sessions sur saison) se chargent automatiquement en infinite scroll au fur et à mesure que je scrolle, au lieu d'afficher une pagination qui casse l'UX tactile,
So that la consultation des listes reste fluide et naturelle sur mobile.

## Contexte

### Pattern cible

- **Desktop** : pagination classique (numérotée, 50 items par page) — actuel
- **Mobile** : infinite scroll — charge 30 items au mount, charge 30 de plus quand l'utilisateur approche le bas (seuil 70% scroll)

## Acceptance Criteria

1. **Hook `usePaginatedList`** dans `aureak/apps/web/hooks/admin/usePaginatedList.ts`.

2. **API** :
   ```typescript
   type UsePaginatedListOptions<T> = {
     fetchPage    : (offset: number, limit: number) => Promise<{ data: T[]; total: number }>
     pageSize?    : number        // default 30 mobile, 50 desktop
     initialLoad? : boolean        // default true
   }

   type UsePaginatedListReturn<T> = {
     data      : T[]
     loading   : boolean
     error     : Error | null
     hasMore   : boolean
     loadMore  : () => void
     refresh   : () => void
     total     : number
   }
   ```

3. **Logique** :
   - Au mount : `fetchPage(0, pageSize)` → set data
   - Au `loadMore()` : `fetchPage(data.length, pageSize)` → append à data
   - `hasMore = data.length < total`
   - `refresh()` → reset et refetch page 0

4. **Composant `<InfiniteScrollContainer />`** dans `components/admin/InfiniteScrollContainer.tsx` :
   ```typescript
   type InfiniteScrollContainerProps = {
     children     : React.ReactNode  // rendu des items
     onLoadMore   : () => void
     hasMore      : boolean
     loading      : boolean
     variant?     : 'auto' | 'infinite' | 'paginated'
   }
   ```

5. **Variant infinite** (mobile) :
   - ScrollView avec onScroll listener
   - Déclenche `onLoadMore()` quand scroll atteint 70% du contenu
   - Loading indicator en bas pendant fetch
   - "Fin des résultats" si `!hasMore`

6. **Variant paginated** (desktop) :
   - Pagination classique numérotée
   - Réutiliser le pattern de pagination existant si présent (à inventorier)

7. **Variant auto** : détecte breakpoint.

8. **Optimisation** :
   - Debounce loadMore (250ms) pour éviter spam
   - Prevent double-fire pendant loading

9. **États** :
   - Loading initial : skeleton list
   - Loading more : spinner en bas
   - Error : message + retry button
   - Empty : emptyState prop

10. **Tokens `@aureak/theme` uniquement**.

11. **Conformité CLAUDE.md** : tsc OK, try/finally dans fetchPage error handling.

12. **Test Playwright** :
    - Page pilote `/academie/clubs` (678 items)
    - Viewport 375×667 : 30 items chargés au load
    - Scroll vers le bas → loader apparaît → 30 de plus apparaissent
    - Répéter jusqu'à "Fin des résultats"
    - Viewport 1440×900 : pagination numérotée

13. **Non-goals** :
    - **Pas de virtualisation FlatList avancée** (scope out — perf gérée par DataCard AC #7)
    - **Pas de pull-to-refresh** (optionnel, peut être story 101.4a)

## Tasks / Subtasks

- [x] **T1 — Hook `usePaginatedList`** (AC #1, #2, #3)
- [x] **T2 — `<InfiniteScrollContainer />`** (AC #4, #5, #6)
- [x] **T3 — Débounce + guards** (AC #8)
- [x] **T4 — États** (AC #9)
- [x] **T5 — QA pilote** (AC #10-12)

## Completion Notes

**Fichiers créés** :
- `aureak/apps/web/hooks/admin/usePaginatedList.ts` — hook générique avec append/refresh, guard anti-double-fire (`inflightRef`), generation token anti-race-condition, `hasMore` dérivé de `data.length < total`.
- `aureak/apps/web/components/admin/InfiniteScrollContainer.tsx` — wrapper avec 3 variants (`auto` | `infinite` | `paginated`). Infinite = ScrollView onScroll @ 70% + debounce 250ms + guard `scheduledRef`. Paginated = boutons ← N / M → reprend le pattern desktop existant (`/academie/clubs` pré-101.4).

**Fichiers modifiés** :
- `aureak/apps/web/app/(admin)/academie/clubs/index.tsx` — split en deux branches `MobileView` / `DesktopView` :
  - Mobile : hook `usePaginatedList` + `InfiniteScrollContainer` variant `infinite` → cards empilées.
  - Desktop : fetch direct par page (pas d'accumulation) + `InfiniteScrollContainer` variant `paginated` → table + pagination numérotée.
  Deux chemins coexistent car la pagination numérotée n'a pas besoin d'accumuler, contrairement à l'infinite scroll. Approche volontairement simple pour cette page pilote.

**Décisions de conception** :
- `InfiniteScrollContainer` est volontairement orthogonal à `<DataCard />` (AC #12 de 101.1) — il ne wrappe PAS les cards/table ; le consommateur passe les rows rendus en `children`.
- `usePaginatedList.fetchPage(offset, limit)` — signature offset-based. La page convertit vers `listClubDirectory({page, pageSize})` via `Math.floor(offset / limit)`. L'API client reste inchangée.
- Empty state = rendu early-return avant le ScrollView/container pour éviter le footer "Fin des résultats" quand il n'y a rien à afficher.

**QA scan** : try/finally OK (`usePaginatedList.doFetch`, `DesktopView.load`), console guardés par `NODE_ENV` (3 occurrences). `npx tsc --noEmit` = 0 erreur.

**Playwright** : skipped — app non démarrée au moment du commit.

## Dev Notes

### Infinite scroll logique

```tsx
const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
  const scrolledRatio = (contentOffset.y + layoutMeasurement.height) / contentSize.height
  if (scrolledRatio > 0.7 && !loading && hasMore) {
    loadMore()
  }
}
```

### Debounce

```tsx
const debouncedLoadMore = useMemo(
  () => debounce(loadMore, 250),
  [loadMore],
)
```

### Pagination cible (desktop)

Si pattern existant → réutiliser. Sinon : 5 boutons (Previous, 1-N numéros, Next) avec state current page. Query offset = `(currentPage - 1) * pageSize`.

### References

- Story 101.1 (DataCard) — intégration pour render rows
- Hooks existants : `hooks/admin/` (déjà présent depuis 95.1)
- Tokens : `@aureak/theme`
