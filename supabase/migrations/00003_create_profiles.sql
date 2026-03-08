-- =============================================================================
-- Migration 00003 : Profiles table
-- Profil utilisateur étendu — core + champs spécifiques enfant
-- NOTE : user_role est TEXT (pas l'enum) pour supporter 'club' et futures valeurs
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Clé primaire = l'UUID auth Supabase
  user_id        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identité
  user_role      TEXT        NOT NULL,
  display_name   TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'active',

  -- Contact (tous rôles)
  phone          TEXT,

  -- Notes internes (admin/coach)
  internal_notes TEXT,

  -- ── Champs spécifiques rôle 'child' ─────────────────────────────────────────
  birth_date          DATE,
  gender              TEXT,   -- 'male' | 'female' | 'other'
  strong_foot         TEXT,   -- 'right' | 'left' | 'both'
  age_category        TEXT,   -- 'Foot à 5' | 'Foot à 8' | 'Foot à 11' | 'Senior'
  current_club        TEXT,

  -- Premier contact parent
  parent_first_name   TEXT,
  parent_last_name    TEXT,
  parent_email        TEXT,
  parent_phone        TEXT,

  -- Second contact parent
  parent2_first_name  TEXT,
  parent2_last_name   TEXT,
  parent2_email       TEXT,
  parent2_phone       TEXT,

  -- Soft-delete + timestamps
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- Tenant isolation globale
CREATE POLICY "tenant_isolation" ON profiles
  FOR ALL USING (tenant_id = current_tenant_id());

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_tenant
  ON profiles(tenant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(tenant_id, user_role)
  WHERE deleted_at IS NULL;
