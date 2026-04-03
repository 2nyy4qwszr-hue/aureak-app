# Story: Page audit/ — audit design Light Premium

**ID:** tbd-audit-light-premium
**Status:** done
**Source:** new
**Epic:** TBD — Design

## Description
Migration des styles de la page audit/index.tsx vers Light Premium.

## Changements effectués
- Suppression des hardcoded `#334155` et `#1E293B` (couleurs dark slate)
- Remplacement par `colors.border.light`, `colors.border.divider`
- Table header migré : fond `colors.light.muted`, texte `colors.text.subtle`
- Entité badge : fond gold teinté `colors.accent.gold + '18'`
- Titre en Rajdhani gold 28px/800
- Import `shadows`, `radius` depuis `@aureak/theme`

## Acceptance Criteria
- [x] Aucun hardcode hex sombre dans le fichier
- [x] Table header light avec `colors.light.muted`
- [x] Bordures via `colors.border.divider`
- [x] Entity badge en gold

## Commit
`feat(audit): migration design Light Premium`
