# Story 5.2 : Event Sourcing — `event_log`, Snapshot Attendance & `apply_event()`

Status: done

## Story

En tant que développeur,
Je veux implémenter un modèle event sourcing léger côté serveur : chaque modification d'attendance génère un événement immuable dans `event_log`, la table `attendances` sert de snapshot courant,
Afin de disposer d'un historique d'audit complet, d'une restauration possible sans suppression d'historique, et d'un socle réutilisable pour les évaluations (Epic 6).

## Acceptance Criteria

**AC1 — Table `event_log` créée**
- **When** la migration Story 5.2 est exécutée
- **Then** `event_log` existe avec `operation_id` unique (idempotency), `entity_type`, `event_type`, index sur `(tenant_id, entity_type, entity_id)`

**AC2 — Colonnes ajoutées à `attendances`**
- **And** `last_event_id`, `updated_by`, `updated_at` ajoutées via `ALTER TABLE`

**AC3 — RPC `apply_event()` complète**
- **And** la fonction gère l'idempotency via `processed_operations`, insère dans `event_log`, upsert dans `attendances`, retourne `{ snapshot, event_id }` ou `{ idempotent: true, snapshot }`

**AC4 — Point d'écriture unique**
- **And** `apply_event()` est le seul point d'écriture pour les modifications de présences — aucun UPDATE direct sur `attendances` depuis le client

**AC5 — RLS**
- **And** coach voit les événements de ses sessions ; admin voit tout le tenant

## Tasks / Subtasks

- [ ] Task 1 — Migration `00016_event_log.sql` (AC: #1, #2)
  - [ ] 1.1 Créer `event_log` + indexes
  - [ ] 1.2 `ALTER TABLE attendances ADD COLUMN last_event_id, updated_by, updated_at`
  - [ ] 1.3 Créer `apply_event()` RPC SECURITY DEFINER (code complet fourni dans epics.md)
  - [ ] 1.4 Activer RLS + policies

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #5)
  - [ ] 2.1 `event_log` : coach = SELECT ses sessions (via `session_coaches`), admin = ALL

- [ ] Task 3 — Tests d'intégration (AC: #3)
  - [ ] 3.1 Test Vitest : `apply_event()` crée un événement + upsert snapshot
  - [ ] 3.2 Test Vitest : 2ème appel avec même `operation_id` → retourne `idempotent: true`

## Dev Notes

### Migration `00016_event_log.sql`

```sql
CREATE TABLE event_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  actor_id     UUID NOT NULL REFERENCES auth.users(id),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  operation_id UUID NOT NULL,
  source       TEXT NOT NULL DEFAULT 'field'
    CHECK (source IN ('field','admin','sync','import')),
  device_id    TEXT
);
CREATE INDEX event_log_entity_idx ON event_log (tenant_id, entity_type, entity_id);
CREATE UNIQUE INDEX event_log_operation_id_idx ON event_log (operation_id);

ALTER TABLE attendances
  ADD COLUMN last_event_id UUID REFERENCES event_log(id),
  ADD COLUMN updated_by    UUID REFERENCES profiles(user_id),
  ADD COLUMN updated_at    TIMESTAMPTZ;

ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
```

### RPC `apply_event()` — code complet (copié exactement depuis epics.md)

```sql
CREATE OR REPLACE FUNCTION apply_event(p_event JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_operation_id UUID := (p_event->>'operation_id')::uuid;
  v_event_id     UUID;
  v_snapshot     JSONB;
BEGIN
  IF (p_event->>'tenant_id')::uuid != current_tenant_id() THEN
    RAISE EXCEPTION 'Tenant mismatch';
  END IF;
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = v_operation_id) THEN
    SELECT to_jsonb(a.*) INTO v_snapshot
    FROM attendances a WHERE id = (p_event->>'entity_id')::uuid;
    RETURN jsonb_build_object('idempotent', true, 'snapshot', v_snapshot);
  END IF;
  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type,
    payload, actor_id, occurred_at, operation_id, source, device_id
  ) VALUES (
    current_tenant_id(), p_event->>'entity_type',
    (p_event->>'entity_id')::uuid, p_event->>'event_type',
    p_event->'payload', auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_operation_id, COALESCE(p_event->>'source','field'), p_event->>'device_id'
  ) RETURNING id INTO v_event_id;
  INSERT INTO attendances (
    session_id, child_id, tenant_id, status,
    recorded_by, recorded_at, last_event_id, updated_by, updated_at
  ) VALUES (
    (p_event->'payload'->>'session_id')::uuid,
    (p_event->'payload'->>'child_id')::uuid,
    current_tenant_id(),
    p_event->'payload'->>'new_status',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_event_id, auth.uid(), now()
  )
  ON CONFLICT (session_id, child_id) DO UPDATE SET
    status        = EXCLUDED.status,
    last_event_id = EXCLUDED.last_event_id,
    updated_by    = EXCLUDED.updated_by,
    updated_at    = EXCLUDED.updated_at;
  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (v_operation_id, current_tenant_id());
  SELECT to_jsonb(a.*) INTO v_snapshot
  FROM attendances a
  WHERE session_id = (p_event->'payload'->>'session_id')::uuid
    AND child_id   = (p_event->'payload'->>'child_id')::uuid;
  RETURN jsonb_build_object('snapshot', v_snapshot, 'event_id', v_event_id);
END; $$;
REVOKE ALL ON FUNCTION apply_event(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_event(JSONB) TO authenticated;
```

### Appel `apply_event()` depuis le client

```typescript
// packages/api-client/src/sessions/attendances.ts
export async function applyAttendanceEvent(params: {
  operationId : string
  sessionId   : string
  childId     : string
  newStatus   : AttendanceStatus
  occurredAt  : string
  deviceId?   : string
  source?     : 'field' | 'admin' | 'sync'
}) {
  const { data, error } = await supabase.rpc('apply_event', {
    p_event: {
      operation_id: params.operationId,
      tenant_id   : getCurrentTenantId(),
      entity_type : 'attendance',
      entity_id   : `${params.sessionId}-${params.childId}`, // sera l'UUID attendance
      event_type  : 'ATTENDANCE_SET',
      occurred_at : params.occurredAt,
      source      : params.source ?? 'field',
      device_id   : params.deviceId,
      payload: {
        session_id : params.sessionId,
        child_id   : params.childId,
        new_status : params.newStatus,
        old_status : null,
      }
    }
  })
  if (error) throw error
  return data
}
```

### Dépendances

- **Prérequis** : Stories 4.2 (attendances) + 1.2 (processed_operations) + 5.1 (sync_queue)
- **Étendu en Story 6.1** : `apply_event()` gère aussi `entity_type = 'evaluation'`

### References
- [Source: epics.md#Story-5.2] — lignes 1667–1778

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
