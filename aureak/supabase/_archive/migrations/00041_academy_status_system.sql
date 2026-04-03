-- Migration 00041 — Academy status system
-- Tables: academy_seasons, child_academy_memberships, stages, child_stage_participations
-- View:   v_child_academy_status (computed status + legacy Notion fallback)
-- Applied live via Management API — saved here for tracking

-- ── Tables ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academy_seasons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  label      TEXT NOT NULL,            -- e.g. '2025-2026'
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one current season per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_academy_seasons_one_current
  ON academy_seasons (tenant_id) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS child_academy_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  child_id   UUID NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  season_id  UUID NOT NULL REFERENCES academy_seasons(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at    TIMESTAMPTZ,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, child_id, season_id)
);

CREATE TABLE IF NOT EXISTS stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  name         TEXT NOT NULL,
  season_label TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  location     TEXT,
  type         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS child_stage_participations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL,
  child_id             UUID NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  stage_id             UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  participation_status TEXT NOT NULL DEFAULT 'confirmed',
  registered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, child_id, stage_id)
);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE academy_seasons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_academy_memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_stage_participations  ENABLE ROW LEVEL SECURITY;

-- (policies to be added per project RLS pattern)

-- ── View ───────────────────────────────────────────────────────────────────────
-- v_child_academy_status computes academy status for every child_directory row.
-- Priority 1: real membership/stage data (populated programmatically)
-- Priority 2: legacy Notion statut field fallback (Notion import: Académicien/Nouveau/Ancien/Stagiaire)

CREATE OR REPLACE VIEW v_child_academy_status AS
WITH academy_stats AS (
  SELECT
    m.child_id,
    m.tenant_id,
    COUNT(DISTINCT m.season_id)          AS total_seasons,
    BOOL_OR(s.is_current)                AS in_current_season,
    MIN(s.label)                         AS first_season_label,
    MAX(s.label)                         AS last_season_label
  FROM child_academy_memberships m
  JOIN academy_seasons s ON s.id = m.season_id AND s.tenant_id = m.tenant_id
  GROUP BY m.child_id, m.tenant_id
),
stage_stats AS (
  SELECT
    p.child_id,
    p.tenant_id,
    COUNT(DISTINCT p.stage_id)           AS total_stages,
    MIN(st.name)                         AS first_stage_name,
    MAX(st.name)                         AS last_stage_name,
    MIN(st.start_date)                   AS first_stage_date,
    MAX(st.start_date)                   AS last_stage_date
  FROM child_stage_participations p
  JOIN stages st ON st.id = p.stage_id AND st.tenant_id = p.tenant_id
  WHERE p.participation_status <> 'cancelled'
  GROUP BY p.child_id, p.tenant_id
),
current_season AS (
  SELECT tenant_id, label AS current_season_label
  FROM academy_seasons
  WHERE is_current = true
)
SELECT
  c.id            AS child_id,
  c.tenant_id,
  c.display_name,
  COALESCE(a.total_seasons, 0)           AS total_academy_seasons,
  COALESCE(a.in_current_season, false)   AS in_current_season,
  a.first_season_label,
  a.last_season_label,
  cs.current_season_label,
  COALESCE(ss.total_stages, 0)           AS total_stages,
  ss.first_stage_name,
  ss.last_stage_name,
  ss.first_stage_date,
  ss.last_stage_date,
  CASE
    -- Priority 1: real membership data
    WHEN COALESCE(a.in_current_season, false) AND COALESCE(a.total_seasons, 0) = 1
      THEN 'NOUVEAU_ACADÉMICIEN'
    WHEN COALESCE(a.in_current_season, false)
      THEN 'ACADÉMICIEN'
    WHEN COALESCE(a.total_seasons, 0) > 0
      THEN 'ANCIEN'
    WHEN COALESCE(ss.total_stages, 0) > 0
      THEN 'STAGE_UNIQUEMENT'
    -- Priority 2: legacy Notion statut fallback
    WHEN c.statut = 'Académicien' THEN 'ACADÉMICIEN'
    WHEN c.statut = 'Nouveau'     THEN 'NOUVEAU_ACADÉMICIEN'
    WHEN c.statut = 'Ancien'      THEN 'ANCIEN'
    WHEN c.statut = 'Stagiaire'   THEN 'STAGE_UNIQUEMENT'
    -- Default
    ELSE 'PROSPECT'
  END AS computed_status
FROM child_directory c
LEFT JOIN academy_stats  a  ON a.child_id = c.id AND a.tenant_id = c.tenant_id
LEFT JOIN stage_stats    ss ON ss.child_id = c.id AND ss.tenant_id = c.tenant_id
LEFT JOIN current_season cs ON cs.tenant_id = c.tenant_id
WHERE c.deleted_at IS NULL;
