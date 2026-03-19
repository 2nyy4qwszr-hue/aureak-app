-- ════════════════════════════════════════════════
-- MIGRATION 00078 — Theme Metaphors
-- Story 24.3 : Métaphores pédagogiques d'un thème,
-- liées optionnellement à une séquence.
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS theme_metaphors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  theme_id    UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sequence_id UUID REFERENCES theme_sequences(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Index ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS theme_metaphors_theme_sort_idx
  ON theme_metaphors (theme_id, sort_order);

CREATE INDEX IF NOT EXISTS theme_metaphors_tenant_idx
  ON theme_metaphors (tenant_id);

-- ── RLS ────────────────────────────────────────
ALTER TABLE theme_metaphors ENABLE ROW LEVEL SECURITY;

DO $pol$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'theme_metaphors' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON theme_metaphors
      USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  END IF;
END $pol$;

-- ── Trigger updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION set_theme_metaphors_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS theme_metaphors_updated_at ON theme_metaphors;
CREATE TRIGGER theme_metaphors_updated_at
  BEFORE UPDATE ON theme_metaphors
  FOR EACH ROW EXECUTE FUNCTION set_theme_metaphors_updated_at();
