# Story 8.2 : Moteur de Quiz Adaptatif (Stop Conditions & Maîtrise)

Status: ready-for-dev

## Story

En tant que système,
Je veux gérer le flux de tutorat adaptatif côté serveur : résolution du seuil de maîtrise applicable, sélection de questions, évaluation des conditions d'arrêt, et déclenchement de la gamification à la clôture de tentative,
Afin que chaque enfant reçoive exactement le nombre de questions nécessaire à sa maîtrise, pas plus.

## Acceptance Criteria

**AC1 — Sélection de questions**
- **When** une tentative est créée pour `(child_id, theme_id, session_id)`
- **Then** questions sélectionnées depuis `quiz_questions WHERE theme_id = X AND status = 'published'`, ordre aléatoire stable (seed = `attempt.id`), sans répétition

**AC2 — RPC `get_mastery_threshold(theme_id, age_group)`**
- **And** résolution par priorité : `theme_age_group` > `theme` > `age_group` > `global`

**AC3 — RPC `submit_answer(attempt_id, question_id, selected_option_id)`**
- **And** incrémente `questions_answered` + `correct_count`
- **And** calcule `mastery_percent = ROUND(correct_count::numeric / questions_answered * 100)`
- **And** évalue stop conditions :
  1. `mastery_percent >= threshold AND questions_answered >= 3` → `stop_reason = 'mastered'`
  2. Plus de questions → `stop_reason` selon `mastery_percent`
- **And** si arrêt : set `ended_at`, `mastery_status`, appelle `finalize_attempt(attempt_id)`
- **And** retourne `{ is_correct, mastery_percent, should_stop, stop_reason }`

**AC4 — RPC `finalize_attempt(attempt_id)`**
- **And** met à jour `player_progress` snapshot (streak, themes_acquired_count, last_activity_at)
- **And** schedule révision espacée si `mastery_status = 'acquired'`
- **And** appelle `award_badge_if_applicable(child_id, event_type, ref_id)` (Epic 12)

**AC5 — RPC `stop_attempt(attempt_id, stop_reason)`**
- **And** finalise avec `stop_reason = 'child_stopped'` et `mastery_status = 'not_acquired'`

**AC6 — Couverture FRs**
- **And** FR71 couvert : génération automatique quiz depuis thèmes séance

## Tasks / Subtasks

