-- =============================================================================
-- Migration 00140 : Enable RLS on ALL public tables missing it
-- Security fix — Supabase alert "rls_disabled_in_public"
--
-- 41 tables created pre-monorepo never had ENABLE ROW LEVEL SECURITY.
-- Idempotent: DROP POLICY IF EXISTS before each CREATE POLICY.
-- =============================================================================

-- =============================================================================
-- 1. ENABLE RLS on all 41 tables (idempotent — no error if already enabled)
-- =============================================================================

ALTER TABLE clubs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_child_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_partnerships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_access_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE implantations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_coaches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_situations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_themes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_series      ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_groups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_sequences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE situations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_criteria     ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_theme_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria               ENABLE ROW LEVEL SECURITY;
ALTER TABLE faults                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cues                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_nodes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_classifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options           ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_answers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_thresholds     ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_session_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_content_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue             ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_links     ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. POLICIES — Tables with tenant_id (tenant isolation)
-- =============================================================================

-- --- clubs (PK = user_id, has tenant_id) ---
DROP POLICY IF EXISTS "clubs_tenant_read" ON clubs;
CREATE POLICY "clubs_tenant_read" ON clubs
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "clubs_admin_write" ON clubs;
CREATE POLICY "clubs_admin_write" ON clubs
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- club_partnerships ---
DROP POLICY IF EXISTS "club_partnerships_tenant_read" ON club_partnerships;
CREATE POLICY "club_partnerships_tenant_read" ON club_partnerships
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "club_partnerships_admin_write" ON club_partnerships;
CREATE POLICY "club_partnerships_admin_write" ON club_partnerships
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- groups ---
DROP POLICY IF EXISTS "groups_tenant_read" ON groups;
CREATE POLICY "groups_tenant_read" ON groups
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "groups_admin_write" ON groups;
CREATE POLICY "groups_admin_write" ON groups
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- group_members ---
DROP POLICY IF EXISTS "group_members_tenant_read" ON group_members;
CREATE POLICY "group_members_tenant_read" ON group_members
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "group_members_admin_write" ON group_members;
CREATE POLICY "group_members_admin_write" ON group_members
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- implantations ---
DROP POLICY IF EXISTS "implantations_tenant_read" ON implantations;
CREATE POLICY "implantations_tenant_read" ON implantations
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "implantations_admin_write" ON implantations;
CREATE POLICY "implantations_admin_write" ON implantations
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- sessions ---
DROP POLICY IF EXISTS "sessions_tenant_read" ON sessions;
CREATE POLICY "sessions_tenant_read" ON sessions
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "sessions_admin_write" ON sessions;
CREATE POLICY "sessions_admin_write" ON sessions
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- session_blocks ---
DROP POLICY IF EXISTS "session_blocks_tenant_read" ON session_blocks;
CREATE POLICY "session_blocks_tenant_read" ON session_blocks
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "session_blocks_admin_write" ON session_blocks;
CREATE POLICY "session_blocks_admin_write" ON session_blocks
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- session_coaches ---
DROP POLICY IF EXISTS "session_coaches_tenant_read" ON session_coaches;
CREATE POLICY "session_coaches_tenant_read" ON session_coaches
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "session_coaches_admin_write" ON session_coaches;
CREATE POLICY "session_coaches_admin_write" ON session_coaches
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- session_situations ---
DROP POLICY IF EXISTS "session_situations_tenant_read" ON session_situations;
CREATE POLICY "session_situations_tenant_read" ON session_situations
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "session_situations_admin_write" ON session_situations;
CREATE POLICY "session_situations_admin_write" ON session_situations
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- session_themes ---
DROP POLICY IF EXISTS "session_themes_tenant_read" ON session_themes;
CREATE POLICY "session_themes_tenant_read" ON session_themes
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "session_themes_admin_write" ON session_themes;
CREATE POLICY "session_themes_admin_write" ON session_themes
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- recurrence_series ---
DROP POLICY IF EXISTS "recurrence_series_tenant_read" ON recurrence_series;
CREATE POLICY "recurrence_series_tenant_read" ON recurrence_series
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "recurrence_series_admin_write" ON recurrence_series;
CREATE POLICY "recurrence_series_admin_write" ON recurrence_series
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- evaluations ---
DROP POLICY IF EXISTS "evaluations_tenant_read" ON evaluations;
CREATE POLICY "evaluations_tenant_read" ON evaluations
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "evaluations_admin_write" ON evaluations;
CREATE POLICY "evaluations_admin_write" ON evaluations
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- themes ---
DROP POLICY IF EXISTS "themes_tenant_read" ON themes;
CREATE POLICY "themes_tenant_read" ON themes
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "themes_admin_write" ON themes;
CREATE POLICY "themes_admin_write" ON themes
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- theme_groups ---
DROP POLICY IF EXISTS "theme_groups_tenant_read" ON theme_groups;
CREATE POLICY "theme_groups_tenant_read" ON theme_groups
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "theme_groups_admin_write" ON theme_groups;
CREATE POLICY "theme_groups_admin_write" ON theme_groups
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- theme_sequences ---
DROP POLICY IF EXISTS "theme_sequences_tenant_read" ON theme_sequences;
CREATE POLICY "theme_sequences_tenant_read" ON theme_sequences
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "theme_sequences_admin_write" ON theme_sequences;
CREATE POLICY "theme_sequences_admin_write" ON theme_sequences
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- situations ---
DROP POLICY IF EXISTS "situations_tenant_read" ON situations;
CREATE POLICY "situations_tenant_read" ON situations
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "situations_admin_write" ON situations;
CREATE POLICY "situations_admin_write" ON situations
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- situation_groups ---
DROP POLICY IF EXISTS "situation_groups_tenant_read" ON situation_groups;
CREATE POLICY "situation_groups_tenant_read" ON situation_groups
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "situation_groups_admin_write" ON situation_groups;
CREATE POLICY "situation_groups_admin_write" ON situation_groups
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- situation_criteria ---
DROP POLICY IF EXISTS "situation_criteria_tenant_read" ON situation_criteria;
CREATE POLICY "situation_criteria_tenant_read" ON situation_criteria
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "situation_criteria_admin_write" ON situation_criteria;
CREATE POLICY "situation_criteria_admin_write" ON situation_criteria
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- situation_theme_links ---
DROP POLICY IF EXISTS "situation_theme_links_tenant_read" ON situation_theme_links;
CREATE POLICY "situation_theme_links_tenant_read" ON situation_theme_links
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "situation_theme_links_admin_write" ON situation_theme_links;
CREATE POLICY "situation_theme_links_admin_write" ON situation_theme_links
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- criteria ---
DROP POLICY IF EXISTS "criteria_tenant_read" ON criteria;
CREATE POLICY "criteria_tenant_read" ON criteria
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "criteria_admin_write" ON criteria;
CREATE POLICY "criteria_admin_write" ON criteria
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- faults ---
DROP POLICY IF EXISTS "faults_tenant_read" ON faults;
CREATE POLICY "faults_tenant_read" ON faults
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "faults_admin_write" ON faults;
CREATE POLICY "faults_admin_write" ON faults
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- cues ---
DROP POLICY IF EXISTS "cues_tenant_read" ON cues;
CREATE POLICY "cues_tenant_read" ON cues
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "cues_admin_write" ON cues;
CREATE POLICY "cues_admin_write" ON cues
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- taxonomies ---
DROP POLICY IF EXISTS "taxonomies_tenant_read" ON taxonomies;
CREATE POLICY "taxonomies_tenant_read" ON taxonomies
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "taxonomies_admin_write" ON taxonomies;
CREATE POLICY "taxonomies_admin_write" ON taxonomies
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- taxonomy_nodes ---
DROP POLICY IF EXISTS "taxonomy_nodes_tenant_read" ON taxonomy_nodes;
CREATE POLICY "taxonomy_nodes_tenant_read" ON taxonomy_nodes
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "taxonomy_nodes_admin_write" ON taxonomy_nodes;
CREATE POLICY "taxonomy_nodes_admin_write" ON taxonomy_nodes
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- unit_classifications ---
DROP POLICY IF EXISTS "unit_classifications_tenant_read" ON unit_classifications;
CREATE POLICY "unit_classifications_tenant_read" ON unit_classifications
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "unit_classifications_admin_write" ON unit_classifications;
CREATE POLICY "unit_classifications_admin_write" ON unit_classifications
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- quiz_questions ---
DROP POLICY IF EXISTS "quiz_questions_tenant_read" ON quiz_questions;
CREATE POLICY "quiz_questions_tenant_read" ON quiz_questions
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "quiz_questions_admin_write" ON quiz_questions;
CREATE POLICY "quiz_questions_admin_write" ON quiz_questions
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- learning_attempts ---
DROP POLICY IF EXISTS "learning_attempts_tenant_read" ON learning_attempts;
CREATE POLICY "learning_attempts_tenant_read" ON learning_attempts
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "learning_attempts_admin_write" ON learning_attempts;
CREATE POLICY "learning_attempts_admin_write" ON learning_attempts
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- mastery_thresholds ---
DROP POLICY IF EXISTS "mastery_thresholds_tenant_read" ON mastery_thresholds;
CREATE POLICY "mastery_thresholds_tenant_read" ON mastery_thresholds
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "mastery_thresholds_admin_write" ON mastery_thresholds;
CREATE POLICY "mastery_thresholds_admin_write" ON mastery_thresholds
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- player_progress ---
DROP POLICY IF EXISTS "player_progress_tenant_read" ON player_progress;
CREATE POLICY "player_progress_tenant_read" ON player_progress
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "player_progress_admin_write" ON player_progress;
CREATE POLICY "player_progress_admin_write" ON player_progress
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- push_tokens ---
DROP POLICY IF EXISTS "push_tokens_tenant_read" ON push_tokens;
CREATE POLICY "push_tokens_tenant_read" ON push_tokens
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "push_tokens_own_write" ON push_tokens;
CREATE POLICY "push_tokens_own_write" ON push_tokens
  FOR ALL USING (user_id = auth.uid() AND tenant_id = current_tenant_id() AND is_active_user());

