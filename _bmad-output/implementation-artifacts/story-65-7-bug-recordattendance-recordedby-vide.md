# Story 65.7 : BUG — recordAttendance échoue (recordedBy vide)

Status: done

## Story

En tant qu'admin ou coach,
je veux pouvoir marquer un enfant présent ou absent depuis la fiche séance,
afin que les présences soient correctement enregistrées sans message d'erreur.

## Acceptance Criteria

1. Marquer un enfant présent dans la fiche séance ne retourne plus l'erreur "Erreur lors de la mise à jour — réessayez"
2. L'upsert dans `attendances` contient un `recorded_by` UUID valide (celui de l'utilisateur connecté)
3. Le toggle présence (present ↔ absent) fonctionne en optimistic update : l'UI se met à jour immédiatement, un rollback est déclenché si l'API retourne une erreur
4. Le comportement offline (enqueueAction) reste intact — ne pas modifier la logique offline
5. Aucun `console.error` n'est produit lors d'un marquage de présence réussi

## Tasks / Subtasks

- [x] T1 — Identifier et corriger recordedBy vide (AC: 1, 2)
  - [x] T1.1 — Dans `seances/[sessionId]/page.tsx`, ajouter l'import `useAuthStore` depuis `@aureak/business-logic` en haut du fichier (après les imports existants)
  - [x] T1.2 — Dans le composant `SessionDetailPage`, déstructurer `user` depuis `useAuthStore()` : `const { user } = useAuthStore()`
  - [x] T1.3 — Remplacer `recordedBy: ''` (ligne 1520) par `recordedBy: user?.id ?? ''`
  - [x] T1.4 — Remplacer `recordedBy: ''` (ligne 1556) par `recordedBy: user?.id ?? ''`
  - [x] T1.5 — Vérifier qu'il n'y a pas d'autres occurrences de `recordedBy: ''` dans le fichier

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Ouvrir une séance planifiée avec au moins un enfant dans le roster
  - [x] T2.2 — Cliquer sur le toggle présence d'un enfant → vérifier que l'UI se met à jour immédiatement (optimistic)
  - [x] T2.3 — Vérifier qu'aucune erreur "Erreur lors de la mise à jour" n'apparaît
  - [x] T2.4 — Vérifier en console que `[SessionDetail] recordAttendance error` n'est pas loggé
  - [x] T2.5 — Cliquer une seconde fois → vérifier le toggle inverse (present → absent)

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

### T1 — Root cause du bug

Le fichier `seances/[sessionId]/page.tsx` passe `recordedBy: ''` (chaîne vide) à `recordAttendance()`. La colonne `attendances.recorded_by` est définie comme :

```sql
recorded_by UUID NOT NULL REFERENCES profiles(user_id)
```

Une chaîne vide n'est pas un UUID valide → Postgres rejette l'INSERT/UPSERT avec une erreur de type ou de contrainte FK → Supabase retourne une erreur → le composant affiche "Erreur lors de la mise à jour".

**Fix minimal — lignes 1520 et 1556 :**

```typescript
// Avant (bug)
recordedBy: '',

// Après (fix)
recordedBy: user?.id ?? '',
```

**Import à ajouter en tête de fichier :**

```typescript
import { useAuthStore } from '@aureak/business-logic'
```

**Déstructuration dans le composant (après `useLocalSearchParams`) :**

```typescript
const { user } = useAuthStore()
```

Référence pattern : `aureak/apps/web/app/(admin)/_layout.tsx` ligne 223 — `const { role, isLoading, signOut, user } = useAuthStore()`

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier | Ajouter import useAuthStore + user.id dans recordedBy (2 occurrences) |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/sessions/attendances.ts` — la fonction `recordAttendance` est correcte, le bug est dans l'appelant
- `supabase/migrations/` — aucune migration nécessaire
- `aureak/apps/web/app/(admin)/activites/presences/` — non concerné par cette story

---

### Dépendances à protéger

- Story 61.5 utilise `enqueueAction` dans le même bloc — ne pas modifier la logique offline (bloc `if (!isOnline)`)
- Story 49-4 (toggle présence avec optimistic update) — conserver le rollback existant

---

### Références

- Bug localisé : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` lignes 1515–1534 et 1550–1573
- Fonction API : `aureak/packages/api-client/src/sessions/attendances.ts` ligne 158
- Pattern useAuthStore : `aureak/apps/web/app/(admin)/_layout.tsx` ligne 223
- Migration table attendances : `supabase/migrations/00136_create_attendances_table.sql`

---

### Multi-tenant

`tenantId: session.tenantId` est déjà correctement passé — RLS filtre sur `current_tenant_id()`. Aucun changement nécessaire.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — fix minimal, cause racine claire.

### Completion Notes List

- Import `useAuthStore` ajouté ligne 42 (après `CoachDndBoard`)
- `const { user } = useAuthStore()` ajouté ligne 1005 (dans `SessionDetailPage`, après `useLocalSearchParams`)
- `recordedBy: ''` remplacé par `recordedBy: user?.id ?? ''` aux 2 occurrences (anciennes lignes 1520 et 1556)
- Logique offline (`enqueueAction`) non modifiée — bloc `if (!isOnline)` intact
- Try/finally existants conservés — conformes aux règles absolues
- Console guards existants conservés (`process.env.NODE_ENV !== 'production'`)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifié |
