# Story 78.1 : Bug — evalMap lookup par scheduled_at au lieu de session_id

Status: done

## Story

En tant que parent,
je veux voir les évaluations (réceptivité, effort, attitude) correctement affichées pour chaque séance dans la fiche de mon enfant,
afin de savoir comment il a été évalué lors de chaque entraînement sans avoir à naviguer ailleurs.

## Acceptance Criteria

1. Dans la fiche enfant (`/parent/children/[childId]`), chaque ligne de présence qui possède une évaluation correspondante affiche bien les 3 indicateurs colorés (réceptivité, effort, attitude) sans exception.
2. Une séance dont le `session_id` de l'évaluation correspond à l'`id` de la session liée à la présence affiche les indicateurs — indépendamment de la valeur `scheduled_at`.
3. Une séance pour laquelle aucune évaluation n'existe n'affiche aucun indicateur (comportement inchangé, pas de régression).
4. Après correction, zéro erreur console JS liée au composant `ChildFichePage` sur la route `/parent/children/[childId]`.
5. Le code utilise les tokens `@aureak/theme` (aucune couleur hex hardcodée ajoutée).

## Tasks / Subtasks

- [x] T1 — Corriger la clé de lookup `evalMap` dans la fiche enfant parent (AC: 1, 2, 3)
  - [x] T1.1 — Dans `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx`, ligne 290, remplacer `att.sessions?.scheduled_at ?? ''` par `att.sessions?.id ?? ''` dans l'appel `evalMap.get(...)`
  - [x] T1.2 — Vérifier que le type `AttendanceRow` (lignes 10-14) inclut bien `id` dans le select jointé `sessions (id, scheduled_at, ...)` — c'est déjà le cas dans `childProfile.ts` (la query sélectionne `id, scheduled_at`), mais confirmer que `AttendanceRow.sessions` expose bien `id`

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Vérifier qu'une présence avec évaluation existante affiche les 3 cercles colorés dans `/parent/children/[childId]`
  - [x] T2.2 — Vérifier qu'une présence sans évaluation n'affiche rien (pas de crash, pas d'indicateurs vides)
  - [x] T2.3 — Vérifier zéro erreur console JS sur la route

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

### T1 — Correction de la clé evalMap

**Fichier cible** : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx`

**Cause du bug** :

Ligne 186, `evalMap` est correctement indexé par `session_id` (UUID) :
```tsx
const evalMap = new Map(evaluations.map(e => [e.session_id, e]))
```

Mais ligne 290, la lookup utilise `att.sessions?.scheduled_at` (string date ISO) au lieu de `att.sessions?.id` (UUID) :
```tsx
// AVANT (bugué)
const ev = evalMap.get(att.sessions?.scheduled_at ?? '')

// APRÈS (corrigé)
const ev = evalMap.get(att.sessions?.id ?? '')
```

**Vérification du type** :

Le type local `AttendanceRow` (ligne 10-14) doit exposer `sessions.id` :
```tsx
// Déjà défini ainsi — vérifier et corriger si nécessaire
type AttendanceRow = {
  id       : string
  status   : string
  sessions?: { id: string; scheduled_at: string; groups?: { name: string } | null } | null
}
```

La query API dans `aureak/packages/api-client/src/parent/childProfile.ts` sélectionne déjà `id` :
```ts
sessions (
  id, scheduled_at,
  groups(name),
  ...
)
```
Donc `att.sessions?.id` est disponible à runtime — seul le type local `AttendanceRow` peut manquer le champ `id`.

**Fix complet (2 modifications dans un seul fichier)** :

1. Ajouter `id: string` dans le type `AttendanceRow.sessions` si absent
2. Remplacer `att.sessions?.scheduled_at ?? ''` par `att.sessions?.id ?? ''` ligne 290

---

### Design

**Type design** : `polish`

Aucune modification UI — correction de logique pure. Les tokens et styles ne sont pas touchés.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` | Modifier | Ligne 12 : ajouter `id: string` dans `AttendanceRow.sessions` si absent. Ligne 290 : remplacer `scheduled_at` par `id` dans `evalMap.get()` |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/parent/childProfile.ts` — la query Supabase est correcte, elle sélectionne déjà `id` dans `sessions`
- `aureak/packages/types/src/entities.ts` — aucun nouveau type nécessaire
- Aucune migration SQL — bug purement frontend

---

### Dépendances à protéger

- `getChildProfile` dans `@aureak/api-client/src/parent/childProfile.ts` — ne pas modifier la signature ni la query
- Le type `EvalRow.session_id` doit rester inchangé (clé de la Map)

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier bugué : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` lignes 10-14 (type), 186 (Map), 290 (lookup)
- API source : `aureak/packages/api-client/src/parent/childProfile.ts` lignes 13-22 (select sessions)

---

### Multi-tenant

RLS gère l'isolation. `getChildProfile` filtre déjà par `child_id` transmis depuis le routing. Aucun paramètre tenantId à ajouter.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` | À modifier |
