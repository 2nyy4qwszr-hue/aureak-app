# Story 53-7 — Séances : Badge série sans absence

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-7
- **Status** : done
- **Priority** : P3
- **Type** : Feature / Gamification légère
- **Estimated effort** : M (4–6h)
- **Dependencies** : Story 19-5 (done — fiche séance), Story 49-4 (ready — présences avec toggle)

---

## User Story

**En tant qu'admin ou coach**, quand je clôture une séance, je veux voir s'afficher les joueurs qui enchaînent 5 présences consécutives ou plus avec un badge "feu" de récompense, afin de valoriser l'assiduité et de partager cette information facilement avec les parents ou le joueur.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### Nouvelle API requise
`getPlayerPresenceStreaks(sessionId: string)` dans `@aureak/api-client` — retourne pour chaque joueur du groupe sa série de présences consécutives (streak count).

### Logique SQL
La streak est calculée en comptant les séances consécutives (passées, même groupe) où le joueur était `present`, en remontant depuis la séance actuelle.

```sql
-- Nombre de présences consécutives pour chaque joueur du groupe jusqu'à cette séance
WITH ordered_sessions AS (
  SELECT
    s.id,
    s.session_date,
    a.child_id,
    a.status,
    ROW_NUMBER() OVER (PARTITION BY a.child_id ORDER BY s.session_date DESC) as rn
  FROM sessions s
  JOIN attendances a ON a.session_id = s.id
  WHERE s.group_id = (SELECT group_id FROM sessions WHERE id = $sessionId)
    AND s.session_date <= (SELECT session_date FROM sessions WHERE id = $sessionId)
    AND a.status = 'present'
),
-- ... grouping runs
SELECT child_id, COUNT(*) as streak FROM ordered_sessions
WHERE rn <= streak_length
GROUP BY child_id
```

La fonction API peut simplifier : récupérer les 10 dernières séances du groupe (par date desc), calculer la streak côté TS (plus simple à maintenir).

---

## Acceptance Criteria

1. **AC1** — Une section "Séries d'assiduité" est affichée sur la fiche séance uniquement si `session.status === 'réalisée'`.

2. **AC2** — La section liste les joueurs avec leur série de présences consécutives, triés par série décroissante.

3. **AC3** — Les joueurs avec 5+ présences consécutives ont un badge "🔥 Série active" doré à côté de leur nom.

4. **AC4** — Les joueurs avec 10+ présences consécutives ont un badge "🔥🔥 Série exceptionnelle" rouge.

5. **AC5** — Les joueurs avec moins de 5 présences consécutives ne sont pas affichés dans cette section (section vide → masquée).

6. **AC6** — Si aucun joueur ne dépasse 5 consécutives, la section n'est pas rendue du tout.

7. **AC7** — La fonction `getPlayerPresenceStreaks(sessionId)` est implémentée dans `@aureak/api-client` et exportée. Elle calcule les streaks en TypeScript (pas de function SQL) depuis les données `listAttendancesBySession` des N dernières séances du groupe.

8. **AC8** — Le chargement des streaks est déclenché dans `load()` uniquement si `session.status === 'réalisée'`.

---

## Tasks

- [x] **T1 — Implémenter `getPlayerPresenceStreaks` dans `@aureak/api-client`**
  - Fonction dans `src/attendances.ts` (ou fichier approprié) :
    1. Récupérer `session.groupId` depuis `getSessionById(sessionId)`
    2. Récupérer les 15 dernières séances du groupe par date desc (jusqu'à la session courante)
    3. Pour chaque séance, récupérer les présences avec status = 'present'
    4. Pour chaque joueur : compter les séances consécutives à rebours
  - Type retour : `{ childId: string; streak: number }[]`
  - Exporter depuis `index.ts`

  ```typescript
  export async function getPlayerPresenceStreaks(sessionId: string): Promise<{ childId: string; streak: number }[]> {
    // 1. Get current session's group + date
    // 2. listSessionsAdminView({groupId, end: session.sessionDate, limit: 15})
    // 3. For each session, get present attendances
    // 4. Compute streaks
  }
  ```

- [x] **T2 — State dans la page**
  - `useState<{childId: string; streak: number}[]>` : `presenceStreaks`
  - Charger dans `load()` si `session.status === 'réalisée'`

- [x] **T3 — Composant `StreakBadgeSection`**
  - Composant local dans `page.tsx`
  - Props : `{ streaks: {childId: string; streak: number}[]; childNameMap: Record<string, string> }`
  - Filtrer les joueurs avec `streak >= 5`
  - Trier par streak desc
  - Si aucun → retourner null
  - Afficher badge emoji + nom + compteur "X en série"

- [x] **T4 — Intégrer dans la page**
  - Placer `<StreakBadgeSection>` après la section Résumé (si présente) ou après les présences
  - Conditionné sur `session.status === 'réalisée'`

- [x] **T5 — QA scan**
  - try/finally sur le chargement des streaks
  - Console guard sur erreurs API
  - Vérifier que la section ne s'affiche pas sur les séances planifiées

---

## Design détaillé

```
Séries d'assiduité  🔥

┌─────────────────────────────────────────────────────────┐
│  [MD] Martin Dupont         🔥🔥 Série exceptionnelle    │
│                             12 présences consécutives    │
├─────────────────────────────────────────────────────────┤
│  [JL] Julie Lambert         🔥 Série active              │
│                             7 présences consécutives     │
├─────────────────────────────────────────────────────────┤
│  [TM] Thomas Martin         🔥 Série active              │
│                             5 présences consécutives     │
└─────────────────────────────────────────────────────────┘
```

---

## Fichiers à modifier/créer

| Fichier | Modification |
|---------|-------------|
| `aureak/packages/api-client/src/attendances.ts` | Ajouter `getPlayerPresenceStreaks` |
| `aureak/packages/api-client/src/index.ts` | Exporter `getPlayerPresenceStreaks` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter section Streaks + chargement conditionnel |

---

## Pas de migration SQL

Le calcul de streak se fait côté TS depuis les données existantes.

---

## Commit

```
feat(epic-53): story 53-7 — badge série sans absence sur fiche séance clôturée
```
