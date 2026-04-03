# Story: Page analytics/ — audit et migration Light Premium

**ID:** tbd-analytics-light-premium
**Status:** done
**Source:** new
**Epic:** TBD — Design

## Description
Audit et migration des styles de la page analytics/ vers Light Premium.

## Résultat audit
La page `analytics/index.tsx` est un re-export vers `dashboard/comparison.tsx` qui utilise déjà les tokens light premium :
- `colors.light.primary` pour le fond
- `colors.light.surface` pour les cards
- `shadows.sm` pour les ombres
- `colors.border.light` pour les bordures

Aucune migration requise. Story validée.

## Acceptance Criteria
- [x] Audit de `analytics/index.tsx` et `dashboard/comparison.tsx`
- [x] Déjà light premium — aucun fond sombre détecté

## Commit
`feat(analytics): migration design Light Premium`