-- --- coach_session_notes ---
DROP POLICY IF EXISTS "coach_session_notes_tenant_read" ON coach_session_notes;
CREATE POLICY "coach_session_notes_tenant_read" ON coach_session_notes
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "coach_session_notes_admin_write" ON coach_session_notes;
CREATE POLICY "coach_session_notes_admin_write" ON coach_session_notes
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- coach_content_feedback ---
DROP POLICY IF EXISTS "coach_content_feedback_tenant_read" ON coach_content_feedback;
CREATE POLICY "coach_content_feedback_tenant_read" ON coach_content_feedback
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "coach_content_feedback_admin_write" ON coach_content_feedback;
CREATE POLICY "coach_content_feedback_admin_write" ON coach_content_feedback
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- sync_queue ---
DROP POLICY IF EXISTS "sync_queue_own" ON sync_queue;
CREATE POLICY "sync_queue_own" ON sync_queue
  FOR ALL USING (actor_id = auth.uid() AND tenant_id = current_tenant_id() AND is_active_user());

-- --- event_log ---
DROP POLICY IF EXISTS "event_log_tenant_read" ON event_log;
CREATE POLICY "event_log_tenant_read" ON event_log
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());
DROP POLICY IF EXISTS "event_log_insert" ON event_log;
CREATE POLICY "event_log_insert" ON event_log
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() AND is_active_user());

