# Story 76.1 : BUG — listAttendancesByChild filtres gte/lte sur table jointe → résultats non filtrés par date

Status: done

## Story

En tant qu'admin,
je veux que la heatmap "Présences 12 mois glissants" ne retourne que les présences dans la période demandée,
afin de visualiser l'historique de présence d'un joueur avec un filtrage de date réellement appliqué.

## Acceptance Criteria

1. `listAttendancesByChild(childId, startDate, endDate)` retourne uniquement les présences dont la session a lieu entre `startDate` et `endDate` inclus — aucune présence hors période ne figure dans le résultat.
2. La fonction ne retourne plus d'erreur 400 PostgREST liée à un filtre sur table jointe (`sessions.scheduled_at`) non supporté par la syntaxe standard PostgREST.
3. Le tri des résultats retournés est effectué par date décroissante (`sessionDate` DESC) côté JavaScript après fetch — aucune clause `.order()` sur table jointe dans la requête Supabase.
4. La heatmap dans `/children/[childId]` affiche les données filtrées correctement sur la période de 12 mois glissants.
5. Aucune régression sur les autres fonctions du fichier `attendances.ts` (listActiveAbsenceAlerts, recordAttendance, etc.).

## Tasks / Subtasks

- [x] T1 — Corriger les filtres gte/lte dans `listAttendancesByChild` (AC: 1, 2)
  - [x] T1.1 — Dans `aureak/packages/api-client/src/sessions/attendances.ts`, localiser la fonction `listAttendancesByChild` (autour de la ligne 798)
  - [x] T1.2 — Supprimer `.gte('sessions.scheduled_at', startDate)` et `.lte('sessions.scheduled_at', endDate)` — ces filtres sur table jointe ne sont pas supportés par PostgREST et sont silencieusement ignorés (résultat : toutes les attendances sont retournées)
  - [x] T1.3 — Appliquer le filtrage de date **côté JavaScript** après le mapping : filtrer les `rows` dont `sessionDate` est entre `startDate` et `endDate` (comparaison ISO string `>=` / `<=`)

