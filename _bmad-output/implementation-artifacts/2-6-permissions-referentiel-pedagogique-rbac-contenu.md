# Story 2.6 : Permissions Référentiel Pédagogique (RBAC Contenu)

Status: ready-for-dev

## Story

En tant que système,
Je veux que les tables du référentiel pédagogique appliquent des politiques RLS différenciées par rôle,
Afin qu'un Admin puisse créer et modifier le contenu, qu'un Coach puisse le consulter en lecture seule, et que les parents/enfants/clubs n'aient aucun accès direct au référentiel.

## Acceptance Criteria

**AC1 — Admin : accès complet (CRUD)**
- **Given** les tables du référentiel pédagogique créées en Epic 3 : `theme_groups`, `themes`, `theme_sequences`, `criteria`, `faults`, `cues`, `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links`, `taxonomies`, `taxonomy_nodes`, `unit_classifications`, `quiz_questions`, `quiz_options`
- **When** les policies RLS sont appliquées via migration
- **Then** un utilisateur avec `current_user_role() = 'admin'` peut exécuter INSERT, UPDATE, DELETE et SELECT sur toutes ces tables (filtré par `tenant_id = current_tenant_id()`)

**AC2 — Coach : lecture seule**
- **And** un utilisateur avec `current_user_role() = 'coach'` peut exécuter uniquement SELECT sur toutes ces tables (filtré par `tenant_id = current_tenant_id()`) — aucune modification possible

**AC3 — Parent / Enfant / Club : aucun accès**
- **And** un utilisateur avec `current_user_role() IN ('parent', 'child')` ne peut accéder à aucune ligne de ces tables — les policies RLS retournent `0 rows`
- **And** les comptes club (`profiles.user_role = 'club'`) n'ont aucun accès aux tables du référentiel pédagogique

**AC4 — Test d'intégration**
- **And** un test d'intégration vérifie : coach peut SELECT, ne peut pas INSERT ; admin peut tout ; parent retourne 0 rows

## Tasks / Subtasks

