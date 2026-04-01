# Story 6.2 : UX Évaluation Rapide (< 10s par enfant)

Status: deferred

## Story

En tant que Coach,
Je veux évaluer chaque enfant d'une main en moins de 10 secondes avec retour haptique immédiat,
Afin de ne pas ralentir le flux post-séance et de garantir que toutes les évaluations sont saisies avant que les enfants ne partent.

## Acceptance Criteria

**AC1 — Liste enfants présents en cartes swipables**
- **When** le Coach ouvre l'écran d'évaluation (séance `en_cours`)
- **Then** enfants avec `attendance.status IN ('present','late','trial')` listés en cartes navigables par swipe gauche/droite

**AC2 — Carte évaluation**
- **And** chaque carte affiche : 3 `IndicatorToggle` (réceptivité, goût effort, attitude), 1 `StarToggle`, 1 champ note optionnel
- **And** zones tactiles ≥ 44×44pt (UX-3, UX-8)
- **And** cycle `none → positive → attention` pour les indicateurs, `none → star` pour StarToggle

**AC3 — Retour haptique**
- **And** chaque tap déclenche un retour haptique via `onHaptic` prop (injecté par l'app mobile)

**AC4 — Offline + sync**
- **And** évaluation enregistrée localement et enfilée dans `sync_queue` via `apply_event()` — même pattern offline que les présences

**AC5 — Indicateur de progression**
- **And** "8 / 12 évalués" visible en permanence

**AC6 — Enfants absents grisés**
- **And** enfants `absent`/`injured` affichés grisés en bas — le coach peut choisir de les évaluer quand même

## Tasks / Subtasks

- [ ] Task 1 — Hook `useRecordEvaluation` dans `@aureak/business-logic` (AC: #4)
  - [ ] 1.1 Créer `packages/business-logic/src/sync/useRecordEvaluation.ts` — même pattern que `useRecordAttendance`

- [ ] Task 2 — Écran évaluation mobile (AC: #1–#6)
  - [ ] 2.1 Créer `apps/mobile/app/(coach)/session/[sessionId]/evaluation.tsx`
  - [ ] 2.2 Swipe navigation : `FlatList` horizontal avec `pagingEnabled`
  - [ ] 2.3 Intégrer `IndicatorToggle` et `StarToggle` depuis `@aureak/ui`
  - [ ] 2.4 Haptique via `expo-haptics` injecté comme `onHaptic` prop

- [ ] Task 3 — Indicateur progression (AC: #5)
  - [ ] 3.1 Count des enfants évalués vs total présents depuis le state local

- [ ] Task 4 — Test performance (AC: #4)
  - [ ] 4.1 Test : 4 taps + swipe (évaluer 1 enfant) < 10s — mesure avec Jest timer mock

## Dev Notes

### Hook `useRecordEvaluation`

```typescript
// packages/business-logic/src/sync/useRecordEvaluation.ts
export function useRecordEvaluation(sessionId: string) {
  const { db } = useOfflineStore()
  const syncService = new SyncQueueService(db)

  const record = async (params: {
    childId    : string
    receptivite: EvaluationSignal
    goutEffort : EvaluationSignal
    attitude   : EvaluationSignal
    topSeance  : 'star' | 'none'
    note?      : string
  }) => {
    const operationId = uuidv4()
    await syncService.enqueue({
      entityType: 'evaluation',
      payload: {
        operation_id: operationId,
        session_id  : sessionId,
        child_id    : params.childId,
        receptivite : params.receptivite,
        gout_effort : params.goutEffort,
        attitude    : params.attitude,
        top_seance  : params.topSeance,
        note        : params.note,
        occurred_at : new Date().toISOString(),
        source      : 'field',
      }
    })
  }

  return { record }
}
```

### Architecture évaluation offline

Les évaluations ne sont PAS stockées dans `local_attendances` SQLite — elles vont directement dans `local_sync_queue` (pas de miroir local des évaluations). Raison : les évaluations ne sont consultées qu'après sync serveur, pas en mode terrain pur.

Exception : si < 2s de réseau, l'optimistic update n'est pas nécessaire pour les évaluations (contrairement aux présences). Le coach évalue, le swipe passe à l'enfant suivant, la sync se fait en arrière-plan.

### Écran évaluation — structure

```typescript
// apps/mobile/app/(coach)/session/[sessionId]/evaluation.tsx
import * as Haptics from 'expo-haptics'

const onHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// FlatList horizontal avec pagingEnabled
// Item = carte par enfant
// En-tête sticky : "8 / 12 évalués"
// Swipe gauche/droite pour naviguer
```

### Pièges

1. **`IndicatorToggle` dans `@aureak/ui`** ne doit pas importer `expo-haptics` directement (casse le web). Utiliser le prop `onHaptic?: () => void` injecté par `apps/mobile`.
2. **Cycle `none → positive → attention`** : `absent` n'est jamais dans le cycle d'évaluation.

### Dépendances

- **Prérequis** : Stories 6.1 (evaluations, apply_event extension) + 1.3 (IndicatorToggle, StarToggle) + 5.3 (SyncQueueService)

### References
- [Source: epics.md#Story-6.2] — lignes 1950–1970

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
