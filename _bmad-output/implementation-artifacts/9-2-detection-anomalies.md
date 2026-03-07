# Story 9.2 : Détection Anomalies

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux être alerté automatiquement lorsque des anomalies sont détectées (séances non clôturées après délai, absentéisme élevé, coaches sans feedback post-séance),
Afin d'intervenir rapidement avant que les situations ne se dégradent.

## Acceptance Criteria

**AC1 — Table `anomaly_events` créée**
- **When** la migration Story 9.2 est exécutée
- **Then** table `anomaly_events` avec types, sévérités, RLS admin-only

**AC2 — Règles de détection (4 types)**
- **And** `session_not_closed` : sessions non clôturées depuis > 4h après fin planifiée
- **And** `high_absenteeism` : taux absence > 40% sur les 4 dernières séances d'un groupe
- **And** `coach_feedback_missing` : séance terminée sans notes coach après 24h
- **And** `no_session_activity` : implantation sans séance planifiée depuis 14 jours

**AC3 — Idempotency**
- **And** `ON CONFLICT (tenant_id, anomaly_type, resource_id) WHERE resolved_at IS NULL DO NOTHING`

**AC4 — Notification admin**
- **And** push envoyé à l'Admin pour anomalies `severity = 'critical'` via Story 7.1

**AC5 — UI panneau anomalies**
- **And** panneau "Anomalies" sur le dashboard avec filtres type/sévérité/implantation
- **And** Admin peut marquer résolue — tracé `audit_logs`

**AC6 — Couverture FRs**
- **And** FR41 couvert : détection proactive des anomalies opérationnelles
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00020_anomaly_events.sql` (AC: #1)
  - [ ] 1.1 Créer `anomaly_events` + RLS

- [ ] Task 2 — Edge Function `detect-anomalies` (AC: #2, #3, #4)
  - [ ] 2.1 Créer `supabase/functions/detect-anomalies/index.ts`
  - [ ] 2.2 Implémenter les 4 règles de détection
  - [ ] 2.3 `ON CONFLICT DO NOTHING` pour idempotency
  - [ ] 2.4 Notification push admin pour `severity = 'critical'`
  - [ ] 2.5 Planifier via `pg_cron` : daily à 7h

- [ ] Task 3 — RPC `resolve_anomaly` (AC: #5)
  - [ ] 3.1 UPDATE `resolved_at = now()`, `resolved_by = auth.uid()`
  - [ ] 3.2 INSERT `audit_logs` avec `action = 'anomaly_resolved'`

- [ ] Task 4 — UI panneau anomalies (AC: #5)
  - [ ] 4.1 Section "Anomalies" dans `apps/web/app/(admin)/dashboard/anomalies.tsx`

## Dev Notes

### Migration `00020_anomaly_events.sql`

```sql
CREATE TABLE anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  anomaly_type TEXT NOT NULL
    CHECK (anomaly_type IN (
      'session_not_closed',
      'high_absenteeism',
      'coach_feedback_missing',
      'no_session_activity'
    )),
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info','warning','critical')),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON anomaly_events
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON anomaly_events
  FOR ALL USING (current_user_role() = 'admin');

-- Contrainte d'unicité : pas de doublon non-résolu
CREATE UNIQUE INDEX anomaly_no_duplicate
  ON anomaly_events (tenant_id, anomaly_type, resource_id)
  WHERE resolved_at IS NULL;
```

### Edge Function `detect-anomalies`

```typescript
// supabase/functions/detect-anomalies/index.ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Sessions non clôturées depuis > 4h
  const { data: unclosedSessions } = await supabase
    .from('sessions')
    .select('id, tenant_id, implantation_id, planned_end_at')
    .neq('status', 'terminée')
    .neq('status', 'annulée')
    .lt('planned_end_at', new Date(Date.now() - 4 * 3600 * 1000).toISOString())

  for (const s of unclosedSessions ?? []) {
    await supabase.from('anomaly_events').insert({
      tenant_id    : s.tenant_id,
      anomaly_type : 'session_not_closed',
      severity     : 'warning',
      resource_type: 'session',
      resource_id  : s.id,
      metadata     : { implantation_id: s.implantation_id, planned_end_at: s.planned_end_at },
    }).onConflict()  // ON CONFLICT DO NOTHING via unique index

  }

  // 2. coach_feedback_missing : séances terminées sans notes depuis > 24h
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: noFeedback } = await supabase
    .from('sessions')
    .select('id, tenant_id')
    .eq('status', 'terminée')
    .lt('closed_at', yesterday)
    .not('id', 'in',
      supabase.from('coach_session_notes').select('session_id')
    )

  for (const s of noFeedback ?? []) {
    await supabase.from('anomaly_events').insert({
      tenant_id    : s.tenant_id,
      anomaly_type : 'coach_feedback_missing',
      severity     : 'info',
      resource_type: 'session',
      resource_id  : s.id,
      metadata     : {},
    })
  }

  // 3. Notification admin pour critiques
  const { data: criticals } = await supabase
    .from('anomaly_events')
    .select('tenant_id, resource_id, anomaly_type')
    .eq('severity', 'critical')
    .is('resolved_at', null)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())  // dernière heure

  // ... envoyer push admin pour chaque critique via send-notification

  return new Response(JSON.stringify({ ok: true }))
})
```

### RPC `resolve_anomaly`

```sql
CREATE OR REPLACE FUNCTION resolve_anomaly(p_anomaly_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE anomaly_events
    SET resolved_at = now(), resolved_by = auth.uid()
    WHERE id = p_anomaly_id AND tenant_id = current_tenant_id();
  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
  VALUES (current_tenant_id(), auth.uid(), 'anomaly_resolved', 'anomaly', p_anomaly_id);
END;
$$;
REVOKE ALL ON FUNCTION resolve_anomaly FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_anomaly TO authenticated;
```

### Dépendances

- **Prérequis** : Story 9.4 (implantations) + Story 7.1 (send-notification) + Story 1.2 (audit_logs) + Story 4.7 (coach_session_notes)
- **pg_cron** : `SELECT cron.schedule('detect-anomalies', '0 7 * * *', 'SELECT net.http_post(...)');`

### References
- [Source: epics.md#Story-9.2] — lignes 2874–2926

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
