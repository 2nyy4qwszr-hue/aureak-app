# Story 86-1 — Migration DB : ajout des rôles `manager` et `marketeur` dans l'enum `user_role`

## Metadata

- **Epic** : 86 — Architecture Rôles & Permissions
- **Story** : 86-1
- **Status** : ready-for-dev
- **Priority** : P0 — Fondation (bloque Epics 87, 88, 90, 91, 92)
- **Type** : Infra / DB
- **Estimated effort** : S (1–2h)
- **Dependencies** : aucune

---

## User Story

**En tant qu'** admin de la plateforme,
**je veux** que les rôles `manager` et `marketeur` existent dans l'enum PostgreSQL `user_role` et dans les types TypeScript,
**afin que** les stories Académie, Prospection, Marketing et Partenariat à venir puissent assigner ces rôles à des profils sans modifier le schéma à chaque fois.

---

## Contexte

### État actuel (vérifié)

- Migration `00002_create_enums.sql` : enum initial `user_role = admin | coach | parent | child`
- Migration `00055_add_club_to_user_role_enum.sql` : `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'club'`
- Migration `00147_create_commercial_contacts.sql` ligne 17 : `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'commercial'`
- Fichier TS `aureak/packages/types/src/enums.ts` ligne 7 : `UserRole = 'admin' | 'coach' | 'parent' | 'child' | 'club' | 'commercial'`

Il manque donc **uniquement** `manager` et `marketeur` (2 valeurs), et non 3 comme initialement supposé. Le rôle `commercial` est déjà présent côté DB et TS.

### Fonctions SQL dépendantes

`current_user_role()` est appelée dans ~20 policies RLS (ex : `00010_child_club_history.sql`, `00092_support_tickets.sql`, `00093_lifecycle.sql`, `00094_consents.sql`). Cette fonction retourne la valeur textuelle du rôle actif depuis `profiles.role` — l'ajout de nouvelles valeurs d'enum n'impacte pas sa signature et **aucune policy existante n'a besoin d'être modifiée** (elles filtrent sur des valeurs explicites comme `'admin'`, `'coach'`, etc., pas avec un `NOT IN`). Scope strictement sur l'enum + les types.

### Pourquoi cette story est P0

Les stories 86-2 (table `profile_roles`), 87 (fiches Académie Commerciaux/Manager/Marketeur), 88/90/91/92 (modules Prospection/Marketing/Partenariat) dépendent de l'existence de ces rôles en DB pour les FK et les policies RLS. Sans cette migration, toute tentative d'`INSERT INTO profiles (role) VALUES ('manager')` échoue avec `invalid input value for enum user_role`.

---

## Acceptance Criteria

1. **AC1** — La migration `00148_add_roles_manager_marketeur.sql` exécute `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager'` puis `ADD VALUE IF NOT EXISTS 'marketeur'`.
2. **AC2** — Après `supabase db push`, la requête `SELECT unnest(enum_range(NULL::user_role))` retourne les 7 valeurs : `admin, coach, parent, child, club, commercial, manager, marketeur`.
3. **AC3** — Le type TS `UserRole` dans `aureak/packages/types/src/enums.ts` liste les mêmes 7 valeurs, dans le même ordre.
4. **AC4** — La migration est **idempotente** : la rejouer ne produit pas d'erreur (grâce à `IF NOT EXISTS`).
5. **AC5** — `npx tsc --noEmit` depuis `aureak/` passe sans erreur.
6. **AC6** — Le test unitaire `aureak/packages/types/src/enums.test.ts` (constante `USER_ROLE_VALUES`) est mis à jour pour inclure les 7 valeurs, et passe.
7. **AC7** — Aucune policy RLS existante n'est modifiée dans cette story. Les tables `profile_roles`, `section_permissions`, `user_section_overrides` appartiennent aux stories 86-2 et 86-3.

---

## Tasks / Subtasks

- [ ] **T1 — Migration SQL** (AC1, AC2, AC4)
  - [ ] T1.1 — Créer `supabase/migrations/00148_add_roles_manager_marketeur.sql` avec les deux `ALTER TYPE`
  - [ ] T1.2 — Commentaire SQL en tête expliquant le contexte Epic 86

- [ ] **T2 — Types TypeScript** (AC3, AC5)
  - [ ] T2.1 — Modifier `aureak/packages/types/src/enums.ts` ligne 7 : ajouter `| 'manager' | 'marketeur'` à `UserRole`
  - [ ] T2.2 — Mettre à jour le commentaire JSDoc au-dessus (Story 86-1)

- [ ] **T3 — Tests unitaires** (AC6)
  - [ ] T3.1 — Modifier `aureak/packages/types/src/enums.test.ts` : ajouter `'manager'`, `'marketeur'` à `USER_ROLE_VALUES`
  - [ ] T3.2 — Mettre à jour le libellé `'UserRole couvre les 4 rôles MVP'` → `'UserRole couvre les 7 rôles'`

