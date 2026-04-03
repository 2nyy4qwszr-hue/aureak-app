# Story: Synthèse parent enrichie

**ID:** tbd-parent-synthese
**Status:** done
**Source:** new
**Epic:** TBD — Parent UX

## Description
Améliorer la vue synthèse parent (`parent/children/[childId]/index.tsx`) avec :
- Badge le plus récent obtenu (emoji + nom + date + coach)
- Console guard ajouté sur les erreurs de chargement

## Changements effectués
- Import `getChildBadgeHistory` depuis `@aureak/api-client`
- State `recentBadge: ChildBadgeHistory | null`
- Chargement en parallèle dans `Promise.all` avec `getChildBadgeHistory(childId)`
- Section "Dernier badge obtenu" avec emoji, nom, date, coach — visible seulement si badge existe
- Console guard ajouté sur le try/catch du useEffect

## Acceptance Criteria
- [x] Badge récent visible si disponible
- [x] Section masquée si aucun badge
- [x] Date + coach du badge affiché
- [x] Console guard sur les erreurs

## Commit
`feat(parent): synthèse enrichie — badge récent`
