-- ════════════════════════════════════════════════
-- MIGRATION 00057 — Situations linked to Blocs
-- Both Themes and Situations now reference the
-- same theme_groups table (= Blocs).
-- situation_groups stays in DB but is no longer
-- the primary grouping for situations.
-- ════════════════════════════════════════════════

ALTER TABLE situations
  ADD COLUMN IF NOT EXISTS bloc_id UUID REFERENCES theme_groups(id) ON DELETE SET NULL;

-- Index for filtering situations by bloc
CREATE INDEX IF NOT EXISTS idx_situations_bloc_id ON situations(bloc_id);
