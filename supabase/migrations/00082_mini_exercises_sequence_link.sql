-- Migration 00082 — Story 24.6 : Mini-Exercices Terrain — Liaison optionnelle à une séquence
-- Seule modification : ajout de sequence_id nullable sur theme_mini_exercises.
-- theme_id (NOT NULL) et criterion_id (nullable, SET NULL) sont déjà conformes depuis migration 00056.

ALTER TABLE theme_mini_exercises
  ADD COLUMN IF NOT EXISTS sequence_id UUID NULL
  REFERENCES theme_sequences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mini_exercises_seq_idx
  ON theme_mini_exercises (sequence_id);
