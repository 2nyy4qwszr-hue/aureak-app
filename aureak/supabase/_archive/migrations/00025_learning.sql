-- Story 8.1 — Modèle apprentissage, maîtrise & gamification
-- Story 8.2 — RPCs moteur quiz adaptatif
-- Story 8.3 — Vue enfant sans métriques
-- Story 8.4 — Logique streak dans finalize_attempt
-- Story 8.5 — RLS policies complètes
-- ============================================================

-- ─── Table mastery_thresholds ─────────────────────────────────────────────────

CREATE TABLE mastery_thresholds (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('global','theme','age_group','theme_age_group')),
  theme_id   UUID REFERENCES themes(id),
  age_group  TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  threshold  INTEGER NOT NULL DEFAULT 80 CHECK (threshold BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mastery_thresholds ENABLE ROW LEVEL SECURITY;

-- Unicité par scope (indexes partiels — colonnes nullable)
CREATE UNIQUE INDEX mt_global    ON mastery_thresholds (tenant_id)
  WHERE scope_type = 'global';
CREATE UNIQUE INDEX mt_theme     ON mastery_thresholds (tenant_id, theme_id)
  WHERE scope_type = 'theme';
CREATE UNIQUE INDEX mt_age       ON mastery_thresholds (tenant_id, age_group)
  WHERE scope_type = 'age_group';
CREATE UNIQUE INDEX mt_theme_age ON mastery_thresholds (tenant_id, theme_id, age_group)
  WHERE scope_type = 'theme_age_group';

CREATE POLICY "mastery_thresholds_read" ON mastery_thresholds
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "mastery_thresholds_admin" ON mastery_thresholds
  FOR ALL USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

-- ─── Table learning_attempts ──────────────────────────────────────────────────

CREATE TABLE learning_attempts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  session_id         UUID REFERENCES sessions(id),
  child_id           UUID NOT NULL REFERENCES profiles(user_id),
  theme_id           UUID NOT NULL REFERENCES themes(id),
  attempt_type       TEXT NOT NULL DEFAULT 'post_session'
    CHECK (attempt_type IN ('post_session','revalidation')),
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at           TIMESTAMPTZ,
  mastery_percent    INTEGER CHECK (mastery_percent BETWEEN 0 AND 100),
  mastery_status     TEXT CHECK (mastery_status IN ('acquired','not_acquired')),
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_count      INTEGER NOT NULL DEFAULT 0,
  stop_reason        TEXT CHECK (stop_reason IN ('mastered','child_stopped','time_limit')),
  review_due_at      TIMESTAMPTZ,
  reviewed_at        TIMESTAMPTZ,
  review_result      TEXT CHECK (review_result IN ('maintained','lost')),
  model_name         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE learning_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX learning_attempts_child_theme ON learning_attempts (child_id, theme_id);

-- ─── Table learning_answers ───────────────────────────────────────────────────

CREATE TABLE learning_answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id         UUID NOT NULL REFERENCES learning_attempts(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_id UUID NOT NULL REFERENCES quiz_options(id),
  is_correct         BOOLEAN NOT NULL,
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE learning_answers ENABLE ROW LEVEL SECURITY;
CREATE INDEX la_attempt ON learning_answers (attempt_id);

-- ─── Table player_progress ────────────────────────────────────────────────────

CREATE TABLE player_progress (
  child_id             UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  total_points         INTEGER NOT NULL DEFAULT 0,
  current_streak       INTEGER NOT NULL DEFAULT 0,
  max_streak           INTEGER NOT NULL DEFAULT 0,
  themes_acquired_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at     TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;

-- ─── RLS policies complètes (Story 8.5) ──────────────────────────────────────

-- learning_attempts
CREATE POLICY "la_child_read" ON learning_attempts
  FOR SELECT USING (child_id = auth.uid() AND current_user_role() = 'child');

CREATE POLICY "la_parent_read" ON learning_attempts
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.child_id = learning_attempts.child_id AND pcl.parent_id = auth.uid()
    )
  );

CREATE POLICY "la_coach_read" ON learning_attempts
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = learning_attempts.session_id AND sc.coach_id = auth.uid()
    )
  );

CREATE POLICY "la_admin_read" ON learning_attempts
  FOR SELECT USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

CREATE POLICY "la_child_insert" ON learning_attempts
  FOR INSERT WITH CHECK (child_id = auth.uid() AND tenant_id = current_tenant_id());

-- learning_answers
CREATE POLICY "la_answers_access" ON learning_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_attempts la
      WHERE la.id = learning_answers.attempt_id
        AND (la.child_id = auth.uid() OR current_user_role() IN ('coach','admin'))
    )
  );

