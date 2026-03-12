-- Migration 00069 : Ajout colonne image_url sur la table themes
-- Story 20-2 : Themes Cards Visual Upgrade
-- Idempotente — IF NOT EXISTS

ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS image_url TEXT;
