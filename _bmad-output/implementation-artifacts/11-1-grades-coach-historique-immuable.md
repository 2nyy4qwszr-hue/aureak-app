# Story 11.1 : Grades Coach & Historique Immuable

Status: done

## Story

En tant qu'Admin,
Je veux attribuer et consulter les grades pédagogiques d'un coach (Bronze/Argent/Or/Platine) avec un historique complet et immuable,
Afin de valoriser la progression et de conditionner l'accès au contenu avancé au niveau atteint.

## Acceptance Criteria

**AC1 — Tables et enum créés**
- **When** la migration Story 11.1 est exécutée
- **Then** enum `coach_grade_level`, table `coach_grades` (append-only), vue `coach_current_grade`, fonction helper `current_user_grade()`

**AC2 — Immuabilité**
- **And** policies `no_update` et `no_delete` sur `coach_grades`

**AC3 — Attribution par Admin**
- **And** Admin insère nouveau grade → l'ancien reste dans l'historique
- **And** notification push au coach lors de l'attribution
- **And** INSERT `audit_logs` (`action = 'coach_grade_awarded'`)

**AC4 — Historique complet**
- **And** onglet "Grades" dans profil coach : liste chronologique grade/date/attribué par/notes

**AC5 — Couverture FRs**
- **And** FR61–FR62 couverts : grades immuables + historique complet
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00028_coach_grades.sql` (AC: #1, #2)
  - [ ] 1.1 Créer enum `coach_grade_level`
  - [ ] 1.2 Créer `coach_grades` + RLS immuable
  - [ ] 1.3 Créer vue `coach_current_grade`
  - [ ] 1.4 Créer fonction helper `current_user_grade()`

- [ ] Task 2 — RPC `award_coach_grade` (AC: #3)
  - [ ] 2.1 INSERT `coach_grades` + notification + audit

- [ ] Task 3 — UI Admin (AC: #3, #4)
  - [ ] 3.1 Section "Attribuer un grade" dans `apps/web/app/(admin)/coaches/[coachId]/grade.tsx`
  - [ ] 3.2 Historique grades (liste chronologique)

- [ ] Task 4 — UI Coach (AC: #4)
  - [ ] 4.1 Onglet "Mon Grade" dans `apps/mobile/app/(coach)/profile/grade.tsx`

## Dev Notes

### Migration `00028_coach_grades.sql`

```sql
CREATE TYPE coach_grade_level AS ENUM ('bronze','silver','gold','platinum');

CREATE TABLE coach_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  coach_id    UUID NOT NULL REFERENCES profiles(user_id),
  grade_level coach_grade_level NOT NULL,
  awarded_by  UUID NOT NULL REFERENCES profiles(user_id),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coach_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON coach_grades
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_insert" ON coach_grades
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND awarded_by = auth.uid());
CREATE POLICY "read_own_or_admin" ON coach_grades
  FOR SELECT USING (coach_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "no_update" ON coach_grades FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON coach_grades FOR DELETE USING (false);

-- Vue grade courant (dernière attribution par coach)
CREATE VIEW coach_current_grade AS
SELECT DISTINCT ON (tenant_id, coach_id)
  tenant_id, coach_id, grade_level, awarded_by, awarded_at, notes
FROM coach_grades
ORDER BY tenant_id, coach_id, awarded_at DESC;

-- Helper RLS : grade du user courant
CREATE OR REPLACE FUNCTION current_user_grade()
RETURNS coach_grade_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT grade_level
  FROM coach_current_grade
  WHERE tenant_id = current_tenant_id() AND coach_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION current_user_grade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_grade() TO authenticated;
```

### RPC `award_coach_grade`

```sql
CREATE OR REPLACE FUNCTION award_coach_grade(
  p_coach_id UUID,
  p_grade coach_grade_level,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grade_id UUID;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO coach_grades (tenant_id, coach_id, grade_level, awarded_by, notes)
  VALUES (current_tenant_id(), p_coach_id, p_grade, auth.uid(), p_notes)
  RETURNING id INTO v_grade_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'coach_grade_awarded', 'coach', p_coach_id,
    jsonb_build_object('grade', p_grade, 'grade_id', v_grade_id));

  RETURN v_grade_id;
END;
$$;
REVOKE ALL ON FUNCTION award_coach_grade FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_coach_grade TO authenticated;
```

### Notification attribution grade

Après `award_coach_grade`, appeler depuis le client :
```typescript
await supabase.functions.invoke('send-notification', {
  body: {
    tenantId   : tenantId,
    recipientId: coachId,
    eventType  : 'grade_awarded',
    referenceId: gradeId,
    urgency    : 'routine',
    title      : `Félicitations !`,
    body       : `Vous avez obtenu le grade ${gradeLabel} !`,
  }
})
```

### Dépendances

- **Prérequis** : Story 7.1 (send-notification) + Story 1.2 (audit_logs)
- **Requis par** : Story 11.2 (permissions contenu par grade — utilise `current_user_grade()`)

### References
- [Source: epics.md#Story-11.1] — lignes 3436–3495

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
