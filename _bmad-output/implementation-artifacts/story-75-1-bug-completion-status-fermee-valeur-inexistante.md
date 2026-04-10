# Story 75.1 : Bug — `completionStatus` utilise 'fermée' (valeur inexistante) → évals affichent 0%

Status: done

## Story

En tant qu'admin consultant les statistiques d'évaluations dans les StatCards,
je veux que le calcul de `completionStatus` utilise les vraies valeurs de statut de séance (`'réalisée'` et `'terminée'`),
afin que le pourcentage d'évals complétées reflète les séances réellement terminées et ne soit plus bloqué à 0%.

## Acceptance Criteria

1. Dans `listSessionsWithAttendance`, la valeur `completionStatus` retourne `'complete'` lorsque `s.status === 'réalisée'` OU `s.status === 'terminée'` — les deux valeurs valides présentes en DB.
2. La valeur `'fermée'` n'apparaît plus nulle part dans le calcul de `completionStatus` — ce statut n'existe pas en base de données.
3. Les StatCards affichant le pourcentage d'évals complétées (`ÉVALS`) retournent une valeur non nulle dès qu'au moins une séance possède le statut `'réalisée'` ou `'terminée'`.
4. Les séances avec un statut autre que `'réalisée'` ou `'terminée'` (ex : `'planifiée'`, `'annulée'`) continuent de retourner `completionStatus = 'partial'` si des présences existent, ou `'not_started'` si aucune présence n'est enregistrée.
5. Le TypeScript compile sans erreur (`npx tsc --noEmit`) après le fix.
6. Aucun autre changement n'est introduit dans le fichier `attendances.ts` — périmètre limité à la ligne 94.

## Tasks / Subtasks

- [x] T1 — Corriger le filtre `completionStatus` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Dans `aureak/packages/api-client/src/sessions/attendances.ts`, ligne 94 : remplacer `s.status === 'fermée'` par `(s.status === 'réalisée' || s.status === 'terminée')`

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Naviguer sur `/activites` (tab Séances) et vérifier que la StatCard ÉVALS affiche un pourcentage > 0% si des séances réalisées/terminées existent
  - [x] T2.2 — Vérifier que `npx tsc --noEmit` ne retourne aucune erreur liée au changement

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Correction ligne 94

**Avant (bugué) :**
```typescript
const completionStatus: 'complete' | 'partial' | 'not_started' =
  total === 0           ? 'not_started' :
  s.status === 'fermée' ? 'complete'    : 'partial'
```

**Après (corrigé) :**
```typescript
const completionStatus: 'complete' | 'partial' | 'not_started' =
  total === 0                                                    ? 'not_started' :
  (s.status === 'réalisée' || s.status === 'terminée')          ? 'complete'    : 'partial'
```

Référence : `aureak/packages/api-client/src/sessions/attendances.ts:92-94` — seule ligne à modifier.

**Contexte du bug** : la valeur `'fermée'` n'existe pas dans l'enum `session_status` en base de données. Les vraies valeurs possibles sont `'planifiée'`, `'réalisée'`, `'terminée'`, `'annulée'`. Le filtre sur `'fermée'` faisait que `completionStatus` était toujours `'partial'` (jamais `'complete'`), ce qui rendait le ratio ÉVALS complétées toujours 0% dans les StatCards.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Modifier | Ligne 94 : `'fermée'` → `'réalisée' \|\| 'terminée'` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/StatCards.tsx` — non impacté, consomme `completionStatus` déjà calculé
- `aureak/apps/web/app/(admin)/activites/page.tsx` — non impacté
- `supabase/migrations/` — aucune migration nécessaire (bug purement frontend/api-client)
- `aureak/packages/types/src/` — aucun type à modifier

---

### Dépendances à protéger

- La fonction `listSessionsWithAttendance` est consommée par `activites/page.tsx` — ne pas modifier sa signature ni ses types de retour
- `completionStatus` est de type `'complete' | 'partial' | 'not_started'` — ce type doit rester inchangé

---

### Références

- Fichier bugué : `aureak/packages/api-client/src/sessions/attendances.ts` ligne 94
- Consommateur : `aureak/apps/web/app/(admin)/activites/StatCards.tsx` (prop `completionStatus`)
- Valeurs DB réelles : enum `session_status` → `'planifiée' | 'réalisée' | 'terminée' | 'annulée'`

---

### Multi-tenant

RLS gère l'isolation. Aucun paramètre `tenantId` à ajouter — la fonction existante est déjà correctement scopée.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Fix inclus dans commit `57e0472` — `fix(patrol-2026-04-08): corrections BLOCKERs design + bugs patrouille`

### Completion Notes List
- Bug détecté lors de la patrouille du 2026-04-08
- Fix appliqué directement dans le même commit que d'autres corrections design
- `completionStatus` était toujours `'partial'` car `'fermée'` ne correspond à aucune valeur réelle en DB
- Après correction : StatCards ÉVALS affichent le vrai ratio de séances complétées

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Modifié |
