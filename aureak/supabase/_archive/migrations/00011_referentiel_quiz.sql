-- Story 3.5 — Questions de Quiz (Workflow Draft/Published)
-- ============================================================

CREATE TABLE quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id      UUID NOT NULL REFERENCES themes(id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  question_text TEXT NOT NULL,
  explanation   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order    INTEGER,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX qq_theme_idx    ON quiz_questions (theme_id, status) WHERE deleted_at IS NULL;
CREATE INDEX qq_tenant_idx   ON quiz_questions (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE quiz_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER
);

-- Garantit une seule option correcte par question
CREATE UNIQUE INDEX one_correct_per_question ON quiz_options (question_id) WHERE is_correct = true;

CREATE INDEX qo_question_idx ON quiz_options (question_id, sort_order);

-- ─── Trigger de publication ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_quiz_question_publish()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  opt_count     INTEGER;
  correct_count INTEGER;
BEGIN
  IF NEW.status = 'published' AND OLD.status = 'draft' THEN
    SELECT COUNT(*) INTO opt_count
      FROM quiz_options WHERE question_id = NEW.id;
    SELECT COUNT(*) INTO correct_count
      FROM quiz_options WHERE question_id = NEW.id AND is_correct = true;

    IF opt_count NOT BETWEEN 3 AND 4 THEN
      RAISE EXCEPTION 'Quiz question % must have 3-4 options, has %', NEW.id, opt_count;
    END IF;
    IF correct_count != 1 THEN
      RAISE EXCEPTION 'Quiz question % must have exactly 1 correct answer, has %', NEW.id, correct_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quiz_publish
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION validate_quiz_question_publish();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options   ENABLE ROW LEVEL SECURITY;
