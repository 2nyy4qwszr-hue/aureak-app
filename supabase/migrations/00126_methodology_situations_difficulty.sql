-- Story 58-6 — Niveau de difficulté sur situations pédagogiques
ALTER TABLE methodology_situations
  ADD COLUMN IF NOT EXISTS difficulty_level INT NOT NULL DEFAULT 3
    CONSTRAINT chk_difficulty_level CHECK (difficulty_level BETWEEN 1 AND 5);

COMMENT ON COLUMN methodology_situations.difficulty_level IS
  '1=Débutant 2=Facile 3=Intermédiaire 4=Avancé 5=Expert';
