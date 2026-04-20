-- Epic 89 — Story 89.3 : Vue + RPC pour accès RGPD masqué aux prospects gardiens
-- Dépend de 00158 (tables + enums rgpd_*).

-- =============================================================================
-- 1. Fonctions de masquage (déterministes, IMMUTABLE)
-- =============================================================================
CREATE OR REPLACE FUNCTION mask_email(v_email TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_email IS NULL OR v_email = '' THEN RETURN v_email; END IF;
  IF position('@' in v_email) < 2 THEN RETURN '****'; END IF;
  -- "alice@domain.tld" → "a****@domain.tld"
  RETURN substring(v_email from 1 for 1) || '****' || substring(v_email from position('@' in v_email));
END; $$;

CREATE OR REPLACE FUNCTION mask_phone(v_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_clean TEXT;
  v_last  TEXT;
BEGIN
  IF v_phone IS NULL OR v_phone = '' THEN RETURN v_phone; END IF;
  -- Garder les 2 derniers chiffres, remplacer le reste par X.
  v_clean := regexp_replace(v_phone, '[^0-9+]', '', 'g');
  IF length(v_clean) < 4 THEN RETURN repeat('X', length(v_clean)); END IF;
  v_last  := substring(v_clean from length(v_clean) - 1);
  RETURN substring(v_clean from 1 for 3) || ' XX XX XX ' || v_last;
END; $$;

CREATE OR REPLACE FUNCTION mask_address_street(v_street TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_street IS NULL OR v_street = '' THEN RETURN v_street; END IF;
  IF length(v_street) <= 4 THEN RETURN '****'; END IF;
  RETURN substring(v_street from 1 for 4) || ' ****';
END; $$;

CREATE OR REPLACE FUNCTION mask_postal_code(v_cp TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_cp IS NULL OR v_cp = '' THEN RETURN v_cp; END IF;
  IF length(v_cp) <= 2 THEN RETURN '****'; END IF;
  RETURN substring(v_cp from 1 for 2) || '****';
END; $$;

CREATE OR REPLACE FUNCTION mask_locality(v_loc TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_loc IS NULL OR v_loc = '' THEN RETURN v_loc; END IF;
  RETURN '****';
END; $$;

-- =============================================================================
-- 2. Helper : l'utilisateur courant a-t-il un accès RGPD pour ce child ?
--    Retourne (has_access, via). Via = NULL pour non-prospects (pas de masking).
-- =============================================================================
CREATE OR REPLACE FUNCTION user_has_rgpd_access(p_child_id UUID)
RETURNS TABLE(has_access BOOLEAN, via rgpd_grant_reason)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_role        TEXT;
  v_grant       rgpd_grant_reason;
  v_is_prospect BOOLEAN;
BEGIN
  SELECT prospect_status IS NOT NULL INTO v_is_prospect
  FROM child_directory WHERE id = p_child_id;

  -- Non-prospect (académicien, etc.) : pas de masking RGPD.
  IF v_is_prospect IS NOT TRUE THEN
    RETURN QUERY SELECT TRUE, NULL::rgpd_grant_reason;
    RETURN;
  END IF;

  -- Admin : bypass total.
  v_role := current_user_role();
  IF v_role = 'admin' THEN
    RETURN QUERY SELECT TRUE, 'admin'::rgpd_grant_reason;
    RETURN;
  END IF;

  -- Grant actif ?
  SELECT reason INTO v_grant
  FROM prospect_access_grants
  WHERE child_id   = p_child_id
    AND granted_to = auth.uid()
    AND deleted_at IS NULL
  ORDER BY granted_at DESC
  LIMIT 1;

  IF v_grant IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_grant;
    RETURN;
  END IF;

  -- Aucun accès.
  RETURN QUERY SELECT FALSE, NULL::rgpd_grant_reason;
END; $$;

-- =============================================================================
-- 3. Vue v_child_directory_rgpd
--    Applique mask_* conditionnellement selon user_has_rgpd_access.
--    Colonnes supplémentaires : rgpd_masked (bool) + rgpd_access_via (enum nullable).
-- =============================================================================
DROP VIEW IF EXISTS v_child_directory_rgpd CASCADE;

CREATE VIEW v_child_directory_rgpd AS
SELECT
  cd.id,
  cd.tenant_id,
  cd.display_name,
  cd.nom,
  cd.prenom,
  cd.birth_date,
  cd.statut,
  cd.current_club,
  cd.niveau_club,
  cd.club_directory_id,
  cd.actif,
  cd.notes_internes,
  cd.contact_declined,
  cd.age_category,
  cd.player_type,
  cd.youth_level,
  cd.senior_division,
  cd.team_level_stars,
  cd.prospect_status,
  cd.trial_used,
  cd.trial_date,
  cd.trial_outcome,
  cd.notion_page_id,
  cd.notion_synced_at,
  cd.deleted_at,
  cd.created_at,
  cd.updated_at,
  cd.created_by,

  -- Champs RGPD conditionnellement masqués
  CASE WHEN acc.has_access THEN cd.email         ELSE mask_email(cd.email)         END AS email,
  CASE WHEN acc.has_access THEN cd.tel           ELSE mask_phone(cd.tel)           END AS tel,
  CASE WHEN acc.has_access THEN cd.parent1_email ELSE mask_email(cd.parent1_email) END AS parent1_email,
  CASE WHEN acc.has_access THEN cd.parent1_tel   ELSE mask_phone(cd.parent1_tel)   END AS parent1_tel,
  cd.parent1_nom,
  CASE WHEN acc.has_access THEN cd.parent2_email ELSE mask_email(cd.parent2_email) END AS parent2_email,
  CASE WHEN acc.has_access THEN cd.parent2_tel   ELSE mask_phone(cd.parent2_tel)   END AS parent2_tel,
  cd.parent2_nom,
  CASE WHEN acc.has_access THEN cd.adresse_rue   ELSE mask_address_street(cd.adresse_rue) END AS adresse_rue,
  CASE WHEN acc.has_access THEN cd.code_postal   ELSE mask_postal_code(cd.code_postal)    END AS code_postal,
  CASE WHEN acc.has_access THEN cd.localite      ELSE mask_locality(cd.localite)          END AS localite,

  -- Flags RGPD
  (NOT acc.has_access)         AS rgpd_masked,
  acc.via                      AS rgpd_access_via
FROM child_directory cd
CROSS JOIN LATERAL user_has_rgpd_access(cd.id) AS acc;

COMMENT ON VIEW v_child_directory_rgpd IS
  'Story 89.3 — vue child_directory avec masquage RGPD conditionnel sur les coordonnées parent/adresse. Hérite de la RLS tenant de child_directory.';

-- =============================================================================
-- 4. RPC get_child_directory_rgpd — écrit un log si accès démasqué.
--    SECURITY DEFINER indispensable pour l'écriture dans prospect_rgpd_access_log
--    (aucune policy INSERT pour authenticated → seule cette RPC peut écrire).
-- =============================================================================
CREATE OR REPLACE FUNCTION get_child_directory_rgpd(p_child_id UUID)
RETURNS SETOF v_child_directory_rgpd
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row    v_child_directory_rgpd%ROWTYPE;
  v_tenant UUID;
BEGIN
  SELECT tenant_id INTO v_tenant FROM child_directory WHERE id = p_child_id;
  IF v_tenant IS NULL THEN RETURN; END IF;

  -- Garde-fou tenant (défense en profondeur en plus de la RLS hérite).
  IF v_tenant <> current_tenant_id() THEN
    RAISE EXCEPTION 'forbidden: tenant mismatch';
  END IF;

  SELECT * INTO v_row FROM v_child_directory_rgpd WHERE id = p_child_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Log uniquement si accès démasqué ET si prospect (rgpd_access_via non NULL).
  IF NOT v_row.rgpd_masked AND v_row.rgpd_access_via IS NOT NULL THEN
    INSERT INTO prospect_rgpd_access_log (tenant_id, child_id, accessor_id, granted_via)
    VALUES (v_tenant, p_child_id, auth.uid(), v_row.rgpd_access_via);
  END IF;

  RETURN NEXT v_row;
END; $$;

-- =============================================================================
-- 5. RPC batch : get_child_directory_rgpd_list (évite N+1 sur listes)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_child_directory_rgpd_list(p_child_ids UUID[])
RETURNS SETOF v_child_directory_rgpd
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row    v_child_directory_rgpd%ROWTYPE;
  v_tenant UUID;
BEGIN
  v_tenant := current_tenant_id();
  IF v_tenant IS NULL THEN RETURN; END IF;

  FOR v_row IN
    SELECT * FROM v_child_directory_rgpd
    WHERE id = ANY(p_child_ids) AND tenant_id = v_tenant
  LOOP
    IF NOT v_row.rgpd_masked AND v_row.rgpd_access_via IS NOT NULL THEN
      INSERT INTO prospect_rgpd_access_log (tenant_id, child_id, accessor_id, granted_via)
      VALUES (v_tenant, v_row.id, auth.uid(), v_row.rgpd_access_via);
    END IF;
    RETURN NEXT v_row;
  END LOOP;
END; $$;

-- =============================================================================
-- 6. GRANTs
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_child_directory_rgpd(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION get_child_directory_rgpd_list(UUID[])    TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_rgpd_access(UUID)               TO authenticated;
GRANT SELECT  ON v_child_directory_rgpd                            TO authenticated;
