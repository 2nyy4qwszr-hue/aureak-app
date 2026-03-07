# Story 4.1 : Modèle de Données — Sessions, Blocs & Récurrence

Status: ready-for-dev

## Story

En tant que développeur,
Je veux créer le modèle de données complet des séances avec blocs, récurrence, coaches et snapshot de versions de thèmes,
Afin que toutes les entités terrain soient modélisées sans ambiguïté et que l'historique des séances passées soit immuable.

## Acceptance Criteria

**AC1 — Tables créées**
- **Given** les migrations Epic 2 et Epic 3 appliquées
- **When** la migration Story 4.1 est exécutée
- **Then** les tables suivantes existent : `implantations`, `groups`, `group_members`, `session_blocks`, `recurrence_series`, `sessions`, `session_coaches`, `session_themes`, `session_situations`

**AC2 — Snapshot thème**
- **And** `session_themes.theme_id` référence `themes.id` (version précise figée au moment de la création) — une séance passée ne change jamais si le thème évolue

**AC3 — Unicité du lead coach**
- **And** `one_lead_per_session` interdit un 2e coach `lead` sur la même séance

**AC4 — Traçabilité exceptions récurrence**
- **And** `is_exception = true` + `original_session_id` tracent qu'une occurrence est une exception modifiée de la série d'origine

**AC5 — FK différées**
- **And** `coach_implantation_assignments.implantation_id` et `quick_auth_devices.implantation_id` reçoivent leurs FK vers `implantations(id)` via `ALTER TABLE ... ADD CONSTRAINT` dans cette migration

**AC6 — RLS et migration propre**
- **And** RLS activé sur toutes les tables avec `tenant_id = current_tenant_id()`
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00011_sessions.sql` (AC: #1–#5)
  - [ ] 1.1 Créer la migration complète (voir Dev Notes pour le SQL complet)
  - [ ] 1.2 Ajouter les FK différées vers `implantations` (Story 2.2 + Story 2.4)
  - [ ] 1.3 Activer RLS sur toutes les tables
  - [ ] 1.4 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #6)
  - [ ] 2.1 Ajouter les policies pour toutes les nouvelles tables :
    - `sessions` : admin=ALL, coach=SELECT ses sessions assignées (via `session_coaches`) ou implantation via grant (pattern Story 2.3)
    - `session_coaches` : admin=ALL, coach=SELECT ses propres assignations
    - `session_themes`, `session_situations` : admin=ALL, coach=SELECT
    - `implantations`, `groups`, `group_members` : admin=ALL, coach=SELECT (implantations assignées)

- [ ] Task 3 — Types TypeScript
  - [ ] 3.1 Ajouter `Implantation`, `Group`, `GroupMember`, `Session`, `SessionCoach`, `SessionTheme`, `SessionSituation`, `RecurrenceSeries`, `SessionBlock` dans `packages/types/src/entities.ts`
  - [ ] 3.2 Ajouter `SessionStatus = 'planifiée' | 'en_cours' | 'terminée' | 'annulée'`

- [ ] Task 4 — `@aureak/api-client` : CRUD de base
  - [ ] 4.1 Créer `packages/api-client/src/sessions/sessions.ts` avec `createSession()`, `getSession()`, `listSessionsByCoach()`, `updateSession()`, `cancelSession()`
  - [ ] 4.2 Créer `packages/api-client/src/sessions/implantations.ts` avec CRUD implantations + groupes

## Dev Notes

### Migration `00011_sessions.sql`

```sql
-- Story 4.1 — Modèle Sessions, Blocs, Récurrence

CREATE TABLE implantations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  address    TEXT,
  gps_lat    NUMERIC,
  gps_lon    NUMERIC,
  gps_radius INTEGER NOT NULL DEFAULT 300,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  name            TEXT NOT NULL,
  age_group       TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id   UUID NOT NULL REFERENCES groups(id),
  child_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, child_id)
);

