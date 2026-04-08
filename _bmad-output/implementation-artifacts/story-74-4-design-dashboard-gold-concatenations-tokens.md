# Story 74.4 : Dashboard — concaténations hex gold fragiles → tokens @aureak/theme

Status: done

## Story

En tant que développeur de l'académie Aureak,
je veux remplacer les concaténations `colors.accent.gold + 'XX'` dans `dashboard/page.tsx` par des tokens `@aureak/theme` existants,
afin d'éliminer les chaînes hex fragiles et maintenir la cohérence du design system.

## Acceptance Criteria

1. La ligne 263 `backgroundColor: colors.accent.gold + '1f'` est remplacée par `colors.border.goldBg` (`rgba(193,172,92,0.10)`).
2. La ligne 264 `border: \`1px solid ${colors.accent.gold + '40'}\`` est remplacée par `border: \`1px solid ${colors.border.gold}\`` (`rgba(193,172,92,0.25)`).
3. La ligne 974 `background: isDropTarget ? colors.accent.gold + '14' : undefined` est remplacée par `background: isDropTarget ? colors.border.goldBg : undefined` (`rgba(193,172,92,0.10)`).
4. Après implémentation, `grep "colors.accent.gold + '" aureak/apps/web/app/(admin)/dashboard/page.tsx` retourne 0 occurrence.
5. Le rendu visuel du dashboard (badge "Aujourd'hui" et zone drop-target bento) est visuellement identique ou indiscernable de l'état précédent (variation d'opacité ≤ 5%).

## Tasks / Subtasks

- [x] T1 — Remplacer les 3 concaténations gold dans dashboard/page.tsx (AC: 1, 2, 3, 4)
  - [x] T1.1 — Ligne 263 : remplacer `colors.accent.gold + '1f'` par `colors.border.goldBg`
  - [x] T1.2 — Ligne 264 : remplacer `` `1px solid ${colors.accent.gold + '40'}` `` par `` `1px solid ${colors.border.gold}` ``
  - [x] T1.3 — Ligne 974 : remplacer `colors.accent.gold + '14'` par `colors.border.goldBg`
  - [x] T1.4 — Vérifier que l'import `colors` inclut déjà `border` (il vient du même destructuring `colors` de `@aureak/theme`)

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Lancer `grep "colors.accent.gold + '" aureak/apps/web/app/(admin)/dashboard/page.tsx` → résultat vide
  - [ ] T2.2 — Naviguer sur http://localhost:8081/(admin)/dashboard → vérifier badge "Aujourd'hui" doré visible
  - [ ] T2.3 — Vérifier que le drag-and-drop bento affiche bien le fond doré lors du survol drop-target

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Mapping des concaténations vers tokens

Valeurs de référence dans `aureak/packages/theme/src/tokens.ts` (lignes 112-113) :

```ts
border: {
  gold    : 'rgba(193,172,92,0.25)',  // ≈ hex '#40' = 25% opacité
  goldBg  : 'rgba(193,172,92,0.10)',  // ≈ hex '1a' = 10% opacité — couvrira '1f' (12%) et '14' (8%)
}
```

Avant / après :

```tsx
// AVANT — ligne 263
backgroundColor: colors.accent.gold + '1f',
// APRÈS
backgroundColor: colors.border.goldBg,

// AVANT — ligne 264
border: `1px solid ${colors.accent.gold + '40'}`,
// APRÈS
border: `1px solid ${colors.border.gold}`,

// AVANT — ligne 974
background: isDropTarget ? colors.accent.gold + '14' : undefined,
// APRÈS
background: isDropTarget ? colors.border.goldBg : undefined,
```

Aucun import supplémentaire nécessaire : `colors` est déjà importé depuis `@aureak/theme` dans `dashboard/page.tsx`.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Badge "Aujourd'hui" (lignes 263-264)
backgroundColor : colors.border.goldBg   // fond doré subtil
border          : `1px solid ${colors.border.gold}`  // bordure dorée

// Zone drop-target bento (ligne 974)
background      : colors.border.goldBg   // highlight drag-and-drop
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | 3 remplacements aux lignes 263, 264, 974 |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — les tokens `colors.border.goldBg` et `colors.border.gold` existent déjà
- Tout autre fichier — cette story est strictement limitée à `dashboard/page.tsx`

---

### Dépendances à protéger

- Aucune — modification purement cosmétique sur des valeurs rgba quasi-identiques
- `colors.accent.gold` reste utilisé dans `dashboard/page.tsx` pour les bordures pleines (sans `+`) — ne pas toucher ces occurrences
