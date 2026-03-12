-- Story 20-3 — Admin Theme Page UX Refactor
-- Ajoute order_index (drag&drop) et category (catégorie pédagogique) sur la table themes
ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category    TEXT;
