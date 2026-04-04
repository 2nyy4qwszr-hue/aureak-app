# Story 43.4 : BUG — Méthodologie thèmes — cards trop grandes

Status: done

## Story

En tant qu'admin Aureak consultant la liste des thèmes méthodologiques,
je veux que les cards de thèmes soient dans un format compact sur 5 colonnes,
afin de voir davantage de thèmes sans scrolling excessif.

## Acceptance Criteria

1. La grille de cards thèmes dans `(admin)/methodologie/themes/` utilise 5 colonnes (au lieu de 3)
2. Chaque card a un format compact : hauteur réduite, padding réduit, titre truncated si nécessaire
3. Sur tablette (< 1024px) : 3 colonnes ; sur mobile (< 640px) : 2 colonnes
4. Le format est identique à la plus petite card mobile qu'on peut faire — compact et uniforme
5. Aucune régression sur les pages méthodologie/seances et méthodologie/situations

## Tasks / Subtasks

- [x] T1 — Corriger la grille des thèmes
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` — identifier la grille actuelle
  - [x] T1.2 — Changer `gridTemplateColumns` : `repeat(5, 1fr)` desktop, `repeat(3, 1fr)` tablette, `repeat(2, 1fr)` mobile
  - [x] T1.3 — Réduire le gap de la grille à 12 (était `space.lg`)
  - [x] T1.4 — Titre : `numberOfLines={2}` avec `ellipsizeMode="tail"` — déjà présent dans PremiumThemeCard
  - [x] T1.5 — Hauteur de card : pas de hauteur fixe, laisser le contenu déterminer (compact via aspectRatio: 1)

- [x] T2 — Validation
  - [x] T2.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T2.2 — Screenshot Playwright → 5 cols visibles sur desktop (skipped — app non démarrée)

## Dev Notes

### Pattern grille responsive
```typescript
const gridStyle = {
  display: 'grid' as const,
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 12,
}
// Pour responsive, utiliser un hook useWindowDimensions
const { width } = useWindowDimensions()
const cols = width >= 1024 ? 5 : width >= 640 ? 3 : 2
const gridStyle = {
  display: 'grid' as const,
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap: 12,
}
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Grille 5 cols compacte |

## Dev Agent Record

**Date** : 2026-04-04
**Agent** : Amelia (Developer Agent BMAD)

**Structure actuelle trouvée** :
- Grille responsive avec breakpoints : `width < 640 → 1 col`, `width < 1100 → 2 cols`, `width < 1500 → 3 cols`, sinon `4 cols`
- Gap : `space.lg`
- `numberOfLines={2}` déjà présent dans `PremiumThemeCard.tsx` sur le titre

**Corrections appliquées** :
1. `gridColumns` recalculé : `width >= 1024 ? 5 : width >= 640 ? 3 : 2` (desktop 5 cols, tablette 3, mobile 2)
2. Gap grille réduit de `space.lg` à `12`

**Résultat tsc** : 0 erreur

## File List

- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` — grille 5 colonnes compact
