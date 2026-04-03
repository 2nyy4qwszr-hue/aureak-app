# Story 33-4 — Tokens espacement (magic numbers)

**Epic:** 33
**Status:** ready-for-dev
**Priority:** low

## Story
En tant que développeur, je veux que les espacements et rayons de bordure utilisent les tokens du design system afin d'éliminer les magic numbers et d'assurer la cohérence du layout.

## Acceptance Criteria
- [ ] AC1: Les tokens `space.xs=4`, `space.sm=8`, `space.md=16`, `space.lg=24`, `space.xl=32` existent dans `tokens.ts` (vérifier et ajouter si absents)
- [ ] AC2: Le token `radius.pill: 20` existe dans `tokens.ts` (ajouter si absent — `radius.xs=6` et `radius.cardLg=24` sont déjà présents selon MEMORY)
- [ ] AC3: Dans `clubs/page.tsx`, les valeurs `paddingHorizontal: 10` remplacées par `space.sm` (8), magic numbers de gap remplacés par tokens
- [ ] AC4: Dans `clubs/new.tsx`, même remplacement des magic numbers d'espacement
- [ ] AC5: Dans `groups/[groupId]/page.tsx`, magic numbers d'espacement remplacés par tokens space.*
- [ ] AC6: Les `borderRadius: 20` remplacés par `radius.pill` dans les fichiers concernés
- [ ] AC7: Aucune régression visuelle — les espacements visuels sont équivalents

## Tasks
- [ ] Lire `aureak/packages/theme/src/tokens.ts` pour vérifier l'existence des tokens `space.*` et `radius.*`
- [ ] Ajouter `space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }` si absent (ou compléter les manquants)
- [ ] Ajouter `radius.pill: 20` si absent dans le groupe `radius`
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/page.tsx` et identifier les magic numbers d'espacement et borderRadius
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/new.tsx` et identifier les magic numbers d'espacement
- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` et identifier les magic numbers d'espacement
- [ ] Remplacer dans les 3 fichiers UI les magic numbers par les tokens correspondants
- [ ] QA: comparer visuellement avant/après (les valeurs 8 vs 10 peuvent légèrement changer le rendu — acceptable si delta < 2px)

## Dev Notes
- Fichiers à modifier: `aureak/packages/theme/src/tokens.ts`, `aureak/apps/web/app/(admin)/clubs/page.tsx`, `aureak/apps/web/app/(admin)/clubs/new.tsx`, `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`
- Tokens à utiliser: `space.*`, `radius.*`
- Mapping d'approximation acceptable:
  | Magic number | Token | Delta |
  |---|---|---|
  | `10` | `space.sm` (8) | -2px (acceptable) |
  | `6` | `space.xs` (4) | -2px (acceptable) ou laisser si gap sémantique différent |
  | `20` | `radius.pill` (20) | 0 |
  | `4` | `space.xs` (4) | 0 |
  | `8` | `space.sm` (8) | 0 |
  | `16` | `space.md` (16) | 0 |
  | `24` | `space.lg` (24) | 0 |
- Si un magic number n'a pas de correspondance exacte et que l'approximation change significativement le rendu, laisser la valeur hardcodée et ajouter un commentaire `// TODO: token`
- Pattern import:
  ```typescript
  import { space, radius } from '@aureak/theme'
  ```
- Ne pas modifier la logique des composants — uniquement les valeurs de style
