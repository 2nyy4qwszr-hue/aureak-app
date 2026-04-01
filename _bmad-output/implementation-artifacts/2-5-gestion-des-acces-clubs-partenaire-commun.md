# Story 2.5 : Gestion des Accès Clubs (Partenaire & Commun)

Status: done

## Story

En tant qu'Admin,
Je veux que les clubs soient des utilisateurs auth à part entière liés à une table `clubs`, avec accès aux données de leurs enfants filtrés par RLS,
Afin que le modèle de données soit cohérent et que `auth.uid()` suffise pour identifier un club dans toutes les policies.

## Acceptance Criteria

**AC1 — Tables `clubs` et `club_child_links` créées**
- **Given** les migrations Epic 1 et Epic 2 appliquées
- **When** la migration Story 2.5 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE clubs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    club_access_level club_access_level NOT NULL DEFAULT 'common',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE club_child_links (
    club_id UUID NOT NULL REFERENCES clubs(user_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (club_id, child_id)
  );
  ```

**AC2 — Enum `user_role` étendu avec `'club'`**
- **And** le type enum PostgreSQL `user_role` est étendu : `ALTER TYPE user_role ADD VALUE 'club'`
- **And** les comptes clubs ont `profiles.user_role = 'club'` (valeur unique — la distinction partner/common vient de `clubs.club_access_level`)

**AC3 — RLS : accès filtré via `auth.uid()`**
- **And** les policies RLS filtrent les données via `auth.uid()` correspondant à `club_id` dans `club_child_links` :
  ```sql
  EXISTS (
    SELECT 1 FROM club_child_links
    WHERE club_id = auth.uid()
    AND child_id = attendances.child_id
  )
  ```
- **And** un club `partner` peut lire : présences, blessures, rapports mi-saison et fin de saison des enfants liés
- **And** un club `common` peut lire uniquement : présences, blessures, rapports périodiques
- **And** aucun club ne peut lire `evaluations`, `quiz_results`, `evaluation_comments`

**AC4 — Changement d'accès effectif immédiatement**
- **And** `clubs.club_access_level` est lu directement par les policies — tout changement par l'Admin est effectif immédiatement sans reissue de token

**AC5 — Audit trail des lectures club**
- **And** toute lecture par un club est journalisée dans `audit_logs` avec `entity_type = 'club_access'`, `action = 'club_data_read'`, `metadata = { club_id, child_id, resource_type }`

**AC6 — Migration propre**
- **And** `supabase db diff` reste clean après application des migrations

## Tasks / Subtasks

- [ ] Task 1 — Migration : enum + tables `clubs` et `club_child_links` (AC: #1, #2)
  - [ ] 1.1 Créer `supabase/migrations/00004_clubs.sql` avec :
    - `ALTER TYPE user_role ADD VALUE 'club'` (avant la création des tables)
    - Création de la table `clubs`
    - Création de la table `club_child_links`
    - Index sur `club_child_links(child_id)` pour les lookups RLS
  - [ ] 1.2 Activer RLS sur `clubs` et `club_child_links`
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #3, #4)
  - [ ] 2.1 Ajouter la section Story 2.5 dans `supabase/migrations/00010_rls_policies.sql`
  - [ ] 2.2 Policy `clubs` : admin peut tout gérer, club voit uniquement son propre enregistrement
  - [ ] 2.3 Policy `club_child_links` : admin peut tout gérer, club voit uniquement ses propres liens
  - [ ] 2.4 Documenter le pattern RLS club dans `supabase/RLS_PATTERNS.md` (section 2.5) — à intégrer dans les tables `attendances` (Story 5.1) et rapports (Stories futures)

- [ ] Task 3 — Types TypeScript (AC: #2)
  - [ ] 3.1 Mettre à jour `packages/types/src/entities.ts` : ajouter type `Club` et `ClubChildLink`
  - [ ] 3.2 Mettre à jour le type `UserRole` dans `packages/types/src/entities.ts` pour inclure `'club'`
  - [ ] 3.3 Ajouter le type `ClubAccessLevel` : `'partner' | 'common'`

- [ ] Task 4 — `@aureak/api-client` : CRUD clubs (AC: #5)
  - [ ] 4.1 Créer `packages/api-client/src/clubs.ts` avec :
    - `createClub({ name, accessLevel, tenantId })` → invite l'utilisateur via `supabase.auth.admin.inviteUserByEmail()` avec `user_role = 'club'` dans metadata, puis INSERT dans `clubs`
    - `linkChildToClub({ clubId, childId })` → INSERT dans `club_child_links` + audit log
    - `unlinkChildFromClub({ clubId, childId })` → DELETE (pas de soft-delete car `club_child_links` est une table de liaison)
    - `listClubs()` → SELECT avec filtre `deleted_at IS NULL`
    - `updateClubAccessLevel({ clubId, accessLevel })` → UPDATE `clubs.club_access_level` + audit log
  - [ ] 4.2 Exporter depuis `packages/api-client/src/index.ts`

- [ ] Task 5 — UI Admin (web) (AC: #1, #4)
  - [ ] 5.1 Créer `apps/web/app/(admin)/clubs/page.tsx` — liste des clubs actifs avec nom, niveau d'accès, nombre d'enfants liés
  - [ ] 5.2 Créer `apps/web/app/(admin)/clubs/new.tsx` — formulaire : nom du club, niveau d'accès (partner/common), email du compte
  - [ ] 5.3 Créer `apps/web/app/(admin)/clubs/[clubId]/page.tsx` — détail club : liste des enfants liés + sélecteur enfant pour ajouter/retirer des liens
  - [ ] 5.4 Valider avec React Hook Form + Zod : email valide, `accessLevel` obligatoire

- [ ] Task 6 — Test d'intégration (AC: #3, #4)
  - [ ] 6.1 Test Vitest : un club `common` ne peut pas lire `evaluations` (retourne 0 rows)
  - [ ] 6.2 Test Vitest : un club `partner` peut lire les présences de ses enfants liés
  - [ ] 6.3 Test Vitest : mise à jour de `club_access_level` vers `partner` donne accès immédiat aux rapports mi-saison

## Dev Notes

### Discordance architecture.md vs epics.md — résolution

`architecture.md` définit les rôles `club_partner` et `club_common` comme valeurs distinctes dans l'enum `coach_role`. `epics.md` Story 2.5 utilise `user_role = 'club'` (valeur unique) avec `clubs.club_access_level` pour la différenciation.

**Décision retenue :** Suivre `epics.md` (source d'autorité pour les ACs). La valeur `'club'` est ajoutée à l'enum `user_role`. La distinction partner/common est gérée par `clubs.club_access_level`, ce qui permet de changer le niveau d'accès sans reissue de token — comportement requis par AC4.

Le type TypeScript `UserRole` dans `packages/types` doit être mis à jour pour inclure `'club'`. Un type `ClubAccessLevel = 'partner' | 'common'` est ajouté séparément.

### Migration `00004_clubs.sql`

```sql
-- Story 2.5 — Tables clubs et club_child_links

-- Étendre l'enum user_role avec la valeur 'club'
-- Note : ALTER TYPE ADD VALUE ne peut pas être exécuté dans une transaction
-- avec d'autres statements qui utilisent l'enum dans la même transaction.
-- supabase CLI gère cela correctement.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'club';

-- Table principale des clubs
CREATE TABLE clubs (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  name             TEXT NOT NULL,
  club_access_level club_access_level NOT NULL DEFAULT 'common',
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les lookups par tenant
CREATE INDEX clubs_tenant_idx ON clubs (tenant_id) WHERE deleted_at IS NULL;

-- Table de liaison enfant <-> club
CREATE TABLE club_child_links (
  club_id    UUID NOT NULL REFERENCES clubs(user_id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, child_id)
);

-- Index pour les lookups RLS depuis le côté enfant
CREATE INDEX ccl_child_idx ON club_child_links (child_id);

-- Activer RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_child_links ENABLE ROW LEVEL SECURITY;
```

### Section Story 2.5 dans `00010_rls_policies.sql`

```sql
-- ============================================================
-- STORY 2.5 — Policies clubs et club_child_links
-- ============================================================

-- clubs : admin gère tout, club voit uniquement son propre enregistrement
CREATE POLICY "clubs_tenant_isolation" ON clubs
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "clubs_admin_full" ON clubs
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "clubs_own_read" ON clubs
  FOR SELECT USING (user_id = auth.uid());

-- club_child_links : admin gère tout, club voit ses propres liens
CREATE POLICY "ccl_tenant_isolation" ON club_child_links
  USING (
    EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
    AND is_active_user()
  );

CREATE POLICY "ccl_admin_full" ON club_child_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
    AND current_user_role() = 'admin'
  );

CREATE POLICY "ccl_club_own" ON club_child_links
  FOR SELECT USING (club_id = auth.uid());
```

### Pattern RLS pour les tables de données — à intégrer en Stories 5.1, 7.3, etc.

Pour les tables qui doivent être accessibles par les clubs en lecture :

```sql
-- Pattern générique pour permettre l'accès club sur attendances (Story 5.1) :
CREATE POLICY "club_read_attendances" ON attendances
  FOR SELECT USING (
    -- Accès club : l'enfant est lié au club
    current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM club_child_links ccl
      WHERE ccl.club_id = auth.uid()
        AND ccl.child_id = attendances.child_id
    )
    -- Restriction partner vs common : les rapports mi-saison/fin-saison
    -- sont gérés dans les tables spécifiques (à définir par les stories futures)
  );