- [ ] Task 1 — RPC `get_mastery_threshold` (AC: #2)
  - [ ] 1.1 Créer RPC SECURITY DEFINER avec logique de priorité scope hiérarchique

- [ ] Task 2 — RPC `submit_answer` (AC: #3)
  - [ ] 2.1 Créer RPC avec INSERT `learning_answers` + UPDATE `learning_attempts`
  - [ ] 2.2 Logique stop conditions + appel `finalize_attempt` si arrêt

- [ ] Task 3 — RPC `finalize_attempt` (AC: #4)
  - [ ] 3.1 Créer RPC SECURITY DEFINER
  - [ ] 3.2 Update `player_progress` + set `review_due_at`
  - [ ] 3.3 Appel conditionnel `award_badge_if_applicable` (stub si Epic 12 pas encore déployé)

- [ ] Task 4 — RPC `stop_attempt` + `create_learning_attempt` (AC: #1, #5)
  - [ ] 4.1 RPC `create_learning_attempt(session_id, theme_id)` → INSERT + retourne attempt_id + premières questions
  - [ ] 4.2 RPC `stop_attempt(attempt_id, reason)`

## Dev Notes

### RPC `get_mastery_threshold`

```sql
CREATE OR REPLACE FUNCTION get_mastery_threshold(p_theme_id UUID, p_age_group TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_threshold INTEGER;
BEGIN
  -- Priorité : theme_age_group > theme > age_group > global
  SELECT threshold INTO v_threshold
  FROM mastery_thresholds
  WHERE tenant_id = current_tenant_id()
    AND scope_type = 'theme_age_group'
    AND theme_id = p_theme_id AND age_group = p_age_group
  LIMIT 1;
  IF FOUND THEN RETURN v_threshold; END IF;

  SELECT threshold INTO v_threshold FROM mastery_thresholds
  WHERE tenant_id = current_tenant_id() AND scope_type = 'theme' AND theme_id = p_theme_id LIMIT 1;
  IF FOUND THEN RETURN v_threshold; END IF;

  SELECT threshold INTO v_threshold FROM mastery_thresholds
  WHERE tenant_id = current_tenant_id() AND scope_type = 'age_group' AND age_group = p_age_group LIMIT 1;
  IF FOUND THEN RETURN v_threshold; END IF;

  SELECT threshold INTO v_threshold FROM mastery_thresholds
  WHERE tenant_id = current_tenant_id() AND scope_type = 'global' LIMIT 1;

  RETURN COALESCE(v_threshold, 80);  -- défaut 80% si aucun seuil configuré
END;
$$;
REVOKE ALL ON FUNCTION get_mastery_threshold FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_mastery_threshold TO authenticated;
```

### RPC `submit_answer`

```sql
CREATE OR REPLACE FUNCTION submit_answer(
  p_attempt_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_correct BOOLEAN;
  v_attempt learning_attempts%ROWTYPE;
  v_threshold INTEGER;
  v_mastery_percent INTEGER;
  v_should_stop BOOLEAN := false;
  v_stop_reason TEXT;
BEGIN
  -- Vérifier si la réponse est correcte
  SELECT is_correct INTO v_is_correct
  FROM quiz_options WHERE id = p_selected_option_id;

  -- Insérer la réponse
  INSERT INTO learning_answers (attempt_id, question_id, selected_option_id, is_correct)
  VALUES (p_attempt_id, p_question_id, p_selected_option_id, v_is_correct);

  -- Mettre à jour la tentative
  UPDATE learning_attempts SET
    questions_answered = questions_answered + 1,
    correct_count = correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  v_mastery_percent := ROUND(v_attempt.correct_count::numeric / v_attempt.questions_answered * 100);

  -- Récupérer le seuil applicable
  SELECT get_mastery_threshold(v_attempt.theme_id, (
    SELECT age_group FROM groups
    JOIN group_members gm ON gm.group_id = groups.id
    JOIN sessions s ON s.group_id = groups.id
    WHERE s.id = v_attempt.session_id
    LIMIT 1
  )) INTO v_threshold;

  -- Évaluer stop conditions
  IF v_mastery_percent >= v_threshold AND v_attempt.questions_answered >= 3 THEN
    v_should_stop := true;
    v_stop_reason := 'mastered';
  ELSE
    -- Vérifier si plus de questions disponibles
    IF NOT EXISTS (
      SELECT 1 FROM quiz_questions
      WHERE theme_id = v_attempt.theme_id AND status = 'published'
        AND id NOT IN (
          SELECT question_id FROM learning_answers WHERE attempt_id = p_attempt_id
        )
    ) THEN
      v_should_stop := true;
      v_stop_reason := CASE WHEN v_mastery_percent >= v_threshold THEN 'mastered' ELSE 'child_stopped' END;
    END IF;
  END IF;

  IF v_should_stop THEN
    UPDATE learning_attempts SET
      ended_at = now(),
      mastery_percent = v_mastery_percent,
      mastery_status = CASE WHEN v_stop_reason = 'mastered' THEN 'acquired' ELSE 'not_acquired' END,
      stop_reason = v_stop_reason
    WHERE id = p_attempt_id;

    PERFORM finalize_attempt(p_attempt_id);
  END IF;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'mastery_percent', v_mastery_percent,
    'should_stop', v_should_stop,
    'stop_reason', v_stop_reason
  );
END;
$$;
REVOKE ALL ON FUNCTION submit_answer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_answer TO authenticated;
```

### RPC `finalize_attempt`

```sql
CREATE OR REPLACE FUNCTION finalize_attempt(p_attempt_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_attempt learning_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_attempt FROM learning_attempts WHERE id = p_attempt_id;

  IF v_attempt.mastery_status = 'acquired' THEN
    -- Schedule révision espacée (configurable via tenants.config)
    UPDATE learning_attempts SET
      review_due_at = now() + INTERVAL '14 days'
    WHERE id = p_attempt_id;

    -- Mettre à jour player_progress snapshot
    INSERT INTO player_progress (child_id, tenant_id, themes_acquired_count, last_activity_at, updated_at)
    VALUES (v_attempt.child_id, v_attempt.tenant_id, 1, now(), now())
    ON CONFLICT (child_id) DO UPDATE SET
      themes_acquired_count = player_progress.themes_acquired_count + 1,
      last_activity_at = now(),
      updated_at = now();
  ELSE
    -- Met à jour last_activity_at même si non acquis
    INSERT INTO player_progress (child_id, tenant_id, last_activity_at, updated_at)
    VALUES (v_attempt.child_id, v_attempt.tenant_id, now(), now())
    ON CONFLICT (child_id) DO UPDATE SET
      last_activity_at = now(),
      updated_at = now();
  END IF;

  -- Déclencher gamification (Epic 12 — stub si non déployé)
  -- PERFORM award_badge_if_applicable(v_attempt.child_id, 'QUIZ_MASTERED', p_attempt_id, '{}', gen_random_uuid());
END;
$$;
REVOKE ALL ON FUNCTION finalize_attempt FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_attempt TO authenticated;
```

### Hook client `useQuiz`

```typescript
// packages/business-logic/src/learning/useQuiz.ts
export function useQuiz(attemptId: string) {
  const submitAnswer = async (questionId: string, optionId: string) => {
    const { data, error } = await supabase.rpc('submit_answer', {
      p_attempt_id        : attemptId,
      p_question_id       : questionId,
      p_selected_option_id: optionId,
    })
    return data as {
      is_correct: boolean
      mastery_percent: number
      should_stop: boolean
      stop_reason: string | null
    }
  }

  const stopAttempt = async (reason: 'child_stopped' | 'time_limit') => {
    await supabase.rpc('stop_attempt', { p_attempt_id: attemptId, p_stop_reason: reason })
  }

  return { submitAnswer, stopAttempt }
}
```

### Dépendances

- **Prérequis** : Story 8.1 (learning_attempts, player_progress) + Story 3.5 (quiz_questions, quiz_options)
- **Consommé par** : Story 8.3 (UX quiz enfant) + Story 8.4 (streaks + révision espacée)

### References
- [Source: epics.md#Story-8.2] — lignes 2322–2358

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
