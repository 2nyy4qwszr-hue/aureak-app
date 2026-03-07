# Story 9.4 : CRUD Implantations, Groupes & Assignations Coaches

Status: ready-for-dev

## Story

En tant que développeur,
Je veux créer le modèle de données et les APIs CRUD pour les implantations, les groupes de joueurs et les assignations coaches,
Afin que l'Admin puisse structurer l'organisation physique et humaine de son club.

## Acceptance Criteria

**AC1 — Tables créées**
- **When** la migration Story 9.4 est exécutée
- **Then** `implantations`, `groups`, `group_members`, `coach_implantation_assignments` sont créées
- **And** `sessions.implantation_id` colonne ajoutée

**AC2 — Soft-delete uniquement**
- **And** `is_active = false` pour désactivation — aucune suppression physique

**AC3 — RPC `bulk_assign_group_members`**
- **And** import en lot de joueurs dans un groupe avec `ON CONFLICT DO NOTHING`

**AC4 — RLS**
- **And** Admin peut créer/modifier/désactiver ; Coach voit ses implantations assignées en lecture seule

**AC5 — Couverture FRs**
- **And** FR43–FR44 couverts : CRUD structure organisationnelle + assignations coaches
- **And** `supabase db diff` reste clean

**Note importante** : `implantations` et `groups` sont référencés par Story 4.1 (sessions) mais définis ici en Story 9.4. Story 4.1 utilise des stub FK (`ALTER TABLE sessions ADD COLUMN group_id`, `implantation_id`) avec la note que la table est créée dans Story 9.4.

## Tasks / Subtasks

- [ ] Task 1 — Migration `00021_org_structure.sql` (AC: #1, #2)
  - [ ] 1.1 Créer `implantations` + RLS
  - [ ] 1.2 Créer `groups` + RLS
  - [ ] 1.3 Créer `group_members` + RLS
  - [ ] 1.4 Créer `coach_implantation_assignments` + RLS
  - [ ] 1.5 `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS implantation_id UUID REFERENCES implantations(id)`
  - [ ] 1.6 Ajouter FK back-fill pour `sessions.group_id REFERENCES groups(id)` (déclaré en Story 4.1)

- [ ] Task 2 — RPC `bulk_assign_group_members` (AC: #3)
  - [ ] 2.1 Créer RPC SECURITY DEFINER admin-only

- [ ] Task 3 — APIs CRUD api-client (AC: #2, #4)
  - [ ] 3.1 `createImplantation`, `updateImplantation`, `deactivateImplantation`
  - [ ] 3.2 `createGroup`, `updateGroup`, `deactivateGroup`
  - [ ] 3.3 `assignCoachToImplantation`, `unassignCoach`
  - [ ] 3.4 `addGroupMember`, `removeGroupMember`, `bulkAssignGroupMembers`

- [ ] Task 4 — UI Admin (AC: #2, #4)
  - [ ] 4.1 Pages CRUD implantations dans `apps/web/app/(admin)/implantations/`
  - [ ] 4.2 Pages CRUD groupes + membres
  - [ ] 4.3 Page assignation coaches

## Dev Notes

### Migration `00021_org_structure.sql`

```sql
-- Sites physiques du club
CREATE TABLE IF NOT EXISTS implantations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  address    TEXT,
  city       TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE implantations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON implantations
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON implantations
  FOR INSERT WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "admin_update" ON implantations
  FOR UPDATE USING (current_user_role() = 'admin');

-- Groupes de joueurs
CREATE TABLE IF NOT EXISTS groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  name            TEXT NOT NULL,
  age_group       TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON groups
  FOR ALL USING (tenant_id = current_tenant_id());

-- Membres des groupes
CREATE TABLE IF NOT EXISTS group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(user_id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at   TIMESTAMPTZ,
  UNIQUE (group_id, player_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON group_members
  FOR ALL USING (tenant_id = current_tenant_id());

-- Assignations coaches ↔ implantations
CREATE TABLE IF NOT EXISTS coach_implantation_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  coach_id        UUID NOT NULL REFERENCES profiles(user_id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at   TIMESTAMPTZ,
  UNIQUE (coach_id, implantation_id)
);
ALTER TABLE coach_implantation_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON coach_implantation_assignments
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON coach_implantation_assignments
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "coach_read_own" ON coach_implantation_assignments
  FOR SELECT USING (coach_id = auth.uid());

-- Rattacher sessions aux implantations (si pas déjà fait en Story 4.1)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS implantation_id UUID REFERENCES implantations(id);

-- Activer FK group_id sur sessions (déclaré en Story 4.1 comme stub)
-- ALTER TABLE sessions ADD CONSTRAINT fk_sessions_group
--   FOREIGN KEY (group_id) REFERENCES groups(id);
```

### RPC `bulk_assign_group_members`

```sql
CREATE OR REPLACE FUNCTION bulk_assign_group_members(p_group_id UUID, p_player_ids UUID[])
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
  v_count INT;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO group_members (tenant_id, group_id, player_id)
  SELECT v_tenant_id, p_group_id, unnest(p_player_ids)
  ON CONFLICT (group_id, player_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION bulk_assign_group_members FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bulk_assign_group_members TO authenticated;
```

### Note FK back-fill avec Story 4.1

Story 4.1 a déclaré `sessions.group_id UUID` et `coach_implantation_assignments` avec un commentaire `-- FK back-fill in Story 9.4`. Cette migration doit vérifier si la contrainte FK existe déjà avant de l'ajouter :

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sessions_group'
  ) THEN
    ALTER TABLE sessions ADD CONSTRAINT fk_sessions_group
      FOREIGN KEY (group_id) REFERENCES groups(id);
  END IF;
END;
$$;
```

### Dépendances

- **Prérequis** : Story 4.1 (sessions avec `group_id` stub) + Story 2.2 (profiles/RBAC)
- **Requis par** : Story 9.1 (dashboard), 9.2 (anomalies), 9.3 (comparaison)

### References
- [Source: epics.md#Story-9.4] — lignes 2978–3082

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
