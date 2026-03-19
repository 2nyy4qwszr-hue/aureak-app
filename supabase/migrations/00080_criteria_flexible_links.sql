-- Migration 00080 — Story 24.4 : Critères de Réussite — Découplage & Liaison exclusive
-- Rend criteria.sequence_id nullable, ajoute metaphor_id + theme_id, contrainte exclusivité.

-- 1. Ajouter theme_id nullable d'abord (pour backfill)
ALTER TABLE criteria
  ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE CASCADE;

-- 2. Backfill theme_id depuis theme_sequences (sequence_id est encore NOT NULL à ce stade)
UPDATE criteria c
  SET theme_id = ts.theme_id
  FROM theme_sequences ts
  WHERE c.sequence_id = ts.id;

-- 3. Vérifier l'absence de NULL restants (sécurité)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM criteria WHERE theme_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill theme_id incomplet sur criteria';
  END IF;
END $$;

-- 4. Poser NOT NULL maintenant que le backfill est terminé
ALTER TABLE criteria ALTER COLUMN theme_id SET NOT NULL;

-- 5. Rendre sequence_id nullable (theme_id est désormais la source de vérité)
ALTER TABLE criteria ALTER COLUMN sequence_id DROP NOT NULL;

-- 6. Ajouter metaphor_id (nullable, SET NULL si la métaphore est supprimée)
ALTER TABLE criteria
  ADD COLUMN IF NOT EXISTS metaphor_id UUID NULL REFERENCES theme_metaphors(id) ON DELETE SET NULL;

-- 7. Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS criteria_theme_idx    ON criteria (theme_id);
CREATE INDEX IF NOT EXISTS criteria_metaphor_idx ON criteria (metaphor_id);

-- 8. Contrainte d'exclusivité : un critère ne peut appartenir simultanément à une séquence ET une métaphore
ALTER TABLE criteria
  ADD CONSTRAINT chk_criteria_single_parent
  CHECK (NOT (sequence_id IS NOT NULL AND metaphor_id IS NOT NULL));

-- 9. Réécrire enforce_criteria_tenant() pour gérer sequence_id nullable + metaphor_id
CREATE OR REPLACE FUNCTION enforce_criteria_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Vérification principale via theme_id (source de vérité après migration)
  IF NEW.theme_id IS NOT NULL AND
     (SELECT tenant_id FROM themes WHERE id = NEW.theme_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match themes.tenant_id (theme_id=%)', NEW.theme_id;
  END IF;
  -- Garde-fou sequence_id (optionnel désormais)
  IF NEW.sequence_id IS NOT NULL AND
     (SELECT tenant_id FROM theme_sequences WHERE id = NEW.sequence_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_sequences.tenant_id (sequence_id=%)', NEW.sequence_id;
  END IF;
  -- Vérification metaphor_id
  IF NEW.metaphor_id IS NOT NULL AND
     (SELECT tenant_id FROM theme_metaphors WHERE id = NEW.metaphor_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_metaphors.tenant_id (metaphor_id=%)', NEW.metaphor_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. Recréer le trigger (DROP + CREATE pour s'assurer de la mise à jour)
DROP TRIGGER IF EXISTS trg_criteria_tenant ON criteria;
CREATE TRIGGER trg_criteria_tenant
  BEFORE INSERT OR UPDATE ON criteria
  FOR EACH ROW EXECUTE FUNCTION enforce_criteria_tenant();
