# Story 3.1 : Hiérarchie Thème — ThemeGroup, Thème & Séquences

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux créer et organiser les thèmes techniques en groupes et séquences pédagogiques,
Afin que le référentiel soit structuré, versionnable et directement utilisable pour composer les séances.

## Acceptance Criteria

**AC1 — Tables `theme_groups`, `themes`, `theme_sequences` créées**
- **Given** les migrations Epic 1 et Epic 2 appliquées
- **When** la migration Story 3.1 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE theme_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    sort_order INTEGER,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    group_id UUID REFERENCES theme_groups(id),
    theme_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT CHECK (level IN ('debutant','intermediaire','avance')),
    age_group TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
    target_audience JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, theme_key, version)
  );
  CREATE UNIQUE INDEX one_current_theme_version ON themes (tenant_id, theme_key) WHERE is_current = true;

  CREATE TABLE theme_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```

**AC2 — RLS activé**
- **And** RLS est activé sur `theme_groups`, `themes`, `theme_sequences` avec policy tenant isolation (RBAC complet : admin=CRUD, coach=SELECT, autres=rien, couvert par Story 2.6)

**AC3 — `theme_key` slug stable**
- **And** `theme_key` est un slug invariant (ex: `'sortie-au-sol'`) — le `name` peut changer entre versions mais pas le `theme_key`
- **And** l'unicité est garantie par `UNIQUE (tenant_id, theme_key, version)`

**AC4 — Versioning de thème**
- **And** un Admin peut créer une nouvelle version d'un thème : passer `is_current = false` sur la version actuelle et insérer avec `version + 1` et `is_current = true`
- **And** l'index partiel `one_current_theme_version` garantit qu'il n'existe qu'une seule version courante par `theme_key` et `tenant_id`

**AC5 — Migration propre**
- **And** `supabase db diff` reste clean après migration

## Tasks / Subtasks

- [ ] Task 1 — Migration `00005_referentiel_themes.sql` (AC: #1, #2, #3, #4)
  - [ ] 1.1 Créer `supabase/migrations/00005_referentiel_themes.sql` avec les 3 tables + index partiel
  - [ ] 1.2 Activer RLS sur les 3 tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
  - [ ] 1.3 Ajouter les indexes de performance (voir Dev Notes)
  - [ ] 1.4 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #2)
  - [ ] 2.1 Compléter la section Story 2.6 dans `supabase/migrations/00010_rls_policies.sql` : ajouter les policies pour `theme_groups`, `themes`, `theme_sequences` (admin=ALL, coach=SELECT)
  - [ ] 2.2 Vérifier que les policies utilisent `current_tenant_id()` et `current_user_role()` (fonctions créées en Story 2.2)

- [ ] Task 3 — Types TypeScript (AC: #1)
  - [ ] 3.1 Ajouter dans `packages/types/src/entities.ts` les types `ThemeGroup`, `Theme`, `ThemeSequence`
  - [ ] 3.2 Ajouter les types utilitaires `ThemeLevel` et `AgeGroup`

- [ ] Task 4 — `@aureak/api-client` : CRUD référentiel thèmes (AC: #3, #4)
  - [ ] 4.1 Créer `packages/api-client/src/referentiel/themes.ts` avec :
    - `createThemeGroup({ name, sortOrder })` → INSERT
    - `listThemeGroups()` → SELECT filtre `deleted_at IS NULL`, trié par `sort_order`
    - `createTheme({ groupId, themeKey, name, level, ageGroup, targetAudience })` → INSERT
    - `listThemes({ groupId? })` → SELECT filtre `is_current = true` et `deleted_at IS NULL`
    - `getThemeByKey(themeKey)` → SELECT WHERE `theme_key = $1 AND is_current = true`
    - `createNewThemeVersion(themeKey)` → transaction : UPDATE is_current=false + INSERT version+1
    - `createThemeSequence({ themeId, name, sortOrder })` → INSERT
    - `listSequencesByTheme(themeId)` → SELECT trié par `sort_order`
  - [ ] 4.2 Exporter depuis `packages/api-client/src/index.ts`

- [ ] Task 5 — UI Admin (web) (AC: #3, #4)
  - [ ] 5.1 Créer `apps/web/app/(admin)/referentiel/theme-groups/page.tsx` — liste des groupes avec ordre drag-and-drop (réordonner via `sort_order`)
  - [ ] 5.2 Créer `apps/web/app/(admin)/referentiel/themes/page.tsx` — liste des thèmes courants groupés par ThemeGroup
  - [ ] 5.3 Créer `apps/web/app/(admin)/referentiel/themes/new.tsx` — formulaire : themeKey (slug), name, level, ageGroup, groupId
  - [ ] 5.4 Créer `apps/web/app/(admin)/referentiel/themes/[themeKey]/page.tsx` — détail thème avec ses séquences + bouton "Nouvelle version"
  - [ ] 5.5 Valider avec React Hook Form + Zod : `themeKey` format slug (`/^[a-z0-9-]+$/`), `level` et `ageGroup` enum stricts

## Dev Notes

### Migration `00005_referentiel_themes.sql`

```sql
-- Story 3.1 — Hiérarchie ThemeGroup > Theme > ThemeSequence

