# Story: Pages partnerships/ et grade-permissions/ — Light Premium

**ID:** tbd-partnerships-design
**Status:** done
**Source:** new
**Epic:** TBD — Design

## Description
Audit et migration des styles des pages partnerships/ et grade-permissions/ vers Light Premium.

## Changements effectués
- `partnerships/index.tsx` : remplacement de `#334155` (dark slate) par `colors.border.light` dans les inputs/selects
- `grade-permissions/index.tsx` : déjà light premium (GRADE_COLOR hex = valeurs sémantiques pour badges)

## Acceptance Criteria
- [x] `partnerships/index.tsx` : aucun hex sombre hardcodé
- [x] `grade-permissions/index.tsx` : déjà OK

## Commit
`feat(partnerships): migration design Light Premium`
