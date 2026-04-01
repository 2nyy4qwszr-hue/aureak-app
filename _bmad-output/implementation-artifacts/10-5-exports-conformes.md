# Story 10.5 : Exports Conformes

Status: done

## Story

En tant qu'Admin,
Je veux générer des exports de données filtrées par consentements et anonymisées pour les usages inter-implantations ou réglementaires,
Afin de partager des données en toute légalité et conformité RGPD.

## Acceptance Criteria

**AC1 — Table `export_jobs` créée**
- **When** la migration Story 10.5 est exécutée
- **Then** `export_jobs` avec 5 types d'export, statuts, formats csv/json

**AC2 — Edge Function `generate-export`**
- **And** `cross_implantation_anonymous` : IDs hachés (SHA-256 + sel tenant), aucun nom
- **And** `gdpr_personal_data` : données filtrées par `consents.granted = true`
- **And** fichier stocké Storage (bucket privé) + lien signé 48h dans `export_jobs.file_url`

**AC3 — Expiration automatique**
- **And** cron `expire-export-jobs` : `status = 'expired'` + supprime fichier Storage après `expires_at`

**AC4 — Traçabilité**
- **And** chaque export tracé dans `audit_logs` (`action = 'export_generated'`)

**AC5 — Couverture FRs**
- **And** FR-R7–FR-R8 couverts : exports conformes filtrés par consentements + anonymisation
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00027_export_jobs.sql` (AC: #1)
  - [ ] 1.1 Créer `export_jobs` + RLS admin-only

- [ ] Task 2 — Edge Function `generate-export` (AC: #2)
  - [ ] 2.1 Créer `supabase/functions/generate-export/index.ts`
  - [ ] 2.2 Implémenter `cross_implantation_anonymous` : SHA-256 des IDs + sel tenant
  - [ ] 2.3 Implémenter `gdpr_personal_data` : filtre `consents.granted = true`
  - [ ] 2.4 Upload Storage + lien signé 48h

- [ ] Task 3 — Cron `expire-export-jobs` (AC: #3)
  - [ ] 3.1 Créer `supabase/functions/expire-export-jobs/index.ts`
  - [ ] 3.2 Supprimer fichiers Storage + UPDATE status='expired'

- [ ] Task 4 — UI Admin Exports (AC: #1, #5)
  - [ ] 4.1 `apps/web/app/(admin)/exports/index.tsx` : configuration + liste jobs

## Dev Notes

### Migration `00027_export_jobs.sql`

```sql
CREATE TABLE export_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  requested_by UUID NOT NULL REFERENCES profiles(user_id),
  export_type  TEXT NOT NULL CHECK (export_type IN (
    'attendance_report',
    'evaluation_report',
    'mastery_report',
    'gdpr_personal_data',
    'cross_implantation_anonymous'
  )),
  filters      JSONB NOT NULL DEFAULT '{}',  -- {from, to, implantation_ids, group_ids}
  status       TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','ready','failed','expired')),
  file_url     TEXT,
  file_format  TEXT NOT NULL DEFAULT 'csv' CHECK (file_format IN ('csv','json')),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON export_jobs
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON export_jobs
  FOR ALL USING (current_user_role() = 'admin');
```

### Anonymisation `cross_implantation_anonymous`

```typescript
// Hachage des IDs dans l'export anonyme
import { crypto } from 'https://deno.land/std/crypto/mod.ts'

async function hashId(id: string, tenantSalt: string): Promise<string> {
  const data = new TextEncoder().encode(`${tenantSalt}:${id}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
// Résultat : pseudonymisation irréversible sans le sel tenant
```

### Structure export `gdpr_personal_data`

```typescript
// Filtre par consentements accordés :
// - photos_videos = false → exclure fichiers media de l'export
// - data_processing = false → ne devrait pas exister (obligatoire à l'inscription)
// Données incluses : profil, présences, évaluations, quiz, tickets
```

### Dépendances

- **Prérequis** : Story 10.2 (consentements) + Story 10.4 (audit_logs) + Story 9.3 (`implantation_dashboard_stats`)

### References
- [Source: epics.md#Story-10.5] — lignes 3378–3427

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
