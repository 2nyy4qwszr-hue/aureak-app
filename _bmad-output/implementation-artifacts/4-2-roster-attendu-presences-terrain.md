# Story 4.2 : Roster Attendu & Présences Terrain

Status: done

## Story

En tant que développeur,
Je veux modéliser séparément le roster attendu (pré-rempli) et les présences réelles terrain, en autorisant les ajouts de dernière minute,
Afin que la liste attendue reste immuable après clôture et que les statistiques reflètent toujours la réalité terrain.

## Acceptance Criteria

**AC1 — Tables `session_attendees`, `attendances`, `coach_presence_confirmations`, `block_checkins`**
- **Given** les tables de Story 4.1 existent
- **When** la migration Story 4.2 est exécutée
- **Then** les tables suivantes existent avec les colonnes exactes définies dans epics.md

**AC2 — Pré-remplissage roster**
- **And** `session_attendees` est pré-rempli automatiquement depuis `group_members` lors de la création de séance (via trigger ou RPC)
- **And** un enfant absent du roster peut quand même avoir une attendance (`trial` ou invité)

**AC3 — Trigger `attendance_started_at`**
- **And** un trigger `BEFORE INSERT ON attendances` met à jour `sessions.attendance_started_at = now()` (si NULL) et passe `sessions.status = 'en_cours'`

**AC4 — Audit confirmation coach**
- **And** la confirmation de présence coach est journalisée dans `audit_logs`

**AC5 — RLS et migration propre**
- **And** RLS activé sur toutes les tables
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00012_attendances.sql` (AC: #1–#3)
  - [ ] 1.1 Créer la migration avec les 4 tables + trigger `attendance_started_at`
  - [ ] 1.2 Créer le trigger `BEFORE INSERT ON attendances`
  - [ ] 1.3 Activer RLS sur toutes les tables

- [ ] Task 2 — RPC `prefill_session_attendees` (AC: #2)
  - [ ] 2.1 Créer une RPC SECURITY DEFINER qui insère dans `session_attendees` tous les `group_members` du groupe de la séance

- [ ] Task 3 — Policies RLS dans `00010_rls_policies.sql`
  - [ ] 3.1 `attendances` : coach de la session peut INSERT/SELECT, admin peut tout, club peut SELECT (pattern Story 2.5 — `child_id` via `club_child_links`)
  - [ ] 3.2 `session_attendees` : admin=ALL, coach=SELECT, parent=SELECT ses enfants

- [ ] Task 4 — Types TypeScript
  - [ ] 4.1 Ajouter `SessionAttendee`, `Attendance`, `CoachPresenceConfirmation`, `BlockCheckin`

- [ ] Task 5 — `@aureak/api-client`
  - [ ] 5.1 Créer `packages/api-client/src/sessions/attendances.ts`

## Dev Notes

### Migration `00012_attendances.sql`

```sql
CREATE TABLE session_attendees (
  session_id UUID NOT NULL REFERENCES sessions(id),
  child_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL,
  PRIMARY KEY (session_id, child_id)
);

CREATE TABLE attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  child_id    UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id   UUID NOT NULL,
  status      attendance_status NOT NULL,
  recorded_by UUID NOT NULL REFERENCES profiles(user_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at   TIMESTAMPTZ,
  UNIQUE (session_id, child_id)
);
CREATE INDEX attendances_session_idx ON attendances (session_id, tenant_id);

CREATE TABLE coach_presence_confirmations (
  session_id   UUID NOT NULL REFERENCES sessions(id),
  coach_id     UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id    UUID NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id    TEXT,
  PRIMARY KEY (session_id, coach_id)
);

CREATE TABLE block_checkins (
  session_block_id UUID NOT NULL REFERENCES session_blocks(id),
  coach_id         UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID NOT NULL,
  checked_in_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_block_id, coach_id)
);

-- Trigger : première attendance → session en_cours
CREATE OR REPLACE FUNCTION trg_attendance_start_session()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE sessions
  SET
    attendance_started_at = COALESCE(attendance_started_at, now()),
    status = CASE WHEN status = 'planifiée' THEN 'en_cours' ELSE status END
  WHERE id = NEW.session_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_attendance_start
  AFTER INSERT ON attendances
  FOR EACH ROW EXECUTE FUNCTION trg_attendance_start_session();

ALTER TABLE session_attendees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_presence_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_checkins              ENABLE ROW LEVEL SECURITY;
```

### RPC `prefill_session_attendees`

```sql
CREATE OR REPLACE FUNCTION prefill_session_attendees(p_session_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group_id  UUID;
  v_tenant_id UUID;
  v_count     INT;
BEGIN
  SELECT group_id, tenant_id INTO v_group_id, v_tenant_id
  FROM sessions WHERE id = p_session_id AND tenant_id = current_tenant_id();

  INSERT INTO session_attendees (session_id, child_id, tenant_id)
  SELECT p_session_id, child_id, v_tenant_id
  FROM group_members WHERE group_id = v_group_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
REVOKE ALL ON FUNCTION prefill_session_attendees FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prefill_session_attendees TO authenticated;
```

### Audit confirmation coach

```typescript
// Dans createCoachPresenceConfirmation() de api-client
await supabase.from('audit_logs').insert({
  entity_type: 'coach_presence',
  entity_id  : sessionId,
  action     : 'coach_presence_confirmed',
  metadata   : { coach_id: coachId, session_id: sessionId, confirmed_at: new Date().toISOString() }
})
```

### Dépendances

- **Prérequis** : Story 4.1 (sessions, groups, session_blocks)
- **À compléter en Story 5.1** : `sync_queue` + colonnes event sourcing sur `attendances`
- **À compléter en Story 5.2** : `last_event_id`, `updated_by`, `updated_at` ajoutés via ALTER TABLE

### References
- [Source: epics.md#Story-4.2] — lignes 1354–1411

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
