-- Story 12.1 + 12.2 — Gamification : badges, points, avatar, skill cards, event bus

-- Définitions de badges
CREATE TABLE badge_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  code        TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  icon_url    TEXT,
  points      INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  season      INTEGER,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON badge_definitions
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON badge_definitions
  FOR ALL USING (current_user_role() = 'admin');

-- Badges attribués (append-only, un badge par enfant)
CREATE TABLE player_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  child_id   UUID NOT NULL REFERENCES profiles(user_id),
  badge_id   UUID NOT NULL REFERENCES badge_definitions(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source     TEXT NOT NULL CHECK (source IN ('quiz','attendance','skill_mastered','coach_award','special_event')),
  ref_id     UUID,
  UNIQUE (child_id, badge_id)
);
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON player_badges FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "child_own" ON player_badges FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_badges FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_badges.child_id AND parent_id = auth.uid()
  )
);
CREATE POLICY "staff_read" ON player_badges FOR SELECT USING (current_user_role() IN ('coach','admin'));
CREATE INDEX pb_child ON player_badges (child_id, awarded_at DESC);

-- Ledger de points immuable (append-only)
CREATE TABLE player_points_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  event_type   TEXT NOT NULL DEFAULT 'BADGE_AWARDED' CHECK (event_type IN ('BADGE_AWARDED')),
  ref_id       UUID NOT NULL,
  points_delta INTEGER NOT NULL CHECK (points_delta > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON player_points_ledger FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "child_own" ON player_points_ledger FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_points_ledger FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_points_ledger.child_id AND parent_id = auth.uid()
  )
);
CREATE POLICY "no_update" ON player_points_ledger FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON player_points_ledger FOR DELETE USING (false);
CREATE INDEX ppl_child ON player_points_ledger (child_id, created_at DESC);

-- Items cosmétiques avatar
CREATE TABLE avatar_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('frame','background','accessory','effect','title')),
  unlock_condition JSONB NOT NULL,
  asset_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER,
  UNIQUE (tenant_id, slug)
);
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON avatar_items FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON avatar_items FOR ALL USING (current_user_role() = 'admin');

-- Avatar équipé par l'enfant
CREATE TABLE player_avatars (
  child_id            UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  equipped_frame      UUID REFERENCES avatar_items(id),
  equipped_background UUID REFERENCES avatar_items(id),
  equipped_accessory  UUID REFERENCES avatar_items(id),
  equipped_effect     UUID REFERENCES avatar_items(id),
  equipped_title      UUID REFERENCES avatar_items(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_avatars FOR ALL USING (child_id = auth.uid());

-- Items débloqués
CREATE TABLE player_unlocked_items (
  child_id       UUID NOT NULL REFERENCES profiles(user_id),
  item_id        UUID NOT NULL REFERENCES avatar_items(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_trigger TEXT NOT NULL CHECK (unlock_trigger IN ('badge_earned','total_points','themes_acquired')),
  PRIMARY KEY (child_id, item_id)
);
ALTER TABLE player_unlocked_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_unlocked_items FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "insert_rpc" ON player_unlocked_items FOR INSERT WITH CHECK (true);

-- Snapshot maîtrise par thème
CREATE TABLE player_theme_mastery (
  child_id          UUID NOT NULL REFERENCES profiles(user_id),
  theme_id          UUID NOT NULL REFERENCES themes(id),
  tenant_id         UUID NOT NULL,
  mastery_status    TEXT NOT NULL DEFAULT 'not_started'
    CHECK (mastery_status IN ('not_started','in_progress','acquired','revalidated')),
  first_acquired_at TIMESTAMPTZ,
  last_attempt_at   TIMESTAMPTZ,
  total_attempts    INTEGER NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, theme_id)
);
ALTER TABLE player_theme_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_theme_mastery FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_theme_mastery FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_theme_mastery.child_id AND parent_id = auth.uid()
  )
);
CREATE POLICY "staff_read" ON player_theme_mastery FOR SELECT USING (current_user_role() IN ('coach','admin'));
CREATE POLICY "insert_rpc" ON player_theme_mastery FOR INSERT WITH CHECK (true);
CREATE POLICY "update_rpc" ON player_theme_mastery FOR UPDATE USING (true);

