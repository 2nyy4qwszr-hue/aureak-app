-- ════════════════════════════════════════════════
-- MIGRATION 00056 — Theme Pedagogical Dossier
-- Étend le système de thèmes existant avec un
-- dossier pédagogique complet structuré autour
-- des critères de réussite comme colonne vertébrale
-- ════════════════════════════════════════════════

-- ── ÉTENDRE LES TABLES EXISTANTES ─────────────

-- criteria : champs pédagogiques étendus
ALTER TABLE criteria
  ADD COLUMN IF NOT EXISTS why_important             TEXT,
  ADD COLUMN IF NOT EXISTS min_level                 TEXT,
  ADD COLUMN IF NOT EXISTS logical_order             INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS good_execution_video_url  TEXT,
  ADD COLUMN IF NOT EXISTS good_execution_image_url  TEXT;

-- faults : diagnostic complet + correction
ALTER TABLE faults
  ADD COLUMN IF NOT EXISTS visible_sign          TEXT,
  ADD COLUMN IF NOT EXISTS probable_cause        TEXT,
  ADD COLUMN IF NOT EXISTS correction_wording    TEXT,
  ADD COLUMN IF NOT EXISTS coaching_phrase       TEXT,
  ADD COLUMN IF NOT EXISTS practical_adjustment  TEXT,
  ADD COLUMN IF NOT EXISTS corrective_video_url  TEXT,
  ADD COLUMN IF NOT EXISTS corrective_image_url  TEXT;

-- theme_sequences : mots-clés terrain + vidéo coach
ALTER TABLE theme_sequences
  ADD COLUMN IF NOT EXISTS short_cues       TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coach_video_url  TEXT;

-- quiz_questions : lien direct vers critère
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS criterion_id UUID REFERENCES criteria(id) ON DELETE SET NULL;

-- ── NOUVELLES TABLES ──────────────────────────

