# Story 3.4 : Système de Taxonomies Génériques

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux classifier les thèmes et situations selon des axes pédagogiques configurables (méthode GK, situationnel, Golden Player…),
Afin que le contenu puisse être filtré et organisé selon plusieurs taxonomies en parallèle, sans duplication de contenu.

## Acceptance Criteria

**AC1 — Tables `taxonomies`, `taxonomy_nodes`, `unit_classifications` créées**
- **Given** les tables de Stories 3.1 et 3.3 existent
- **When** la migration Story 3.4 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE taxonomies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL, slug TEXT NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, slug)
  );

  CREATE TABLE taxonomy_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxonomy_id UUID NOT NULL REFERENCES taxonomies(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES taxonomy_nodes(id),
    name TEXT NOT NULL, slug TEXT NOT NULL, sort_order INTEGER,
    UNIQUE (taxonomy_id, slug)
  );

  CREATE TABLE unit_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxonomy_node_id UUID NOT NULL REFERENCES taxonomy_nodes(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    unit_type TEXT NOT NULL CHECK (unit_type IN ('theme','situation')),
    unit_id UUID NOT NULL,
    UNIQUE (taxonomy_node_id, unit_type, unit_id)
  );
  ```

**AC2 — Seed de 3 taxonomies de base**
- **And** une migration de seed insère 3 taxonomies pour chaque nouveau tenant :
  - `{ name: 'Méthode GK', slug: 'gk-methode' }`
  - `{ name: 'Situationnel', slug: 'situationnel' }`
  - `{ name: 'Golden Player', slug: 'golden-player' }`

**AC3 — Flexibilité des classifications**
- **And** `unit_type IN ('theme','situation')` — les deux types de contenu sont classifiables dans le même système
- **And** un thème/situation peut être assigné à 0, 1 ou N nœuds de taxonomie — sans contrainte obligatoire

**AC4 — RLS et migration propre**
- **And** RLS activé sur les 3 tables, policies couvertes par Story 2.6
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00008_referentiel_taxonomies.sql` (AC: #1, #2)
  - [ ] 1.1 Créer la migration avec les 3 tables + indexes
  - [ ] 1.2 Ajouter le seed des 3 taxonomies de base (dans la migration ou via fonction)
  - [ ] 1.3 Activer RLS sur les 3 tables
  - [ ] 1.4 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql`
  - [ ] 2.1 Section Story 2.6 : policies pour `taxonomies`, `taxonomy_nodes`, `unit_classifications`

- [ ] Task 3 — Types TypeScript
  - [ ] 3.1 Ajouter `Taxonomy`, `TaxonomyNode`, `UnitClassification` dans `packages/types/src/entities.ts`
  - [ ] 3.2 Ajouter `UnitType = 'theme' | 'situation'`

- [ ] Task 4 — `@aureak/api-client`
  - [ ] 4.1 Créer `packages/api-client/src/referentiel/taxonomies.ts` avec CRUD taxonomies + nœuds + classifications

- [ ] Task 5 — UI Admin (web)
  - [ ] 5.1 Créer `apps/web/app/(admin)/referentiel/taxonomies/page.tsx` — vue arborescente des taxonomies
  - [ ] 5.2 Dans la fiche thème/situation : section "Classifications" avec sélecteur de nœuds

## Dev Notes

### Seed des 3 taxonomies de base

Le seed doit être exécuté pour chaque nouveau tenant. Deux approches :

**Option A (MVP)** : Inclure le seed dans la migration comme commentaire + instruction pour l'Admin de créer ses taxonomies via l'UI.

**Option B (recommandée)** : Edge Function `init-tenant` appelée après création du tenant qui insère les taxonomies de base. Cela permet de personnaliser le seed par tenant.

```typescript
// supabase/functions/init-tenant/index.ts
const BASE_TAXONOMIES = [
  { name: 'Méthode GK', slug: 'gk-methode' },
  { name: 'Situationnel', slug: 'situationnel' },
  { name: 'Golden Player', slug: 'golden-player' },
]

await supabase.from('taxonomies').insert(
  BASE_TAXONOMIES.map(t => ({ ...t, tenant_id: tenantId }))
)
```

### Arbre `taxonomy_nodes` (auto-référentiel)

`parent_id IS NULL` = nœud racine. Profondeur recommandée : max 3 niveaux (racine > catégorie > sous-catégorie). Aucune contrainte de profondeur en DB en MVP.

Pour naviguer l'arbre, utiliser une requête récursive CTE :
```sql
WITH RECURSIVE tree AS (
  SELECT id, name, slug, parent_id, 0 AS depth FROM taxonomy_nodes
  WHERE taxonomy_id = $1 AND parent_id IS NULL
  UNION ALL
  SELECT n.id, n.name, n.slug, n.parent_id, t.depth + 1
  FROM taxonomy_nodes n JOIN tree t ON n.parent_id = t.id
)
SELECT * FROM tree ORDER BY depth, sort_order;
```

### Dépendances

- **Prérequis** : Stories 3.1 (`themes`) + 3.3 (`situations`)
- **À compléter en Story 3.6** : `filterByAudience` utilise potentiellement les taxonomies pour le filtrage par programme

### References

- [Source: epics.md#Story-3.4] — lignes 1079–1128

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
### Completion Notes List
### File List