```

**Tables accessibles par `partner` et `common` :** `attendances`, `injury_reports` (Story 7+)
**Tables accessibles par `partner` uniquement :** `midseason_reports`, `endseason_reports` (Stories futures)
**Tables JAMAIS accessibles par club :** `evaluations`, `quiz_results`, `evaluation_comments`

### Audit trail des lectures club

L'audit des lectures club est déclenché **côté Edge Function** (ou via trigger PostgreSQL) pour ne pas surcharger le client. Pour le MVP, utiliser un trigger `AFTER SELECT` n'est pas supporté par PostgreSQL — deux approches alternatives :

**Option A (recommandée MVP) :** Logger dans l'api-client avant chaque requête de lecture club :
```typescript
// packages/api-client/src/clubs.ts
export async function getClubAttendances(childId: string): Promise<Attendance[]> {
  // Audit préalable
  await supabase.from('audit_logs').insert({
    entity_type: 'club_access',
    entity_id: childId,
    action: 'club_data_read',
    metadata: { resource_type: 'attendance', child_id: childId }
  })
  // Requête principale
  const { data } = await supabase
    .from('attendances')
    .select('*')
    .eq('child_id', childId)
  return data ?? []
}
```

**Option B (Phase 2) :** Edge Function dédiée avec audit intégré côté serveur.

### Types TypeScript

```typescript
// packages/types/src/entities.ts — ajouts Story 2.5

