-- Story 3.6 — Ciblage d'Audience : contraintes CHECK sur target_audience
-- ============================================================
-- target_audience = '{}'  → aucune restriction (contenu universel)
-- target_audience = '{ "roles": [...], "age_groups": [...] }' → contenu ciblé
-- Champ optionnel "programs" : liste de programmes (ex: 'golden_player', 'gardien_elite')

ALTER TABLE themes ADD CONSTRAINT target_audience_structure CHECK (
  (target_audience = '{}'::jsonb) OR (
    target_audience ? 'roles'
    AND target_audience ? 'age_groups'
    AND jsonb_typeof(target_audience->'roles') = 'array'
    AND jsonb_typeof(target_audience->'age_groups') = 'array'
    AND (
      NOT (target_audience ? 'programs')
      OR jsonb_typeof(target_audience->'programs') = 'array'
    )
  )
);

ALTER TABLE situations ADD CONSTRAINT target_audience_structure CHECK (
  (target_audience = '{}'::jsonb) OR (
    target_audience ? 'roles'
    AND target_audience ? 'age_groups'
    AND jsonb_typeof(target_audience->'roles') = 'array'
    AND jsonb_typeof(target_audience->'age_groups') = 'array'
    AND (
      NOT (target_audience ? 'programs')
      OR jsonb_typeof(target_audience->'programs') = 'array'
    )
  )
);
