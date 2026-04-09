# Story 82.1 : Activités — Uniformisation hauteur des StatCards (Séances ≙ Présences ≙ Évaluations)

Status: done

## Story

En tant qu'admin,
je veux que les 3 onglets Activités (Séances, Présences, Évaluations) affichent des stat cards de hauteur uniforme,
afin d'obtenir une cohérence visuelle entre les onglets lors de la navigation.

## Acceptance Criteria

1. Les 4 StatCards de l'onglet Séances (`StatCards.tsx`) n'ont plus de `minHeight` fixe : leur hauteur est déterminée par leur contenu, comme les cards Présences et Évaluations.
2. Le `borderRadius` des cards Séances utilise `radius.card` (identique aux cards Présences et Évaluations), plus `radius.cardLg` (24px).
3. Les cards Séances (blanches et gold) conservent leur contenu exact (picto, label, valeur, sous-label, badge trend, badge record, barre de progression) — aucune info supprimée.
4. Le skeleton de chargement (`skeletonCard`) n'a plus de `minHeight` fixe.
5. Aucune couleur hardcodée n'est introduite — tous les styles utilisent des tokens `@aureak/theme`.
6. Les onglets Présences et Évaluations ne sont pas modifiés.

## Tasks / Subtasks

- [x] T1 — Modifier `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] T1.1 — Dans le style `card` : supprimer `minHeight: 174` + changer `borderRadius: radius.cardLg` → `borderRadius: radius.card`
  - [x] T1.2 — Dans le style `cardGold` : supprimer `minHeight: 174` + changer `borderRadius: 24` → `borderRadius: radius.card`
  - [x] T1.3 — Dans le style `skeletonCard` : supprimer `minHeight: 174` + changer `borderRadius: radius.cardLg` → `borderRadius: radius.card`
  - [x] T1.4 — Vérifier que `radius` est bien importé depuis `@aureak/theme` (déjà présent — confirmer uniquement)

- [x] T2 — QA (AC: tous)
  - [x] T2.1 — Grep `minHeight.*174` dans `StatCards.tsx` → zéro occurrence
  - [x] T2.2 — Grep `radius.cardLg\|borderRadius.*24` dans `StatCards.tsx` → zéro occurrence introduite
  - [x] T2.3 — Grep `#[0-9a-fA-F]` dans `StatCards.tsx` → zéro couleur hex introduite

## Dev Notes

### Contexte

Les cards Séances avaient `minHeight: 174` + `borderRadius: radius.cardLg` (24px) hérité d'un layout Figma bento plus grand.
Les cards Présences et Évaluations ont toujours fonctionné sans `minHeight` fixe, avec `borderRadius: radius.card`.
L'utilisateur préfère la hauteur naturelle de Présences.

### Diff ciblé dans `StatCards.tsx`

```tsx
// AVANT
card: {
  flex            : 1,
  minWidth        : 160,
  minHeight       : 174,           // ← supprimer
  backgroundColor : colors.light.surface,
  borderRadius    : radius.cardLg, // ← remplacer par radius.card
  padding         : 16,
  ...
},
skeletonCard: {
  flex           : 1,
  minWidth       : 160,
  minHeight      : 174,            // ← supprimer
  backgroundColor: colors.light.muted,
  borderRadius   : radius.cardLg,  // ← remplacer par radius.card
  opacity        : 0.6,
},
cardGold: {
  flex           : 1,
  minWidth       : 160,
  minHeight      : 174,            // ← supprimer
  backgroundColor: colors.accent.goldDark,
  borderRadius   : 24,             // ← remplacer par radius.card
  ...
},

// APRÈS
card: {
  flex            : 1,
  minWidth        : 160,
  backgroundColor : colors.light.surface,
  borderRadius    : radius.card,
  padding         : 16,
  ...
},
skeletonCard: {
  flex           : 1,
  minWidth       : 160,
  backgroundColor: colors.light.muted,
  borderRadius   : radius.card,
  opacity        : 0.6,
},
cardGold: {
  flex           : 1,
  minWidth       : 160,
  backgroundColor: colors.accent.goldDark,
  borderRadius   : radius.card,
  ...
},
```

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | 3 suppressions `minHeight` + 3 changements `borderRadius` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — référence à ne pas toucher
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — référence à ne pas toucher
- `aureak/apps/web/app/(admin)/activites/page.tsx` — non impacté
- Toute migration Supabase — changement UI pur

### Dépendances

Aucune dépendance story. Modification isolée sur un seul fichier.

### Multi-tenant

Sans impact — aucune donnée RLS concernée, modification UI pure.
