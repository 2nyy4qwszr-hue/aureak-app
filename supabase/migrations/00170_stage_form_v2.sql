-- =============================================================================
-- Migration 00170 : Stage form v2 — fix RLS INSERT + implantations.short_name
-- Story 107.1
--
-- Objectifs :
--   1. Remplacer la policy "stages_tenant" (00041) par le pattern split
--      read/admin_write aligné sur 00140 (avec WITH CHECK symétrique).
--      La policy actuelle utilise FOR ALL USING (...) sans WITH CHECK, ce qui
--      bloque les INSERT côté client avec l'erreur :
--        "new row violates row-level security policy for table stages"
--   2. Ajouter implantations.short_name (TEXT, nullable) + seed data pour
--      permettre la génération automatique du nom de stage au format
--      "{Méthode} - {Type} - {ShortName} - {Année}".
-- =============================================================================

-- ── 1. Fix RLS stages ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "stages_tenant"       ON stages;
DROP POLICY IF EXISTS "stages_tenant_read"  ON stages;
DROP POLICY IF EXISTS "stages_admin_write"  ON stages;

CREATE POLICY "stages_tenant_read" ON stages
  FOR SELECT
  USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "stages_admin_write" ON stages
  FOR ALL
  USING      (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user())
  WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- ── 2. implantations.short_name + seed ────────────────────────────────────────

ALTER TABLE implantations ADD COLUMN IF NOT EXISTS short_name TEXT;

UPDATE implantations SET short_name = 'Onhaye'    WHERE name ILIKE '%Onhaye%'        AND short_name IS NULL;
UPDATE implantations SET short_name = 'Templiers' WHERE name ILIKE '%Templiers%'     AND short_name IS NULL;
UPDATE implantations SET short_name = 'Rochefort' WHERE name ILIKE '%Rochefortoise%' AND short_name IS NULL;
