-- Migration 00010 — Registre central RLS : fonctions durcies + policies universelles
-- Story 2.2 — Contrôle d'accès par rôle (RBAC — Règle Universelle RLS)
-- Prérequis : 00001 (tenants), 00002 (user_role enum), 00003 (profiles, parent_child_links)
--
-- RÈGLE : ce fichier est le registre central de TOUTES les policies RLS.
-- Chaque story créant une nouvelle table DOIT ajouter ses policies ici,
-- JAMAIS inline dans la migration de création de table.
-- Enrichi à chaque story : 4.1 (sessions), 5.1 (attendances), 6.1 (evaluations), etc.

-- ============================================================
-- FONCTIONS HELPER JWT — version durcie (remplace Story 1.2)
-- Durcissements : SET search_path, REVOKE ALL FROM PUBLIC, GRANT TO authenticated
-- ============================================================

-- Retourne tenant_id depuis app_metadata du JWT
-- SECURITY DEFINER + SET search_path = protection contre search_path injection
CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;
REVOKE ALL ON FUNCTION current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;

-- Retourne le rôle depuis app_metadata du JWT — ENUM typé (cast invalide = erreur explicite)
-- user_role enum : toute valeur inconnue lève une erreur PostgreSQL immédiatement
-- DROP CASCADE requis : 00001 a créé cette fonction avec RETURNS TEXT ; les policies de 00003
-- qui en dépendent sont recréées ci-dessous avec les versions durcies.
DROP FUNCTION IF EXISTS current_user_role() CASCADE;
CREATE OR REPLACE FUNCTION current_user_role()
  RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::user_role;
$$;
REVOKE ALL ON FUNCTION current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- Vérifie que l'utilisateur courant a un profil actif dans ce tenant
-- Utilisé dans TOUTES les policies pour bloquer les comptes désactivés
-- STABLE : mise en cache dans la transaction → pas de surcoût par row
CREATE OR REPLACE FUNCTION is_active_user()
  RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  );
$$;
REVOKE ALL ON FUNCTION is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_active_user() TO authenticated;

-- ============================================================
-- TABLE : tenants — mise à jour policies
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation" ON tenants;

-- Les admins voient et modifient leur tenant uniquement
CREATE POLICY "tenant_read" ON tenants
  FOR SELECT USING (
    id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "admin_write" ON tenants
  FOR ALL USING (
    id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- ============================================================
-- TABLE : profiles — mise à jour policies
-- ============================================================

DROP POLICY IF EXISTS "own_profile_read"   ON profiles;
DROP POLICY IF EXISTS "own_profile_update" ON profiles;
DROP POLICY IF EXISTS "admin_insert"       ON profiles;

-- Lecture : utilisateur lui-même OU admin du même tenant (actif)
CREATE POLICY "profile_read" ON profiles
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      user_id = auth.uid()
      OR (is_active_user() AND current_user_role() = 'admin')
    )
  );

-- Mise à jour propre uniquement (display_name)
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    AND is_active_user()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Seul l'admin actif peut insérer dans son tenant
CREATE POLICY "profile_admin_insert" ON profiles
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Soft-delete : admin peut mettre à jour deleted_at (jamais de DELETE physique)
CREATE POLICY "profile_admin_soft_delete" ON profiles
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- ============================================================
-- TABLE : parent_child_links — mise à jour policies
-- ============================================================

DROP POLICY IF EXISTS "parent_sees_own_links" ON parent_child_links;
DROP POLICY IF EXISTS "admin_manage_links"    ON parent_child_links;

-- Parent voit ses propres liens, admin voit tout dans le tenant
CREATE POLICY "pcl_read" ON parent_child_links
  FOR SELECT USING (
    is_active_user()
    AND (
      parent_id = auth.uid()
      OR current_user_role() = 'admin'
    )
  );

-- Admin peut gérer les liens dans son tenant
CREATE POLICY "pcl_admin_write" ON parent_child_links
  FOR ALL USING (
    is_active_user()
    AND current_user_role() = 'admin'
  );

-- ============================================================
-- TABLE : processed_operations — mise à jour policies
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation" ON processed_operations;

