-- Story 58-8 — Table methodology_session_modules : structure 3 phases par séance pédagogique
-- Phases : activation | development | conclusion
-- Distinct de la colonne JSONB `modules` (migration 00111) qui sert aux séances GP structurées.

CREATE TABLE IF NOT EXISTS methodology_session_modules (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_session_id   UUID NOT NULL REFERENCES methodology_sessions(id) ON DELETE CASCADE,
  module_type              TEXT NOT NULL CHECK (module_type IN ('activation', 'development', 'conclusion')),
  duration_minutes         INT  NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (methodology_session_id, module_type)
);

COMMENT ON TABLE methodology_session_modules IS
  'Story 58-8 — Phases pédagogiques (activation/développement/conclusion) d''une séance méthodologie.';

-- Table de liaison : module ↔ situations associées
CREATE TABLE IF NOT EXISTS methodology_module_situations (
  module_id    UUID NOT NULL REFERENCES methodology_session_modules(id) ON DELETE CASCADE,
  situation_id UUID NOT NULL REFERENCES methodology_situations(id) ON DELETE CASCADE,
  sort_order   INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (module_id, situation_id)
);

COMMENT ON TABLE methodology_module_situations IS
  'Story 58-8 — Situations pédagogiques associées à un module de phase de séance.';

-- RLS
ALTER TABLE methodology_session_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_module_situations   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_methodology_session_modules" ON methodology_session_modules
  FOR ALL USING (
    methodology_session_id IN (
      SELECT id FROM methodology_sessions WHERE tenant_id = current_tenant_id()
    )
  );

CREATE POLICY "tenant_access_methodology_module_situations" ON methodology_module_situations
  FOR ALL USING (
    module_id IN (
      SELECT msm.id FROM methodology_session_modules msm
      JOIN methodology_sessions ms ON ms.id = msm.methodology_session_id
      WHERE ms.tenant_id = current_tenant_id()
    )
  );
