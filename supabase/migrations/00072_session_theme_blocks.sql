-- Story 21.2 — Training Builder : blocs thèmes / séquences / ressources liés aux séances opérationnelles
-- Distincte de methodology_session_themes (liée aux fiches pédagogiques réutilisables)

CREATE TABLE IF NOT EXISTS session_theme_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  theme_id    UUID        NOT NULL REFERENCES themes(id),
  sequence_id UUID                    REFERENCES theme_sequences(id),
  resource_id UUID                    REFERENCES theme_resources(id),
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (session_id, theme_id, sequence_id)
);

CREATE INDEX IF NOT EXISTS idx_stb_session_id ON session_theme_blocks (session_id);
CREATE INDEX IF NOT EXISTS idx_stb_tenant_id  ON session_theme_blocks (tenant_id);

-- RLS
ALTER TABLE session_theme_blocks ENABLE ROW LEVEL SECURITY;

-- Admin : accès complet dans son tenant
CREATE POLICY "admin_full_access_session_theme_blocks" ON session_theme_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND user_role = 'admin'
        AND tenant_id = session_theme_blocks.tenant_id
    )
  );

-- Coach : lecture des blocs des séances auxquelles il est assigné
CREATE POLICY "coach_read_session_theme_blocks" ON session_theme_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = session_theme_blocks.session_id
        AND sc.coach_id   = auth.uid()
    )
  );

COMMENT ON TABLE session_theme_blocks IS 'Blocs thème/séquence/ressource associés à une séance opérationnelle (Story 21.2)';
COMMENT ON COLUMN session_theme_blocks.sort_order IS 'Ordre d''affichage dans l''interface (0-indexed)';
