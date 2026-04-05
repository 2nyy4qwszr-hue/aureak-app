-- Story 56.2 — Ajout colonne formation_data JSONB sur la table groups
-- Format : { "GK": "uuid-child-1", "DC_L": "uuid-child-2", ... } (position_key → childId)
-- AC5 : aucune donnée existante n'est altérée

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS formation_data JSONB DEFAULT NULL;

COMMENT ON COLUMN groups.formation_data IS
  'Formation tactique en JSON — map position_key → child_id (Story 56.2). Positions : GK, LB, DC_L, DC_R, RB, CM_L, CM_R, LW, CAM, RW, ST';
