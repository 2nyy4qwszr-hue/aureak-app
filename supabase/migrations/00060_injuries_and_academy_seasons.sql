-- =============================================================================
-- Migration 00060 : Blessures joueurs + seed saisons académie historiques
-- =============================================================================

-- ─── 1. Table blessures joueurs ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_directory_injuries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id    UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,

  -- Type : 'blessure' (légère) ou 'grosse_blessure' (longue durée)
  type        TEXT        NOT NULL DEFAULT 'blessure'
              CHECK (type IN ('blessure', 'grosse_blessure')),

  -- Zone anatomique ou nature (texte libre)
  zone        TEXT,          -- ex: 'cheville gauche', 'genou', 'commotion'

  -- Période
  date_debut  DATE,
  date_fin    DATE,          -- null = en cours

  -- Notes libres
  commentaire TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
DO $rls$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'child_directory_injuries' AND policyname = 'tenant_isolation'
  ) THEN
    ALTER TABLE child_directory_injuries ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON child_directory_injuries
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_child_directory_injuries_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $trg$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'child_directory_injuries_updated_at'
  ) THEN
    CREATE TRIGGER child_directory_injuries_updated_at
      BEFORE UPDATE ON child_directory_injuries
      FOR EACH ROW EXECUTE FUNCTION set_child_directory_injuries_updated_at();
  END IF;
END $trg$;

CREATE INDEX IF NOT EXISTS idx_child_injuries_child
  ON child_directory_injuries (child_id, tenant_id, date_debut DESC NULLS LAST);

-- ─── 2. Seed saisons académie historiques (2014-2015 → 2026-2027) ────────────
-- Insère toutes les saisons manquantes pour chaque tenant existant.
-- La saison courante (is_current=true) n'est jamais écrasée.

INSERT INTO academy_seasons (tenant_id, label, start_date, end_date, is_current)
SELECT
  t.id                   AS tenant_id,
  s.label,
  s.start_date :: date,
  s.end_date   :: date,
  -- Marque 2025-2026 comme courante seulement si aucune saison courante n'existe
  CASE
    WHEN s.label = '2025-2026'
     AND NOT EXISTS (
       SELECT 1 FROM academy_seasons
       WHERE tenant_id = t.id AND is_current = true
     )
    THEN true
    ELSE false
  END                    AS is_current
FROM tenants t
CROSS JOIN (VALUES
  ('2014-2015', '2014-09-01', '2015-06-30'),
  ('2015-2016', '2015-09-01', '2016-06-30'),
  ('2016-2017', '2016-09-01', '2017-06-30'),
  ('2017-2018', '2017-09-01', '2018-06-30'),
  ('2018-2019', '2018-09-01', '2019-06-30'),
  ('2019-2020', '2019-09-01', '2020-06-30'),
  ('2020-2021', '2020-09-01', '2021-06-30'),
  ('2021-2022', '2021-09-01', '2022-06-30'),
  ('2022-2023', '2022-09-01', '2023-06-30'),
  ('2023-2024', '2023-09-01', '2024-06-30'),
  ('2024-2025', '2024-09-01', '2025-06-30'),
  ('2025-2026', '2025-09-01', '2026-06-30'),
  ('2026-2027', '2026-09-01', '2027-06-30')
) AS s(label, start_date, end_date)
ON CONFLICT (tenant_id, label) DO NOTHING;
