# Story 12.2 : Event Bus Gamification — Traitement des 4 Événements Déclencheurs

Status: done

## Story

En tant que système,
Je veux une fonction centralisée `award_badge_if_applicable()` qui traite les 4 événements déclencheurs et orchestre les mises à jour de tous les éléments de l'univers joueur,
Afin que chaque événement d'apprentissage produise exactement les bonnes récompenses, sans duplication, avec idempotency garantie.

## Acceptance Criteria

**AC1 — Idempotency via `processed_operations`**
- **When** `award_badge_if_applicable(child_id, event_type, ref_id, context, operation_id)` est appelée
- **Then** si `operation_id` déjà traité → retourne `{idempotent: true}`

**AC2 — Attribution badges par event_type**
- **And** table de mapping event_type → badges potentiels (voir tableau Dev Notes)
- **And** `INSERT INTO player_badges ON CONFLICT DO NOTHING`

**AC3 — Items cosmétiques**
- **And** après attribution badge → `check_and_award_items(child_id)` vérifie `avatar_items.unlock_condition`
- **And** `INSERT INTO player_unlocked_items ON CONFLICT DO NOTHING`

**AC4 — `player_theme_mastery` upsert**
- **And** `QUIZ_MASTERED` → `mastery_status = 'acquired'`, `first_acquired_at`
- **And** `SKILL_MASTERED` → `mastery_status = 'revalidated'`, `review_count++`
- **And** skill card attribuée si condition remplie

**AC5 — Pas d'écriture directe dans `player_points_ledger`**
- **And** le trigger `after_player_badge_insert` s'en charge

**AC6 — Couverture**
- **And** retourne `{ badges_awarded: [{badge_id, code, label, points}], items_unlocked: [{item_id, slug}] }`

## Tasks / Subtasks

