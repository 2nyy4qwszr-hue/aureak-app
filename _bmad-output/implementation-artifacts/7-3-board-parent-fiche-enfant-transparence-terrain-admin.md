# Story 7.3 : Board Parent — Fiche Enfant & Transparence Terrain/Admin

Status: done

## Story

En tant que Parent,
Je veux consulter la fiche complète de mon enfant avec les présences, évaluations et le statut terrain vs édition admin,
Afin de comprendre exactement ce qui s'est passé et si une donnée a été corrigée après coup.

## Acceptance Criteria

**AC1 — Fiche enfant complète**
- **When** le Parent ouvre la fiche de son enfant
- **Then** l'écran affiche en sections :
  1. Résumé présences : dernières N séances avec statut + date
  2. Évaluations fusionnées : vue `session_evaluations_merged` + notes coach (non fusionnées)
  3. Historique séances : liste paginée avec thèmes, groupe, date, coach(s)

**AC2 — Indicateur source terrain/modifié**
- **And** chaque ligne présence/évaluation affiche un indicateur de source dérivé de `event_log` :
  - **"Terrain"** : dernier événement `event_log.source = 'field'` — timestamp = `event_log.occurred_at`
  - **"Modifié"** : dernier événement `event_log.source = 'admin'` — libellé "Modifié le [date] par staff"
- **And** dérivation côté serveur via query `event_log WHERE entity_id = attendance.id ORDER BY occurred_at DESC LIMIT 1`

**AC3 — Pagination & performance**
- **And** 3 derniers mois préchargés par défaut ; pagination pour données plus anciennes

**AC4 — RLS stricte**
- **And** un parent ne voit que les données de ses propres enfants (via `parent_child_links`)

**AC5 — Couverture FRs**
- **And** FR34 couvert : Parent consulte fiche complète de son enfant
- **And** FR35 couvert : Parent visualise évolution dans le temps

## Tasks / Subtasks

- [ ] Task 1 — API api-client pour fiche enfant (AC: #1–#3)
  - [ ] 1.1 Fonction `getChildProfile(childId, options)` dans `@aureak/api-client` : présences + évaluations + séances (3 mois)
  - [ ] 1.2 Fonction `getAttendanceSource(attendanceId)` : query `event_log` pour dériver source terrain/admin

- [ ] Task 2 — Écran parent mobile (AC: #1–#4)
  - [ ] 2.1 Créer `apps/mobile/app/(parent)/child/[childId]/index.tsx`
  - [ ] 2.2 Section présences avec indicateur source (icône terrain 🌿 / admin ✏️)
  - [ ] 2.3 Section évaluations avec `IndicatorToggle`/`StarToggle` en lecture seule
  - [ ] 2.4 Section historique séances (liste paginée)

- [ ] Task 3 — RLS policies parent (AC: #4)
  - [ ] 3.1 Vérifier que `session_evaluations_merged` hérite les RLS des tables sous-jacentes
  - [ ] 3.2 Parent accède `attendances` via `parent_child_links`

## Dev Notes

### Query fiche enfant

```typescript
// packages/api-client/src/parent/getChildProfile.ts
export async function getChildProfile(
  childId: string,
  options: { months?: number } = { months: 3 }
) {
  const from = new Date()
  from.setMonth(from.getMonth() - (options.months ?? 3))

  // Présences + séances
  const { data: attendances } = await supabase
    .from('attendances')
    .select(`
      id, status, created_at,
      sessions (
        id, date, groups(name),
        session_themes(themes(name)),
        session_coaches(coach_id, role, profiles!session_coaches_coach_id_fkey(first_name, last_name))
      )
    `)
    .eq('child_id', childId)
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: false })

  // Évaluations fusionnées
  const { data: evaluations } = await supabase
    .from('session_evaluations_merged')
    .select('session_id, receptivite, gout_effort, attitude, top_seance')
    .eq('child_id', childId)

  return { attendances, evaluations }
}

// Dérivation source terrain/admin
export async function getAttendanceSource(attendanceId: string) {
  const { data } = await supabase
    .from('event_log')
    .select('source, occurred_at, actor_id')
    .eq('entity_id', attendanceId)
    .eq('entity_type', 'attendance')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .single()

  return data
}
```

### Structure écran parent

```typescript
// apps/mobile/app/(parent)/child/[childId]/index.tsx
// Sections :
// 1. <PresenceSummary attendances={...} />  — statut + badge source
// 2. <EvaluationsList evaluations={...} />  — IndicatorToggle/StarToggle readonly
// 3. <SessionHistory childId={childId} />   — liste paginée (3 mois default)
```

### Dépendances

- **Prérequis** : Story 6.1 (session_evaluations_merged) + Story 5.2 (event_log avec source) + Story 4.2 (attendances) + Story 2.1 (parent_child_links)
- **Consommé par** : Story 8.5 (rapports parent incluent progression quiz)

### References
- [Source: epics.md#Story-7.3] — lignes 2144–2167

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
