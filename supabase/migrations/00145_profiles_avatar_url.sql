-- =============================================================================
-- Migration 00145 — BUG — Ajout colonne avatar_url sur profiles
-- La colonne était absente de la migration d'origine (00003_create_profiles.sql)
-- mais référencée dans plusieurs fonctions api-client (admin-profile.ts, xp.ts)
-- → Erreur 400 sur /profile et toutes les pages utilisant avatar_url
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN profiles.avatar_url IS
  'URL de la photo de profil — Supabase Storage (bucket public) ou URL externe.';