- [ ] Task 1 — RPC `award_badge_if_applicable` complète (AC: #1, #2, #5)
  - [ ] 1.1 Implémenter logique par event_type
  - [ ] 1.2 Idempotency via `processed_operations`
  - [ ] 1.3 `INSERT player_badges ON CONFLICT DO NOTHING`

- [ ] Task 2 — Fonction `check_and_award_items` (AC: #3)
  - [ ] 2.1 Évaluer chaque condition de `avatar_items.unlock_condition` non encore débloquée

- [ ] Task 3 — Upsert `player_theme_mastery` (AC: #4)
  - [ ] 3.1 Gestion QUIZ_MASTERED + SKILL_MASTERED
  - [ ] 3.2 Attribution skill cards

- [ ] Task 4 — Activer les appels stub depuis `finalize_attempt` (AC: #1)
  - [ ] 4.1 Décommenter l'appel dans `finalize_attempt` (Story 8.4 TODO)
  - [ ] 4.2 Passer `context = { session_id, theme_id, ended_at, current_streak }`

## Dev Notes

### Tableau événements → badges

| Événement | Badge | Condition |
|---|---|---|
| `QUIZ_MASTERED` | `FIRST_ACQUIRED` | Aucun badge `FIRST_ACQUIRED` existant pour ce child |
| `QUIZ_MASTERED` | `EARLY_BIRD` | `context.ended_at <= session.closed_at + 72h` |
| `QUIZ_MASTERED` | `STREAK_3` | `player_progress.current_streak >= 3` |
| `QUIZ_MASTERED` | `STREAK_7` | `player_progress.current_streak >= 7` |
| `SKILL_MASTERED` | `SKILL_REVALIDATED` | `context.attempt_type = 'revalidation'` |
| `SESSION_ATTENDED` | *(badges Admin custom)* | configurable |
| `COACH_AWARD` | badge_id fourni explicitement | Admin déclenche |
| `SPECIAL_EVENT` | badge_id fourni explicitement | Admin déclenche |

### RPC `award_badge_if_applicable`

```sql
CREATE OR REPLACE FUNCTION award_badge_if_applicable(
  p_child_id     UUID,
  p_event_type   TEXT,
  p_ref_id       UUID,
  p_context      JSONB DEFAULT '{}',
  p_operation_id UUID DEFAULT gen_random_uuid()
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
  v_badges_awarded JSONB := '[]'::JSONB;
  v_items_unlocked JSONB := '[]'::JSONB;
  v_badge RECORD;
BEGIN
  -- Idempotency
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;

  -- Traiter QUIZ_MASTERED
  IF p_event_type = 'QUIZ_MASTERED' THEN
    -- FIRST_ACQUIRED
    IF NOT EXISTS (
      SELECT 1 FROM player_badges pb
      JOIN badge_definitions bd ON bd.id = pb.badge_id
      WHERE pb.child_id = p_child_id AND bd.code = 'FIRST_ACQUIRED' AND bd.tenant_id = v_tenant_id
    ) THEN
      INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
      SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
      FROM badge_definitions WHERE code = 'FIRST_ACQUIRED' AND tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING
      RETURNING badge_id INTO v_badge;
    END IF;

    -- STREAK_3
    IF (SELECT current_streak FROM player_progress WHERE child_id = p_child_id) >= 3 THEN
      INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
      SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
      FROM badge_definitions WHERE code = 'STREAK_3' AND tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;

    -- STREAK_7
    IF (SELECT current_streak FROM player_progress WHERE child_id = p_child_id) >= 7 THEN
      INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
      SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
      FROM badge_definitions WHERE code = 'STREAK_7' AND tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;

    -- Upsert player_theme_mastery
    INSERT INTO player_theme_mastery (child_id, theme_id, tenant_id, mastery_status, first_acquired_at, last_attempt_at, total_attempts, updated_at)
    VALUES (p_child_id, (p_context->>'theme_id')::uuid, v_tenant_id, 'acquired', now(), now(), 1, now())
    ON CONFLICT (child_id, theme_id) DO UPDATE SET
      mastery_status = 'acquired',
      first_acquired_at = COALESCE(player_theme_mastery.first_acquired_at, now()),
      last_attempt_at = now(),
      total_attempts = player_theme_mastery.total_attempts + 1,
      updated_at = now();

    -- Skill card
    INSERT INTO player_skill_cards (child_id, skill_card_id, tenant_id)
    SELECT p_child_id, sc.id, v_tenant_id
    FROM skill_cards sc
    WHERE sc.theme_id = (p_context->>'theme_id')::uuid
      AND sc.unlock_condition = 'theme_acquired'
      AND sc.tenant_id = v_tenant_id
    ON CONFLICT DO NOTHING;

  ELSIF p_event_type = 'SKILL_MASTERED' THEN
    INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
    SELECT v_tenant_id, p_child_id, id, 'skill_mastered', p_ref_id
    FROM badge_definitions WHERE code = 'SKILL_REVALIDATED' AND tenant_id = v_tenant_id
    ON CONFLICT DO NOTHING;

    UPDATE player_theme_mastery SET
      mastery_status = 'revalidated',
      review_count = review_count + 1,
      last_attempt_at = now(),
      updated_at = now()
    WHERE child_id = p_child_id AND theme_id = (p_context->>'theme_id')::uuid;

  ELSIF p_event_type IN ('COACH_AWARD','SPECIAL_EVENT') THEN
    -- Badge ID fourni explicitement dans p_context
    INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
    VALUES (v_tenant_id, p_child_id, (p_context->>'badge_id')::uuid,
      LOWER(p_event_type), p_ref_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Vérifier items cosmétiques à débloquer
  PERFORM check_and_award_items(p_child_id);

  -- Marquer opération traitée
  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (p_operation_id, v_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('badges_awarded', v_badges_awarded, 'items_unlocked', v_items_unlocked);
END;
$$;
REVOKE ALL ON FUNCTION award_badge_if_applicable FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_badge_if_applicable TO authenticated;
```

### Fonction `check_and_award_items`

```sql
CREATE OR REPLACE FUNCTION check_and_award_items(p_child_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item RECORD;
  v_pp player_progress%ROWTYPE;
BEGIN
  SELECT * INTO v_pp FROM player_progress WHERE child_id = p_child_id;

  FOR v_item IN
    SELECT ai.* FROM avatar_items ai
    WHERE ai.tenant_id = current_tenant_id()
      AND ai.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM player_unlocked_items
        WHERE child_id = p_child_id AND item_id = ai.id
      )
  LOOP
    IF (v_item.unlock_condition->>'type') = 'total_points'
      AND v_pp.total_points >= (v_item.unlock_condition->>'min_points')::int THEN
      INSERT INTO player_unlocked_items (child_id, item_id, unlock_trigger)
      VALUES (p_child_id, v_item.id, 'total_points')
      ON CONFLICT DO NOTHING;
    ELSIF (v_item.unlock_condition->>'type') = 'themes_acquired'
      AND v_pp.themes_acquired_count >= (v_item.unlock_condition->>'count')::int THEN
      INSERT INTO player_unlocked_items (child_id, item_id, unlock_trigger)
      VALUES (p_child_id, v_item.id, 'themes_acquired')
      ON CONFLICT DO NOTHING;
    -- Type 'badge' géré par check séparé
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION check_and_award_items FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_award_items TO authenticated;
```

### Dépendances

- **Prérequis** : Story 12.1 (toutes les tables gamification) + Story 8.4 (finalize_attempt stub avec TODO)
- **Activation** : Décommenter le call `award_badge_if_applicable` dans `finalize_attempt` (Story 8.4) après déploiement de cette story

### References
- [Source: epics.md#Story-12.2] — lignes 2677–2722

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