CREATE POLICY "processed_ops_tenant" ON processed_operations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- ============================================================
-- TABLE : audit_logs — mise à jour policies
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation"  ON audit_logs;
DROP POLICY IF EXISTS "insert_only_base"  ON audit_logs;

-- Lecture : admin uniquement (log sensible)
CREATE POLICY "audit_admin_read" ON audit_logs
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Insertion : tout utilisateur actif du tenant (append-only)
CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Pas de UPDATE ni DELETE — enforced en Story 10.4 par policies explicites de blocage

-- ============================================================
-- TABLE : coach_implantation_assignments
-- Gère l'assignation des coachs aux implantations
-- Note : FK vers implantations(id) sera ajoutée en Story 4.1 (table non créée encore)
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_implantation_assignments (
  coach_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  implantation_id UUID NOT NULL,  -- FK vers implantations ajoutée en Story 4.1
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (coach_id, implantation_id)
);

CREATE INDEX IF NOT EXISTS cia_tenant_idx ON coach_implantation_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS cia_coach_idx  ON coach_implantation_assignments (coach_id);

ALTER TABLE coach_implantation_assignments ENABLE ROW LEVEL SECURITY;

-- Admin gère les assignations de son tenant
CREATE POLICY "cia_admin_manage" ON coach_implantation_assignments
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Coach voit ses propres assignations
CREATE POLICY "cia_coach_read" ON coach_implantation_assignments
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND coach_id = auth.uid()
  );

-- ============================================================
-- TEMPLATE POLICIES STORIES FUTURES (commentaires de référence)
-- ============================================================

-- Template coach-implantation (à utiliser en Story 4.1 — sessions) :
-- CREATE POLICY "sessions_coach_read" ON sessions
--   FOR SELECT USING (
--     tenant_id = current_tenant_id()
--     AND is_active_user()
--     AND EXISTS (
--       SELECT 1 FROM coach_implantation_assignments cia
--       WHERE cia.coach_id = auth.uid()
--         AND cia.implantation_id = sessions.implantation_id
--     )
--   );

-- Template parent-child (à utiliser en Stories 5.x, 6.x, 8.x) :
-- CREATE POLICY "attendances_parent_read" ON attendances
--   FOR SELECT USING (
--     tenant_id = current_tenant_id()
--     AND is_active_user()
--     AND EXISTS (
--       SELECT 1 FROM parent_child_links pcl
--       WHERE pcl.parent_id = auth.uid()
--         AND pcl.child_id = attendances.child_id
--     )
--   );

-- Template child-own (à utiliser en Story 8.x — quiz_results) :
-- CREATE POLICY "quiz_results_child_own" ON quiz_results
--   FOR SELECT USING (
--     tenant_id = current_tenant_id()
--     AND is_active_user()
--     AND child_id = auth.uid()
--   );

-- ============================================================
-- TABLE : clubs + club_child_links — Story 2.5
-- Clubs = utilisateurs auth avec profiles.user_role = 'club'
-- Distinction partner/common : clubs.club_access_level (pas l'enum user_role)
-- ============================================================

-- clubs : admin gère tout dans son tenant, club voit uniquement son propre enregistrement
CREATE POLICY "clubs_tenant_read" ON clubs
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "clubs_admin_write" ON clubs
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Un club voit uniquement son propre enregistrement (pour lire son access_level)
CREATE POLICY "clubs_own_read" ON clubs
  FOR SELECT USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- club_child_links : admin gère tout, club voit ses propres liens
CREATE POLICY "ccl_admin_write" ON club_child_links
  FOR ALL USING (
    is_active_user()
    AND current_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
  );

-- Club voit uniquement ses propres liens (via auth.uid() = club_id)
CREATE POLICY "ccl_club_own_read" ON club_child_links
  FOR SELECT USING (
    club_id = auth.uid()
  );

-- Admin et coaches (actifs du tenant) peuvent lire tous les liens de leur tenant
CREATE POLICY "ccl_admin_coach_read" ON club_child_links
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() IN ('admin', 'coach')
    AND EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.user_id = club_child_links.club_id
        AND c.tenant_id = current_tenant_id()
    )
  );

