# Story 8.4 : Streaks, Révision Espacée & Déclenchement Événements Gamification

Status: ready-for-dev

## Story

En tant que système,
Je veux mettre à jour les streaks et la révision espacée à la finalisation d'une tentative, et notifier la couche gamification (Epic 12) via RPC pour attribution de badges,
Afin que la logique d'apprentissage reste découplée de la logique de récompenses.

## Acceptance Criteria

**AC1 — Mise à jour streak**
- **When** `finalize_attempt(attempt_id)` est appelée avec `mastery_status = 'acquired'`
- **Then** `player_progress.current_streak` incrémenté si `last_activity_at::date >= current_date - 1` ; reset à 1 si gap > 1 jour
- **And** `max_streak` mis à jour si `current_streak > max_streak`
- **And** `themes_acquired_count` incrémenté
- **And** `last_activity_at = now()`

**AC2 — Révision espacée planifiée**
- **And** `learning_attempts.review_due_at = ended_at + INTERVAL '14 days'` (configurable `tenants.config->>'review_interval_days'`)
- **And** Edge Function cron `review-reminder` (daily 9h) : détecte `review_due_at::date = current_date`, envoie push parent + enfant
- **And** notification loguée dans `notification_send_logs` (`event_type = 'review_due'`, `urgency = 'routine'`)

**AC3 — Découplage gamification**
- **And** `finalize_attempt()` appelle `award_badge_if_applicable(child_id, event_type, ref_id, context, operation_id)` (Epic 12)
- **And** `event_type = 'QUIZ_MASTERED'` si `attempt_type = 'post_session'`
- **And** `event_type = 'SKILL_MASTERED'` si `attempt_type = 'revalidation'`
- **And** Epic 8 n'écrit jamais directement dans `player_badges` ou `player_points_ledger`

**AC4 — Non-acquisition**
- **And** si `mastery_status = 'not_acquired'` : aucun événement gamification ; `player_progress` non modifié sauf `last_activity_at`

**AC5 — Couverture FRs**
- **And** FR76 couvert : calcul progression par thème via `player_progress.themes_acquired_count`
- **And** FR-P8 couvert : progression calculée incrémentalement à chaque clôture

## Tasks / Subtasks

- [ ] Task 1 — Enrichir `finalize_attempt` avec logique streak (AC: #1)
  - [ ] 1.1 Logique streak complète dans `finalize_attempt` RPC (Story 8.2 crée la RPC stub)

- [ ] Task 2 — Révision espacée configurable (AC: #2)
  - [ ] 2.1 Lire `tenants.config->>'review_interval_days'` dans `finalize_attempt`
  - [ ] 2.2 Créer Edge Function `review-reminder` (cron daily 9h)
  - [ ] 2.3 Notification via `send-notification` (Story 7.1)

- [ ] Task 3 — Intégration gamification (AC: #3)
  - [ ] 3.1 Appel `award_badge_if_applicable` dans `finalize_attempt` (activer après déploiement Epic 12)
  - [ ] 3.2 Passer `context = { session_id, theme_id, ended_at, current_streak }`

## Dev Notes

### Logique streak dans `finalize_attempt`

```sql
-- Extension de finalize_attempt (Story 8.2) :
-- Section streak (uniquement si mastery_status = 'acquired')

DECLARE
  v_last_activity DATE;
  v_new_streak INT;
BEGIN
  SELECT last_activity_at::date INTO v_last_activity
  FROM player_progress WHERE child_id = v_attempt.child_id;

  IF v_last_activity IS NULL OR v_last_activity < current_date - 1 THEN
    v_new_streak := 1;
  ELSE
    SELECT current_streak + 1 INTO v_new_streak
    FROM player_progress WHERE child_id = v_attempt.child_id;
  END IF;

  INSERT INTO player_progress (child_id, tenant_id, current_streak, max_streak, themes_acquired_count, last_activity_at, updated_at)
  VALUES (v_attempt.child_id, v_attempt.tenant_id, v_new_streak, v_new_streak, 1, now(), now())
  ON CONFLICT (child_id) DO UPDATE SET
    current_streak = v_new_streak,
    max_streak = GREATEST(player_progress.max_streak, v_new_streak),
    themes_acquired_count = player_progress.themes_acquired_count + 1,
    last_activity_at = now(),
    updated_at = now();
END;
```

### Edge Function `review-reminder` (cron daily 9h)

```typescript
// supabase/functions/review-reminder/index.ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Tentatives avec révision due aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const { data: dueAttempts } = await supabase
    .from('learning_attempts')
    .select('child_id, theme_id, tenant_id, themes(name)')
    .eq('mastery_status', 'acquired')
    .is('reviewed_at', null)
    .lte('review_due_at', `${today}T23:59:59Z`)

  for (const attempt of dueAttempts ?? []) {
    // Envoyer notification enfant + parent via send-notification
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        tenantId   : attempt.tenant_id,
        recipientId: attempt.child_id,
        eventType  : 'review_due',
        referenceId: attempt.child_id,
        urgency    : 'routine',
        title      : `Révision à faire !`,
        body       : `Il est temps de revalider "${attempt.themes?.name}" !`,
      })
    })
  }

  return new Response(JSON.stringify({ processed: dueAttempts?.length ?? 0 }))
})
```

### Dépendances

- **Prérequis** : Story 8.2 (finalize_attempt stub) + Story 7.1 (send-notification) + Story 12.2 (award_badge_if_applicable — Epic 12)
- **Note** : L'appel `award_badge_if_applicable` doit être activé après déploiement Epic 12. Pendant Epic 8, la ligne est présente mais commentée avec un `TODO: activate after Epic 12`.

### References
- [Source: epics.md#Story-8.4] — lignes 2392–2426

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