-- player_progress
CREATE POLICY "pp_child_own" ON player_progress
  FOR SELECT USING (child_id = auth.uid());

CREATE POLICY "pp_parent_children" ON player_progress
  FOR SELECT USING (
    current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE child_id = player_progress.child_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "pp_staff_read" ON player_progress
  FOR SELECT USING (
    tenant_id = current_tenant_id() AND current_user_role() IN ('coach','admin')
  );

-- ─── Vue enfant sans métriques numériques (Story 8.3) ────────────────────────

CREATE VIEW learning_attempts_child_view AS
SELECT
  id, session_id, child_id, theme_id, attempt_type,
  started_at, ended_at,
  mastery_status,
  stop_reason,
  review_due_at,
  created_at
FROM learning_attempts;

-- ─── RPC get_mastery_threshold (Story 8.2) ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_mastery_threshold(p_theme_id UUID, p_age_group TEXT)
  RETURNS INTEGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE v_threshold INTEGER;
BEGIN
  SELECT threshold INTO v_threshold FROM mastery_thresholds
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

  RETURN COALESCE(v_threshold, 80);
END;
$$;
REVOKE ALL ON FUNCTION get_mastery_threshold(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_mastery_threshold(UUID, TEXT) TO authenticated;

-- ─── RPC create_learning_attempt (Story 8.2) ─────────────────────────────────

CREATE OR REPLACE FUNCTION create_learning_attempt(
  p_session_id UUID,
  p_theme_id   UUID
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_attempt_id UUID;
  v_questions  JSONB;
BEGIN
  INSERT INTO learning_attempts (tenant_id, session_id, child_id, theme_id, attempt_type)
  VALUES (
    current_tenant_id(),
    p_session_id,
    auth.uid(),
    p_theme_id,
    CASE WHEN p_session_id IS NOT NULL THEN 'post_session' ELSE 'revalidation' END
  ) RETURNING id INTO v_attempt_id;

  -- Sélectionner les questions publiées pour ce thème (ordre aléatoire stable)
  SELECT jsonb_agg(q ORDER BY md5(v_attempt_id::text || q.id::text))
  INTO v_questions
  FROM (
    SELECT id, question_text AS text,
      (SELECT jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text))
       FROM quiz_options o WHERE o.question_id = qq.id) AS options
    FROM quiz_questions qq
    WHERE qq.theme_id = p_theme_id AND qq.status = 'published'
      AND qq.deleted_at IS NULL
    LIMIT 5
  ) q;

  RETURN jsonb_build_object('attempt_id', v_attempt_id, 'questions', v_questions);
END;
$$;
REVOKE ALL ON FUNCTION create_learning_attempt(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_learning_attempt(UUID, UUID) TO authenticated;

-- ─── RPC finalize_attempt (Story 8.2 + 8.4) ──────────────────────────────────

CREATE OR REPLACE FUNCTION finalize_attempt(p_attempt_id UUID)
  RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_attempt     learning_attempts%ROWTYPE;
  v_last_date   DATE;
  v_new_streak  INTEGER;
  v_review_days INTEGER;
BEGIN
  SELECT * INTO v_attempt FROM learning_attempts WHERE id = p_attempt_id;

  -- Lire l'intervalle de révision configurable (défaut 14 jours)
  SELECT COALESCE((config->>'review_interval_days')::integer, 14)
  INTO v_review_days
  FROM tenants WHERE id = v_attempt.tenant_id;

  IF v_attempt.mastery_status = 'acquired' THEN
    -- Logique streak (Story 8.4)
    SELECT last_activity_at::date INTO v_last_date
    FROM player_progress WHERE child_id = v_attempt.child_id;

    IF v_last_date IS NULL OR v_last_date < current_date - 1 THEN
      v_new_streak := 1;
    ELSE
      SELECT COALESCE(current_streak, 0) + 1 INTO v_new_streak
      FROM player_progress WHERE child_id = v_attempt.child_id;
    END IF;

    -- Schedule révision espacée
    UPDATE learning_attempts SET
      review_due_at = now() + (v_review_days || ' days')::INTERVAL
    WHERE id = p_attempt_id;

    -- Mettre à jour player_progress
    INSERT INTO player_progress (child_id, tenant_id, current_streak, max_streak, themes_acquired_count, last_activity_at, updated_at)
    VALUES (v_attempt.child_id, v_attempt.tenant_id, v_new_streak, v_new_streak, 1, now(), now())
    ON CONFLICT (child_id) DO UPDATE SET
      current_streak        = v_new_streak,
      max_streak            = GREATEST(player_progress.max_streak, v_new_streak),
      themes_acquired_count = player_progress.themes_acquired_count + 1,
      last_activity_at      = now(),
      updated_at            = now();

    -- TODO: activate after Epic 12
    -- PERFORM award_badge_if_applicable(
    --   v_attempt.child_id,
    --   CASE WHEN v_attempt.attempt_type = 'post_session' THEN 'QUIZ_MASTERED' ELSE 'SKILL_MASTERED' END,
    --   p_attempt_id,
    --   jsonb_build_object('session_id', v_attempt.session_id, 'theme_id', v_attempt.theme_id),
    --   gen_random_uuid()
    -- );
  ELSE
    -- Non acquis : mettre à jour last_activity_at seulement
    INSERT INTO player_progress (child_id, tenant_id, last_activity_at, updated_at)
    VALUES (v_attempt.child_id, v_attempt.tenant_id, now(), now())
    ON CONFLICT (child_id) DO UPDATE SET
      last_activity_at = now(),
      updated_at       = now();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION finalize_attempt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_attempt(UUID) TO authenticated;

-- ─── RPC submit_answer (Story 8.2) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_answer(
  p_attempt_id         UUID,
  p_question_id        UUID,
  p_selected_option_id UUID
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_is_correct      BOOLEAN;
  v_attempt         learning_attempts%ROWTYPE;
  v_threshold       INTEGER;
  v_mastery_percent INTEGER;
  v_should_stop     BOOLEAN := false;
  v_stop_reason     TEXT;
  v_age_group       TEXT;
BEGIN
  SELECT is_correct INTO v_is_correct
  FROM quiz_options WHERE id = p_selected_option_id;

  INSERT INTO learning_answers (attempt_id, question_id, selected_option_id, is_correct)
  VALUES (p_attempt_id, p_question_id, p_selected_option_id, v_is_correct);

  UPDATE learning_attempts SET
    questions_answered = questions_answered + 1,
    correct_count      = correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  v_mastery_percent := ROUND(v_attempt.correct_count::numeric / v_attempt.questions_answered * 100);

  -- Récupérer l'age_group depuis le groupe de la séance
  SELECT g.age_group INTO v_age_group
  FROM sessions s
  JOIN groups g ON g.id = s.group_id
  WHERE s.id = v_attempt.session_id
  LIMIT 1;

  SELECT get_mastery_threshold(v_attempt.theme_id, COALESCE(v_age_group, 'U8'))
  INTO v_threshold;

  -- Stop conditions
  IF v_mastery_percent >= v_threshold AND v_attempt.questions_answered >= 3 THEN
    v_should_stop := true;
    v_stop_reason := 'mastered';
  ELSIF NOT EXISTS (
    SELECT 1 FROM quiz_questions
    WHERE theme_id = v_attempt.theme_id AND status = 'published'
      AND id NOT IN (SELECT question_id FROM learning_answers WHERE attempt_id = p_attempt_id)
  ) THEN
    v_should_stop := true;
    v_stop_reason := CASE WHEN v_mastery_percent >= v_threshold THEN 'mastered' ELSE 'child_stopped' END;
  END IF;

  IF v_should_stop THEN
    UPDATE learning_attempts SET
      ended_at        = now(),
      mastery_percent = v_mastery_percent,
      mastery_status  = CASE WHEN v_stop_reason = 'mastered' THEN 'acquired' ELSE 'not_acquired' END,
      stop_reason     = v_stop_reason
    WHERE id = p_attempt_id;

    PERFORM finalize_attempt(p_attempt_id);
  END IF;

  RETURN jsonb_build_object(
    'is_correct',      v_is_correct,
    'mastery_percent', v_mastery_percent,
    'should_stop',     v_should_stop,
    'stop_reason',     v_stop_reason
  );
END;
$$;
REVOKE ALL ON FUNCTION submit_answer(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_answer(UUID, UUID, UUID) TO authenticated;

-- ─── RPC stop_attempt (Story 8.2) ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION stop_attempt(
  p_attempt_id UUID,
  p_stop_reason TEXT DEFAULT 'child_stopped'
) RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE learning_attempts SET
    ended_at       = now(),
    mastery_status = 'not_acquired',
    stop_reason    = p_stop_reason,
    mastery_percent = CASE WHEN questions_answered > 0
      THEN ROUND(correct_count::numeric / questions_answered * 100)
      ELSE 0 END
  WHERE id = p_attempt_id;

  PERFORM finalize_attempt(p_attempt_id);
END;
$$;
REVOKE ALL ON FUNCTION stop_attempt(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stop_attempt(UUID, TEXT) TO authenticated;
