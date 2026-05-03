# Story 110.8 : Bouton Filtres uniformisé sur /presences et /evaluations

Status: done

## Story

En tant qu'**admin**,
je veux **le même bouton "Filtres" (style segmented) sur /activites/presences et /activites/evaluations qu'à /activites/seances**,
afin d'**avoir une UI cohérente sur les 4 onglets de la section Activités**.

## Contexte

Story 110.7 a uniformisé le style du bouton FilterSheet (segmented muted+surface). Story 110.2 l'a appliqué à /activites/seances. Restait à propager à :
- /activites/presences (FiltresScope + PseudoFiltresTemporels en row)
- /activites/evaluations (FiltresScope + segmented evalType)

## Acceptance Criteria

- **AC1 — /presences** : segmented `PseudoFiltresTemporels` reste visible en surface (geste rapide passé/today/upcoming) ; `FiltresScope` est wrappé dans `<FilterSheet>` avec activeCount = 0 si scope='global', sinon 1.
- **AC2 — /evaluations** : segmented evalType (badges/connaissances/competences) reste en surface ; `FiltresScope` est wrappé dans `<FilterSheet>`.
- **AC3 — Bouton Réinitialiser** : présent dans les 2 sheets, reset le scope à `{ scope: 'global' }`.
- **AC4 — Style cohérent** : auto via composant FilterSheet partagé (style segmented appliqué en 110.7).
- **AC5 — Conformité** : tsc OK, pas de hardcode.

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (wrap FiltresScope)
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (wrap FiltresScope)

## Notes

- Le segmented externe (PseudoFiltresTemporels / evalType) reste visible pour conserver le geste rapide. Aligné avec le pattern /activites/seances (timeView segmented externe).
- L'activeCount est binaire (0 ou 1) car FiltresScope a un seul mode actif à la fois (global/implantation/groupe/joueur).
