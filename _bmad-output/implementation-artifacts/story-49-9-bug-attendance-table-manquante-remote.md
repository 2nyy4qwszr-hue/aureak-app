# Story 49.9 : BUG P0 — Table `attendances` absente en remote — dashboard et score académie cassés

Status: done

Epic: 49 — Bugfix batch avril 2026 #2

## Contexte

La table `attendances` est définie dans l'archive migrations (`aureak/supabase/_archive/migrations/00016_attendances.sql`) mais **n'a jamais été créée dans `supabase/migrations/` (racine)**, qui est le seul dossier actif selon la règle d'architecture.

En conséquence, la table `attendances` n'existe pas en remote Supabase. Toute requête vers cette table retourne une erreur PostgREST PGRST205 ("relation does not exist").

### Fonctions impactées (toutes les appeler renvoient PGRST205)

| Fichier | Fonction | Table |
|---------|----------|-------|
| `aureak/packages/api-client/src/admin/dashboard.ts` | `getTopStreakPlayers()` | `attendances` |
| `aureak/packages/api-client/src/admin/dashboard.ts` | `fetchActivityFeed()` | `attendances` |
| `aureak/packages/api-client/src/admin/dashboard.ts` | `getNavBadgeCounts()` | `attendances` |
| `aureak/packages/api-client/src/gamification/academy-score.ts` | `getAcademyScore()` | `attendances` |
| `aureak/packages/api-client/src/realtime/liveSessionCounts.ts` | `useLiveSessionCounts()` | `attendances` |
| `aureak/packages/api-client/src/sessions/attendances.ts` | Tout le fichier | `attendances` |
| `aureak/packages/api-client/src/sessions/presences.ts` | `listPresencesForSession()` | `attendances` |
| `aureak/packages/api-client/src/sessions/dashboard.ts` | `getSessionDashboard()` | `attendances` |
| `aureak/packages/api-client/src/sessions/coach-attendance.ts` | Plusieurs fonctions | `attendances` |
| `aureak/packages/api-client/src/analytics.ts` | Toutes les analytics | `attendances` |

### Structure de la table (source archive)

La table `attendances` doit avoir les colonnes suivantes (extraites de `00016_attendances.sql`) :
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `session_id UUID NOT NULL REFERENCES sessions(id)`
- `child_id UUID NOT NULL REFERENCES profiles(user_id)`
- `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- `status attendance_status NOT NULL`
- `recorded_by UUID NOT NULL REFERENCES profiles(user_id)`
- `recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `synced_at TIMESTAMPTZ`
- `UNIQUE (session_id, child_id)`

Des colonnes supplémentaires ont été ajoutées par des migrations ultérieures (vérifier `00103_badges_session_photos.sql`).

## Story

En tant qu'admin,
je veux que le dashboard et toutes les fonctionnalités de présences fonctionnent sans erreur PGRST205,
afin que les KPIs, la streak des joueurs, le score académie et les compteurs en direct soient opérationnels.

## Acceptance Criteria

1. **AC1 — Migration créée** : La migration `00136_create_attendances_table.sql` est créée dans `supabase/migrations/` et crée la table `attendances` avec toutes ses colonnes, index, trigger et politiques RLS.

2. **AC2 — Colonnes additionnelles incluses** : La migration inclut les colonnes ajoutées par les migrations ultérieures qui font `ALTER TABLE attendances` (notamment `attendance_type` ajouté par `00102_attendance_corrections_presence.sql`) via `ADD COLUMN IF NOT EXISTS`.

3. **AC3 — RLS complet** : Les politiques Row Level Security sont créées pour les rôles `admin`, `coach` et `child` (read/write appropriés selon le rôle). La table utilise `tenant_id` comme colonne d'isolation. Les coaches ne peuvent voir que les présences des séances de leur tenant.

4. **AC4 — Trigger préservé** : Le trigger `trg_attendance_start` (UPDATE sessions SET status = 'en_cours') est recréé dans la migration.

5. **AC5 — Dashboard opérationnel** : Après application de la migration, naviguer vers `/dashboard` ne produit aucune erreur console de type PGRST205 sur `attendances`. Les tiles `getTopStreakPlayers`, `fetchActivityFeed`, `getNavBadgeCounts`, `useLiveSessionCounts` retournent des données (ou un tableau vide si pas encore de présences) sans erreur.

6. **AC6 — Score académie opérationnel** : `getAcademyScore()` retourne un score valide (ou 0 si aucune donnée) sans erreur PGRST205.

7. **AC7 — Aucune modification dans `apps/`** : Cette story ne modifie aucun fichier dans `aureak/apps/`. La correction est purement au niveau de la migration Supabase.

## Tâches

### 1. Investigation préalable

