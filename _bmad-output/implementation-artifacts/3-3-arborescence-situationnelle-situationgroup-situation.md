# Story 3.3 : Arborescence Situationnelle (SituationGroup → Situation)

Status: done

## Story

En tant qu'Admin,
Je veux créer et organiser les situations de match en groupes, avec leurs critères d'analyse et leurs liens optionnels vers les thèmes techniques,
Afin que les coachs disposent d'un référentiel situationnel parallèle au référentiel technique pour contextualiser les séances.

## Acceptance Criteria

**AC1 — Tables créées**
- **Given** les tables de Story 3.1 existent (`themes`)
- **When** la migration Story 3.3 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE situation_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL, sort_order INTEGER,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    group_id UUID REFERENCES situation_groups(id),
    situation_key TEXT NOT NULL,
    name TEXT NOT NULL, description TEXT,
    variables JSONB,
    target_audience JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, situation_key, version)
  );
  CREATE UNIQUE INDEX one_current_situation_version ON situations (tenant_id, situation_key) WHERE is_current = true;

  CREATE TABLE situation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_id UUID NOT NULL REFERENCES situations(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    label TEXT NOT NULL, sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE situation_theme_links (
    situation_id UUID NOT NULL REFERENCES situations(id),
    theme_id UUID NOT NULL REFERENCES themes(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    PRIMARY KEY (situation_id, theme_id)
  );
  ```

**AC2 — Versioning situations**
- **And** les situations sont versionnées avec le même mécanisme que les thèmes : `situation_key` stable + `version` + `is_current` + index unique partiel `one_current_situation_version`

**AC3 — Liens situation ↔ thèmes optionnels**
- **And** `situation_theme_links` permet à une situation de référencer 0, 1 ou N thèmes ; un thème peut être lié à N situations — sans contrainte obligatoire

**AC4 — RLS et migration propre**
- **And** RLS activé sur toutes les tables, policies couvertes par Story 2.6
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00007_referentiel_situations.sql` (AC: #1, #2)
  - [ ] 1.1 Créer le fichier de migration avec les 4 tables + index partiel + fonction RPC `create_situation_version`
  - [ ] 1.2 Activer RLS sur les 4 tables
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #4)
  - [ ] 2.1 Compléter la section Story 2.6 : policies pour `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links`

- [ ] Task 3 — Types TypeScript
  - [ ] 3.1 Ajouter `SituationGroup`, `Situation`, `SituationCriterion`, `SituationThemeLink` dans `packages/types/src/entities.ts`

- [ ] Task 4 — `@aureak/api-client` (AC: #1, #2, #3)
  - [ ] 4.1 Créer `packages/api-client/src/referentiel/situations.ts` : CRUD situations + versioning + gestion liens themes

- [ ] Task 5 — UI Admin (web)
  - [ ] 5.1 Créer `apps/web/app/(admin)/referentiel/situations/` par analogie avec l'UI thèmes (Story 3.1)

## Dev Notes

### RPC `create_situation_version` (même pattern que Story 3.1)

```sql
CREATE OR REPLACE FUNCTION create_situation_version(
  p_situation_key TEXT, p_current_id UUID,
  p_name TEXT, p_description TEXT, p_variables JSONB,
  p_target_audience JSONB, p_tenant_id UUID
) RETURNS situations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_version INTEGER;
  v_result situations;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
  FROM situations WHERE situation_key = p_situation_key AND tenant_id = p_tenant_id;

  UPDATE situations SET is_current = false WHERE id = p_current_id;

  INSERT INTO situations (tenant_id, group_id, situation_key, name, description,
    variables, target_audience, version, is_current)
  SELECT t.tenant_id, t.group_id, p_situation_key, p_name, p_description,
    p_variables, p_target_audience, v_new_version, true
  FROM situations t WHERE t.id = p_current_id
  RETURNING * INTO v_result;

  RETURN v_result;
END; $$;
REVOKE ALL ON FUNCTION create_situation_version FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_situation_version TO authenticated;
```

### Structure `variables` JSONB

```json
{
  "nb_joueurs": 11,
  "disposition": "4-3-3",
  "phase": "défensive"
}
```
Aucune contrainte de schéma en MVP — champ libre pour les paramètres situationnels.

### Dépendances

- **Prérequis** : Story 3.1 (`themes`, `theme_sequences`)
- **À compléter en Story 3.6** : contrainte CHECK `target_audience` ajoutée sur `situations`
- **À compléter en Story 3.4** : `situations` référencées dans `unit_classifications` via `unit_type = 'situation'`
- **À compléter en Story 11.2** : `required_grade_level` ajouté sur `situations`

### References

- [Source: epics.md#Story-3.3] — lignes 1017–1075

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
### Completion Notes List
### File List

- supabase/migrations/00007_referentiel_situations.sql
- supabase/migrations/00010_rls_policies.sql (policies situation_groups, situations, situation_criteria, situation_theme_links)
- packages/types/src/entities.ts (SituationGroup, Situation, SituationCriterion, SituationThemeLink)
- packages/api-client/src/referentiel/situations.ts
- packages/api-client/src/index.ts (exports situations ajoutés)
- apps/web/app/(admin)/referentiel/situations/page.tsx
- apps/web/app/(admin)/referentiel/situations/new.tsx
- apps/web/app/(admin)/referentiel/situations/[situationKey]/page.tsx
- apps/web/app/(admin)/_layout.tsx (routes situations ajoutées)

### Status

review
