# Story 52-2 : Stats Gardien 6 Attributs

Status: done
Epic: 52 — Player Cards
Priority: P0
Dependencies: 52-1

## Description

6 attributs gardien : PLO (plongeon), TIR (tirs), TEC (technique), TAC (tactique), PHY (physique), MEN (mental).
Fonction `computePlayerTier(stats)` bronze/silver/gold/elite.
Integrer dans PlayerCard.

## Acceptance Criteria

- [x] AC1 : 6 attributs PLO/TIR/TEC/TAC/PHY/MEN affiches dans PlayerCard
- [x] AC2 : Fonction `computePlayerStats()` dans `@aureak/business-logic`
- [x] AC3 : Fonction `computePlayerTier()` dans `@aureak/business-logic`
- [x] AC4 : Couleurs par bande stat via gamification.statBands tokens
- [x] AC5 : StatsRow composant integre en bas de PlayerCard

## Tasks

- [x] T1 : Creer `PlayerStats` type dans `@aureak/business-logic`
- [x] T2 : Implementer `computePlayerStats()` et `computePlayerTier()`
- [x] T3 : Creer `StatsRow` sous-composant dans PlayerCard.tsx
- [x] T4 : Ajouter tokens `gamification.statBands` et `gamification.statLabels`

## Notes

Deja implemente dans `aureak/packages/business-logic/src/playerStats.ts` et integre dans PlayerCard.
