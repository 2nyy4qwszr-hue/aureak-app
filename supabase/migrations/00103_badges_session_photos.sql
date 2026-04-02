-- Story 33.2 — Workflow Coach : Badges comportementaux + Photos séance
-- Migration 00103

-- ─── session_photos ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL,
  session_id   UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  taken_by     UUID        NOT NULL REFERENCES auth.users(id),
  taken_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── behavioral_badges ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavioral_badges (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,                    -- NULL = badge global partagé tous tenants
  name      TEXT    NOT NULL,
  emoji     TEXT    NOT NULL,
  category  TEXT    NOT NULL CHECK (category IN ('comportemental', 'thematique')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ─── session_badge_awards ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_badge_awards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL,
  session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  child_id   UUID        NOT NULL,
  badge_id   UUID        NOT NULL REFERENCES behavioral_badges(id),
  awarded_by UUID        NOT NULL REFERENCES auth.users(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, child_id, badge_id)
);

-- ─── attendance_late_type sur attendances ─────────────────────────────────────
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS late_type TEXT
    CHECK (late_type IN ('under_15', 'over_15'));

-- ─── Seed badges comportementaux globaux ─────────────────────────────────────
INSERT INTO behavioral_badges (id, tenant_id, name, emoji, category)
VALUES
  ('11111111-0001-0000-0000-000000000000', NULL, 'Réceptivité', '🎯', 'comportemental'),
  ('11111111-0002-0000-0000-000000000000', NULL, 'Effort',       '💪', 'comportemental'),
  ('11111111-0003-0000-0000-000000000000', NULL, 'Attitude',     '🧠', 'comportemental'),
  ('11111111-0004-0000-0000-000000000000', NULL, 'Prestance',    '👑', 'comportemental')
ON CONFLICT (id) DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE session_photos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_badges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_badge_awards ENABLE ROW LEVEL SECURITY;

-- session_photos : admin + coach du groupe
CREATE POLICY "session_photos_admin" ON session_photos
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "session_photos_coach_read" ON session_photos
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND session_id IN (
      SELECT s.id FROM sessions s
      JOIN group_staff gs ON gs.group_id = s.group_id
      WHERE gs.coach_id = auth.uid()
    )
  );

CREATE POLICY "session_photos_coach_insert" ON session_photos
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND taken_by = auth.uid()
  );

-- behavioral_badges : lecture universelle
CREATE POLICY "behavioral_badges_read_all" ON behavioral_badges
  FOR SELECT USING (true);

CREATE POLICY "behavioral_badges_admin_write" ON behavioral_badges
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- session_badge_awards : coach du groupe peut créer/lire, admin tout
CREATE POLICY "session_badge_awards_admin" ON session_badge_awards
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "session_badge_awards_coach_read" ON session_badge_awards
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND session_id IN (
      SELECT s.id FROM sessions s
      JOIN group_staff gs ON gs.group_id = s.group_id
      WHERE gs.coach_id = auth.uid()
    )
  );

CREATE POLICY "session_badge_awards_coach_insert" ON session_badge_awards
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND awarded_by = auth.uid()
  );

-- ─── Index ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_session_photos_session      ON session_photos (session_id);
CREATE INDEX IF NOT EXISTS idx_session_badge_awards_session ON session_badge_awards (session_id);
CREATE INDEX IF NOT EXISTS idx_session_badge_awards_child   ON session_badge_awards (child_id);