-- Groupes de thèmes (catégories de haut niveau)
CREATE TABLE theme_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tg_tenant_idx ON theme_groups (tenant_id) WHERE deleted_at IS NULL;

-- Thèmes pédagogiques versionnés
CREATE TABLE themes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  group_id        UUID REFERENCES theme_groups(id),
  theme_key       TEXT NOT NULL,   -- slug invariant ex: 'sortie-au-sol'
  name            TEXT NOT NULL,
  description     TEXT,
  level           TEXT CHECK (level IN ('debutant','intermediaire','avance')),
  age_group       TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  target_audience JSONB NOT NULL DEFAULT '{}',
  version         INTEGER NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, theme_key, version)
);

-- Unicité : une seule version courante par thème et tenant
CREATE UNIQUE INDEX one_current_theme_version
  ON themes (tenant_id, theme_key)
  WHERE is_current = true;

-- Index pour les lookups courants par groupe
CREATE INDEX themes_tenant_current_idx
  ON themes (tenant_id, group_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Séquences pédagogiques d'un thème
CREATE TABLE theme_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id    UUID NOT NULL REFERENCES themes(id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note : theme_sequences n'a pas de soft-delete (lié à une version de thème immuable)
CREATE INDEX ts_theme_idx ON theme_sequences (theme_id, sort_order);

-- Activer RLS
ALTER TABLE theme_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_sequences ENABLE ROW LEVEL SECURITY;
```

### Policies RLS à ajouter dans `00010_rls_policies.sql` (section Story 2.6)

```sql
-- Tables Story 3.1 : theme_groups, themes, theme_sequences

-- theme_groups
CREATE POLICY "tg_tenant_isolation" ON theme_groups
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "tg_admin_full" ON theme_groups
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "tg_coach_read" ON theme_groups
  FOR SELECT USING (current_user_role() = 'coach');

-- themes
CREATE POLICY "themes_tenant_isolation" ON themes
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "themes_admin_full" ON themes
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "themes_coach_read" ON themes
  FOR SELECT USING (current_user_role() = 'coach');

-- theme_sequences
CREATE POLICY "theme_seq_tenant_isolation" ON theme_sequences
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "theme_seq_admin_full" ON theme_sequences
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "theme_seq_coach_read" ON theme_sequences
  FOR SELECT USING (current_user_role() = 'coach');
```

### Versioning de thème : transaction atomique

```typescript
// packages/api-client/src/referentiel/themes.ts
export async function createNewThemeVersion(params: {
  themeKey: string
  tenantId: string
  name?: string         // optionnel : conserver le même nom si omis
  description?: string
  level?: ThemeLevel
  ageGroup?: AgeGroup
  targetAudience?: Record<string, unknown>
}): Promise<Theme> {
  // 1. Récupérer la version courante
  const { data: current, error: fetchError } = await supabase
    .from('themes')
    .select('*')
    .eq('theme_key', params.themeKey)
    .eq('is_current', true)
    .single()

  if (fetchError || !current) throw fetchError ?? new Error('Theme not found')

  // 2. Atomique via RPC pour éviter les race conditions sur l'index partiel
  const { data: newVersion, error } = await supabase.rpc('create_theme_version', {
    p_theme_key      : params.themeKey,
    p_current_id     : current.id,
    p_name           : params.name ?? current.name,
    p_description    : params.description ?? current.description,
    p_level          : params.level ?? current.level,
    p_age_group      : params.ageGroup ?? current.age_group,
    p_target_audience: params.targetAudience ?? current.target_audience,
    p_tenant_id      : params.tenantId,
  })

  if (error) throw error
  return newVersion
}
```

**Fonction PostgreSQL `create_theme_version` :**

```sql
-- supabase/migrations/00005_referentiel_themes.sql (suite)
CREATE OR REPLACE FUNCTION create_theme_version(
  p_theme_key       TEXT,
  p_current_id      UUID,
  p_name            TEXT,
  p_description     TEXT,
  p_level           TEXT,
  p_age_group       TEXT,
  p_target_audience JSONB,
  p_tenant_id       UUID
) RETURNS themes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_version INTEGER;
  v_result      themes;
BEGIN
  -- Calculer le numéro de prochaine version
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_new_version
  FROM themes
  WHERE theme_key = p_theme_key AND tenant_id = p_tenant_id;

  -- Désactiver la version courante
  UPDATE themes SET is_current = false WHERE id = p_current_id;

  -- Créer la nouvelle version
  INSERT INTO themes (
    tenant_id, group_id, theme_key, name, description,
    level, age_group, target_audience, version, is_current
  )
  SELECT
    t.tenant_id, t.group_id, p_theme_key, p_name, p_description,
    p_level, p_age_group, p_target_audience, v_new_version, true
  FROM themes t WHERE t.id = p_current_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION create_theme_version FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_theme_version TO authenticated;
```

### Types TypeScript

```typescript
// packages/types/src/entities.ts — ajouts Story 3.1

export type ThemeLevel = 'debutant' | 'intermediaire' | 'avance'
export type AgeGroup   = 'U5' | 'U8' | 'U11' | 'Senior'

export type ThemeGroup = {
  id        : string
  tenantId  : string
  name      : string
  sortOrder : number | null
  deletedAt : string | null
  createdAt : string
}

export type Theme = {
  id             : string
  tenantId       : string
  groupId        : string | null
  themeKey       : string   // slug invariant
  name           : string
  description    : string | null
  level          : ThemeLevel | null
  ageGroup       : AgeGroup | null
  targetAudience : Record<string, unknown>
  version        : number
  isCurrent      : boolean
  deletedAt      : string | null
  createdAt      : string
}

export type ThemeSequence = {
  id          : string
  themeId     : string
  tenantId    : string
  name        : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}
```

### Validation Zod pour le formulaire thème

```typescript
// apps/web/app/(admin)/referentiel/themes/new.tsx
import { z } from 'zod'

const themeSchema = z.object({
  themeKey: z
    .string()
    .min(1, 'Requis')
    .regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name       : z.string().min(1, 'Requis'),
  description: z.string().optional(),
  level      : z.enum(['debutant', 'intermediaire', 'avance']).optional(),
  ageGroup   : z.enum(['U5', 'U8', 'U11', 'Senior']).optional(),
  groupId    : z.string().uuid().optional(),
})
```

### Structure `target_audience` JSONB

Ce champ est prévu pour le ciblage d'audience (Story 3.6). Format recommandé :

```json
{
  "age_groups": ["U8", "U11"],
  "levels": ["debutant", "intermediaire"],
  "custom_tags": []
}
```

Pour Story 3.1, accepter `'{}'` par défaut — Story 3.6 enrichira ce champ.

### Pièges courants à éviter

1. **Index partiel `one_current_theme_version` et transactions** : deux INSERT simultanés avec `is_current = true` sur le même `theme_key` lèveront une erreur de contrainte unique. C'est le comportement souhaité. Utiliser `create_theme_version` RPC pour toute création de version (jamais en parallèle côté client).
2. **`theme_sequences` sans soft-delete** : les séquences sont liées à une version spécifique du thème. Lorsqu'une nouvelle version est créée, les séquences de l'ancienne version sont conservées (historique) — la nouvelle version démarre sans séquences et l'Admin les recrée si nécessaire.
3. **`group_id` nullable** : un thème peut exister sans groupe (migration initiale de données). Ne pas ajouter `NOT NULL` sur `group_id`.
4. **Soft-delete sur `theme_groups` et `themes`** : `deleted_at` + `deleted_by` obligatoires (convention projet). Ne jamais faire de DELETE physique.

### Dépendances de cette story

- **Prérequis** : Stories 1.2 (tenants) + 2.2 (RLS helpers) + 2.6 (pattern RBAC référentiel)
- **À compléter en Story 3.2** : tables `criteria`, `faults`, `cues` avec FK vers `theme_sequences`
- **À compléter en Story 3.6** : enrichissement de `target_audience` JSONB + système de ciblage

### References

- [Source: epics.md#Story-3.1] — Acceptance Criteria originaux (lignes 899–952)
- [Source: epics.md#Epic-3] — Description Epic Référentiel Pédagogique (lignes 895–897)
- [Source: epics.md#Story-2.6] — Pattern RBAC référentiel (admin/coach/autres) (lignes 877–892)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Fonction RPC `create_theme_version` ajoutée pour garantir l'atomicité du versioning (éviter race condition sur l'index partiel `one_current_theme_version`).
- `theme_sequences` sans soft-delete : les séquences sont immuables par version de thème.
- Numéro de migration : `00005_referentiel_themes.sql` (Story 2.5 utilise `00004_clubs.sql`).

### File List

- supabase/migrations/00005_referentiel_themes.sql
- supabase/migrations/00010_rls_policies.sql (policies theme_groups, themes, theme_sequences ajoutées)
- packages/types/src/entities.ts (ThemeGroup, Theme, ThemeSequence, ThemeLevel, AgeGroup)
- packages/api-client/src/referentiel/themes.ts
- packages/api-client/src/index.ts (exports referentiel/themes ajoutés)
- apps/web/app/(admin)/referentiel/theme-groups/page.tsx
- apps/web/app/(admin)/referentiel/themes/page.tsx
- apps/web/app/(admin)/referentiel/themes/new.tsx
- apps/web/app/(admin)/referentiel/themes/[themeKey]/page.tsx
- apps/web/app/(admin)/_layout.tsx (routes referentiel ajoutées)

### Status

review
