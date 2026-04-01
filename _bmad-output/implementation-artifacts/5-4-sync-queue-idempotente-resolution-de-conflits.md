# Story 5.4 : Sync Queue Idempotente & Résolution de Conflits

Status: done

## Story

En tant que système,
Je veux traiter la queue de sync de façon idempotente et résoudre les conflits selon la règle MVP définie,
Afin que la synchronisation soit fiable, que les données ne soient jamais perdues, et que les conflits soient tracés sans ambiguïté.

## Acceptance Criteria

**AC1 — Traitement ordonné**
- **When** le réseau devient disponible
- **Then** `SyncQueueService.processPending()` itère les opérations `created_at ASC` et appelle `apply_event()` pour chacune

**AC2 — Idempotency**
- **And** `apply_event()` garantit l'idempotency via `processed_operations` — réponse `idempotent: true` sans erreur

**AC3 — Gestion des erreurs**
- **And** succès : `sync_queue.status = 'done'`, `local_attendances.synced = 1`
- **And** erreur récupérable (500, timeout) : `status = 'failed'`, `retry_count++`, max 5 tentatives

**AC4 — Règle de priorité conflits MVP**
- **And** si `apply_event()` détecte une valeur différente dans le snapshot courant :
  - Actor = lead coach → `lead_wins` : valeur entrante écrase ; `event_type = 'ATTENDANCE_CONFLICT_RESOLVED'`
  - Sinon → `server_wins` : opération ignorée (`status = 'done'`) ; conflit loggué dans `event_log`

**AC5 — Badge UI "à vérifier"**
- **And** badge affiché sur la fiche séance si ≥ 1 `ATTENDANCE_CONFLICT_RESOLVED` pour cette session

## Tasks / Subtasks

- [ ] Task 1 — `SyncQueueService.processPending()` dans `@aureak/business-logic` (AC: #1–#3)
  - [ ] 1.1 Implémenter `processPending()` dans `packages/business-logic/src/sync/SyncQueueService.ts`
  - [ ] 1.2 Appeler `applyAttendanceEvent()` (Story 5.2) pour chaque opération pending
  - [ ] 1.3 Gérer les erreurs et retries (max 5)

- [ ] Task 2 — Logique de conflit dans `apply_event()` (AC: #4)
  - [ ] 2.1 Enrichir `apply_event()` RPC pour détecter les conflits et appliquer la règle lead_wins/server_wins
  - [ ] 2.2 Logguer `ATTENDANCE_CONFLICT_RESOLVED` dans `event_log`

- [ ] Task 3 — Badge "à vérifier" (AC: #5)
  - [ ] 3.1 Ajouter colonne `conflicts_reviewed_at TIMESTAMPTZ` sur `sessions` (ALTER TABLE)
  - [ ] 3.2 Dans la fiche séance, query `event_log` pour détecter les conflits non reviewés
  - [ ] 3.3 Afficher badge UI si conflit détecté

- [ ] Task 4 — Tests (AC: #1–#4)
  - [ ] 4.1 Test Vitest : conflit lead_wins écrase la valeur serveur
  - [ ] 4.2 Test Vitest : conflit server_wins ignore l'opération entrante
  - [ ] 4.3 Test Vitest : retry après 500 incrémente retry_count

## Dev Notes

### `processPending()` complet

```typescript
// packages/business-logic/src/sync/SyncQueueService.ts (suite)
async processPending(): Promise<{ synced: number; failed: number }> {
  const pending = await this.getLocalPending()
  let synced = 0, failed = 0

  for (const op of pending) {
    const payload = JSON.parse(op.payload)
    try {
      const result = await applyAttendanceEvent({
        operationId: op.operation_id,
        sessionId  : payload.session_id,
        childId    : payload.child_id,
        newStatus  : payload.new_status,
        occurredAt : payload.occurred_at,
        deviceId   : payload.device_id,
        source     : payload.source,
      })

      if (result.idempotent || result.snapshot) {
        await this.markSynced(op.operation_id)
        // Mettre à jour SQLite local
        await this.db.runAsync(
          `UPDATE local_attendances SET synced = 1 WHERE operation_id = ?`,
          [op.operation_id]
        )
        synced++
      }
    } catch (err) {
      const retryCount = await this.getRetryCount(op.operation_id)
      if (retryCount >= 5) {
        await this.markFailed(op.operation_id, `Max retries exceeded: ${err}`)
      } else {
        await this.markFailed(op.operation_id, String(err))
      }
      failed++
    }
  }

  return { synced, failed }
}
```

### Logique conflit dans `apply_event()` (extension)

```sql
-- À ajouter dans apply_event() après l'upsert de l'attendance
-- Si la valeur existante est différente de la nouvelle : conflit détecté
DECLARE
  v_existing_status TEXT;
  v_is_lead         BOOLEAN;
BEGIN
  -- Récupérer le statut existant avant upsert
  SELECT status INTO v_existing_status
  FROM attendances
  WHERE session_id = (p_event->'payload'->>'session_id')::uuid
    AND child_id   = (p_event->'payload'->>'child_id')::uuid;

  IF v_existing_status IS NOT NULL
     AND v_existing_status != (p_event->'payload'->>'new_status') THEN
    -- Vérifier si l'actor est le lead coach
    SELECT EXISTS(
      SELECT 1 FROM session_coaches
      WHERE session_id = (p_event->'payload'->>'session_id')::uuid
        AND coach_id = auth.uid() AND role = 'lead'
    ) INTO v_is_lead;

    IF v_is_lead THEN
      -- lead_wins : continuer l'upsert (déjà fait), logguer conflit
      INSERT INTO event_log (...event_type = 'ATTENDANCE_CONFLICT_RESOLVED',
        payload = payload || '{"conflict_rule":"lead_wins","old_server_status":"' || v_existing_status || '"}'...)
    ELSE
      -- server_wins : annuler l'upsert — restaurer l'ancien statut
      UPDATE attendances SET status = v_existing_status
      WHERE session_id = ... AND child_id = ...;
      INSERT INTO event_log (...event_type = 'ATTENDANCE_CONFLICT_RESOLVED',
        payload = ... || '{"conflict_rule":"server_wins"}' ...)
    END IF;
  END IF;
END;
```

### Colonne `conflicts_reviewed_at` sur `sessions`

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS conflicts_reviewed_at TIMESTAMPTZ;
```

### Dépendances

- **Prérequis** : Stories 5.1 (SyncQueueService) + 5.2 (apply_event) + 5.3 (enqueue)
- **Utilisé en Story 5.5** : `ATTENDANCE_CONFLICT_RESOLVED` events affichés dans la timeline admin

### References
- [Source: epics.md#Story-5.4] — lignes 1805–1824

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
