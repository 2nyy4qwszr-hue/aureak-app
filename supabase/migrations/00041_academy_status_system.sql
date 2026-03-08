-- =============================================================================
-- Migration 00041 : Système de statut académie — 4 tables + vue calculée
-- Vocabulaire : joueur = enfant = child (child_directory)
-- Statuts possibles : ACADÉMICIEN | NOUVEAU_ACADÉMICIEN | ANCIEN |
--                     STAGE_UNIQUEMENT | PROSPECT
-- =============================================================================

-- ─── 1. academy_seasons ───────────────────────────────────────────────────────
-- Liste des saisons académie (2023-2024, 2024-2025, 2025-2026, …)

CREATE TABLE academy_seasons (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,                 -- ex : '2025-2026'
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  is_current BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_season_dates CHECK (end_date > start_date)
);

-- Garantit une seule saison active par tenant
CREATE UNIQUE INDEX idx_academy_seasons_one_current
  ON academy_seasons (tenant_id)
  WHERE is_current = true;

-- Garantit un label unique par tenant
CREATE UNIQUE INDEX idx_academy_seasons_label
  ON academy_seasons (tenant_id, label);

ALTER TABLE academy_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_seasons_tenant"
  ON academy_seasons FOR ALL
  USING (tenant_id = current_tenant_id());

-- ─── 2. child_academy_memberships ────────────────────────────────────────────
-- Quel enfant était à l'académie pendant quelle(s) saison(s)

CREATE TABLE child_academy_memberships (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id   UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  season_id  UUID        NOT NULL REFERENCES academy_seasons(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at    TIMESTAMPTZ,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_child_academy_season UNIQUE (tenant_id, child_id, season_id)
);

CREATE INDEX idx_cam_child   ON child_academy_memberships (child_id,  tenant_id);
CREATE INDEX idx_cam_season  ON child_academy_memberships (season_id, tenant_id);

ALTER TABLE child_academy_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cam_tenant"
  ON child_academy_memberships FOR ALL
  USING (tenant_id = current_tenant_id());

-- ─── 3. stages ───────────────────────────────────────────────────────────────
-- Stages / camps d'entraînement organisés par l'académie

CREATE TABLE stages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,            -- ex : 'Stage Été 2024'
  season_label TEXT,                            -- ex : '2024-2025'
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  location     TEXT,                            -- lieu du stage
  type         TEXT,                            -- 'été' | 'toussaint' | 'hiver' | 'pâques' | 'custom'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_stage_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_stages_tenant ON stages (tenant_id, start_date DESC);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_tenant"
  ON stages FOR ALL
  USING (tenant_id = current_tenant_id());

-- ─── 4. child_stage_participations ───────────────────────────────────────────
-- Quel enfant a participé à quel stage

CREATE TABLE child_stage_participations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id             UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  stage_id             UUID        NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  participation_status TEXT        NOT NULL DEFAULT 'confirmed',
  -- 'registered' | 'confirmed' | 'absent' | 'cancelled'
  registered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_child_stage UNIQUE (tenant_id, child_id, stage_id)
);

CREATE INDEX idx_csp_child  ON child_stage_participations (child_id,  tenant_id);
CREATE INDEX idx_csp_stage  ON child_stage_participations (stage_id,  tenant_id);

ALTER TABLE child_stage_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csp_tenant"
  ON child_stage_participations FOR ALL
  USING (tenant_id = current_tenant_id());

-- ─── 5. Vue calculée : v_child_academy_status ────────────────────────────────
-- Calcule en temps réel le statut de chaque joueur du child_directory.
-- Logique :
--   NOUVEAU_ACADÉMICIEN → inscrit saison courante ET c'est sa 1ère saison
--   ACADÉMICIEN         → inscrit saison courante, plusieurs saisons
--   ANCIEN              → inscrit par le passé, pas en cours
--   STAGE_UNIQUEMENT    → jamais académie, mais a fait ≥1 stage (non annulé)
--   PROSPECT            → rien du tout

CREATE OR REPLACE VIEW v_child_academy_status AS
WITH academy_stats AS (
  SELECT
    m.child_id,
    m.tenant_id,
    COUNT(DISTINCT m.season_id)                              AS total_seasons,
    BOOL_OR(s.is_current)                                    AS in_current_season,
    MIN(s.label)                                             AS first_season_label,
    MAX(s.label)                                             AS last_season_label
  FROM child_academy_memberships m
  JOIN academy_seasons s ON s.id = m.season_id AND s.tenant_id = m.tenant_id
  GROUP BY m.child_id, m.tenant_id
),
stage_stats AS (
  SELECT
    p.child_id,
    p.tenant_id,
    COUNT(DISTINCT p.stage_id)                               AS total_stages,
    MIN(st.name)                                             AS first_stage_name,
    MAX(st.name)                                             AS last_stage_name,
    MIN(st.start_date)                                       AS first_stage_date,
    MAX(st.start_date)                                       AS last_stage_date
  FROM child_stage_participations p
  JOIN stages st ON st.id = p.stage_id AND st.tenant_id = p.tenant_id
  WHERE p.participation_status <> 'cancelled'
  GROUP BY p.child_id, p.tenant_id
),
current_season AS (
  SELECT tenant_id, label AS current_season_label
  FROM   academy_seasons
  WHERE  is_current = true
)
SELECT
  c.id                                                             AS child_id,
  c.tenant_id,
  c.display_name,
  COALESCE(a.total_seasons,  0)                                    AS total_academy_seasons,
  COALESCE(a.in_current_season, false)                             AS in_current_season,
  a.first_season_label,
  a.last_season_label,
  cs.current_season_label,
  COALESCE(ss.total_stages,  0)                                    AS total_stages,
  ss.first_stage_name,
  ss.last_stage_name,
  ss.first_stage_date,
  ss.last_stage_date,
  CASE
    WHEN COALESCE(a.in_current_season, false) AND COALESCE(a.total_seasons, 0) = 1
      THEN 'NOUVEAU_ACADÉMICIEN'
    WHEN COALESCE(a.in_current_season, false)
      THEN 'ACADÉMICIEN'
    WHEN COALESCE(a.total_seasons, 0) > 0
      THEN 'ANCIEN'
    WHEN COALESCE(ss.total_stages, 0) > 0
      THEN 'STAGE_UNIQUEMENT'
    ELSE 'PROSPECT'
  END                                                              AS computed_status
FROM  child_directory c
LEFT JOIN academy_stats  a  ON a.child_id  = c.id AND a.tenant_id  = c.tenant_id
LEFT JOIN stage_stats    ss ON ss.child_id = c.id AND ss.tenant_id = c.tenant_id
LEFT JOIN current_season cs ON cs.tenant_id = c.tenant_id
WHERE c.deleted_at IS NULL;

-- ─── 6. Seed : saison courante 2025-2026 (si absente) ────────────────────────
-- Cette commande s'exécute uniquement si la table est vide pour le tenant donné.
-- À adapter selon l'identifiant exact du tenant en production.
-- NOTE : le seed réel est fait via le dashboard ou un script séparé.
-- (Laissé commenté pour éviter une erreur si tenant_id inconnu)
--
-- INSERT INTO academy_seasons (tenant_id, label, start_date, end_date, is_current)
-- SELECT id, '2025-2026', '2025-09-01', '2026-06-30', true
-- FROM   tenants
-- ON CONFLICT DO NOTHING;
