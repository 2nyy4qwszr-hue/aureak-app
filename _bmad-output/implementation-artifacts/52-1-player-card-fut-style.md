# Story 52-1 : Player Card FUT-Style

Status: done
Epic: 52 — Player Cards
Priority: P0 (fondation)
Dependencies: none

## Description

Composant `PlayerCard` 160x220px style FIFA Ultimate Team dans `@aureak/ui`.
3 tiers visuels (header gold, zone stats, footer).

## Acceptance Criteria

- [x] AC1 : Composant `PlayerCard` exporté depuis `@aureak/ui`
- [x] AC2 : Dimensions 160x220px (normal) et 140x193px (compact)
- [x] AC3 : Props : name, rating, position, tier (bronze/silver/gold/elite) via JoueurListItem
- [x] AC4 : 4 tiers visuels : Prospect (gris), Academicien (blanc), Confirme (or clair), Elite (or sombre + shimmer)
- [x] AC5 : Avatar photo avec fallback initiales
- [x] AC6 : Zéro valeur hardcodée — tout via @aureak/theme tokens

## Tasks

- [x] T1 : Définir PlayerTier type dans `@aureak/types/enums.ts`
- [x] T2 : Créer tokens playerTiers dans `@aureak/theme/tokens.ts`
- [x] T3 : Créer composant `PlayerCard.tsx` dans `@aureak/ui/src/`
- [x] T4 : Export depuis `@aureak/ui/src/index.ts`

## Notes

Composant et types deja existants (implementation anterieure). Story validee comme done.
