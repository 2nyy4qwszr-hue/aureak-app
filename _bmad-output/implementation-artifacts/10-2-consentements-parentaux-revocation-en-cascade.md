# Story 10.2 : Consentements Parentaux & Révocation en Cascade

Status: ready-for-dev

## Story

En tant que Parent,
Je veux gérer mes consentements (photos/vidéos, traitement données, partage clubs) et pouvoir les révoquer à tout moment,
Afin d'exercer mon droit de contrôle sur les données personnelles de mon enfant.

## Acceptance Criteria

**AC1 — Table `consents` créée**
- **When** la migration Story 10.2 est exécutée
- **Then** `consents` avec `consent_type` enum, versioning, `granted/revoked_at`, RLS parent + admin

**AC2 — RPC `revoke_consent`**
- **And** `revoke_consent(p_child_id, p_consent_type)` : `revoked_at = now()`, `granted = false`
- **And** si `consent_type = 'photos_videos'` → archivage medias liés (Epic 13, stub en MVP)
- **And** INSERT `user_lifecycle_events` avec `event_type = 'consent_revoked'`
- **And** tracé `audit_logs`

**AC3 — Nouveau consentement sur version**
- **And** notification push envoyée au Parent lors de mise à jour version du texte de consentement

**AC4 — Écran "Mes Consentements"**
- **And** affiche par enfant : type, statut, date, version avec lien texte complet

**AC5 — Couverture FRs**
- **And** FR54–FR55 couverts : gestion consentements + révocation cascade médias
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00024_consents.sql` (AC: #1)
  - [ ] 1.1 Créer enum `consent_type` + table `consents` + RLS

- [ ] Task 2 — RPC `revoke_consent` + `grant_consent` (AC: #2)
  - [ ] 2.1 `revoke_consent(p_child_id, p_consent_type)` SECURITY DEFINER
  - [ ] 2.2 `grant_consent(p_child_id, p_consent_type, p_version)` SECURITY DEFINER

- [ ] Task 3 — Notification mise à jour version (AC: #3)
  - [ ] 3.1 Edge Function `notify-consent-update` déclenchée manuellement par Admin lors de mise à jour des textes légaux

- [ ] Task 4 — UI Mobile Parent (AC: #4)
  - [ ] 4.1 Créer `apps/mobile/app/(parent)/settings/consents.tsx`
  - [ ] 4.2 Liste consentements par enfant avec toggle révocation

## Dev Notes

### Migration `00024_consents.sql`

```sql
CREATE TYPE consent_type AS ENUM (
  'photos_videos',
  'data_processing',
  'marketing',
  'sharing_clubs'
);

CREATE TABLE consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  parent_id    UUID NOT NULL REFERENCES profiles(user_id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  consent_type consent_type NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, parent_id, child_id, consent_type)
    DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON consents
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON consents
  FOR ALL USING (parent_id = auth.uid() OR current_user_role() = 'admin');
```

### RPC `revoke_consent`

```sql
CREATE OR REPLACE FUNCTION revoke_consent(p_child_id UUID, p_consent_type consent_type)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Seul le parent de l'enfant peut révoquer
  IF NOT EXISTS (
    SELECT 1 FROM parent_child_links
    WHERE parent_id = auth.uid() AND child_id = p_child_id
  ) THEN
    RAISE EXCEPTION 'Accès refusé — vous n''êtes pas le parent de cet enfant';
  END IF;

  UPDATE consents SET
    granted = false,
    revoked_at = now()
  WHERE parent_id = auth.uid()
    AND child_id = p_child_id
    AND consent_type = p_consent_type
    AND tenant_id = current_tenant_id();

  -- Journaliser
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id, metadata)
  VALUES (current_tenant_id(), p_child_id, 'consent_revoked', auth.uid(),
    jsonb_build_object('consent_type', p_consent_type));

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'consent_revoked', 'child', p_child_id,
    jsonb_build_object('consent_type', p_consent_type));

  -- TODO Epic 13 : si consent_type = 'photos_videos' → archiver medias
END;
$$;
REVOKE ALL ON FUNCTION revoke_consent FROM PUBLIC;
GRANT EXECUTE ON FUNCTION revoke_consent TO authenticated;
```

### Dépendances

- **Prérequis** : Story 10.1 (user_lifecycle_events) + Story 2.1 (parent_child_links) + Story 1.2 (audit_logs)
- **Consommé par** : Story 10.3 (RGPD effacement requiert révocation consentements) + Epic 13 (médias conditionnés aux consentements)

### References
- [Source: epics.md#Story-10.2] — lignes 3212–3263

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
