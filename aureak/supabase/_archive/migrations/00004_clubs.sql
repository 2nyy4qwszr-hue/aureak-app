-- Migration 00004 — clubs + club_child_links
-- Story 2.5 — Gestion des accès clubs (Partenaire & Commun)
-- Prérequis : 00001 (tenants), 00002 (user_role, club_access_level), 00003 (profiles)
--
-- Les clubs sont des utilisateurs auth.users à part entière.
-- Distinction partner/common : clubs.club_access_level (pas l'enum user_role).
-- Policies RLS : voir supabase/migrations/00010_rls_policies.sql (section Story 2.5)

-- Étendre l'enum user_role avec la valeur 'club'
-- IF NOT EXISTS : idempotent en cas de supabase db reset partial
-- Note : ne pas utiliser dans un BEGIN/COMMIT explicite — Supabase CLI gère les transactions
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'club';

-- ============================================================
-- Table clubs — compte utilisateur d'un club partenaire
-- ============================================================

CREATE TABLE clubs (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  club_access_level club_access_level NOT NULL DEFAULT 'common',
  -- Soft-delete convention (Zone 11)
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index performance — lookup par tenant (actifs uniquement)
CREATE INDEX clubs_tenant_idx ON clubs (tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Table club_child_links — liaison enfant <-> club
-- Pas de soft-delete : table de liaison pure (historique dans audit_logs)
-- ============================================================

CREATE TABLE club_child_links (
  club_id    UUID NOT NULL REFERENCES clubs(user_id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, child_id)
);

-- Index pour les lookups RLS depuis le côté enfant (indispensable pour performance)
CREATE INDEX ccl_child_idx ON club_child_links (child_id);
CREATE INDEX ccl_club_idx  ON club_child_links (club_id);

ALTER TABLE club_child_links ENABLE ROW LEVEL SECURITY;
