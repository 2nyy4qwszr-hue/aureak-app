-- Story 86.2 — Multi-rôle utilisateur + switch de contexte
-- Table user_roles : association many-to-many user ↔ rôle
-- Permet à un utilisateur d'avoir plusieurs rôles simultanément

-- ── Table user_roles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un utilisateur ne peut avoir chaque rôle qu'une seule fois
  UNIQUE (user_id, role)
);

-- Index pour lookup rapide par user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ── Migrer les rôles existants depuis profiles.role ─────────────────────────
-- Chaque profil existant génère une entrée dans user_roles avec is_primary = true
INSERT INTO public.user_roles (user_id, role, is_primary)
SELECT p.user_id, p.user_role, true
FROM public.profiles p
WHERE p.user_id IS NOT NULL
  AND p.user_role IS NOT NULL
  AND p.deleted_at IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leurs propres rôles
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Les admins peuvent lire tous les rôles
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- Les admins peuvent insérer des rôles
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- Les utilisateurs peuvent mettre à jour is_primary sur leurs propres rôles (switch de rôle)
CREATE POLICY "user_roles_update_own"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- Les admins peuvent mettre à jour les rôles de tous les utilisateurs
CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- Les admins peuvent supprimer des rôles
CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );
