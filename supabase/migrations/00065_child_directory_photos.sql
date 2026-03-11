-- Migration: 00065_child_directory_photos.sql
-- Story 18.2 : Gestion des photos joueurs avec historique
-- Photos stockées dans Supabase Storage bucket 'child-photos' (privé)
-- Accès uniquement via Signed URLs (expiration 1h) — jamais d'URLs publiques
--
-- ⚠️  ACTION MANUELLE REQUISE après déploiement de cette migration :
--   1. Supabase Dashboard > Storage > New bucket
--      Name: child-photos  |  Public: false (privé)
--   2. Configurer les policies Storage :
--      - Admin INSERT/SELECT/DELETE : (bucket_id = 'child-photos') AND (auth.jwt() ->> 'role' = 'admin')
--      - Coach SELECT : (bucket_id = 'child-photos') AND (auth.jwt() ->> 'role' IN ('admin', 'coach'))

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_directory_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,

  -- Chemin relatif dans Supabase Storage (bucket: child-photos)
  -- Format : {tenant_id}/{child_id}/{unix_timestamp}_{sanitized_name}
  -- Exemple : abc123/def456/1741694400_martin-dupont.jpg
  photo_path  TEXT NOT NULL,

  -- Métadonnées
  taken_at    DATE        NULL,   -- date approximative de la photo (saisie manuelle)
  season      TEXT        NULL,   -- ex: '2024-2025' (saison académie)
  caption     TEXT        NULL,   -- légende optionnelle
  uploaded_by UUID        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_current  BOOLEAN     NOT NULL DEFAULT false,

  -- Soft-delete (cohérent avec child_directory, club_directory, etc.)
  deleted_at  TIMESTAMPTZ NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Index ─────────────────────────────────────────────────────────────────────

-- Un seul is_current actif par joueur (index unique partiel)
-- Garantit qu'on ne peut pas avoir deux photos courantes pour un même joueur
CREATE UNIQUE INDEX IF NOT EXISTS child_directory_photos_current_idx
  ON child_directory_photos (child_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Index de liste par joueur (chargement de l'historique)
CREATE INDEX IF NOT EXISTS child_directory_photos_child_idx
  ON child_directory_photos (child_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ── Trigger : unicité is_current ─────────────────────────────────────────────
-- Quand une photo passe is_current = true, toutes les autres du même joueur
-- passent automatiquement à is_current = false. Évite la race condition côté API.

CREATE OR REPLACE FUNCTION fn_ensure_single_current_photo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE child_directory_photos
    SET    is_current = false,
           updated_at = NOW()
    WHERE  child_id   = NEW.child_id
      AND  id         != NEW.id
      AND  is_current = true
      AND  deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_current_photo ON child_directory_photos;
CREATE TRIGGER trg_ensure_single_current_photo
  AFTER INSERT OR UPDATE OF is_current ON child_directory_photos
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION fn_ensure_single_current_photo();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE child_directory_photos ENABLE ROW LEVEL SECURITY;

-- Admin : accès complet (lecture + écriture) sur son tenant
CREATE POLICY "admin_all_child_photos"
  ON child_directory_photos
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Coach : lecture seule sur son tenant (pour affichage futur dans vues coach)
CREATE POLICY "coach_read_child_photos"
  ON child_directory_photos
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'coach'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND deleted_at IS NULL
  );
