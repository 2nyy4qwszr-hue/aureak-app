# Story 6.1 : Modèle Évaluations — Event Sourcing & Règle de Fusion

Status: ready-for-dev

## Story

En tant que développeur,
Je veux modéliser les évaluations coach en réutilisant le pattern event sourcing de Story 5.2, avec une vue fusionnée quand deux coaches évaluent le même enfant,
Afin que l'historique complet des évaluations soit traçable et que la vue parent/admin reflète toujours la valeur fusionnée déterministe.

## Acceptance Criteria

**AC1 — Table `evaluations` créée**
- **When** la migration Story 6.1 est exécutée
- **Then** table `evaluations` avec 5 indicateurs (`receptivite`, `gout_effort`, `attitude`, `top_seance`, `note`) + colonnes event sourcing + UNIQUE `(session_id, child_id, coach_id)`

**AC2 — Extension `apply_event()`**
- **And** `apply_event()` gère `entity_type = 'evaluation'` avec `event_type = 'EVALUATION_SET'` : upsert sur `(session_id, child_id, coach_id)`

**AC3 — Vue fusionnée `session_evaluations_merged`**
- **And** vue SQL avec règle `attention > positive > none` par indicateur, `top_seance = 'star'` si ≥ 1 coach l'a attribué

**AC4 — Notes non fusionnées**
- **And** `note` (texte libre) reste par coach — jamais fusionnée

**AC5 — RLS**
- **And** coach = ses propres évaluations ; admin = tout le tenant ; parent/enfant = vue fusionnée de leurs séances

## Tasks / Subtasks

- [ ] Task 1 — Migration `00017_evaluations.sql` (AC: #1)
  - [ ] 1.1 Créer `evaluations` + activer RLS

- [ ] Task 2 — Extension `apply_event()` (AC: #2)
  - [ ] 2.1 Ajouter la branche `entity_type = 'evaluation'` dans la RPC `apply_event()`

- [ ] Task 3 — Vue `session_evaluations_merged` (AC: #3)
  - [ ] 3.1 Créer la vue SQL avec la règle de fusion

- [ ] Task 4 — Policies RLS dans `00010_rls_policies.sql` (AC: #5)
  - [ ] 4.1 Coach = ALL ses propres évaluations ; admin = ALL ; parent = SELECT via `parent_child_links`

- [ ] Task 5 — Types TypeScript
  - [ ] 5.1 Ajouter `Evaluation`, `EvaluationMerged`, `TopSeance = 'star' | 'none'`

## Dev Notes

### Migration `00017_evaluations.sql`

```sql
CREATE TABLE evaluations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  coach_id     UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  receptivite  evaluation_signal NOT NULL DEFAULT 'none',
  gout_effort  evaluation_signal NOT NULL DEFAULT 'none',
  attitude     evaluation_signal NOT NULL DEFAULT 'none',
  top_seance   TEXT NOT NULL DEFAULT 'none' CHECK (top_seance IN ('star','none')),
  note         TEXT,
  last_event_id UUID REFERENCES event_log(id),
  updated_by   UUID REFERENCES profiles(user_id),
  updated_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, child_id, coach_id)
);
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
```

### Extension `apply_event()` — branche evaluation

```sql
-- Dans apply_event(), après la vérification de l'idempotency, ajouter :
ELSIF (p_event->>'entity_type') = 'evaluation' THEN
  INSERT INTO evaluations (
    session_id, child_id, coach_id, tenant_id,
    receptivite, gout_effort, attitude, top_seance, note,
    last_event_id, updated_by, updated_at
  ) VALUES (
    (p_event->'payload'->>'session_id')::uuid,
    (p_event->'payload'->>'child_id')::uuid,
    auth.uid(),
    current_tenant_id(),
    COALESCE(p_event->'payload'->>'receptivite', 'none')::evaluation_signal,
    COALESCE(p_event->'payload'->>'gout_effort', 'none')::evaluation_signal,
    COALESCE(p_event->'payload'->>'attitude', 'none')::evaluation_signal,
    COALESCE(p_event->'payload'->>'top_seance', 'none'),
    p_event->'payload'->>'note',
    v_event_id, auth.uid(), now()
  )
  ON CONFLICT (session_id, child_id, coach_id) DO UPDATE SET
    receptivite   = EXCLUDED.receptivite,
    gout_effort   = EXCLUDED.gout_effort,
    attitude      = EXCLUDED.attitude,
    top_seance    = EXCLUDED.top_seance,
    note          = EXCLUDED.note,
    last_event_id = EXCLUDED.last_event_id,
    updated_by    = EXCLUDED.updated_by,
    updated_at    = EXCLUDED.updated_at;
```

### Vue `session_evaluations_merged`

```sql
CREATE VIEW session_evaluations_merged AS
SELECT
  session_id, child_id, tenant_id,
  CASE WHEN bool_or(receptivite = 'attention') THEN 'attention'
       WHEN bool_or(receptivite = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS receptivite,
  CASE WHEN bool_or(gout_effort = 'attention') THEN 'attention'
       WHEN bool_or(gout_effort = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS gout_effort,
  CASE WHEN bool_or(attitude = 'attention') THEN 'attention'
       WHEN bool_or(attitude = 'positive')  THEN 'positive'
       ELSE 'none' END::evaluation_signal AS attitude,
  CASE WHEN bool_or(top_seance = 'star') THEN 'star' ELSE 'none' END AS top_seance
FROM evaluations
GROUP BY session_id, child_id, tenant_id;
```

### Rappel : aucun état `absent` dans les évaluations

Les indicateurs n'ont que 3 états : `none`, `positive`, `attention`. L'état `absent` de `attendance_status` n'existe pas dans `evaluation_signal`. Un enfant absent peut quand même avoir une évaluation (cas edge) — c'est intentionnel (Story 6.2 : enfants absents grisés mais évaluables).

### Dépendances

- **Prérequis** : Story 5.2 (apply_event, event_log) + Story 1.2 (evaluation_signal enum)
- **Utilisé en Story 6.2** : évaluations créées via `apply_event()` depuis l'UX

### References
- [Source: epics.md#Story-6.1] — lignes 1879–1946

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
