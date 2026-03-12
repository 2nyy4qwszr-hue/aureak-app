-- Story 21.3 — Training Builder : ateliers (workshops) par séance opérationnelle
-- Migration 00076 (00074 = fix_session_theme_blocks_unique, 00075 = child_directory_nom_prenom)

-- ── Bucket Supabase Storage ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('session-workshops', 'session-workshops', true)
ON CONFLICT DO NOTHING;

-- Policies Storage
CREATE POLICY "admin_upload_session_workshops" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'session-workshops' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "admin_update_session_workshops" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'session-workshops' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "admin_delete_session_workshops" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'session-workshops' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "auth_read_session_workshops" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'session-workshops');

-- ── Fonction générique updated_at ─────────────────────────────────────────────
-- Pas de version générique dans les migrations fondation — on la crée ici (idempotent)

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Table session_workshops ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_workshops (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  pdf_url     TEXT,
  card_label  TEXT,
  card_url    TEXT,
  notes       TEXT CHECK (char_length(notes) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sw_session_id ON session_workshops (session_id);
CREATE INDEX IF NOT EXISTS idx_sw_tenant_id  ON session_workshops (tenant_id);

DROP TRIGGER IF EXISTS set_session_workshops_updated_at ON session_workshops;
CREATE TRIGGER set_session_workshops_updated_at
  BEFORE UPDATE ON session_workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE session_workshops ENABLE ROW LEVEL SECURITY;

-- Admin : accès complet dans son tenant
CREATE POLICY "admin_full_session_workshops" ON session_workshops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND user_role = 'admin'
        AND tenant_id = session_workshops.tenant_id
    )
  );

-- Coach : lecture des ateliers des séances auxquelles il est assigné
CREATE POLICY "coach_read_session_workshops" ON session_workshops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = session_workshops.session_id
        AND sc.coach_id = auth.uid()
    )
  );

COMMENT ON TABLE session_workshops IS 'Ateliers pratiques (workshops) associés à une séance opérationnelle (Story 21.3)';
COMMENT ON COLUMN session_workshops.sort_order IS 'Ordre d''affichage (0-indexed, max 3 → 4 ateliers max côté UI)';
