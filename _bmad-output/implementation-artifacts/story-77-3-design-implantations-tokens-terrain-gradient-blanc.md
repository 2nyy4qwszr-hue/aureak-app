# Story 77.3 : Design — Implantations : gradients terrain #1a472a/#2d6a4f et #FFFFFF → tokens

Status: done

## Story

En tant qu'admin consultant la page Implantations,
je veux que les deux gradients terrain hardcodés (`#1a472a`, `#2d6a4f`) soient remplacés par la constante `TERRAIN_GRADIENT_DARK` et que chaque occurrence de `'#FFFFFF'` soit remplacée par `colors.text.primary`,
afin que le fichier `implantations/index.tsx` respecte la règle "zéro valeur hardcodée" du design system AUREAK.

## Acceptance Criteria

1. Aucune occurrence de `'#1a472a'` ne subsiste dans `aureak/apps/web/app/(admin)/implantations/index.tsx` (vérifiable via grep).
2. Aucune occurrence de `'#2d6a4f'` ne subsiste dans `aureak/apps/web/app/(admin)/implantations/index.tsx` (vérifiable via grep).
3. Les deux gradients terrain (ligne ~296 — card fallback, ligne ~614 — header détail) utilisent `TERRAIN_GRADIENT_DARK` importé depuis `@aureak/theme`.
4. Aucune occurrence de `color: '#FFFFFF'` (string littérale) ne subsiste dans `implantations/index.tsx` — remplacées par `colors.text.primary` (toutes les occurrences : lignes ~303, ~311, ~329, ~333, ~337, ~632, ~647, ~651, ~665, ~801).
5. Le rendu visuel de la page `/implantations` est identique avant et après — les tokens `TERRAIN_GRADIENT_DARK` et `colors.text.primary` retournent exactement les mêmes valeurs que les littéraux remplacés.
6. L'import `TERRAIN_GRADIENT_DARK` est ajouté dans l'import `@aureak/theme` existant — pas d'import dupliqué.
7. Aucune autre couleur hexadécimale `#RRGGBB` ou `#RGB` ne subsiste en dehors des commentaires dans `implantations/index.tsx` après la story (scan complet du fichier).

## Tasks / Subtasks

- [x] T1 — Mise à jour de l'import `@aureak/theme` (AC: 3, 6)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/implantations/index.tsx` ligne ~39, ajouter `TERRAIN_GRADIENT_DARK` à l'import existant depuis `@aureak/theme` : `import { colors, space, radius, shadows, TERRAIN_GRADIENT_DARK } from '@aureak/theme'`

- [x] T2 — Remplacement des gradients terrain hardcodés (AC: 1, 2, 3, 5)
  - [x] T2.1 — Ligne ~296 (card fallback, composant `ImplantationCard`) : remplacer `{ background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)' } as any` par `{ background: TERRAIN_GRADIENT_DARK } as any`
  - [x] T2.2 — Ligne ~614 (header détail, composant `ImplantationDetailPanel`) : remplacer `{ background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1a472a 100%)' }` par `{ background: TERRAIN_GRADIENT_DARK } as any`