- [x] 1.1 Vérifier via `grep -rn "ALTER TABLE attendances" supabase/migrations/` quelles colonnes additionnelles ont été ajoutées après la création initiale (archive)
- [x] 1.2 Lire `supabase/migrations/00103_badges_session_photos.sql` pour identifier les colonnes `ALTER TABLE attendances`
- [x] 1.3 Lire `supabase/migrations/00102_attendance_corrections_presence.sql` pour identifier la colonne `attendance_type`
- [x] 1.4 Lire `supabase/migrations/00090_rls_policies_complete.sql` pour vérifier si les policies `attendances` y sont définies (si oui, les inclure dans la migration principale sans doublon — utiliser `CREATE POLICY IF NOT EXISTS`)

### 2. Migration Supabase

- [x] 2.1 Créer `supabase/migrations/00136_create_attendances_table.sql`
- [x] 2.2 Inclure `CREATE TABLE IF NOT EXISTS attendances (...)` avec toutes les colonnes de base
- [x] 2.3 Inclure `ADD COLUMN IF NOT EXISTS attendance_type TEXT NOT NULL DEFAULT 'member' CHECK (attendance_type IN ('member', 'trial'))` (Migration 00102)
- [x] 2.4 Inclure les colonnes additionnelles identifiées en 1.2 (badges, etc.)
- [x] 2.5 Créer les index : `attendances_session_idx ON attendances (session_id, tenant_id)`, `attendances_child_idx ON attendances (child_id)`
- [x] 2.6 Créer le trigger `trg_attendance_start_session` + `trg_attendance_start`
- [x] 2.7 Activer RLS : `ALTER TABLE attendances ENABLE ROW LEVEL SECURITY`
- [x] 2.8 Créer les policies RLS :
  - `admin` : accès complet en lecture/écriture sur son tenant
  - `coach` : lecture des attendances de ses séances, écriture si coach de la séance
  - `child` : lecture de ses propres attendances *(ajouté en code review — policy `att_child_read`)*
  - `parent` : lecture des attendances de ses enfants

### 3. Tables dépendantes (si absentes)

- [x] 3.1 Vérifier si `session_attendees` existe dans `supabase/migrations/` (hors archive). Si absent, créer `supabase/migrations/00136_create_attendances_table.sql` avec `session_attendees` + `attendances` + `coach_presence_confirmations` + `block_checkins`
- [x] 3.2 Vérifier si `coach_presence_confirmations` et `block_checkins` existent. Si absent, inclure dans la même migration.

### 4. QA post-migration

- [x] 4.1 QA scan sur la migration : vérifier que `CREATE TABLE IF NOT EXISTS` est utilisé (idempotent)
- [x] 4.2 Vérifier que `ALTER TABLE` avec `ADD COLUMN IF NOT EXISTS` ne causera pas de conflit si les colonnes existent déjà ailleurs
- [x] 4.3 Grep `console.` dans les fichiers modifiés : aucun console non-guardé

## Dépendances

**Aucune dépendance de story** — bug pur infrastructure, la table doit exister avant toute autre feature de présences.

**Vérifie avant de coder :**
- Lire `supabase/migrations/00102_attendance_corrections_presence.sql` (colonne attendance_type)
- Lire `supabase/migrations/00103_badges_session_photos.sql` (colonnes photos/badges sur attendances)
- Grep `ALTER TABLE attendances` dans tout `supabase/migrations/` pour ne rater aucune colonne

## Notes techniques

### Ordre de création dans la migration

La migration doit créer dans cet ordre :
1. `session_attendees` (référencée par `attendances` via FK — non, `attendances` n'a pas de FK vers `session_attendees`, ordre libre)
2. `attendances`
3. `coach_presence_confirmations`
4. `block_checkins`
5. Les triggers
6. Les RLS policies

### Colonnes connues à inclure (consolidées depuis l'archive + migrations ultérieures)

```sql
CREATE TABLE IF NOT EXISTS attendances (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES sessions(id),
  child_id      UUID        NOT NULL REFERENCES profiles(user_id),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  status        attendance_status NOT NULL,
  recorded_by   UUID        NOT NULL REFERENCES profiles(user_id),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at     TIMESTAMPTZ,
  -- Ajouté par 00102
  attendance_type TEXT NOT NULL DEFAULT 'member'
    CHECK (attendance_type IN ('member', 'trial')),
  UNIQUE (session_id, child_id)
);
```

### Ne pas oublier

- `prefill_session_attendees` RPC : déjà dans `00090_rls_policies_complete.sql` ou ailleurs → à vérifier avant de recréer
- Le trigger `trg_attendance_start_session` : update sessions.status de 'planifiée' → 'en_cours' à la première attendance INSERT

### Numéro de migration

Prochaine migration disponible : **`00136`** (dernière en place : `00135_stages_add_event_type.sql`)

## Fichiers à créer/modifier

| Fichier | Action | Raison |
|---------|--------|--------|
| `supabase/migrations/00136_create_attendances_table.sql` | CRÉER | Table manquante en remote |

**Aucun fichier TypeScript ni page React ne doit être modifié** — le code API utilise déjà `attendances` correctement.

## Commit

```
fix(epic-49): story 49.9 — migration attendances table manquante en remote (PGRST205)
```