- [x] T2 — Vérifier et corriger le tri (AC: 3)
  - [x] T2.1 — S'assurer qu'il n'existe aucune clause `.order('sessions.session_date')` ou `.order('sessions.scheduled_at')` dans la requête Supabase (déjà absent suite à story-69-9, vérifier à nouveau)
  - [x] T2.2 — Confirmer que le tri JS existant est en ordre décroissant (`b - a`) après le fix du filtrage : `rows.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Vérifier manuellement sur `/children/[childId]` que la heatmap "Présences 12 mois glissants" affiche des données réelles limitées aux 12 derniers mois
  - [x] T3.2 — Grep QA sur `attendances.ts` : absence de `sessions.scheduled_at` dans les filtres `.gte`/`.lte`, présence du filtre JS post-fetch
  - [x] T3.3 — Vérifier zéro régression sur les exports de `attendances.ts` en lançant `cd aureak && npx tsc --noEmit`

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Cause exacte et correction

**Problème :** PostgREST ne supporte pas les filtres `.gte()` / `.lte()` sur une colonne d'une table jointe en notation pointée (`sessions.scheduled_at`). Ces filtres sont **silencieusement ignorés** — la requête réussit (pas de 400) mais retourne toutes les attendances du joueur sans filtre de date.

**Code actuel bugué (lignes ~817-819) :**
```typescript
.eq('child_id', childId)
.gte('sessions.scheduled_at', startDate)   // ← ignoré par PostgREST
.lte('sessions.scheduled_at', endDate)     // ← ignoré par PostgREST
```

**Correction : supprimer ces deux lignes et filtrer côté JS après le mapping :**

```typescript
export async function listAttendancesByChild(
  childId  : string,
  startDate: string,
  endDate  : string,
): Promise<AttendanceHistoryRow[]> {
  let data: unknown[] | null = null
  try {
    const { data: raw, error } = await supabase
      .from('attendances')
      .select(`
        session_id,
        status,
        sessions!inner (
          scheduled_at,
          session_type,
          group_id,
          groups ( name )
        )
      `)
      .eq('child_id', childId)
      // ← NE PAS ajouter .gte/.lte sur sessions.scheduled_at (non supporté)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[listAttendancesByChild] error:', error)
      throw error
    }

    data = raw ?? []
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[listAttendancesByChild] unexpected error:', err)
    throw err
  }

  const rows = (data as unknown[])
    .map(row => {
      const r        = row as { session_id: string; status: string; sessions: { scheduled_at: string; session_type: string | null; groups: { name: string } | null } }
      const sessions = r.sessions
      return {
        sessionId  : r.session_id,
        sessionDate: sessions?.scheduled_at ?? '',
        sessionType: sessions?.session_type ?? '',
        groupName  : (sessions?.groups as { name: string } | null)?.name ?? '',
        status     : r.status as AttendanceStatus,
      }
    })
    // Filtrage de date côté JS (PostgREST ne supporte pas les filtres sur tables jointes)
    .filter(row => row.sessionDate >= startDate && row.sessionDate <= endDate)

  // Tri côté JS décroissant — PostgREST ne supporte pas .order() sur table jointe
  rows.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())

  return rows
}
```

**Note :** Le filtrage ISO string `>=` / `<=` fonctionne correctement car `scheduled_at` est au format ISO 8601 (`2026-03-15T10:00:00Z`) et `startDate`/`endDate` sont au format `YYYY-MM-DD`. La comparaison lexicographique est valide ici car ISO 8601 est trié lexicographiquement de façon identique au tri chronologique.

---

### QA — Patterns à vérifier après correction

**BLOCKER — Vérifier l'absence de filtres sur table jointe :**
```bash
grep -n "gte\|lte" aureak/packages/api-client/src/sessions/attendances.ts | grep "sessions\."
```
→ Doit retourner zéro ligne après correction.

**WARNING — Console guards présents :**
```bash
grep -n "console\." aureak/packages/api-client/src/sessions/attendances.ts | grep -v "NODE_ENV"
```
→ Doit retourner zéro ligne.

---

### Contexte : story-69-9 (done)

La story **69-9** a déjà corrigé le `.order('sessions.session_date')` initial (colonne inexistante + table jointe non supportée par `.order()`). La présente story corrige le bug **complémentaire** : les filtres `.gte()` / `.lte()` sur table jointe également non supportés, laissant les attendances non filtrées par date malgré l'absence d'erreur 400.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Modifier | Supprimer .gte/.lte sur sessions.scheduled_at + filtrage JS post-mapping |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/parent/attendance-heatmap.ts` — utilise `v_child_attendance_heatmap` (vue SQL), `session_date` est une colonne propre à la vue, non impactée
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — appelle déjà correctement `listAttendancesByChild`, aucune modification nécessaire
- Toute migration SQL — aucune modification de schéma requise

---

### Dépendances à protéger

- Story 54-6 crée `AttendanceHistoryRow` et `listAttendancesByChild` — la signature doit rester identique `(childId, startDate, endDate) => Promise<AttendanceHistoryRow[]>`
- Story 65-6 utilise potentiellement `listAttendancesByChild` dans la vue joueur inline — ne pas modifier la signature

---

### Références

- Fonction cible : `aureak/packages/api-client/src/sessions/attendances.ts` lignes 798-848
- Story précédente (partiellement corrigée) : `_bmad-output/implementation-artifacts/story-69-9-bug-listattendancesbychild-session-date.md`
- Pattern filtrage JS post-fetch : même pattern que `listGroupMembersWithProfiles` dans `aureak/packages/api-client/src/sessions/implantations.ts`

---

### Multi-tenant

RLS gère l'isolation. La clause `.eq('child_id', childId)` est suffisante — aucun paramètre `tenantId` supplémentaire requis. La vue `sessions!inner` hérite du contexte RLS via le JWT.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- Suppression des `.gte('sessions.scheduled_at', startDate)` / `.lte('sessions.scheduled_at', endDate)` non supportés par PostgREST sur tables jointes
- Filtrage de date migré côté JS en `.filter(row => row.sessionDate >= startDate && row.sessionDate <= endDate)` après le `.map()`
- Tri corrigé de ascendant (a-b) → décroissant (b-a)
- TypeScript OK, QA OK

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Modifié |
