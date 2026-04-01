# Story 10.3 : Droits RGPD Parent (Accès, Rectification, Effacement, Portabilité)

Status: done

## Story

En tant que Parent,
Je veux exercer mes droits RGPD (accéder à mes données, les rectifier, demander leur effacement ou leur portabilité) depuis l'application,
Afin que le club respecte ses obligations légales sans nécessiter d'intervention manuelle longue.

## Acceptance Criteria

**AC1 — Table `gdpr_requests` créée**
- **When** la migration Story 10.3 est exécutée
- **Then** `gdpr_requests` avec enum `gdpr_request_type`, statuts, RLS

**AC2 — RPC `submit_gdpr_request`**
- **And** INSERT `gdpr_requests` + notification push admin + INSERT `audit_logs`

**AC3 — Traitement par Admin**
- **And** `access`/`portability` → Edge Function `generate-gdpr-export` : JSON complet (profil, consentements, évaluations, présences, tickets) → `file_url` lien signé 72h
- **And** `erasure` → déclenche `request_user_deletion()` (Story 10.1)
- **And** `rectification` → Admin modifie champs, marque `completed`

**AC4 — Délai légal 30 jours**
- **And** alerte anomalie (Story 9.2) si `status = 'pending'` après 25 jours

**AC5 — Couverture FRs**
- **And** FR56–FR59 couverts : accès, rectification, effacement, portabilité RGPD
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00025_gdpr_requests.sql` (AC: #1)
  - [ ] 1.1 Créer enum `gdpr_request_type` + table `gdpr_requests` + RLS

- [ ] Task 2 — RPC `submit_gdpr_request` (AC: #2)
  - [ ] 2.1 INSERT + notification admin + audit

- [ ] Task 3 — Edge Function `generate-gdpr-export` (AC: #3)
  - [ ] 3.1 Créer `supabase/functions/generate-gdpr-export/index.ts`
  - [ ] 3.2 Compiler JSON : profil, consentements, présences, évaluations, tickets
  - [ ] 3.3 Upload Storage + lien signé 72h
  - [ ] 3.4 UPDATE `gdpr_requests.file_url`, `status = 'completed'`

- [ ] Task 4 — UI Parent (AC: #1, #4)
  - [ ] 4.1 Section "Mes Droits RGPD" dans `apps/mobile/app/(parent)/settings/gdpr.tsx`
  - [ ] 4.2 Formulaire soumission + suivi statut

- [ ] Task 5 — UI Admin (AC: #3)
  - [ ] 5.1 Panneau "Demandes RGPD" dans `apps/web/app/(admin)/gdpr/index.tsx`

## Dev Notes

### Migration `00025_gdpr_requests.sql`

```sql
CREATE TYPE gdpr_request_type AS ENUM (
  'access',
  'rectification',
  'erasure',
  'portability'
);

CREATE TABLE gdpr_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  requester_id     UUID NOT NULL REFERENCES profiles(user_id),
  target_id        UUID NOT NULL REFERENCES profiles(user_id),
  request_type     gdpr_request_type NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','rejected')),
  rejection_reason TEXT,
  payload          JSONB,
  file_url         TEXT,
  processed_at     TIMESTAMPTZ,
  processed_by     UUID REFERENCES profiles(user_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON gdpr_requests
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON gdpr_requests
  FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "admin_manage" ON gdpr_requests
  FOR ALL USING (current_user_role() = 'admin');
```

### RPC `submit_gdpr_request`

```sql
CREATE OR REPLACE FUNCTION submit_gdpr_request(
  p_target_id UUID,
  p_type gdpr_request_type
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req_id UUID;
BEGIN
  INSERT INTO gdpr_requests (tenant_id, requester_id, target_id, request_type)
  VALUES (current_tenant_id(), auth.uid(), p_target_id, p_type)
  RETURNING id INTO v_req_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'gdpr_request_submitted', 'gdpr_request', v_req_id,
    jsonb_build_object('request_type', p_type, 'target_id', p_target_id));

  RETURN v_req_id;
END;
$$;
REVOKE ALL ON FUNCTION submit_gdpr_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_gdpr_request TO authenticated;
```

### Edge Function `generate-gdpr-export` (structure)

```typescript
// supabase/functions/generate-gdpr-export/index.ts
// Compiles:
// 1. profiles (target_id)
// 2. consents (parent_id = requester_id, child_id = target_id)
// 3. attendances (child_id = target_id)
// 4. session_evaluations_merged (child_id = target_id)
// 5. learning_attempts (child_id = target_id)
// 6. tickets (parent_id = requester_id)
// → JSON → upload Storage → lien signé 72h
// → UPDATE gdpr_requests SET file_url = link, status = 'completed', processed_at = now()
```

### Alerte anomalie délai légal

La règle `status = 'pending'` après 25 jours est détectée par la Edge Function `detect-anomalies` (Story 9.2) avec `anomaly_type = 'gdpr_request_overdue'` (à ajouter au CHECK constraint de `anomaly_events`).

### Dépendances

- **Prérequis** : Story 10.1 (request_user_deletion) + Story 10.2 (consentements) + Story 9.2 (anomalies pour alerte 25j) + Story 1.2 (audit_logs)

### References
- [Source: epics.md#Story-10.3] — lignes 3267–3322

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
