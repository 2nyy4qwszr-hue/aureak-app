-- Migration 00054 : Auto-assign tenant_id à la création d'un profil
-- Problème : créer un admin manuellement (Dashboard SQL) nécessite de connaître
--            l'UUID du tenant — erreur fréquente qui bloque l'accès à l'appli.
-- Solution  : trigger BEFORE INSERT qui remplit tenant_id avec le premier tenant
--             trouvé quand la valeur est NULL (ou manquante).
-- Compatibilité : l'Edge Function create-user-profile passe tenant_id explicitement
--                 → le trigger ne le modifie pas (IF NEW.tenant_id IS NULL).

-- ── Trigger function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_assign_tenant_id()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Seulement si tenant_id n'est pas fourni
  IF NEW.tenant_id IS NULL THEN
    SELECT id INTO NEW.tenant_id
    FROM public.tenants
    ORDER BY created_at
    LIMIT 1;

    IF NEW.tenant_id IS NULL THEN
      RAISE EXCEPTION
        '[auto_assign_tenant_id] Aucun tenant trouvé dans la table tenants. '
        'Créez d''abord un tenant avant d''insérer un profil.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger BEFORE INSERT ────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS profiles_auto_tenant ON profiles;

CREATE TRIGGER profiles_auto_tenant
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_tenant_id();