-- Skill cards catalogue
CREATE TABLE skill_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  theme_id         UUID NOT NULL REFERENCES themes(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  rarity           TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  illustration_url TEXT,
  unlock_condition TEXT NOT NULL CHECK (unlock_condition IN ('theme_acquired','revalidated','first_acquired','streak_active')),
  UNIQUE (tenant_id, slug)
);
ALTER TABLE skill_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON skill_cards FOR SELECT USING (tenant_id = current_tenant_id());

-- Collection skill cards
CREATE TABLE player_skill_cards (
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  skill_card_id UUID NOT NULL REFERENCES skill_cards(id),
  tenant_id     UUID NOT NULL,
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, skill_card_id)
);
ALTER TABLE player_skill_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_skill_cards FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "insert_rpc" ON player_skill_cards FOR INSERT WITH CHECK (true);

-- Trigger : à chaque badge → points ledger + player_progress update
CREATE OR REPLACE FUNCTION fn_badge_awarded_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_points INTEGER;
BEGIN
  SELECT points INTO v_points FROM badge_definitions WHERE id = NEW.badge_id;
  IF v_points > 0 THEN
    INSERT INTO player_points_ledger
      (tenant_id, child_id, event_type, ref_id, points_delta)
    VALUES
      (NEW.tenant_id, NEW.child_id, 'BADGE_AWARDED', NEW.badge_id, v_points);
    UPDATE player_progress
      SET total_points = total_points + v_points, updated_at = now()
      WHERE child_id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER after_player_badge_insert
  AFTER INSERT ON player_badges
  FOR EACH ROW EXECUTE FUNCTION fn_badge_awarded_ledger();

-- Fonction check_and_award_items
CREATE OR REPLACE FUNCTION check_and_award_items(p_child_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item RECORD;
  v_pp   player_progress%ROWTYPE;
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
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION check_and_award_items FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_award_items TO authenticated;

-- RPC award_badge_if_applicable (Story 12.2)
CREATE OR REPLACE FUNCTION award_badge_if_applicable(
  p_child_id     UUID,
  p_event_type   TEXT,
  p_ref_id       UUID,
  p_context      JSONB DEFAULT '{}',
  p_operation_id UUID DEFAULT gen_random_uuid()
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
BEGIN
  -- Idempotency
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;

  IF p_event_type = 'QUIZ_MASTERED' THEN
    -- FIRST_ACQUIRED
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
    IF p_context->>'theme_id' IS NOT NULL THEN
      INSERT INTO player_theme_mastery (child_id, theme_id, tenant_id, mastery_status, first_acquired_at, last_attempt_at, total_attempts, updated_at)
      VALUES (p_child_id, (p_context->>'theme_id')::uuid, v_tenant_id, 'acquired', now(), now(), 1, now())
      ON CONFLICT (child_id, theme_id) DO UPDATE SET
        mastery_status    = 'acquired',
        first_acquired_at = COALESCE(player_theme_mastery.first_acquired_at, now()),
        last_attempt_at   = now(),
        total_attempts    = player_theme_mastery.total_attempts + 1,
        updated_at        = now();

      -- Skill card
      INSERT INTO player_skill_cards (child_id, skill_card_id, tenant_id)
      SELECT p_child_id, sc.id, v_tenant_id
      FROM skill_cards sc
      WHERE sc.theme_id = (p_context->>'theme_id')::uuid
        AND sc.unlock_condition = 'theme_acquired'
        AND sc.tenant_id = v_tenant_id
      ON CONFLICT DO NOTHING;
    END IF;

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
