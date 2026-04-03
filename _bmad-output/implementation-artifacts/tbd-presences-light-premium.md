# Story: Page presences/ — migration Light Premium

**ID:** tbd-presences-light-premium
**Status:** done
**Source:** new
**Epic:** TBD — Design

## Description
Audit et migration des styles de la page presences/ vers Light Premium.

## Résultat audit
La page `presences/page.tsx` utilisait déjà les tokens light premium :
- `colors.light.surface` pour les cards
- `colors.text.dark` pour le texte
- `colors.border.divider` pour les bordures
- `shadows.sm/md` pour les ombres
- Pas de fonds sombres hardcodés

Aucune migration requise. Story validée.

## Acceptance Criteria
- [x] Audit de `presences/page.tsx` — déjà light premium
- [x] Pas de couleurs hex hardcodées sombres détectées
- [x] Commit documentant l'audit

## Commit
`feat(presences): migration design Light Premium`
