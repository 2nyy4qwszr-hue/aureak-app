# Story 3.2 : Critères, Faults & Cues

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux créer les critères de réussite, les fautes associées et les cues de correction coaching pour chaque séquence,
Afin que chaque séquence d'un thème soit outillée d'un référentiel pédagogique détaillé utilisable sur le terrain.

## Acceptance Criteria

**AC1 — Tables `criteria`, `faults`, `cues` créées**
- **Given** les tables de Story 3.1 existent (`theme_sequences`)
- **When** la migration Story 3.2 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES theme_sequences(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    label TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE faults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criterion_id UUID NOT NULL REFERENCES criteria(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    label TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE cues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fault_id UUID NOT NULL REFERENCES faults(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    label TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```

**AC2 — Triggers d'intégrité tenant_id**
- **And** des triggers vérifient la cohérence `tenant_id` à chaque niveau de la chaîne :
  - `criteria.tenant_id` doit correspondre à `theme_sequences.tenant_id`
  - `faults.tenant_id` doit correspondre à `criteria.tenant_id`
  - `cues.tenant_id` doit correspondre à `faults.tenant_id`

**AC3 — RLS activé**
- **And** RLS est activé sur `criteria`, `faults`, `cues` avec policy `tenant_id = current_tenant_id()` (RBAC complet couvert par Story 2.6 : admin=ALL, coach=SELECT)

**AC4 — Migration propre**
- **And** `supabase db diff` reste clean après migration

## Tasks / Subtasks

- [ ] Task 1 — Migration `00006_referentiel_criteria.sql` (AC: #1, #2, #3)
  - [ ] 1.1 Créer `supabase/migrations/00006_referentiel_criteria.sql` avec les 3 tables + indexes + triggers
  - [ ] 1.2 Activer RLS sur les 3 tables
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #3)
  - [ ] 2.1 Compléter la section Story 2.6 : ajouter policies pour `criteria`, `faults`, `cues` (admin=ALL, coach=SELECT)

- [ ] Task 3 — Types TypeScript (AC: #1)
  - [ ] 3.1 Ajouter `Criterion`, `Fault`, `Cue` dans `packages/types/src/entities.ts`

- [ ] Task 4 — `@aureak/api-client` : CRUD critères/faults/cues (AC: #1)
  - [ ] 4.1 Créer `packages/api-client/src/referentiel/criteria.ts` avec CRUD pour les 3 entités
  - [ ] 4.2 Exporter depuis `packages/api-client/src/index.ts`

- [ ] Task 5 — UI Admin (web) (AC: #1)
  - [ ] 5.1 Enrichir `apps/web/app/(admin)/referentiel/themes/[themeKey]/page.tsx` avec les séquences → critères → fautes → cues imbriqués (arbre accordéon)

## Dev Notes

### Migration `00006_referentiel_criteria.sql`

```sql
-- Story 3.2 — Critères → Faults → Cues

CREATE TABLE criteria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES theme_sequences(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX criteria_seq_idx ON criteria (sequence_id, sort_order);

CREATE TABLE faults (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  label        TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX faults_criterion_idx ON faults (criterion_id, sort_order);

CREATE TABLE cues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id    UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cues_fault_idx ON cues (fault_id, sort_order);

-- Trigger d'intégrité tenant criteria
CREATE OR REPLACE FUNCTION enforce_criteria_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM theme_sequences WHERE id = NEW.sequence_id) != NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_sequences.tenant_id (sequence_id=%)', NEW.sequence_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_criteria_tenant BEFORE INSERT OR UPDATE ON criteria
  FOR EACH ROW EXECUTE FUNCTION enforce_criteria_tenant();

-- Trigger d'intégrité tenant faults
CREATE OR REPLACE FUNCTION enforce_faults_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM criteria WHERE id = NEW.criterion_id) != NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match criteria.tenant_id (criterion_id=%)', NEW.criterion_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_faults_tenant BEFORE INSERT OR UPDATE ON faults
  FOR EACH ROW EXECUTE FUNCTION enforce_faults_tenant();

-- Trigger d'intégrité tenant cues
CREATE OR REPLACE FUNCTION enforce_cues_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM faults WHERE id = NEW.fault_id) != NEW.tenant_id THEN
    RAISE EXCEPTION 'cues.tenant_id must match faults.tenant_id (fault_id=%)', NEW.fault_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_cues_tenant BEFORE INSERT OR UPDATE ON cues
  FOR EACH ROW EXECUTE FUNCTION enforce_cues_tenant();

ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE faults   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cues     ENABLE ROW LEVEL SECURITY;
```

### Types TypeScript

```typescript
// packages/types/src/entities.ts — ajouts Story 3.2
export type Criterion = {
  id          : string
  sequenceId  : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

export type Fault = {
  id          : string
  criterionId : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

export type Cue = {
  id          : string
  faultId     : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}
```

### Pièges courants

1. **ON DELETE CASCADE** sur `criteria → faults → cues` : si une séquence est supprimée, ses critères et toute la chaîne sont supprimés. C'est voulu — les critères n'ont pas de sens sans leur séquence.
2. **Pas de soft-delete** sur ces tables : liées à une version figée de thème. Si une version est archivée, la chaîne reste pour historique.
3. **Triggers SECURITY DEFINER** : `SET search_path = public` obligatoire (convention projet).

### Dépendances

- **Prérequis** : Story 3.1 (`theme_sequences`) + Story 2.2 (helpers RLS) + Story 2.6 (policies référentiel)
- **À compléter en Story 8.5** : `criteria.label` est utilisé pour grouper les questions manquées par critère (rapport coach)

### References

- [Source: epics.md#Story-3.2] — lignes 956–1013

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
### Completion Notes List
### File List

- supabase/migrations/00006_referentiel_criteria.sql
- supabase/migrations/00010_rls_policies.sql (policies criteria, faults, cues ajoutées)
- packages/types/src/entities.ts (Criterion, Fault, Cue ajoutés)
- packages/api-client/src/referentiel/criteria.ts
- packages/api-client/src/index.ts (exports criteria ajoutés)
- apps/web/app/(admin)/referentiel/themes/[themeKey]/page.tsx (bouton "Critères" par séquence)
- apps/web/app/(admin)/referentiel/themes/[themeKey]/sequences/[sequenceId]/page.tsx (arbre critères→fautes→cues)
- apps/web/app/(admin)/_layout.tsx (route sequences/[sequenceId] ajoutée)

### Status

review
