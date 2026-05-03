# Story 110.6 : Refonte filtres /presences en sheet compact (pattern 110.2)

Status: ready-for-dev

Dépend de : 110.2 (FilterSheet pattern validé sur /activites/seances)

## Story

En tant qu'**admin**,
je veux **un seul bouton "Filtres" qui ouvre un sheet/popover compact contenant période + implantation + groupe sur /presences**,
afin de **gagner de l'espace mobile vertical et avoir le même geste de filtrage que sur /activites/seances**.

## Contexte

Story 110.2 a appliqué le pattern `<FilterSheet>` à `/activites/seances` :
- Mobile (< 640px) : bouton "Filtres" + bottom sheet
- Desktop : layout inline préservé
- Badge compteur quand filtres actifs ≠ défaut
- Bouton "Réinitialiser"

`/presences` (`aureak/apps/web/app/(admin)/presences/page.tsx` ligne ~700) garde encore les filtres en barre wrap horizontale (timeView segmented + 2 selects). Sur mobile, ça prend ~140px de hauteur avant les cards. À aligner.

## Acceptance Criteria

- **AC1** : `/presences` mobile (<640px) affiche 1 bouton "Filtres" (icône SlidersHorizontal) à la place des 2 selects Implantation+Groupe. Le segmented timeView reste visible (geste rapide).
- **AC2** : Clic bouton → `<FilterSheet>` ouvert avec les 2 selects + bouton Réinitialiser.
- **AC3** : Badge compteur sur le bouton si `implantationId !== ''` ou `groupId !== ''`.
- **AC4** : Cascade implantation→groupe préservée (reset groupe si implantation change).
- **AC5** : Desktop (≥640px) : layout inline existant préservé via `<FilterSheet variant="inline">`.
- **AC6** : Conformité : `@aureak/api-client` only, tokens `@aureak/theme`, try/finally, console guards.

## Tasks / Subtasks

- [ ] T1 — Importer `FilterSheet` dans `presences/page.tsx`
- [ ] T2 — Wrap les 2 `<select>` dans `<FilterSheet activeCount={X} onReset={...}>`
- [ ] T3 — Garder le segmented timeView en dehors du sheet (geste rapide)
- [ ] T4 — `cd aureak && npx tsc --noEmit`
- [ ] T5 — Test mobile (390x844) : bouton Filtres visible, sheet ouvre, cascade OK

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/presences/page.tsx`

## Notes

- Le fichier est en HTML/divs (pas RN/View). FilterSheet (React Native) doit être ajusté ou wrappé dans un `<View>` parent. Vérifier compat RN-web avant.
- Si incompat : créer une version HTML `<FilterSheetWeb>` ou extraire la logique en hook `useFilterSheet`.
- Pattern de référence : story 110.2 (commit `9e242b7`).
