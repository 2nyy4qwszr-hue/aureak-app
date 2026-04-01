# Story 3.6 : Ciblage d'Audience & Filtrage Dynamique

Status: done

## Story

En tant qu'Admin,
Je veux associer chaque thème et situation à une audience cible structurée (rôles, tranches d'âge, programmes),
Afin que le contenu soit filtré dynamiquement selon le profil de l'utilisateur et le programme auquel il appartient.

## Acceptance Criteria

**AC1 — Contrainte CHECK `target_audience` sur `themes` et `situations`**
- **Given** les tables `themes` (Story 3.1) et `situations` (Story 3.3) existent
- **When** la migration Story 3.6 est exécutée
- **Then** la contrainte suivante est ajoutée :
  ```sql
  ALTER TABLE themes ADD CONSTRAINT target_audience_structure CHECK (
    (target_audience = '{}'::jsonb) OR (
      target_audience ? 'roles'
      AND target_audience ? 'age_groups'
      AND jsonb_typeof(target_audience->'roles') = 'array'
      AND jsonb_typeof(target_audience->'age_groups') = 'array'
      AND (
        NOT (target_audience ? 'programs')
        OR jsonb_typeof(target_audience->'programs') = 'array'
      )
    )
  );
  -- Même contrainte sur situations
  ALTER TABLE situations ADD CONSTRAINT target_audience_structure CHECK (...);
  ```

**AC2 — Sémantique `target_audience`**
- **And** `target_audience = '{}'` = aucune restriction (contenu universel)
- **And** `{ "roles": ["coach"], "age_groups": ["U8","U11"] }` est valide
- **And** `{ "roles": "coach" }` est rejeté (`roles` doit être un array)
- **And** `programs` supporte des valeurs comme `'golden_player'`, `'gardien_elite'` — extensible sans migration

**AC3 — Fonction `filterByAudience` dans `@aureak/business-logic`**
- **And** la couche applicative expose une fonction `filterByAudience(items, userProfile)` qui filtre thèmes et situations selon `user_role`, `age_group` et `programs` du profil

**AC4 — Migration propre**
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration contraintes CHECK (AC: #1, #2)
  - [ ] 1.1 Ajouter les contraintes CHECK sur `themes.target_audience` et `situations.target_audience` via migration ALTER TABLE
  - [ ] 1.2 Vérifier les données existantes (si seed data) avant ajout de contrainte
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — `filterByAudience` dans `@aureak/business-logic` (AC: #3)
  - [ ] 2.1 Créer `packages/business-logic/src/referentiel/filterByAudience.ts`
  - [ ] 2.2 Écrire les tests Vitest (4 cas : audience vide, match partiel, aucun match, programmes)
  - [ ] 2.3 Exporter depuis `packages/business-logic/src/index.ts`

- [ ] Task 3 — Types TypeScript (AC: #1)
  - [ ] 3.1 Ajouter `TargetAudience` dans `packages/types/src/entities.ts`

- [ ] Task 4 — Intégration dans les listes de référentiel (AC: #3)
  - [ ] 4.1 Appliquer `filterByAudience` dans `listThemes()` et `listSituations()` côté serveur (ou Edge Function si filtrage serveur requis)

## Dev Notes

### Contrainte CHECK complète

```sql
-- supabase/migrations/00010b_audience_constraints.sql (ou section dans la migration adéquate)

ALTER TABLE themes ADD CONSTRAINT target_audience_structure CHECK (
  (target_audience = '{}'::jsonb) OR (
    target_audience ? 'roles'
    AND target_audience ? 'age_groups'
    AND jsonb_typeof(target_audience->'roles') = 'array'
    AND jsonb_typeof(target_audience->'age_groups') = 'array'
    AND (
      NOT (target_audience ? 'programs')
      OR jsonb_typeof(target_audience->'programs') = 'array'
    )
  )
);

ALTER TABLE situations ADD CONSTRAINT target_audience_structure CHECK (
  (target_audience = '{}'::jsonb) OR (
    target_audience ? 'roles'
    AND target_audience ? 'age_groups'
    AND jsonb_typeof(target_audience->'roles') = 'array'
    AND jsonb_typeof(target_audience->'age_groups') = 'array'
    AND (
      NOT (target_audience ? 'programs')
      OR jsonb_typeof(target_audience->'programs') = 'array'
    )
  )
);
```

### Fonction `filterByAudience`

```typescript
// packages/business-logic/src/referentiel/filterByAudience.ts

export type TargetAudience = {
  roles?     : string[]
  age_groups?: string[]
  programs?  : string[]
}

export type UserProfile = {
  role     : string
  ageGroup : string | null
  programs : string[]
}

export function filterByAudience<T extends { targetAudience: TargetAudience }>(
  items      : T[],
  userProfile: UserProfile
): T[] {
  return items.filter(item => {
    const { targetAudience } = item
    // Aucune restriction = universel
    if (!targetAudience || Object.keys(targetAudience).length === 0) return true

    // Vérifier le rôle
    if (targetAudience.roles?.length && !targetAudience.roles.includes(userProfile.role)) {
      return false
    }
    // Vérifier la tranche d'âge
    if (targetAudience.age_groups?.length && userProfile.ageGroup &&
        !targetAudience.age_groups.includes(userProfile.ageGroup)) {
      return false
    }
    // Vérifier les programmes (intersection — l'utilisateur doit être dans au moins 1 programme requis)
    if (targetAudience.programs?.length) {
      const hasProgram = targetAudience.programs.some(p => userProfile.programs.includes(p))
      if (!hasProgram) return false
    }
    return true
  })
}
```

### Tests Vitest

```typescript
// packages/business-logic/src/__tests__/filterByAudience.test.ts
import { describe, it, expect } from 'vitest'
import { filterByAudience } from '../referentiel/filterByAudience'

const profile = { role: 'coach', ageGroup: 'U8', programs: ['golden_player'] }

describe('filterByAudience', () => {
  it('retourne tout si audience vide', () => {
    const items = [{ id: '1', targetAudience: {} }]
    expect(filterByAudience(items, profile)).toHaveLength(1)
  })
  it('filtre par rôle', () => {
    const items = [{ id: '1', targetAudience: { roles: ['admin'], age_groups: [] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })
  it('filtre par age_group', () => {
    const items = [{ id: '1', targetAudience: { roles: ['coach'], age_groups: ['U11'] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })
  it('filtre par programme', () => {
    const items = [{ id: '1', targetAudience: { roles: ['coach'], age_groups: ['U8'], programs: ['gardien_elite'] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })
})
```

### Dépendances

- **Prérequis** : Stories 3.1 (`themes`) + 3.3 (`situations`)
- **Utilisé en Story 4.7** : `filterByAudience` appliqué côté serveur pour la fiche séance coach

### References

- [Source: epics.md#Story-3.6] — lignes 1194–1225

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
### Completion Notes List
### File List
