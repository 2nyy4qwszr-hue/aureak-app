# Story 5.5 : Timeline Admin & Restauration via `event_log`

Status: done

## Story

En tant qu'Admin,
Je veux consulter l'historique complet des modifications de présence pour une séance/un enfant, filtrer par source et restaurer une valeur antérieure,
Afin d'avoir une traçabilité totale et de pouvoir corriger toute erreur sans jamais supprimer d'historique.

## Acceptance Criteria

**AC1 — Timeline des événements**
- **When** l'Admin ouvre la timeline d'une présence
- **Then** snapshot courant (`attendances`) + liste ordonnée des événements (`event_log`) affichés avec `event_type`, `occurred_at`, `actor_id` (nom), `source`, `payload.old_status → new_status`, `device_id`

**AC2 — Filtres**
- **And** filtres par `source` (field/admin/sync) et plage de dates

**AC3 — Restauration**
- **And** l'Admin sélectionne un événement passé et clique "Restaurer" → `apply_event()` avec `event_type = 'ATTENDANCE_RESTORED'`, `source = 'admin'`, `payload.restored_from_event_id`
- **And** historique antérieur préservé intégralement — jamais modifié

**AC4 — Badge "à vérifier" résolu**
- **And** `sessions.conflicts_reviewed_at` mis à jour après review des conflits → badge disparaît

## Tasks / Subtasks

- [ ] Task 1 — Query timeline dans `@aureak/api-client` (AC: #1, #2)
  - [ ] 1.1 Créer `packages/api-client/src/sessions/timeline.ts` : `getAttendanceTimeline(sessionId, childId, filters?)`
  - [ ] 1.2 JOIN `event_log` + `profiles` pour le nom de l'actor

- [ ] Task 2 — RPC `restore_attendance` (AC: #3)
  - [ ] 2.1 Créer une RPC qui appelle `apply_event()` avec les paramètres de restauration

- [ ] Task 3 — RPC `mark_conflicts_reviewed` (AC: #4)
  - [ ] 3.1 UPDATE `sessions.conflicts_reviewed_at = now()` sécurisé admin-only

- [ ] Task 4 — UI Admin web (AC: #1–#4)
  - [ ] 4.1 Créer `apps/web/app/(admin)/sessions/[sessionId]/timeline.tsx` — vue timeline avec filtres + bouton restaurer

## Dev Notes

### Query timeline

```typescript
// packages/api-client/src/sessions/timeline.ts
export async function getAttendanceTimeline(
  sessionId: string,
  childId  : string,
  filters? : { source?: string; from?: string; to?: string }
) {
  // Snapshot courant
  const { data: snapshot } = await supabase
    .from('attendances')
    .select('*, profiles!recorded_by(first_name, last_name)')
    .eq('session_id', sessionId)
    .eq('child_id', childId)
    .single()

  // Historique événements
  let query = supabase
    .from('event_log')
    .select('*, profiles!actor_id(first_name, last_name)')
    .eq('tenant_id', getCurrentTenantId())
    .eq('entity_type', 'attendance')
    .order('occurred_at', { ascending: false })

  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.from)   query = query.gte('occurred_at', filters.from)
  if (filters?.to)     query = query.lte('occurred_at', filters.to)

  const { data: events } = await query

  return { snapshot, events: events ?? [] }
}
```

### RPC `restore_attendance`

```sql
CREATE OR REPLACE FUNCTION restore_attendance(
  p_event_id     UUID,   -- événement à restaurer
  p_operation_id UUID    -- clé idempotency
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event event_log%ROWTYPE;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  SELECT * INTO v_event FROM event_log WHERE id = p_event_id;

  RETURN apply_event(jsonb_build_object(
    'operation_id', p_operation_id,
    'tenant_id'   , current_tenant_id(),
    'entity_type' , 'attendance',
    'entity_id'   , v_event.entity_id,
    'event_type'  , 'ATTENDANCE_RESTORED',
    'source'      , 'admin',
    'occurred_at' , now(),
    'payload'     , jsonb_build_object(
      'session_id'              , v_event.payload->>'session_id',
      'child_id'                , v_event.payload->>'child_id',
      'new_status'              , v_event.payload->>'new_status',
      'restored_from_event_id'  , p_event_id
    )
  ));
END; $$;
REVOKE ALL ON FUNCTION restore_attendance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION restore_attendance TO authenticated;
```

### Composant Timeline (web)

```typescript
// apps/web/app/(admin)/sessions/[sessionId]/timeline.tsx
const eventTypeLabels = {
  ATTENDANCE_SET              : 'Présence enregistrée',
  ATTENDANCE_RESTORED         : 'Valeur restaurée',
  ATTENDANCE_CONFLICT_RESOLVED: 'Conflit résolu',
}

const sourceLabels = {
  field: 'Terrain',
  admin: 'Admin',
  sync : 'Sync offline',
}
```

### Dépendances

- **Prérequis** : Stories 5.2 (event_log, apply_event) + 5.4 (conflicts_reviewed_at)

### References
- [Source: epics.md#Story-5.5] — lignes 1828–1846

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
