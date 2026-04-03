# Story 40-5 — Lists: infinite scroll joueurs

**Epic:** 40
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux que la liste des joueurs se charge progressivement au fil du scroll afin de ne pas attendre le chargement de tous les 678 joueurs lors de l'ouverture de la page.

## Acceptance Criteria
- [ ] AC1: La liste `children/index.tsx` charge les 50 premiers joueurs au montage
- [ ] AC2: Quand l'utilisateur scroll jusqu'au bas de la liste, les 50 joueurs suivants sont chargés automatiquement
- [ ] AC3: Un skeleton loader apparaît pendant le chargement de la page suivante
- [ ] AC4: Quand tous les joueurs sont chargés, aucun nouveau fetch n'est déclenché
- [ ] AC5: Un indicateur textuel "X joueurs chargés sur Y au total" est affiché en bas de liste
- [ ] AC6: Les filtres (statut, actif, recherche) re-déclenchent un fetch depuis la page 0
- [ ] AC7: Un hook `useInfiniteScroll` est créé et réutilisable

## Tasks
- [ ] Créer `aureak/apps/web/lib/useInfiniteScroll.ts` — hook: `IntersectionObserver` sur sentinel div, state `page`, `hasMore`, `isLoadingMore`
- [ ] Modifier `aureak/apps/web/app/(admin)/children/index.tsx` — remplacer fetch unique par pagination: query Supabase avec `.range(offset, offset + pageSize - 1)`, accumuler résultats dans `joueurs[]`
- [ ] Vérifier que `listChildDirectory` dans `@aureak/api-client/src/admin/child-directory.ts` accepte `{ page, pageSize, ...filters }` — sinon ajouter ces paramètres
- [ ] Ajouter sentinel `<div ref={sentinelRef} />` en bas de la liste dans `children/index.tsx`
- [ ] Ajouter skeleton loader (3 cards skeleton) visible quand `isLoadingMore`
- [ ] Ajouter compteur "X joueurs chargés sur Y au total" en bas de liste
- [ ] Modifier fetch pour reset à `page=0` quand les filtres changent (useEffect sur filtres)
- [ ] Vérifier QA: try/finally sur fetch, console guards présents

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/lib/useInfiniteScroll.ts` (nouveau)
  - `aureak/apps/web/app/(admin)/children/index.tsx`
  - `aureak/packages/api-client/src/admin/child-directory.ts`
- `pageSize` = 50 (paramètre configurable dans le hook)
- `IntersectionObserver` API disponible nativement sur web (pas de polyfill nécessaire pour Expo web)
- Pattern accumulation:
  ```typescript
  const [joueurs, setJoueurs] = useState<ChildDirectoryEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const loadPage = async (page: number, reset = false) => {
    // ...
    if (reset) setJoueurs(data)
    else setJoueurs(prev => [...prev, ...data])
  }
  ```
- Query Supabase: `.range(page * 50, (page + 1) * 50 - 1)` + `.select('*', { count: 'exact' })` pour `totalCount`
- Skeleton card: composant `SkeletonCard` déjà existant dans le projet ou créer un simple `<View style={{ height: 80, backgroundColor: colors.light.elevated, borderRadius: tokens.radius.md }} />`
- Pas de migration Supabase nécessaire
