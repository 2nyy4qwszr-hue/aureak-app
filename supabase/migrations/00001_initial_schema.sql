-- =============================================================================
-- Migration 00001 : Extensions + Table tenants + Fonctions helper JWT
-- Story 1.2 — Fondation multi-tenant
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Fonctions helper JWT — DOIVENT être créées avant les policies RLS
-- =============================================================================

-- Retourne le tenant_id depuis le JWT (app_metadata.tenant_id)
-- SECURITY DEFINER pour accès à auth.jwt() depuis les policies RLS
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
$$;

-- Retourne le rôle utilisateur depuis le JWT (app_metadata.role)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$;

-- =============================================================================
-- Table tenants — multi-tenant foundation
-- =============================================================================

CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Isolation tenant : chaque utilisateur ne voit que son tenant
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = current_tenant_id());
