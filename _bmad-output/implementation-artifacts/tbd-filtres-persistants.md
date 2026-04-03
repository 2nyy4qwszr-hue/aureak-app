# Story: Filtres persistants entre sessions (localStorage)

**ID:** tbd-filtres-persistants
**Status:** done
**Source:** new
**Epic:** TBD — UX

## Description
Créer un hook `usePersistedFilters(key, defaultValue)` qui lit/écrit dans localStorage. L'utiliser dans les pages `children/` et `clubs/` pour persister les filtres entre sessions.

## Acceptance Criteria
- [x] Hook `usePersistedFilters` dans `aureak/apps/web/hooks/usePersistedFilters.ts`
- [x] Fallback gracieux si localStorage indisponible (SSR, private browsing)
- [x] Filtres children/ persistés : acadStatus, season, stage, birthYear
- [x] Filtres clubs/ persistés : province, relation, actif

## Tasks
- [x] Créer `hooks/usePersistedFilters.ts`
- [x] Intégrer dans `children/index.tsx`
- [x] Intégrer dans `clubs/page.tsx`
- [x] Commit

## Commit
`feat(admin): filtres persistants localStorage joueurs et clubs`
