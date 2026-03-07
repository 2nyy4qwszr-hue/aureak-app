# Story 11.3 : Partenariats Clubs

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux configurer des partenariats avec d'autres clubs (accès partiel à notre référentiel, niveau d'accès configurable) et consulter le journal des accès partenaires,
Afin de partager notre expertise pédagogique dans un cadre maîtrisé et traçable.

## Acceptance Criteria

**AC1 — Tables créées**
- **When** la migration Story 11.3 est exécutée
- **Then** enum `club_access_level`, tables `club_partnerships` + `club_access_logs` avec RLS

**AC2 — Accès conditionnel**
- **And** accès conditionné à `active_from <= CURRENT_DATE AND (active_until IS NULL OR active_until >= CURRENT_DATE)`
- **And** stateless — vérifié à chaque requête

**AC3 — Journal accès automatique**
- **And** chaque accès partenaire à un contenu loggé dans `club_access_logs` via RPC `log_partner_access()`

**AC4 — Dashboard partenariats**
- **And** liste clubs partenaires, niveau d'accès, expiration, nombre d'accès 30 jours

**AC5 — Mise à jour immédiate**
- **And** modification `access_level` ou `active_until` → effets immédiats (stateless RLS)

**AC6 — Traçabilité**
- **And** création/modification partenariat tracée `audit_logs` (`action = 'partnership_created'`/`'partnership_updated'`)

**AC7 — Couverture FRs**
- **And** FR65–FR67 couverts : partenariats configurables + journal + mise à jour immédiate
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00030_partnerships.sql` (AC: #1, #2)
  - [ ] 1.1 Créer enum `club_access_level` (distinct de `club_access_level` Story 2.5 — attention conflit de noms)
  - [ ] 1.2 Créer `club_partnerships` + `club_access_logs` + RLS

- [ ] Task 2 — RPC `log_partner_access` (AC: #3)
  - [ ] 2.1 INSERT `club_access_logs` SECURITY DEFINER

- [ ] Task 3 — Intégration RLS référentiel (AC: #2)
  - [ ] 3.1 Policies thèmes/situations pour utilisateurs `role = 'club'` filtrées par `club_partnerships.access_level`

- [ ] Task 4 — UI Admin (AC: #4)
  - [ ] 4.1 `apps/web/app/(admin)/partnerships/index.tsx` avec CRUD + stats accès

## Dev Notes

### Conflit de noms avec Story 2.5

Story 2.5 a créé `club_access_level` comme colonne (TEXT) sur la table `clubs`. Story 11.3 crée un enum `club_access_level`. Pour éviter le conflit, l'enum est nommé `partnership_access_level` dans la migration.

### Migration `00030_partnerships.sql`

```sql
CREATE TYPE partnership_access_level AS ENUM (
  'read_catalogue',   -- thèmes + situations publics uniquement
  'read_bronze',      -- contenu grade Bronze
  'read_silver',      -- contenu grade Argent et inférieur
  'full_read'         -- tout le contenu du tenant partenaire
);

CREATE TABLE club_partnerships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  partner_name      TEXT NOT NULL,
  partner_tenant_id UUID REFERENCES tenants(id),  -- NULL si club externe non-inscrit
  access_level      partnership_access_level NOT NULL DEFAULT 'read_catalogue',
  active_from       DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until      DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON club_partnerships
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_manage" ON club_partnerships
  FOR ALL USING (current_user_role() = 'admin');

-- Journal des accès partenaires
CREATE TABLE club_access_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES club_partnerships(id),
  accessor_id    UUID NOT NULL REFERENCES profiles(user_id),
  resource_type  TEXT NOT NULL,  -- 'theme' | 'situation' | 'quiz_question'
  resource_id    UUID NOT NULL,
  accessed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON club_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_partnerships cp
      WHERE cp.id = club_access_logs.partnership_id AND cp.tenant_id = current_tenant_id()
    )
  );
```

### RPC `log_partner_access`

```sql
CREATE OR REPLACE FUNCTION log_partner_access(
  p_resource_type TEXT,
  p_resource_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Trouver le partenariat actif pour l'utilisateur courant
  INSERT INTO club_access_logs (partnership_id, accessor_id, resource_type, resource_id)
  SELECT cp.id, auth.uid(), p_resource_type, p_resource_id
  FROM clubs c
  JOIN club_partnerships cp ON cp.partner_tenant_id = c.user_id  -- club inscrit
  WHERE c.user_id = auth.uid()
    AND cp.active_from <= CURRENT_DATE
    AND (cp.active_until IS NULL OR cp.active_until >= CURRENT_DATE)
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION log_partner_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_partner_access TO authenticated;
```

### Policies RLS pour role='club'

```sql
-- Extension de la policy themes pour les clubs partenaires
CREATE POLICY "club_partner_access_themes" ON themes
  FOR SELECT USING (
    current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM clubs c
      JOIN club_partnerships cp ON cp.partner_tenant_id = c.user_id
      WHERE c.user_id = auth.uid()
        AND cp.tenant_id = themes.tenant_id
        AND cp.access_from <= CURRENT_DATE
        AND (cp.active_until IS NULL OR cp.active_until >= CURRENT_DATE)
        AND cp.access_level IN ('read_bronze','read_silver','full_read')  -- filtrer selon niveau
    )
  );
```

### Dépendances

- **Prérequis** : Story 2.5 (clubs table) + Story 11.2 (grade_rank, required_grade_level) + Story 1.2 (audit_logs)

### References
- [Source: epics.md#Story-11.3] — lignes 3555–3616

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