- [ ] **T4 — Validation** (AC tous)
  - [ ] T4.1 — `supabase db reset` local → vérifier que l'enum contient 7 valeurs via `psql -c "SELECT unnest(enum_range(NULL::user_role))"`
  - [ ] T4.2 — `cd aureak && npx tsc --noEmit` → zéro erreur
  - [ ] T4.3 — `cd aureak && npx vitest run packages/types/src/enums.test.ts` → tests verts

---

## Dev Notes

### ⚠️ Contraintes Stack

- **Migration idempotente** : toujours `IF NOT EXISTS` sur `ADD VALUE`
- **Miroir DB ↔ TS obligatoire** (ARCH-12) : tout enum PostgreSQL a son miroir dans `@aureak/types/enums.ts`, dans le **même ordre**
- **Pas de refactor RLS dans cette story** — strictement scope sur l'enum et les types

---

### T1 — Migration

**Fichier : `supabase/migrations/00148_add_roles_manager_marketeur.sql`**

```sql
-- Story 86-1 — Epic 86 Architecture Rôles & Permissions
-- Ajoute les rôles `manager` et `marketeur` à l'enum user_role.
-- Le rôle `commercial` a été ajouté en 00147, `club` en 00055.
-- Scope : enum uniquement. Aucune policy RLS modifiée.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketeur';
```

Contrainte Postgres : chaque `ALTER TYPE ... ADD VALUE` doit être hors d'un bloc transactionnel implicite sur certaines versions ; si le harness Supabase bronche, séparer en deux fichiers (`00148a`, `00148b`). En pratique, la combinaison `ADD VALUE IF NOT EXISTS` + `supabase db push` passe sans souci (cf. migration 00055 qui fait la même chose).

---

### T2 — Types TS

**Fichier : `aureak/packages/types/src/enums.ts` (modifier ligne 7)**

```typescript
/** Rôles utilisateur — miroir de l'enum PostgreSQL `user_role`.
 *  Historique : 00002 (admin/coach/parent/child) → 00055 (+club) → 00147 (+commercial) → 00148 (+manager, +marketeur, Story 86-1)
 */
export type UserRole =
  | 'admin'
  | 'coach'
  | 'parent'
  | 'child'
  | 'club'
  | 'commercial'
  | 'manager'
  | 'marketeur'
```

---

### T3 — Test unitaire

**Fichier : `aureak/packages/types/src/enums.test.ts`**

Remplacer la constante et le libellé existants :

```typescript
const USER_ROLE_VALUES: UserRole[] = [
  'admin',
  'coach',
  'parent',
  'child',
  'club',
  'commercial',
  'manager',
  'marketeur',
]

it('UserRole couvre les 7 rôles', () => {
  expect(USER_ROLE_VALUES).toHaveLength(8) // 7 personnes + 1 club
})
```

Note : 8 entrées au total (`club` compte comme un "rôle organisationnel" à part entière) — aligner le test sur la longueur réelle du tableau.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00148_add_roles_manager_marketeur.sql` | Créer | 2 ALTER TYPE idempotents |
| `aureak/packages/types/src/enums.ts` | Modifier ligne 7 | Ajouter `manager`, `marketeur` à `UserRole` |
| `aureak/packages/types/src/enums.test.ts` | Modifier | Aligner `USER_ROLE_VALUES` + libellé |

---

### Fichiers à NE PAS modifier

- `supabase/migrations/00002_create_enums.sql` — migration d'origine, jamais réécrire
- `supabase/migrations/00055_add_club_to_user_role_enum.sql` — historique
- `supabase/migrations/00147_create_commercial_contacts.sql` — fait partie d'Epic 85, rôle commercial déjà présent
- Toute policy RLS existante qui référence `current_user_role()` — hors scope
- `aureak/packages/api-client/src/**` — aucune API à créer dans cette story
- `aureak/apps/web/**` — aucune UI dans cette story

---

### Dépendances à protéger

- La fonction SQL `current_user_role()` (définie dans `00002` + variantes ultérieures) continue de retourner `profiles.role::text`. Aucune signature modifiée.
- Les policies existantes `WHERE current_user_role() = 'admin'` continuent de fonctionner à l'identique.

---

### Références

- Enum source : `supabase/migrations/00002_create_enums.sql`
- Extension `club` : `supabase/migrations/00055_add_club_to_user_role_enum.sql`
- Extension `commercial` : `supabase/migrations/00147_create_commercial_contacts.sql` lignes 16-17
- Miroir TS : `aureak/packages/types/src/enums.ts` lignes 6-7
- Story référence (même pattern) : `_bmad-output/implementation-artifacts/story-85-1-migration-types-api.md`

---

### Multi-tenant

Aucun impact tenant. L'enum est global (PostgreSQL types ne sont pas multi-tenant).

---

## Commit

```
feat(epic-86): story 86-1 — ajout rôles manager et marketeur dans user_role
```

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