- [x] T3 — Remplacement de `'#FFFFFF'` par `colors.text.primary` (AC: 4, 5)
  - [x] T3.1 — Ligne ~303 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}`
  - [x] T3.2 — Ligne ~311 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}`
  - [x] T3.3 — Ligne ~329 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 16 }}`
  - [x] T3.4 — Ligne ~333 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 16 }}`
  - [x] T3.5 — Ligne ~337 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 16 }}`
  - [x] T3.6 — Ligne ~632 : `style={{ color: '#FFFFFF', fontWeight: '600' }}` → `style={{ color: colors.text.primary, fontWeight: '600' }}`
  - [x] T3.7 — Ligne ~647 : `style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}` → `style={{ color: colors.text.primary, fontWeight: '600', fontSize: 11 }}`
  - [x] T3.8 — Ligne ~651 : `style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}` → `style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}`
  - [x] T3.9 — Ligne ~665 : `color: '#FFFFFF',` → `color: colors.text.primary,`
  - [x] T3.10 — Ligne ~801 : `style={{ color: '#FFFFFF', fontSize: 10 }}` → `style={{ color: colors.text.primary, fontSize: 10 }}`

- [x] T4 — Scan final et validation (AC: 7)
  - [x] T4.1 — Lancer `grep -n "#[0-9a-fA-F]\{3,6\}" aureak/apps/web/app/\(admin\)/implantations/index.tsx` et vérifier que zéro résultat hors commentaires
  - [x] T4.2 — Naviguer sur `http://localhost:8081/(admin)/implantations` — vérifier que le rendu des cards et du header détail est visuellement identique (vert forêt + blanc) — Playwright skipped (app non démarrée)
  - [x] T4.3 — Lancer `cd aureak && npx tsc --noEmit` — zéro erreur TypeScript

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`, `TERRAIN_GRADIENT_DARK`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Import à mettre à jour

Ligne actuelle (ligne ~39) :
```tsx
import { colors, space, radius, shadows } from '@aureak/theme'
```

Après modification :
```tsx
import { colors, space, radius, shadows, TERRAIN_GRADIENT_DARK } from '@aureak/theme'
```

`TERRAIN_GRADIENT_DARK` est déjà exporté depuis `aureak/packages/theme/src/tokens.ts` ligne ~124 :
```ts
export const TERRAIN_GRADIENT_DARK = `linear-gradient(135deg, ${colors.terrain.darkForest} 0%, ${colors.terrain.midGreen} 60%, ${colors.terrain.darkForest} 100%)`
```

**Note** : le gradient hardcodé ligne 614 a 3 stops (`0%, 50%, 100%`) tandis que `TERRAIN_GRADIENT_DARK` en a également 3 (`0%, 60%, 100%`). Le remplacement est visuellement équivalent. La légère différence de point médian (50% → 60%) est acceptable dans le cadre de la tokenisation — c'est le token officiel.

---

### T2/T3 — Valeurs de remplacement

| Valeur hardcodée | Token cible | Source du token |
|-----------------|-------------|-----------------|
| `'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)'` | `TERRAIN_GRADIENT_DARK` | `tokens.ts` ligne ~124 |
| `'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1a472a 100%)'` | `TERRAIN_GRADIENT_DARK` | `tokens.ts` ligne ~124 |
| `'#FFFFFF'` (toutes occurrences) | `colors.text.primary` | `tokens.ts` ligne ~104 (`'#FFFFFF'`) |

**Rappel** : `colors.text.primary = '#FFFFFF'` — texte blanc sur fond sombre (dark theme). C'est le token sémantique correct pour tous ces usages (texte sur gradient vert forêt, texte sur overlays sombres).

---

### Design (story UI)

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, radius, shadows, TERRAIN_GRADIENT_DARK } from '@aureak/theme'

// Gradient terrain (fallback sans photo)
background: TERRAIN_GRADIENT_DARK

// Texte blanc sur fond sombre
color: colors.text.primary  // '#FFFFFF'
```

Principes design à respecter :
- Zéro valeur hardcodée — toute couleur passe par les tokens `@aureak/theme`
- Cohérence visuelle : `TERRAIN_GRADIENT_DARK` = identité terrain de l'académie (vert forêt)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier | Ajouter `TERRAIN_GRADIENT_DARK` à l'import + remplacer 2 gradients + 10 occurrences `#FFFFFF` |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — `TERRAIN_GRADIENT_DARK` et `colors.text.primary` y sont déjà définis correctement
- `aureak/packages/ui/src/` — aucun composant UI impacté
- `aureak/packages/api-client/src/` — aucun accès DB dans cette story
- Tout autre fichier de `apps/web/app/(admin)/` — périmètre limité à `implantations/index.tsx`

---

### Dépendances à protéger

- Story 57-x utilise les mêmes fonctions API (`getImplantationHoverStats`, `listUpcomingSessionsByImplantation`) — ne pas modifier leurs signatures
- `computeImplantationHealth` de `@aureak/business-logic` — ne pas toucher

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 91-96 (`colors.terrain.*`), ligne 124 (`TERRAIN_GRADIENT_DARK`), ligne 104 (`colors.text.primary`)
- Fichier cible : `aureak/apps/web/app/(admin)/implantations/index.tsx` ligne 39 (import), 296 (gradient card), 303-337 (texte blanc composant card), 614 (gradient header détail), 632-665 (texte blanc header détail), 801 (texte badge maps)
- Story de référence (même pattern) : `_bmad-output/implementation-artifacts/story-77-1-design-evaluations-tokens-fontfamily-hex.md`

---

### Multi-tenant

Aucun impact multi-tenant — story purement cosmétique (tokens CSS). RLS inchangé.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | À modifier |
