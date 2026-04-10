# Story 42.2 : Page Présences — redesign visuel compact

Status: done

## Story

En tant qu'admin,
je veux une page présences plus dense et visuellement attractive,
afin de consulter rapidement les taux de présence sans scroll excessif.

## Acceptance Criteria

1. Les cards de séances sont plus compactes (hauteur réduite ~30%)
2. Chaque card affiche en priorité : nom du groupe, date, taux de présence avec barre colorée inline, statut (en cours / terminée / annulée) avec badge
3. La barre de progression utilise `colors.status.present` / `colors.status.attention` / `colors.status.absent` selon le taux (≥80% / 60-80% / <60%)
4. Les chiffres présents/absents/retards sont affichés en compact (icônes + nombres) plutôt qu'en blocs séparés
5. Le layout passe de cards empilées à une liste dense avec séparateurs fins
6. Zéro couleur hardcodée introduite

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/presences/page.tsx` (ou index.tsx)
- [x] Réduire la hauteur des cards : padding vertical `space.sm` au lieu de `space.md/xl`
- [x] Remplacer les blocs KPI par une ligne compacte : `✓ 12  ✗ 3  ⏱ 1`
- [x] Ajouter une `PresenceProgressBar` inline sous le nom de séance
- [x] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/presences/page.tsx` ou `index.tsx` (modifier)

## Dependencies

Aucune.