-- PATTERN RLS club pour tables de données — à intégrer en Story 5.1 (attendances) :
-- CREATE POLICY "attendances_club_read" ON attendances
--   FOR SELECT USING (
--     current_user_role() = 'club'
--     AND EXISTS (
--       SELECT 1 FROM club_child_links ccl
--       WHERE ccl.club_id = auth.uid()
--         AND ccl.child_id = attendances.child_id
--     )
--     -- Pour restreindre partner vs common : ajouter un JOIN sur clubs
--     -- et vérifier clubs.club_access_level selon la nature du rapport
--   );

-- ============================================================
-- TABLE : coach_access_grants — Story 2.3
-- Accès temporaire cross-implantation pour coaches remplaçants
-- L'expiration est automatique via la condition RLS (expires_at > now())
-- Pas de job cron requis — la RLS suffit
-- Note : FK vers implantations(id) sera ajoutée en Story 4.1
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  coach_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  implantation_id UUID NOT NULL,    -- FK vers implantations ajoutée en Story 4.1
  granted_by      UUID NOT NULL REFERENCES profiles(user_id),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,      -- NULL = actif ; non-NULL = révoqué manuellement
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cag_tenant_idx    ON coach_access_grants (tenant_id);
CREATE INDEX IF NOT EXISTS cag_coach_exp_idx ON coach_access_grants (coach_id, expires_at)
  WHERE revoked_at IS NULL;  -- index partiel : uniquement les grants actifs
CREATE INDEX IF NOT EXISTS cag_impl_exp_idx  ON coach_access_grants (implantation_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE coach_access_grants ENABLE ROW LEVEL SECURITY;

-- Isolation tenant de base (tous les rôles actifs du tenant voient la table)
CREATE POLICY "cag_tenant_read" ON coach_access_grants
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Admin : CRUD complet dans son tenant
CREATE POLICY "cag_admin_write" ON coach_access_grants
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Coach : lecture de ses propres grants uniquement
CREATE POLICY "cag_coach_own_read" ON coach_access_grants
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND coach_id = auth.uid()
  );

-- ============================================================
-- PATTERN RLS — accès coach permanent OU temporaire (Stories 4.1 / 5.1)
-- À inclure dans les policies SELECT coach sur sessions et attendances :
--
-- CREATE POLICY "sessions_coach_assigned_or_granted" ON sessions
--   FOR SELECT USING (
--     tenant_id = current_tenant_id()
--     AND is_active_user()
--     AND (
--       EXISTS (  -- assignation permanente
--         SELECT 1 FROM coach_implantation_assignments cia
--         WHERE cia.coach_id = auth.uid()
--           AND cia.implantation_id = sessions.implantation_id
--       )
--       OR
--       EXISTS (  -- grant temporaire actif
--         SELECT 1 FROM coach_access_grants cag
--         WHERE cag.coach_id = auth.uid()
--           AND cag.implantation_id = sessions.implantation_id
--           AND cag.expires_at > now()
--           AND cag.revoked_at IS NULL
--       )
--     )
--   );
-- ============================================================

