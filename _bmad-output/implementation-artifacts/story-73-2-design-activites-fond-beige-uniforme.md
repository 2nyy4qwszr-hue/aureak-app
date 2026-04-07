# Story 73.2 : Design — Activités fond beige uniforme sur toutes les sous-pages

Status: done

## Story

En tant qu'admin,
je veux que le fond des pages Activités (Séances, Présences, Évaluations) soit uniformément beige (`colors.light.primary`),
afin que le header ACTIVITÉS et le fond derrière les stat cards soient cohérents avec la charte light premium du projet.

## Acceptance Criteria

1. Le header `ActivitesHeader` (wrapper contenant titre + onglets) a `backgroundColor: colors.light.primary` — plus de blanc (`colors.light.surface`).
2. La page principale Séances (`activites/page.tsx`) a son container root avec `backgroundColor: colors.light.primary` — plus de blanc.
3. Les pages Présences et Évaluations conservent leur `backgroundColor: colors.light.primary` déjà en place — aucune régression.
4. Les cartes individuelles (stat cards, tableaux, heatmap) conservent leur fond blanc `colors.light.surface` — seul le fond DE LA PAGE change.
5. Aucune couleur hardcodée n'est introduite — uniquement des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Corriger `ActivitesHeader.tsx` : fond beige (AC: 1, 5)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`, style `wrapper`, remplacer `backgroundColor: colors.light.surface` par `backgroundColor: colors.light.primary`

- [x] T2 — Corriger `activites/page.tsx` : fond beige (AC: 2, 5)
  - [x] T2.1 — Dans `aureak/apps/web/app/(admin)/activites/page.tsx`, style `container`, remplacer `backgroundColor: colors.light.surface` par `backgroundColor: colors.light.primary`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Naviguer sur `/activites` : vérifier que le fond de la page et du header est beige `#F3EFE7`, les cards restent blanches
  - [x] T3.2 — Naviguer sur `/activites/presences` : vérifier fond beige inchangé, pas de régression
  - [x] T3.3 — Naviguer sur `/activites/evaluations` : vérifier fond beige inchangé, pas de régression
  - [x] T3.4 — QA scan : `grep -n "backgroundColor" ActivitesHeader.tsx page.tsx` — zéro occurrence de `colors.light.surface` sur les éléments container/wrapper

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — ActivitesHeader.tsx

**Fichier** : `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`

**Ligne actuelle (74)** :
```tsx
wrapper: {
  backgroundColor  : colors.light.surface,   // ← blanc #FFFFFF — INCORRECT
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,
},
```

**Après correction** :
```tsx
wrapper: {
  backgroundColor  : colors.light.primary,   // ← beige #F3EFE7 — CORRECT
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,
},
```

Référence token : `colors.light.primary = '#F3EFE7'` dans `aureak/packages/theme/src/tokens.ts`

---

### T2 — activites/page.tsx

**Fichier** : `aureak/apps/web/app/(admin)/activites/page.tsx`

**Ligne actuelle (44-46)** :
```tsx
container: {
  flex           : 1,
  backgroundColor: colors.light.surface,   // ← blanc #FFFFFF — INCORRECT
},
```

**Après correction** :
```tsx
container: {
  flex           : 1,
  backgroundColor: colors.light.primary,   // ← beige #F3EFE7 — CORRECT
},
```

Les pages `presences/page.tsx` (ligne 1286) et `evaluations/page.tsx` (ligne 558) ont déjà `colors.light.primary` — **ne pas modifier**.

---

### Design

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// fond page et header
backgroundColor: colors.light.primary   // #F3EFE7 — beige

// fond cartes (ne pas toucher)
backgroundColor: colors.light.surface   // #FFFFFF — blanc
```

Principe design : fond beige uniforme = contraste doux entre la page et les cards blanches, pattern light premium établi dans toutes les autres pages admin.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifier | Style `wrapper` : `colors.light.surface` → `colors.light.primary` |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifier | Style `container` : `colors.light.surface` → `colors.light.primary` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — déjà `colors.light.primary` sur le container, aucune action
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — déjà `colors.light.primary` sur le container, aucune action
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — cards restent blanches, hors périmètre
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` — hors périmètre

---

### Dépendances à protéger

- Story 72-8 modifie `ActivitesHeader.tsx` (couleurs hardcodées `#18181B` / `#FFFFFF`) — s'assurer que les deux corrections sont compatibles. Cette story-73-2 ne touche que le style `wrapper.backgroundColor`, 72-8 touche les couleurs de texte et fond d'onglets.

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern de référence fond beige : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 1284-1287 (`pageStyles.container`)
- Pattern de référence fond beige : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` lignes 556-559 (`styles.container`)

---

### Multi-tenant

Sans objet — changement purement visuel, aucune donnée DB impliquée.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | À modifier |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | À modifier |