// Étendre UserRole (déjà défini en Story 1.2 et 2.1)
export type UserRole = 'admin' | 'coach' | 'parent' | 'child' | 'club'

export type ClubAccessLevel = 'partner' | 'common'

export type Club = {
  userId       : string
  tenantId     : string
  name         : string
  clubAccessLevel: ClubAccessLevel
  deletedAt    : string | null
  createdAt    : string
}

export type ClubChildLink = {
  clubId   : string
  childId  : string
  createdAt: string
}
```

### Formulaire Admin : création d'un compte club

```typescript
// apps/web/app/(admin)/clubs/new.tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClub } from '@aureak/api-client'

const schema = z.object({
  name       : z.string().min(1, 'Nom requis'),
  email      : z.string().email('Email invalide'),
  accessLevel: z.enum(['partner', 'common']),
})

type FormData = z.infer<typeof schema>

export default function NewClubPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accessLevel: 'common' }
  })

  const onSubmit = async (data: FormData) => {
    await createClub({
      name        : data.name,
      email       : data.email,
      accessLevel : data.accessLevel,
      tenantId    : getCurrentTenantId(),
    })
    // Rediriger vers la liste
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* champs name, email, accessLevel select */}
    </form>
  )
}
```

### Création du compte club via Supabase Auth Admin

Les clubs sont créés par invitation (pas d'auto-inscription) :

```typescript
// packages/api-client/src/clubs.ts
export async function createClub(params: {
  name        : string
  email       : string
  accessLevel : ClubAccessLevel
  tenantId    : string
}): Promise<Club> {
  // 1. Inviter l'utilisateur (envoie un email magic link)
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    params.email,
    { data: { user_role: 'club', tenant_id: params.tenantId } }
  )
  if (authError) throw authError

  // 2. Créer le profil
  await supabase.from('profiles').insert({
    user_id   : authData.user.id,
    tenant_id : params.tenantId,
    user_role : 'club',
    first_name: params.name,
    last_name : '',
    is_active : true,
  })

  // 3. Créer l'enregistrement club
  const { data: club, error } = await supabase.from('clubs').insert({
    user_id          : authData.user.id,
    tenant_id        : params.tenantId,
    name             : params.name,
    club_access_level: params.accessLevel,
  }).select().single()

  if (error) throw error
  return club
}
```

### Piège : `ALTER TYPE ADD VALUE` et transactions

PostgreSQL ne permet pas d'utiliser `ALTER TYPE ADD VALUE` dans une transaction avec des statements DDL qui référencent l'enum dans la même transaction. Supabase CLI gère cela en appliquant chaque fichier de migration dans une transaction séparée. S'assurer que `00004_clubs.sql` ne contient pas de `BEGIN/COMMIT` explicite (le CLI les gère automatiquement).

### Pièges courants à éviter

1. **`club_child_links` sans soft-delete** : table de liaison pure — `DELETE` physique autorisé (pas de `deleted_at`). L'historique des associations est tracé dans `audit_logs`.
2. **Ne pas utiliser `current_user_role() = 'club_partner'`** : la valeur dans l'enum est `'club'`, la différenciation se fait via `clubs.club_access_level`.
3. **RLS sur `evaluations`** : ne pas ajouter de clause club sur `evaluations`, `quiz_results`, `evaluation_comments` — l'absence de policy club suffit (RLS bloque par défaut).
4. **Index sur `ccl_child_idx`** : indispensable pour les performances RLS qui cherchent par `child_id`. Sans cet index, chaque SELECT sur `attendances` par un admin déclencherait un seq scan de `club_child_links`.

### Dépendances de cette story

- **Prérequis** : Story 1.2 (enums, `tenants`, `profiles`, `audit_logs`) + Story 2.1 (`profiles` + `is_active_user()`)
- **À compléter en Story 5.1** : ajouter la clause club dans les policies `attendances`
- **À compléter en Story 7.3** : ajouter la clause club dans les policies `injury_reports` et rapports

### References

- [Source: epics.md#Story-2.5] — Acceptance Criteria originaux (lignes 833–873)
- [Source: architecture.md#Zone-9] — Rôles RBAC et enums (lignes 444–475)
- [Source: epics.md#Story-1.2] — Enum `user_role` et `club_access_level` (lignes 645–647)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Discordance architecture.md (`club_partner`/`club_common` comme valeurs d'enum séparées) vs epics.md (`'club'` unique + `club_access_level`) résolue en faveur d'epics.md — voir Dev Notes section dédiée.
- `ALTER TYPE ADD VALUE IF NOT EXISTS` utilisé pour idempotence en cas de reset partiel.

### File List

- supabase/migrations/00004_clubs.sql
- supabase/migrations/00010_rls_policies.sql (section clubs ajoutée)
- packages/types/src/enums.ts (UserRole étendu avec 'club')
- packages/types/src/entities.ts (Club, ClubChildLink ajoutés)
- packages/api-client/src/clubs.ts
- packages/api-client/src/index.ts (exports clubs ajoutés)
- apps/web/app/(admin)/clubs/page.tsx
- apps/web/app/(admin)/clubs/new.tsx
- apps/web/app/(admin)/clubs/[clubId]/page.tsx
- apps/web/app/(admin)/_layout.tsx (routes clubs ajoutées)
- apps/web/app/(auth)/login.tsx (ROLE_ROUTES étendu avec 'club')

### Status

review
