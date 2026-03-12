-- Story 21.2 — Code review fix : contrainte UNIQUE sur session_theme_blocks
-- La contrainte UNIQUE (session_id, theme_id, sequence_id) ne protège pas les NULL
-- en PostgreSQL (NULL != NULL), permettant des doublons thème+no-séquence.
-- Remplacement par deux index partiels couvrant les deux cas.

-- Supprimer l'ancienne contrainte UNIQUE (si elle existe)
ALTER TABLE session_theme_blocks
  DROP CONSTRAINT IF EXISTS session_theme_blocks_session_id_theme_id_sequence_id_key;

-- Index partiel : un seul bloc par session+thème quand sequence_id est NULL
CREATE UNIQUE INDEX IF NOT EXISTS uq_stb_no_sequence
  ON session_theme_blocks (session_id, theme_id)
  WHERE sequence_id IS NULL;

-- Index partiel : un seul bloc par session+thème+séquence quand sequence_id est défini
CREATE UNIQUE INDEX IF NOT EXISTS uq_stb_with_sequence
  ON session_theme_blocks (session_id, theme_id, sequence_id)
  WHERE sequence_id IS NOT NULL;
