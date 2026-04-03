# Story: Apps (coach)/ et (parent)/ — audit Light Premium

**ID:** tbd-coach-parent-light-premium
**Status:** done
**Source:** new
**Epic:** TBD — Design

## Description
Audit et migration des styles des apps (coach)/ et (parent)/ vers Light Premium.

## Résultat audit
Après inspection des layouts et dashboards :
- `(coach)/_layout.tsx` : `colors.light.surface`, `colors.light.primary` — déjà OK
- `(coach)/coach/dashboard/index.tsx` : `colors.light.primary`, `colors.text.dark` — déjà OK
- `(parent)/_layout.tsx` : `colors.light.surface`, `colors.light.primary` — déjà OK
- `(parent)/parent/dashboard/index.tsx` : `colors.light.primary`, `colors.text.dark` — déjà OK

Aucun fond sombre `#1A1A1A` / `background.primary` / `background.surface` détecté.
Aucune migration requise. Story validée.

## Commit
`feat(coach+parent): migration design Light Premium`