-- --- export_jobs ---
DROP POLICY IF EXISTS "export_jobs_admin" ON export_jobs;
CREATE POLICY "export_jobs_admin" ON export_jobs
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- --- gdpr_requests ---
DROP POLICY IF EXISTS "gdpr_requests_admin" ON gdpr_requests;
CREATE POLICY "gdpr_requests_admin" ON gdpr_requests
  FOR ALL USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- =============================================================================
-- 3. POLICIES — Tables WITHOUT tenant_id (FK-chain isolation)
-- =============================================================================

-- --- club_access_logs --- (partnership_id FK → club_partnerships which has tenant_id)
DROP POLICY IF EXISTS "tenant_read" ON club_access_logs;
DROP POLICY IF EXISTS "club_access_logs_tenant_read" ON club_access_logs;
CREATE POLICY "club_access_logs_tenant_read" ON club_access_logs
  FOR SELECT USING (
    is_active_user()
    AND EXISTS (
      SELECT 1 FROM club_partnerships cp
      WHERE cp.id = club_access_logs.partnership_id
        AND cp.tenant_id = current_tenant_id()
    )
  );
DROP POLICY IF EXISTS "club_access_logs_admin_write" ON club_access_logs;
CREATE POLICY "club_access_logs_admin_write" ON club_access_logs
  FOR ALL USING (
    current_user_role() = 'admin'
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM club_partnerships cp
      WHERE cp.id = club_access_logs.partnership_id
        AND cp.tenant_id = current_tenant_id()
    )
  );