CREATE TABLE session_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  date            DATE NOT NULL,
  label           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recurrence_series (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  rule       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  implantation_id          UUID NOT NULL REFERENCES implantations(id),
  group_id                 UUID NOT NULL REFERENCES groups(id),
  session_block_id         UUID REFERENCES session_blocks(id),
  recurrence_id            UUID REFERENCES recurrence_series(id),
  is_exception             BOOLEAN NOT NULL DEFAULT false,
  original_session_id      UUID REFERENCES sessions(id),
  scheduled_at             TIMESTAMPTZ NOT NULL,
  duration_minutes         INTEGER NOT NULL DEFAULT 90,
  location                 TEXT,
  status                   TEXT NOT NULL DEFAULT 'planifiée'
    CHECK (status IN ('planifiée','en_cours','terminée','annulée')),
  attendance_started_at    TIMESTAMPTZ,
  attendance_completed_at  TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  deleted_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_tenant_status ON sessions (tenant_id, status, scheduled_at);
CREATE INDEX sessions_implantation   ON sessions (implantation_id, scheduled_at);

CREATE TABLE session_coaches (
  session_id UUID NOT NULL REFERENCES sessions(id),
  coach_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL,
  role       TEXT NOT NULL DEFAULT 'lead' CHECK (role IN ('lead','assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, coach_id)
);
CREATE UNIQUE INDEX one_lead_per_session ON session_coaches (session_id) WHERE role = 'lead';

CREATE TABLE session_themes (
  session_id UUID NOT NULL REFERENCES sessions(id),
  theme_id   UUID NOT NULL REFERENCES themes(id),
  tenant_id  UUID NOT NULL,
  sort_order INTEGER,
  PRIMARY KEY (session_id, theme_id)
);

CREATE TABLE session_situations (
  session_id   UUID NOT NULL REFERENCES sessions(id),
  situation_id UUID NOT NULL REFERENCES situations(id),
  tenant_id    UUID NOT NULL,
  sort_order   INTEGER,
  PRIMARY KEY (session_id, situation_id)
);

-- FK différées : implantations existe maintenant
ALTER TABLE coach_implantation_assignments
  ADD CONSTRAINT fk_cia_implantation
  FOREIGN KEY (implantation_id) REFERENCES implantations(id);

ALTER TABLE quick_auth_devices
  ADD COLUMN IF NOT EXISTS implantation_id UUID,
  ADD CONSTRAINT fk_qad_implantation
  FOREIGN KEY (implantation_id) REFERENCES implantations(id);

-- Activer RLS
ALTER TABLE implantations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_coaches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_themes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_situations ENABLE ROW LEVEL SECURITY;
```

### Policies RLS `sessions` — pattern Story 2.3

```sql
-- Dans 00010_rls_policies.sql, section Story 4.1
CREATE POLICY "sessions_coach_assigned_or_granted" ON sessions
  FOR SELECT USING (
    tenant_id = current_tenant_id() AND is_active_user()
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM session_coaches sc
        WHERE sc.session_id = sessions.id AND sc.coach_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM coach_access_grants cag
        WHERE cag.coach_id = auth.uid()
          AND cag.implantation_id = sessions.implantation_id
          AND cag.expires_at > now() AND cag.revoked_at IS NULL
      )
    )
  );
```

### Règle de remplacement de lead coach

Le changement de lead doit être atomique (via RPC) pour respecter `one_lead_per_session` :
```sql
CREATE OR REPLACE FUNCTION change_session_lead(p_session_id UUID, p_new_lead_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE session_coaches SET role = 'assistant'
  WHERE session_id = p_session_id AND role = 'lead';
  INSERT INTO session_coaches (session_id, coach_id, tenant_id, role)
  VALUES (p_session_id, p_new_lead_id, current_tenant_id(), 'lead')
  ON CONFLICT (session_id, coach_id) DO UPDATE SET role = 'lead';
END; $$;
REVOKE ALL ON FUNCTION change_session_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION change_session_lead TO authenticated;
```

### Dépendances

- **Prérequis** : Epic 2 (profiles, grants) + Epic 3 (themes, situations)
- **À compléter en Story 4.2** : `session_attendees`, `attendances`, `coach_presence_confirmations`
- **À compléter en Story 9.4** : remplacement de la table `implantations` par celle de Story 9.4 (déjà définie ici — Story 9.4 enrichit avec `city`, `is_active`)

### References

- [Source: epics.md#Story-4.1] — lignes 1235–1350

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
