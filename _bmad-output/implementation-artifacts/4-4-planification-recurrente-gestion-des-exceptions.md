# Story 4.4 : Planification Récurrente & Gestion des Exceptions

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux créer une série de séances récurrentes et pouvoir modifier individuellement une occurrence, les suivantes, ou toute la série,
Afin de gérer les plannings hebdomadaires sans ressaisie tout en gardant la flexibilité pour les exceptions terrain.

## Acceptance Criteria

**AC1 — Création d'une série récurrente**
- **When** l'Admin soumet un formulaire avec récurrence
- **Then** une `recurrence_series` est créée, toutes les occurrences générées avec `recurrence_id` + `is_exception = false`, `session_attendees` pré-rempli pour chaque occurrence

**AC2 — Modification avec scopes**
- **And** l'Admin choisit le scope de modification :
  - "Cette séance uniquement" → `is_exception = true`, nouvelle ligne avec modifications, originale archivée
  - "Cette séance et les suivantes" → occurrences ≥ date_modif recréées, nouvelle `recurrence_series`
  - "Toutes les séances de la série" → occurrences `planifiée` mises à jour, séances `terminée`/`annulée` non touchées

**AC3 — Suppression de série**
- **And** supprimer une série passe toutes les occurrences `planifiée` à `status = 'annulée'` + notifications (Story 4.5)

**AC4 — Migration propre**
- **And** `supabase db diff` reste clean (pas de nouvelle table — utilise le modèle de Story 4.1)

## Tasks / Subtasks

- [ ] Task 1 — RPC `generate_recurrence_sessions` (AC: #1)
  - [ ] 1.1 Créer une RPC SECURITY DEFINER qui génère toutes les occurrences depuis la règle JSONB
  - [ ] 1.2 Appeler `prefill_session_attendees()` pour chaque occurrence générée
  - [ ] 1.3 Valider avec `supabase db reset`

- [ ] Task 2 — RPC `modify_recurrence_scope` (AC: #2)
  - [ ] 2.1 Implémenter les 3 scopes de modification via une RPC unique avec paramètre `scope TEXT`

- [ ] Task 3 — RPC `cancel_recurrence_series` (AC: #3)
  - [ ] 3.1 UPDATE toutes les occurrences `planifiée` à `annulée`

- [ ] Task 4 — UI Admin (web) (AC: #1, #2)
  - [ ] 4.1 Enrichir `apps/web/app/(admin)/sessions/new.tsx` avec un toggle "Récurrence" et le formulaire de règle (fréquence, jour, nombre d'occurrences ou date de fin)
  - [ ] 4.2 Dialog de modification "Quel scope ?" à l'ouverture de l'éditeur d'une séance d'une série

## Dev Notes

### Format de la règle JSONB `recurrence_series.rule`

```json
{
  "freq"  : "weekly",
  "day"   : "wednesday",
  "count" : 8,
  "until" : null
}
```
`count` et `until` sont mutuellement exclusifs. Utiliser `count` pour "8 séances" ou `until` pour une date de fin (ISO 8601).

### RPC `generate_recurrence_sessions`

```sql
CREATE OR REPLACE FUNCTION generate_recurrence_sessions(
  p_rule JSONB,
  p_base_session_params JSONB
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_series_id UUID;
  v_session   sessions;
  v_date      DATE := (p_base_session_params->>'start_date')::DATE;
  v_count     INT  := COALESCE((p_rule->>'count')::int, 52);
  v_until     DATE := (p_rule->>'until')::DATE;
  v_day       TEXT := p_rule->>'day';
  v_generated INT := 0;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO recurrence_series (tenant_id, rule)
  VALUES (current_tenant_id(), p_rule)
  RETURNING id INTO v_series_id;

  -- Générer les occurrences (max 52 pour sécurité)
  WHILE v_generated < v_count AND (v_until IS NULL OR v_date <= v_until) LOOP
    v_session := (SELECT create_session_full(
      p_base_session_params || jsonb_build_object(
        'scheduled_at', v_date::TEXT || ' ' || (p_base_session_params->>'time'),
        'recurrence_id', v_series_id
      )
    ));
    v_date := v_date + INTERVAL '7 days';
    v_generated := v_generated + 1;
  END LOOP;

  RETURN v_generated;
END; $$;
REVOKE ALL ON FUNCTION generate_recurrence_sessions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_recurrence_sessions TO authenticated;
```

### Scope "Cette séance uniquement"

```typescript
// packages/api-client/src/sessions/recurrence.ts
async function modifySingleException(sessionId: string, changes: Partial<Session>) {
  // 1. Marquer l'originale comme supprimée
  await supabase.from('sessions').update({ deleted_at: new Date().toISOString() })
    .eq('id', sessionId)
  // 2. Créer une nouvelle occurrence exception
  const { data } = await supabase.rpc('create_session_full', {
    ...changes,
    is_exception: true,
    original_session_id: sessionId,
    recurrence_id: null  // exception = pas de série
  })
  return data
}
```

### Dépendances

- **Prérequis** : Stories 4.1 (recurrence_series) + 4.2 (prefill_session_attendees) + 4.3 (create_session_full)
- **À compléter en Story 4.5** : annulation de série déclenche les notifications

### References
- [Source: epics.md#Story-4.4] — lignes 1460–1480

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