-- vision pédagogique (1:1 par thème)
CREATE TABLE IF NOT EXISTS theme_vision (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  theme_id              UUID NOT NULL UNIQUE REFERENCES themes(id) ON DELETE CASCADE,
  pourquoi              TEXT,
  quand_en_match        TEXT,
  ce_que_comprend       TEXT,
  idee_maitresse        TEXT,
  criteres_prioritaires TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- page terrain coach (1:1 par thème)
CREATE TABLE IF NOT EXISTS theme_page_terrain (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  theme_id         UUID NOT NULL UNIQUE REFERENCES themes(id) ON DELETE CASCADE,
  sequences_court  TEXT,
  metaphors_court  TEXT,
  cues             TEXT[] DEFAULT '{}',
  criteria_summary TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- liaison séquence ↔ critères ciblés
CREATE TABLE IF NOT EXISTS sequence_criteria (
  sequence_id  UUID NOT NULL REFERENCES theme_sequences(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  PRIMARY KEY (sequence_id, criterion_id)
);

-- mini-exercices terrain (liés à un critère)
CREATE TABLE IF NOT EXISTS theme_mini_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  theme_id     UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES criteria(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  purpose      TEXT,
  situation    TEXT,
  cue          TEXT,
  video_url    TEXT,
  image_url    TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exercices à domicile (savoir-faire)
CREATE TABLE IF NOT EXISTS theme_home_exercises (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  theme_id                  UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  objective                 TEXT,
  material                  TEXT,
  installation              TEXT,
  parent_child_instructions TEXT,
  distance_meters           NUMERIC,
  intensity                 TEXT,
  repetitions               INTEGER,
  demo_video_url            TEXT,
  required_level            TEXT,
  sort_order                INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- liaison exercice ↔ critères évalués
CREATE TABLE IF NOT EXISTS home_exercise_criteria (
  exercise_id  UUID NOT NULL REFERENCES theme_home_exercises(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, criterion_id)
);

-- templates d'évaluation vidéo
CREATE TABLE IF NOT EXISTS theme_video_eval_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  theme_id     UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  exercise_id  UUID REFERENCES theme_home_exercises(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  instructions TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- liaison template ↔ critères observés
CREATE TABLE IF NOT EXISTS video_eval_template_criteria (
  template_id  UUID NOT NULL REFERENCES theme_video_eval_templates(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, criterion_id)
);

-- enum résultat par critère
DO $$ BEGIN
  CREATE TYPE criterion_eval_result AS ENUM ('acquis', 'en_cours', 'a_corriger');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- évaluations vidéo (résultats par joueur)
CREATE TABLE IF NOT EXISTS theme_video_evaluations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  template_id    UUID NOT NULL REFERENCES theme_video_eval_templates(id) ON DELETE CASCADE,
  child_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  coach_id       UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  video_url      TEXT,
  global_comment TEXT,
  next_step      TEXT,
  evaluated_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- résultats par critère dans une évaluation
CREATE TABLE IF NOT EXISTS video_evaluation_criterion_results (
  evaluation_id UUID NOT NULL REFERENCES theme_video_evaluations(id) ON DELETE CASCADE,
  criterion_id  UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  result        criterion_eval_result NOT NULL DEFAULT 'en_cours',
  comment       TEXT,
  PRIMARY KEY (evaluation_id, criterion_id)
);

-- niveaux badge / progression
CREATE TABLE IF NOT EXISTS theme_badge_levels (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  theme_id                UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  level_number            INTEGER NOT NULL,
  stage                   TEXT NOT NULL CHECK (stage IN ('Bronze','Argent','Or','Elite','Master')),
  badge_image_url         TEXT,
  progression_rule        TEXT,
  required_criteria_count INTEGER,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- enum type ressource
DO $$ BEGIN
  CREATE TYPE theme_resource_type AS ENUM (
    'pdf_coach','video_global','image_global','audio','reference_media'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ressources pédagogiques centralisées
CREATE TABLE IF NOT EXISTS theme_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  theme_id      UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  resource_type theme_resource_type NOT NULL,
  label         TEXT,
  url           TEXT NOT NULL,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- différenciation par catégorie d'âge
CREATE TABLE IF NOT EXISTS theme_age_differentiation (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  theme_id             UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  age_category         TEXT NOT NULL CHECK (age_category IN ('U6','U8','U10','U12','U14','U16','U21','Senior')),
  simplification_notes TEXT,
  vocabulary_adapted   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(theme_id, age_category)
);

-- ── RLS ───────────────────────────────────────

ALTER TABLE theme_vision              ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_page_terrain        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_criteria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_mini_exercises      ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_home_exercises      ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_exercise_criteria    ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_video_eval_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_eval_template_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_video_evaluations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_evaluation_criterion_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_badge_levels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_resources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_age_differentiation ENABLE ROW LEVEL SECURITY;

-- Policies tenant isolation (pattern du projet) — idempotent
DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_vision' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_vision
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_page_terrain' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_page_terrain
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_mini_exercises' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_mini_exercises
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_home_exercises' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_home_exercises
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_video_eval_templates' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_video_eval_templates
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_video_evaluations' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_video_evaluations
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_badge_levels' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_badge_levels
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_resources' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_resources
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_age_differentiation' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON theme_age_differentiation
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
  -- join tables : pas de tenant_id direct, accès via parent
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sequence_criteria' AND policyname='access_via_parent') THEN
    CREATE POLICY "access_via_parent" ON sequence_criteria
      USING (EXISTS (
        SELECT 1 FROM theme_sequences ts
        JOIN themes t ON t.id = ts.theme_id
        WHERE ts.id = sequence_criteria.sequence_id
          AND t.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='home_exercise_criteria' AND policyname='access_via_parent') THEN
    CREATE POLICY "access_via_parent" ON home_exercise_criteria
      USING (EXISTS (
        SELECT 1 FROM theme_home_exercises he
        WHERE he.id = home_exercise_criteria.exercise_id
          AND he.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='video_eval_template_criteria' AND policyname='access_via_parent') THEN
    CREATE POLICY "access_via_parent" ON video_eval_template_criteria
      USING (EXISTS (
        SELECT 1 FROM theme_video_eval_templates vt
        WHERE vt.id = video_eval_template_criteria.template_id
          AND vt.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='video_evaluation_criterion_results' AND policyname='access_via_parent') THEN
    CREATE POLICY "access_via_parent" ON video_evaluation_criterion_results
      USING (EXISTS (
        SELECT 1 FROM theme_video_evaluations ve
        WHERE ve.id = video_evaluation_criterion_results.evaluation_id
          AND ve.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      ));
  END IF;
END $pol$;

-- ── TRIGGERS updated_at ───────────────────────
-- Pattern du projet : une fonction dédiée par table — triggers idempotents

CREATE OR REPLACE FUNCTION set_theme_vision_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_vision_updated_at ON theme_vision;
CREATE TRIGGER theme_vision_updated_at
  BEFORE UPDATE ON theme_vision
  FOR EACH ROW EXECUTE FUNCTION set_theme_vision_updated_at();

CREATE OR REPLACE FUNCTION set_theme_page_terrain_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_page_terrain_updated_at ON theme_page_terrain;
CREATE TRIGGER theme_page_terrain_updated_at
  BEFORE UPDATE ON theme_page_terrain
  FOR EACH ROW EXECUTE FUNCTION set_theme_page_terrain_updated_at();

CREATE OR REPLACE FUNCTION set_theme_mini_exercises_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_mini_exercises_updated_at ON theme_mini_exercises;
CREATE TRIGGER theme_mini_exercises_updated_at
  BEFORE UPDATE ON theme_mini_exercises
  FOR EACH ROW EXECUTE FUNCTION set_theme_mini_exercises_updated_at();

CREATE OR REPLACE FUNCTION set_theme_home_exercises_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_home_exercises_updated_at ON theme_home_exercises;
CREATE TRIGGER theme_home_exercises_updated_at
  BEFORE UPDATE ON theme_home_exercises
  FOR EACH ROW EXECUTE FUNCTION set_theme_home_exercises_updated_at();

CREATE OR REPLACE FUNCTION set_theme_video_eval_templates_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_video_eval_templates_updated_at ON theme_video_eval_templates;
CREATE TRIGGER theme_video_eval_templates_updated_at
  BEFORE UPDATE ON theme_video_eval_templates
  FOR EACH ROW EXECUTE FUNCTION set_theme_video_eval_templates_updated_at();

CREATE OR REPLACE FUNCTION set_theme_video_evaluations_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_video_evaluations_updated_at ON theme_video_evaluations;
CREATE TRIGGER theme_video_evaluations_updated_at
  BEFORE UPDATE ON theme_video_evaluations
  FOR EACH ROW EXECUTE FUNCTION set_theme_video_evaluations_updated_at();

CREATE OR REPLACE FUNCTION set_theme_age_differentiation_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS theme_age_differentiation_updated_at ON theme_age_differentiation;
CREATE TRIGGER theme_age_differentiation_updated_at
  BEFORE UPDATE ON theme_age_differentiation
  FOR EACH ROW EXECUTE FUNCTION set_theme_age_differentiation_updated_at();
