-- Migration 00107 — Quêtes hebdomadaires gamification
-- Story 12.4

-- ─── quest_definitions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quest_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  icon_url        TEXT,
  recurrence      TEXT NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('weekly','monthly','once')),
  quest_type      TEXT NOT NULL CHECK (quest_type IN ('attend_sessions','acquire_themes','complete_reviews')),
  target_value    INTEGER NOT NULL,
  reward_badge_id UUID REFERENCES badge_definitions(id),
  xp_reward       INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "qd_tenant_read" ON quest_definitions FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "qd_admin_write" ON quest_definitions FOR ALL USING (current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_quests ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  quest_id      UUID NOT NULL REFERENCES quest_definitions(id),
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','expired')),
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value  INTEGER NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, quest_id, period_start)
);
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "pq_child_own" ON player_quests FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pq_staff_read" ON player_quests FOR SELECT USING (current_user_role() IN ('coach','admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pq_insert_rpc" ON player_quests FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pq_update_rpc" ON player_quests FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS pq_child_active ON player_quests (child_id, status, period_end);

-- ─── award_badge_if_applicable étendu avec quêtes ────────────────────────────
CREATE OR REPLACE FUNCTION award_badge_if_applicable(
  p_child_id     UUID,
  p_event_type   TEXT,
  p_ref_id       UUID,
  p_context      JSONB DEFAULT '{}',
  p_operation_id UUID DEFAULT gen_random_uuid()
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
  v_streak    INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;

  IF p_event_type = 'QUIZ_MASTERED' THEN
    INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
    SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
    FROM badge_definitions
    WHERE code = 'FIRST_ACQUIRED' AND tenant_id = v_tenant_id
      AND NOT EXISTS (
        SELECT 1 FROM player_badges pb
        JOIN badge_definitions bd ON bd.id = pb.badge_id
        WHERE pb.child_id = p_child_id AND bd.code = 'FIRST_ACQUIRED' AND bd.tenant_id = v_tenant_id
      )
    ON CONFLICT DO NOTHING;

    BEGIN
      SELECT COALESCE(current_streak, 0) INTO v_streak FROM player_progress WHERE child_id = p_child_id;
    EXCEPTION WHEN undefined_table THEN v_streak := 0; END;

    IF v_streak >= 3 THEN
      INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
      SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
      FROM badge_definitions WHERE code = 'STREAK_3' AND tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;
    IF v_streak >= 7 THEN
      INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
      SELECT v_tenant_id, p_child_id, id, 'quiz', p_ref_id
      FROM badge_definitions WHERE code = 'STREAK_7' AND tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;

    IF p_context->>'theme_id' IS NOT NULL THEN
      INSERT INTO player_theme_mastery
        (child_id, theme_id, tenant_id, mastery_status, first_acquired_at, last_attempt_at, total_attempts, updated_at)
      VALUES
        (p_child_id, (p_context->>'theme_id')::uuid, v_tenant_id, 'acquired', now(), now(), 1, now())
      ON CONFLICT (child_id, theme_id) DO UPDATE SET
        mastery_status    = 'acquired',
        first_acquired_at = COALESCE(player_theme_mastery.first_acquired_at, now()),
        last_attempt_at   = now(),
        total_attempts    = player_theme_mastery.total_attempts + 1,
        updated_at        = now();

      INSERT INTO player_skill_cards (child_id, skill_card_id, tenant_id)
      SELECT p_child_id, sc.id, v_tenant_id
      FROM skill_cards sc
      WHERE sc.theme_id = (p_context->>'theme_id')::uuid
        AND sc.unlock_condition = 'theme_acquired'
        AND sc.tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;

    -- Progression quêtes acquire_themes
    UPDATE player_quests SET
      current_value = current_value + 1,
      completed_at  = CASE WHEN current_value + 1 >= target_value THEN now() ELSE NULL END,
      status        = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE 'active' END
    WHERE child_id = p_child_id AND status = 'active'
      AND period_end >= CURRENT_DATE
      AND quest_id IN (SELECT id FROM quest_definitions WHERE quest_type = 'acquire_themes');

  ELSIF p_event_type = 'SKILL_MASTERED' THEN
    INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
    SELECT v_tenant_id, p_child_id, id, 'skill_mastered', p_ref_id
    FROM badge_definitions WHERE code = 'SKILL_REVALIDATED' AND tenant_id = v_tenant_id
    ON CONFLICT DO NOTHING;

    IF p_context->>'theme_id' IS NOT NULL THEN
      UPDATE player_theme_mastery SET
        mastery_status  = 'revalidated',
        review_count    = review_count + 1,
        last_attempt_at = now(),
        updated_at      = now()
      WHERE child_id = p_child_id AND theme_id = (p_context->>'theme_id')::uuid;
    END IF;

  ELSIF p_event_type = 'SESSION_ATTENDED' THEN
    -- Progression quêtes attend_sessions
    UPDATE player_quests SET
      current_value = current_value + 1,
      completed_at  = CASE WHEN current_value + 1 >= target_value THEN now() ELSE NULL END,
      status        = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE 'active' END
    WHERE child_id = p_child_id AND status = 'active'
      AND period_end >= CURRENT_DATE
      AND quest_id IN (SELECT id FROM quest_definitions WHERE quest_type = 'attend_sessions');

  ELSIF p_event_type IN ('COACH_AWARD','SPECIAL_EVENT') THEN
    INSERT INTO player_badges (tenant_id, child_id, badge_id, source, ref_id)
    VALUES (v_tenant_id, p_child_id, (p_context->>'badge_id')::uuid, LOWER(p_event_type), p_ref_id)
    ON CONFLICT DO NOTHING;
  END IF;

  PERFORM check_and_award_items(p_child_id);

  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (p_operation_id, v_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('badges_awarded', '[]'::jsonb, 'items_unlocked', '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION award_badge_if_applicable FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_badge_if_applicable TO authenticated;
