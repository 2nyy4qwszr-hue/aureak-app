-- Migration 00001 — Schéma initial : extensions, tenants, fonctions helper JWT
-- Story 1.2 — Fondation multi-tenant
-- Prérequis : aucun

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Fonctions helper JWT — SECURITY DEFINER pour accès à auth.jwt()
-- Définies EN PREMIER car utilisées dans les policies RLS ci-dessous
-- ============================================================

-- Extrait tenant_id depuis app_metadata du JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
$$;

-- Extrait le rôle depuis app_metadata du JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$;

-- ============================================================
-- Table tenants (multi-tenant foundation)
-- ============================================================
CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy minimale : chaque utilisateur voit uniquement son tenant
-- (enrichie en Story 2.2 avec RBAC complet)
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = current_tenant_id());