-- ============================================================
-- STORY 2.6 — Policies référentiel pédagogique (RBAC contenu)
-- ============================================================
-- Pattern : admin=CRUD, coach=SELECT, parent/child/club=rien (deny-by-default)
-- Tables protégées : créées en Epic 3 (Stories 3.1–3.5)
-- Policies ajoutées ici au fur et à mesure
--
-- Tables Story 3.1 : theme_groups, themes, theme_sequences    ✓ ajouté
-- Tables Story 3.2 : criteria, faults, cues                   ✓ ajouté
-- Tables Story 3.3 : situation_groups, situations, ✓ ajouté
--                    situation_criteria, situation_theme_links
-- Tables Story 3.4 : taxonomies, taxonomy_nodes,
--                    unit_classifications                       ✓ ajouté
-- Tables Story 3.5 : quiz_questions, quiz_options              (pending — ajouté après 00011)
-- ============================================================
--
-- DO block à activer après Epic 3 (toutes les tables doivent exister) :
--
-- DO $$
-- DECLARE
--   tbl TEXT;
--   tables TEXT[] := ARRAY[
--     'theme_groups', 'themes', 'theme_sequences',
--     'criteria', 'faults', 'cues',
--     'situation_groups', 'situations', 'situation_criteria', 'situation_theme_links',
--     'taxonomies', 'taxonomy_nodes', 'unit_classifications',
--     'quiz_questions', 'quiz_options'
--   ];
-- BEGIN
--   FOREACH tbl IN ARRAY tables LOOP
--     EXECUTE format(
--       'CREATE POLICY %I ON %I FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user())',
--       tbl || '_tenant_isolation', tbl
--     );
--     EXECUTE format(
--       'CREATE POLICY %I ON %I FOR ALL USING (current_user_role() = ''admin'') WITH CHECK (tenant_id = current_tenant_id())',
--       tbl || '_admin_full', tbl
--     );
--     EXECUTE format(
--       'CREATE POLICY %I ON %I FOR SELECT USING (current_user_role() = ''coach'' AND tenant_id = current_tenant_id() AND is_active_user())',
--       tbl || '_coach_read', tbl
--     );
--   END LOOP;
-- END $$;
-- ============================================================

-- ============================================================
-- STORY 2.6 — Policies concrètes Story 3.1 : theme_groups, themes, theme_sequences
-- ============================================================

-- theme_groups
CREATE POLICY "tg_tenant_isolation" ON theme_groups
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "tg_admin_full" ON theme_groups
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "tg_coach_read" ON theme_groups
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- themes
CREATE POLICY "themes_tenant_isolation" ON themes
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "themes_admin_full" ON themes
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "themes_coach_read" ON themes
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- theme_sequences
CREATE POLICY "theme_seq_tenant_isolation" ON theme_sequences
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "theme_seq_admin_full" ON theme_sequences
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "theme_seq_coach_read" ON theme_sequences
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- ─── Story 2.6 — Policies concrètes Story 3.2 : criteria, faults, cues ───────

CREATE POLICY "criteria_tenant_isolation" ON criteria
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "criteria_admin_full" ON criteria
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "criteria_coach_read" ON criteria
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "faults_tenant_isolation" ON faults
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "faults_admin_full" ON faults
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "faults_coach_read" ON faults
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "cues_tenant_isolation" ON cues
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "cues_admin_full" ON cues
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "cues_coach_read" ON cues
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- ─── Story 2.6 — Policies concrètes Story 3.3 : situation_groups, situations, situation_criteria, situation_theme_links

CREATE POLICY "sg_tenant_isolation" ON situation_groups
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "sg_admin_full" ON situation_groups
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "sg_coach_read" ON situation_groups
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "situations_tenant_isolation" ON situations
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "situations_admin_full" ON situations
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "situations_coach_read" ON situations
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "sit_criteria_tenant_isolation" ON situation_criteria
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "sit_criteria_admin_full" ON situation_criteria
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "sit_criteria_coach_read" ON situation_criteria
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "stl_tenant_isolation" ON situation_theme_links
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "stl_admin_full" ON situation_theme_links
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "stl_coach_read" ON situation_theme_links
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- ─── Story 2.6 — Policies concrètes Story 3.4 : taxonomies, taxonomy_nodes, unit_classifications

CREATE POLICY "tax_tenant_isolation" ON taxonomies
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "tax_admin_full" ON taxonomies
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "tax_coach_read" ON taxonomies
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "taxn_tenant_isolation" ON taxonomy_nodes
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "taxn_admin_full" ON taxonomy_nodes
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "taxn_coach_read" ON taxonomy_nodes
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "uc_tenant_isolation" ON unit_classifications
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "uc_admin_full" ON unit_classifications
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "uc_coach_read" ON unit_classifications
  FOR SELECT USING (current_user_role() = 'coach' AND tenant_id = current_tenant_id() AND is_active_user());

-- ─── Story 2.6 — Policies concrètes Story 3.5 : quiz_questions, quiz_options (après migration 00011)
-- Note : ces policies sont ajoutées dans 00012_rls_quiz_policies.sql pour respecter l'ordre des migrations
