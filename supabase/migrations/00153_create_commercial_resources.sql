-- Story 88.5 : Bibliothèque ressources commerciales
-- Table metadata + bucket Storage + RLS + seed

-- ── Enum ──────────────────────────────────────────────────────────────────────
CREATE TYPE commercial_resource_type AS ENUM ('powerpoint', 'flyer', 'webpage', 'tarifs');

-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE commercial_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  resource_type commercial_resource_type NOT NULL,
  file_path     TEXT,                     -- chemin dans le bucket (null = pas encore uploadé)
  external_url  TEXT,                     -- URL externe (pour webpage)
  file_size     BIGINT,                   -- taille en octets
  mime_type     TEXT,                     -- ex: application/pdf
  uploaded_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_commercial_resources
  BEFORE UPDATE ON commercial_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE commercial_resources ENABLE ROW LEVEL SECURITY;

-- Admin : full CRUD
CREATE POLICY "admin_commercial_resources_all"
  ON commercial_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.tenant_id = commercial_resources.tenant_id
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.tenant_id = commercial_resources.tenant_id
        AND profiles.role = 'admin'
    )
  );

-- Commercial : lecture seule
CREATE POLICY "commercial_commercial_resources_select"
  ON commercial_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.tenant_id = commercial_resources.tenant_id
        AND profiles.role = 'commercial'
    )
  );

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('commercial-resources', 'commercial-resources', false, 52428800)  -- 50 MB
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "admin_commercial_resources_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'commercial-resources'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_commercial_resources_storage_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'commercial-resources'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_commercial_resources_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'commercial-resources'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "authenticated_commercial_resources_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'commercial-resources'
    AND auth.uid() IS NOT NULL
  );

-- ── Seed : 4 ressources prédéfinies ──────────────────────────────────────────
-- On utilise le premier tenant existant
INSERT INTO commercial_resources (tenant_id, title, description, resource_type)
SELECT
  t.id,
  v.title,
  v.description,
  v.rtype::commercial_resource_type
FROM tenants t
CROSS JOIN (VALUES
  ('Présentation Club PowerPoint', 'Présentation complète à envoyer aux clubs partenaires potentiels.', 'powerpoint'),
  ('Flyer Parents',                'Document à distribuer aux parents lors des événements et portes ouvertes.', 'flyer'),
  ('One-pager Web',                'Page web de présentation de l''académie — lien à partager.', 'webpage'),
  ('Grille Tarifaire',            'Tarifs actuels des différentes formules et stages.', 'tarifs')
) AS v(title, description, rtype)
LIMIT 4;