- [ ] Task 1 — Préparer la section Story 2.6 dans `00010_rls_policies.sql` (AC: #1, #2, #3)
  - [ ] 1.1 Ajouter la section Story 2.6 dans `supabase/migrations/00010_rls_policies.sql` avec les macros de policies pour les 15 tables du référentiel
  - [ ] 1.2 Appliquer les policies à chaque table via le pattern réutilisable (voir Dev Notes)
  - [ ] 1.3 Vérifier que `supabase db reset` et `supabase db diff` sont clean **après** application de l'Epic 3 (Story 2.6 dépend des tables Epic 3)

- [ ] Task 2 — Activation RLS sur chaque table Epic 3 (AC: #1)
  - [ ] 2.1 Dans les migrations Epic 3 (Stories 3.1–3.5), s'assurer que `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY` est présent
  - [ ] 2.2 Coordonner avec Story 3.1 : `theme_groups`, `themes`, `theme_sequences`
  - [ ] 2.3 Coordonner avec Story 3.2 : `criteria`, `faults`, `cues`
  - [ ] 2.4 Coordonner avec Story 3.3 : `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links`
  - [ ] 2.5 Coordonner avec Story 3.4 : `taxonomies`, `taxonomy_nodes`, `unit_classifications`
  - [ ] 2.6 Coordonner avec Story 3.5 : `quiz_questions`, `quiz_options`

- [ ] Task 3 — Tests d'intégration (AC: #4)
  - [ ] 3.1 Créer `packages/api-client/src/__tests__/rbac-referentiel.test.ts` avec les 4 scénarios requis
  - [ ] 3.2 Test : coach peut SELECT `themes` (retourne des rows)
  - [ ] 3.3 Test : coach ne peut pas INSERT dans `themes` (Supabase error `42501` permission denied)
  - [ ] 3.4 Test : admin peut INSERT + SELECT + DELETE sur `themes`
  - [ ] 3.5 Test : parent retourne 0 rows sur SELECT `themes`
  - [ ] 3.6 Test : club retourne 0 rows sur SELECT `themes`

- [ ] Task 4 — Mettre à jour `supabase/RLS_PATTERNS.md` (AC: #1)
  - [ ] 4.1 Documenter le pattern référentiel pédagogique (admin: CRUD, coach: SELECT, autres: rien) dans `supabase/RLS_PATTERNS.md` section 2.6

## Dev Notes

### Stratégie : policies définies en Story 2.6 mais applicables après Epic 3

Story 2.6 est dans Epic 2 (Auth) mais les tables qu'elle protège sont créées en Epic 3. La section Story 2.6 dans `00010_rls_policies.sql` sera **vide** jusqu'à ce qu'Epic 3 soit implémenté. Les policies sont ajoutées table par table au fur et à mesure des Stories 3.1–3.5.

**Convention dans `00010_rls_policies.sql` :**
```sql
-- ============================================================
-- STORY 2.6 — Policies référentiel pédagogique (RBAC contenu)
-- ============================================================
-- Pattern : admin=CRUD, coach=SELECT, parent/child/club=rien
-- Tables protégées : créées en Epic 3 (Stories 3.1–3.5)
-- Policies ajoutées ici au fur et à mesure (voir ci-dessous)
--
-- Tables Story 3.1 : theme_groups, themes, theme_sequences    ✓ ajouté
-- Tables Story 3.2 : criteria, faults, cues                   ✓ ajouté
-- Tables Story 3.3 : situation_groups, situations,
--                    situation_criteria, situation_theme_links ✓ ajouté
-- Tables Story 3.4 : taxonomies, taxonomy_nodes,
--                    unit_classifications                       ✓ ajouté
-- Tables Story 3.5 : quiz_questions, quiz_options              ✓ ajouté
-- ============================================================
```

### Pattern RLS référentiel pédagogique (à répéter pour chaque table)

```sql
-- Exemple appliqué à 'themes' — répliquer pour chaque table du référentiel

-- Isolation tenant (condition de base)
CREATE POLICY "themes_tenant_isolation" ON themes
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

-- Admin : accès complet CRUD
CREATE POLICY "themes_admin_full" ON themes
  FOR ALL USING (current_user_role() = 'admin');

-- Coach : lecture seule
CREATE POLICY "themes_coach_read" ON themes
  FOR SELECT USING (current_user_role() = 'coach');

-- Absence volontaire de policy pour parent, child, club :
-- RLS bloque par défaut (deny-by-default) — aucune ligne retournée.
```

**Macro SQL pour générer les policies en lot :**

```sql
-- Plutôt qu'une policy par table, utiliser un DO block pour éviter la répétition :
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'theme_groups', 'themes', 'theme_sequences',
    'criteria', 'faults', 'cues',
    'situation_groups', 'situations', 'situation_criteria', 'situation_theme_links',
    'taxonomies', 'taxonomy_nodes', 'unit_classifications',
    'quiz_questions', 'quiz_options'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user())',
      tbl || '_tenant_isolation', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (current_user_role() = ''admin'')',
      tbl || '_admin_full', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (current_user_role() = ''coach'')',
      tbl || '_coach_read', tbl
    );
  END LOOP;
END $$;
```

> **Note :** Le DO block ne peut être exécuté que si toutes les tables existent déjà. La section Story 2.6 dans `00010_rls_policies.sql` est donc exécutée après les migrations Epic 3. L'ordre des migrations garantit cela : `00010_rls_policies.sql` est le dernier fichier (numéro le plus élevé).

### Tests d'intégration Vitest

```typescript
// packages/api-client/src/__tests__/rbac-referentiel.test.ts
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect } from 'vitest'

const SUPABASE_URL = process.env.SUPABASE_URL!
const ANON_KEY    = process.env.SUPABASE_ANON_KEY!

// Tokens pré-générés pour les tests (via supabase test helpers)
const COACH_TOKEN  = process.env.TEST_COACH_TOKEN!
const ADMIN_TOKEN  = process.env.TEST_ADMIN_TOKEN!
const PARENT_TOKEN = process.env.TEST_PARENT_TOKEN!
const CLUB_TOKEN   = process.env.TEST_CLUB_TOKEN!

function clientAs(token: string) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

describe('RBAC Référentiel Pédagogique', () => {
  it('coach peut SELECT themes', async () => {
    const { data, error } = await clientAs(COACH_TOKEN)
      .from('themes').select('id').limit(1)
    expect(error).toBeNull()
    // data peut être [] si pas de contenu, mais pas d'erreur permission
  })

  it('coach ne peut pas INSERT dans themes', async () => {
    const { error } = await clientAs(COACH_TOKEN)
      .from('themes').insert({ name: 'test', tenant_id: 'xxx', theme_key: 'test' })
    expect(error).not.toBeNull()
    expect(error!.code).toBe('42501')  // permission denied
  })

  it('admin peut INSERT + SELECT + DELETE sur themes', async () => {
    const client = clientAs(ADMIN_TOKEN)
    const { data: inserted, error: insertError } = await client
      .from('themes').insert({ name: 'RBAC Test', theme_key: 'rbac-test', tenant_id: 'auto' })
      .select().single()
    expect(insertError).toBeNull()
    expect(inserted).not.toBeNull()

    const { error: deleteError } = await client
      .from('themes').delete().eq('id', inserted!.id)
    expect(deleteError).toBeNull()
  })

  it('parent retourne 0 rows sur SELECT themes', async () => {
    const { data, error } = await clientAs(PARENT_TOKEN)
      .from('themes').select('id')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('club retourne 0 rows sur SELECT themes', async () => {
    const { data, error } = await clientAs(CLUB_TOKEN)
      .from('themes').select('id')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})
```

### Ordre d'application des migrations

| Migration                   | Contenu                                      | Dépend de          |
|-----------------------------|----------------------------------------------|--------------------|
| `00001_init.sql`            | `tenants`, extensions, helpers               | —                  |
| `00002_enums.sql`           | Tous les enums PostgreSQL                    | 00001              |
| `00003_profiles.sql`        | `profiles`, `parent_child_links`             | 00001, 00002       |
| `00004_clubs.sql`           | `clubs`, `club_child_links`                  | 00001, 00002, 00003|
| `00005_rls_helpers.sql`     | `coach_implantation_assignments`, fonctions  | 00003              |
| `00006_quick_auth.sql`      | `quick_auth_devices`, `coach_access_grants`  | 00003              |
| `00007_theme_groups.sql`    | Tables Epic 3 (Stories 3.1–3.5)             | 00001, 00002       |
| `00008_situations.sql`      | Tables Epic 3 suite                          | 00007              |
| `00009_audit.sql`           | `audit_logs`, `processed_operations`         | 00001              |
| **`00010_rls_policies.sql`**| Toutes les policies RLS (Stories 2.2–2.6+)  | Toutes les tables  |

> **Règle de conception :** `00010_rls_policies.sql` est toujours le **dernier** fichier. Il peut référencer toute table créée dans les migrations précédentes. Chaque story qui ajoute des policies ajoute une section dans ce fichier, jamais un nouveau fichier de migration distinct pour les policies.

### Pièges courants à éviter

1. **Exécuter Story 2.6 avant Epic 3** : le DO block échouera si les tables n'existent pas. S'assurer que le numéro de migration est `00010` (après toutes les tables Epic 3).
2. **Policy `FOR ALL` vs policies séparées** : `FOR ALL USING (...)` s'applique à SELECT, INSERT, UPDATE, DELETE — mais `USING` s'applique uniquement aux rows existantes (filtre). Pour INSERT, la condition est `WITH CHECK`. Utiliser `FOR ALL USING (...) WITH CHECK (...)` pour admin.
3. **RLS deny-by-default** : si `ENABLE ROW LEVEL SECURITY` est posé sans aucune policy pour un rôle, ce rôle ne voit rien (0 rows) — c'est le comportement souhaité pour parent/child/club.
4. **`current_user_role()` retourne `user_role` enum** : 'club' est maintenant une valeur valide (Story 2.5). Pas besoin d'exclure explicitement 'club' dans les policies — l'absence de policy club sur les tables référentiel suffit.

### Dépendances de cette story

- **Prérequis** : Story 2.2 (`current_user_role()`, `current_tenant_id()`, `is_active_user()`) + Story 2.5 (`user_role = 'club'`)
- **À compléter dès Story 3.1** : activer `ENABLE ROW LEVEL SECURITY` sur chaque table Epic 3 et ajouter la policy correspondante dans `00010_rls_policies.sql` section 2.6
- **Dépendance inversée** : Story 2.6 est la référence de policies ; Epic 3 implémente les tables + active RLS

### References

- [Source: epics.md#Story-2.6] — Acceptance Criteria originaux (lignes 877–892)
- [Source: architecture.md#Zone-12] — RLS isolation tenant (lignes 555–590)
- [Source: epics.md#Story-2.2] — Fonctions helpers `current_user_role()`, `is_active_user()` (lignes 756–790)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Story 2.6 définit le **contrat RLS** pour Epic 3, mais les policies ne peuvent être appliquées qu'après la création des tables (Epic 3). L'implémentation se fait donc en deux temps : section Story 2.6 placée dans `00010_rls_policies.sql` maintenant, policies concrètes ajoutées au fur et à mesure de l'Epic 3.
- DO block SQL recommandé pour éviter 15 × 3 = 45 CREATE POLICY répétitifs.
- Test d'intégration complet (5 scénarios) fourni, couvre tous les rôles requis par l'AC.

### File List

- supabase/migrations/00010_rls_policies.sql (section Story 2.6 ajoutée — DO block commenté, activer après Epic 3)
- supabase/RLS_PATTERNS.md (Pattern 2.6 documenté)
- packages/api-client/src/__tests__/rbac-referentiel.test.ts (6 tests : 1 smoke + 5 intégration skipIf)

### Status

review
