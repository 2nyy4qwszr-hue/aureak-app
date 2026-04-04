# Story 43.2 : Méthodologie — cards entraînements plus compactes

Status: ready-for-dev

## Story

En tant qu'admin,
je veux une liste d'entraînements pédagogiques plus dense,
afin de visualiser plus d'entraînements sans scroller.

## Acceptance Criteria

1. Les cards dans `methodologie/seances/` sont réduites en hauteur (~40% moins hautes)
2. Le layout passe d'un grid de grandes cards à une liste compacte ou un grid 3 colonnes
3. Chaque card affiche : titre, méthode (badge coloré), niveau, nombre de modules/blocs, date de création
4. Les infos secondaires (description longue) sont masquées par défaut, visibles au hover ou dans la fiche détail
5. Zéro couleur hardcodée

## Technical Tasks

- [ ] Lire `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`
- [ ] Réduire le padding des cards : `space.sm` vertical
- [ ] Passer à grid 3 colonnes : `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- [ ] Tronquer les descriptions à 1 ligne avec ellipsis
- [ ] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (modifier)

## Dependencies

- story-43-1 doit être `done` avant (même fichier)
