-- Story 86.3 — Permissions granulaires par section — admin-configurable
-- Tables role_default_sections + user_section_overrides
-- Seed les sections par défaut par rôle

-- ── Enum app_section ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_section AS ENUM (
    'dashboard',
    'activites',
    'methodologie',
    'academie',
    'evenements',
    'prospection',
    'marketing',
    'partenariat',
    'performances'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table role_default_sections ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_default_sections (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role        public.user_role    NOT NULL,
  section_key public.app_section  NOT NULL,
  enabled     BOOLEAN             NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),

  UNIQUE (role, section_key)
);

-- ── Table user_section_overrides ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_section_overrides (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_key public.app_section  NOT NULL,
  enabled     BOOLEAN             NOT NULL,
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),

  UNIQUE (user_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_user_section_overrides_user_id
  ON public.user_section_overrides(user_id);

-- ── Seed : sections par défaut par rôle ──────────────────────────────────────

-- Admin : tout
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('admin', 'dashboard'),
  ('admin', 'activites'),
  ('admin', 'methodologie'),
  ('admin', 'academie'),
  ('admin', 'evenements'),
  ('admin', 'prospection'),
  ('admin', 'marketing'),
  ('admin', 'partenariat'),
  ('admin', 'performances')
ON CONFLICT (role, section_key) DO NOTHING;

-- Coach : Dashboard, Activités, Méthodologie
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('coach', 'dashboard'),
  ('coach', 'activites'),
  ('coach', 'methodologie')
ON CONFLICT (role, section_key) DO NOTHING;

-- Commercial : Dashboard, Prospection
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('commercial', 'dashboard'),
  ('commercial', 'prospection')
ON CONFLICT (role, section_key) DO NOTHING;

-- Manager : Dashboard, Prospection, Académie
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('manager', 'dashboard'),
  ('manager', 'prospection'),
  ('manager', 'academie')
ON CONFLICT (role, section_key) DO NOTHING;

-- Marketeur : Dashboard, Marketing
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('marketeur', 'dashboard'),
  ('marketeur', 'marketing')
ON CONFLICT (role, section_key) DO NOTHING;

-- Parent : Dashboard uniquement
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('parent', 'dashboard')
ON CONFLICT (role, section_key) DO NOTHING;

-- Child : Dashboard uniquement
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('child', 'dashboard')
ON CONFLICT (role, section_key) DO NOTHING;

-- Club : Dashboard, Partenariat
INSERT INTO public.role_default_sections (role, section_key) VALUES
  ('club', 'dashboard'),
  ('club', 'partenariat')
ON CONFLICT (role, section_key) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────

-- role_default_sections : lecture publique (tout le monde peut lire les défauts)
ALTER TABLE public.role_default_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_default_sections_select_all"
  ON public.role_default_sections FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier les défauts
CREATE POLICY "role_default_sections_admin_all"
  ON public.role_default_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- user_section_overrides : lecture par l'utilisateur lui-même ou un admin
ALTER TABLE public.user_section_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_section_overrides_select_own"
  ON public.user_section_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_section_overrides_select_admin"
  ON public.user_section_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- Seuls les admins peuvent insérer/modifier/supprimer des overrides
CREATE POLICY "user_section_overrides_insert_admin"
  ON public.user_section_overrides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

CREATE POLICY "user_section_overrides_update_admin"
  ON public.user_section_overrides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

CREATE POLICY "user_section_overrides_delete_admin"
  ON public.user_section_overrides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );
