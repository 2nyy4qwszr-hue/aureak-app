-- Migration 00081 — Story 24.5 : Erreurs Observées — Création indépendante & Liaison exclusive
-- Rend faults.criterion_id nullable, ajoute theme_id, réécrit enforce_faults_tenant().

-- 1. Supprimer la FK existante criterion_id → criteria (avec lookup dynamique du nom)
DO $$ DECLARE v_cname TEXT;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'faults'::regclass
    AND confrelid = 'criteria'::regclass
    AND contype = 'f';

  IF v_cname IS NULL THEN
    RAISE EXCEPTION 'FK faults→criteria introuvable';
  END IF;

  EXECUTE format('ALTER TABLE faults DROP CONSTRAINT %I', v_cname);
END $$;

-- 2. Recréer la FK avec ON DELETE SET NULL (au lieu de CASCADE)
ALTER TABLE faults
  ADD CONSTRAINT faults_criterion_id_fkey
  FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE SET NULL;

-- 3. Rendre criterion_id nullable (séparé du DROP CONSTRAINT en PG)
ALTER TABLE faults ALTER COLUMN criterion_id DROP NOT NULL;

-- 4. Ajouter theme_id nullable (pour backfill)
ALTER TABLE faults
  ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE CASCADE;

-- 5. Backfill theme_id via criteria.theme_id (disponible depuis migration 00080)
UPDATE faults f
  SET theme_id = c.theme_id
  FROM criteria c
  WHERE f.criterion_id = c.id;

-- 6. Vérifier l'absence de NULL restants (garde-fou de cohérence)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM faults WHERE theme_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill incomplet sur faults.theme_id';
  END IF;
END $$;

-- 7. Poser NOT NULL sur theme_id
ALTER TABLE faults ALTER COLUMN theme_id SET NOT NULL;

-- 8. Index
CREATE INDEX IF NOT EXISTS faults_theme_idx ON faults (theme_id);

-- 9. Réécrire enforce_faults_tenant() pour gérer criterion_id nullable
CREATE OR REPLACE FUNCTION enforce_faults_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Vérification via theme_id direct (source de vérité)
  IF NEW.theme_id IS NOT NULL AND
     (SELECT tenant_id FROM themes WHERE id = NEW.theme_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match themes.tenant_id (theme_id=%)', NEW.theme_id;
  END IF;
  -- Garde-fou criterion_id (optionnel désormais)
  IF NEW.criterion_id IS NOT NULL AND
     (SELECT tenant_id FROM criteria WHERE id = NEW.criterion_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match criteria.tenant_id (criterion_id=%)', NEW.criterion_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. Recréer le trigger
DROP TRIGGER IF EXISTS trg_faults_tenant ON faults;
CREATE TRIGGER trg_faults_tenant
  BEFORE INSERT OR UPDATE ON faults
  FOR EACH ROW EXECUTE FUNCTION enforce_faults_tenant();