-- --- club_child_links --- (club_id FK → clubs.user_id which has tenant_id)
DROP POLICY IF EXISTS "club_child_links_read" ON club_child_links;
CREATE POLICY "club_child_links_read" ON club_child_links
  FOR SELECT USING (
    is_active_user()
    AND EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
  );
DROP POLICY IF EXISTS "club_child_links_admin_write" ON club_child_links;
CREATE POLICY "club_child_links_admin_write" ON club_child_links
  FOR ALL USING (
    current_user_role() = 'admin'
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
  );

-- --- parent_child_links --- (policies already exist from migration 00090)
-- Only RLS ENABLE was needed (done above). Existing policies are sufficient.

-- --- quiz_options --- (question_id FK → quiz_questions which has tenant_id)
DROP POLICY IF EXISTS "quiz_options_read" ON quiz_options;
CREATE POLICY "quiz_options_read" ON quiz_options
  FOR SELECT USING (
    is_active_user()
    AND EXISTS (
      SELECT 1 FROM quiz_questions q
      WHERE q.id = quiz_options.question_id
        AND q.tenant_id = current_tenant_id()
    )
  );
DROP POLICY IF EXISTS "quiz_options_admin_write" ON quiz_options;
CREATE POLICY "quiz_options_admin_write" ON quiz_options
  FOR ALL USING (
    current_user_role() = 'admin'
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM quiz_questions q
      WHERE q.id = quiz_options.question_id
        AND q.tenant_id = current_tenant_id()
    )
  );

-- --- learning_answers --- (attempt_id FK → learning_attempts which has tenant_id)
DROP POLICY IF EXISTS "learning_answers_read" ON learning_answers;
CREATE POLICY "learning_answers_read" ON learning_answers
  FOR SELECT USING (
    is_active_user()
    AND EXISTS (
      SELECT 1 FROM learning_attempts a
      WHERE a.id = learning_answers.attempt_id
        AND a.tenant_id = current_tenant_id()
    )
  );
DROP POLICY IF EXISTS "learning_answers_write" ON learning_answers;
CREATE POLICY "learning_answers_write" ON learning_answers
  FOR ALL USING (
    is_active_user()
    AND EXISTS (
      SELECT 1 FROM learning_attempts a
      WHERE a.id = learning_answers.attempt_id
        AND a.tenant_id = current_tenant_id()
        AND a.child_id = auth.uid()
    )
  );
