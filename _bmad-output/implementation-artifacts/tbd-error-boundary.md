# Story: Error Boundary global admin

**ID:** tbd-error-boundary
**Status:** done
**Source:** new
**Epic:** TBD — UI Robustesse

## Description
Créer un composant `ErrorBoundary` React class component avec fallback UI light premium. Intégrer dans `_layout.tsx` admin comme wrapper du contenu principal.

## Acceptance Criteria
- [x] `ErrorBoundary.tsx` créé dans `aureak/apps/web/components/`
- [x] Fallback UI light premium : card blanche, accent gold, bouton reset
- [x] `componentDidCatch` avec console guard `NODE_ENV !== 'production'`
- [x] Stack trace visible en dev uniquement
- [x] Intégré dans `_layout.tsx` wrappant le `<Slot />`

## Tasks
- [x] Créer `components/ErrorBoundary.tsx`
- [x] Intégrer dans `_layout.tsx`
- [x] Commit

## Commit
`feat(admin): error boundary global avec fallback UI`
