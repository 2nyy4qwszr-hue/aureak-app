-- Migration 00106 — Gamification : badges, points ledger, avatar, skill cards, event bus
-- Stories 12.1 + 12.2

-- ─── badge_definitions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badge_definitions (
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
DO $$ BEGIN
  CREATE POLICY "badge_def_tenant_read" ON badge_definitions
    FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "badge_def_admin_write" ON badge_definitions
    FOR ALL USING (current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_badges ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_badges (
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
DO $$ BEGIN
  CREATE POLICY "pb_tenant" ON player_badges FOR ALL USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pb_child_own" ON player_badges FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pb_parent" ON player_badges FOR SELECT USING (
    current_user_role() = 'parent' AND EXISTS (
      SELECT 1 FROM parent_child_links WHERE child_id = player_badges.child_id AND parent_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pb_staff" ON player_badges FOR SELECT USING (current_user_role() IN ('coach','admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS pb_child ON player_badges (child_id, awarded_at DESC);

-- ─── player_points_ledger (append-only) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_points_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  event_type   TEXT NOT NULL DEFAULT 'BADGE_AWARDED' CHECK (event_type IN ('BADGE_AWARDED')),
  ref_id       UUID NOT NULL,
  points_delta INTEGER NOT NULL CHECK (points_delta > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_points_ledger ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ppl_tenant" ON player_points_ledger FOR ALL USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ppl_child_own" ON player_points_ledger FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ppl_parent" ON player_points_ledger FOR SELECT USING (
    current_user_role() = 'parent' AND EXISTS (
      SELECT 1 FROM parent_child_links WHERE child_id = player_points_ledger.child_id AND parent_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ppl_no_update" ON player_points_ledger FOR UPDATE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ppl_no_delete" ON player_points_ledger FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS ppl_child ON player_points_ledger (child_id, created_at DESC);

-- ─── avatar_items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_items (
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
DO $$ BEGIN
  CREATE POLICY "ai_tenant_read" ON avatar_items FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ai_admin_write" ON avatar_items FOR ALL USING (current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_avatars ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_avatars (
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
DO $$ BEGIN
  CREATE POLICY "pa_child_own" ON player_avatars FOR ALL USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_unlocked_items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_unlocked_items (
  child_id       UUID NOT NULL REFERENCES profiles(user_id),
  item_id        UUID NOT NULL REFERENCES avatar_items(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_trigger TEXT NOT NULL CHECK (unlock_trigger IN ('badge_earned','total_points','themes_acquired')),
  PRIMARY KEY (child_id, item_id)
);
ALTER TABLE player_unlocked_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "pui_child_own" ON player_unlocked_items FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "pui_insert_rpc" ON player_unlocked_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_theme_mastery ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_theme_mastery (
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
DO $$ BEGIN
  CREATE POLICY "ptm_child_own" ON player_theme_mastery FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ptm_parent" ON player_theme_mastery FOR SELECT USING (
    current_user_role() = 'parent' AND EXISTS (
      SELECT 1 FROM parent_child_links WHERE child_id = player_theme_mastery.child_id AND parent_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ptm_staff" ON player_theme_mastery FOR SELECT USING (current_user_role() IN ('coach','admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ptm_insert_rpc" ON player_theme_mastery FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ptm_update_rpc" ON player_theme_mastery FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── skill_cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_cards (
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
DO $$ BEGIN
  CREATE POLICY "sc_tenant_read" ON skill_cards FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── player_skill_cards ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_skill_cards (
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  skill_card_id UUID NOT NULL REFERENCES skill_cards(id),
  tenant_id     UUID NOT NULL,
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, skill_card_id)
);
ALTER TABLE player_skill_cards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "psc_child_own" ON player_skill_cards FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "psc_insert_rpc" ON player_skill_cards FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Trigger : badge → points ledger + player_progress ──────────────────────
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
    -- Update player_progress if it exists (from story 8.1)
    UPDATE player_progress
      SET total_points = total_points + v_points, updated_at = now()
      WHERE child_id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER after_player_badge_insert
    AFTER INSERT ON player_badges
    FOR EACH ROW EXECUTE FUNCTION fn_badge_awarded_ledger();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── check_and_award_items ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_and_award_items(p_child_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item      RECORD;
  v_points    BIGINT;
  v_themes    BIGINT;
BEGIN
  SELECT COALESCE(SUM(points_delta), 0) INTO v_points
  FROM player_points_ledger WHERE child_id = p_child_id;

  SELECT COUNT(DISTINCT theme_id) INTO v_themes
  FROM player_theme_mastery
  WHERE child_id = p_child_id AND mastery_status IN ('acquired','revalidated');

  FOR v_item IN
    SELECT ai.* FROM avatar_items ai
    WHERE ai.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM player_unlocked_items
        WHERE child_id = p_child_id AND item_id = ai.id
      )
  LOOP
    IF (v_item.unlock_condition->>'type') = 'total_points'
      AND v_points >= (v_item.unlock_condition->>'min_points')::int THEN
      INSERT INTO player_unlocked_items (child_id, item_id, unlock_trigger)
      VALUES (p_child_id, v_item.id, 'total_points')
      ON CONFLICT DO NOTHING;
    ELSIF (v_item.unlock_condition->>'type') = 'themes_acquired'
      AND v_themes >= (v_item.unlock_condition->>'count')::int THEN
      INSERT INTO player_unlocked_items (child_id, item_id, unlock_trigger)
      VALUES (p_child_id, v_item.id, 'themes_acquired')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION check_and_award_items FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_award_items TO authenticated;

-- ─── award_badge_if_applicable (Story 12.2 — event bus) ─────────────────────
CREATE OR REPLACE FUNCTION award_badge_if_applicable(
  p_child_id     UUID,
  p_event_type   TEXT,
  p_ref_id       UUID,
  p_context      JSONB DEFAULT '{}',
  p_operation_id UUID DEFAULT gen_random_uuid()
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id   UUID := current_tenant_id();
  v_streak      INTEGER := 0;
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

    -- Streak badges (from player_progress if available)
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

    -- player_theme_mastery upsert
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

-- ─── Seed badges de base (par tenant) ────────────────────────────────────────
-- NOTE : à exécuter via Edge Function init-tenant avec current_setting('app.tenant_id')
-- Les 5 badges MVP sont seedés manuellement ou via init-tenant
