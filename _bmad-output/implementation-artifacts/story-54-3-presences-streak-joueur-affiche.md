# Story 54-3 — Présences : Streak joueur affiché sous le nom

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-3
- **Status** : done
- **Priority** : P2
- **Type** : Feature / UX
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 54-1 (ready — squad overview grid), Story 53-7 (ready — `getPlayerPresenceStreaks` API)

---

## User Story

**En tant qu'admin ou coach**, quand je consulte la grille de présences d'une séance, je veux voir sous chaque nom de joueur un indicateur de streak court ("🔥 5 consécutives" ou "⚠️ 2 absences récentes"), afin d'avoir une vue contextuelle de l'assiduité de chaque joueur sans quitter la page de saisie.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### API utilisée
`getPlayerRecentStreak(childId: string, groupId: string)` — à créer dans `@aureak/api-client`.

Cette fonction diffère de `getPlayerPresenceStreaks(sessionId)` (Story 53-7) qui calcule les streaks pour tous les joueurs en une fois. Ici, la fonction cible un joueur spécifique et retourne :
```typescript
type PlayerStreakData = {
  consecutivePresences: number   // streak actuel (présences d'affilée)
  recentAbsences: number         // absences sur les 5 dernières séances
}
```

Pour des raisons de performance, préférer une version batch : `getGroupMembersRecentStreaks(groupId: string, sessionId: string)` qui retourne `Record<childId, PlayerStreakData>`.

---

## Acceptance Criteria

1. **AC1** — Chaque carte joueur dans la grille de présences affiche, sous le nom, une ligne de streak textuelle compacte.

2. **AC2** — Si `consecutivePresences >= 5` : afficher "🔥 {n} consécutives" en vert.

3. **AC3** — Si `consecutivePresences >= 10` : afficher "🔥🔥 {n} consécutives" en vert bold.

4. **AC4** — Si `recentAbsences >= 2` (sur les 5 dernières séances) ET `consecutivePresences < 3` : afficher "⚠️ {n} absences récentes" en orange.

5. **AC5** — Si aucune donnée remarquable (1–2 présences, 0–1 absence récente) : ne pas afficher de ligne streak (sous-texte vide → ne pas créer de hauteur vide).

6. **AC6** — Les streaks sont chargées via `getGroupMembersRecentStreaks(groupId, sessionId)` une seule fois au chargement de la page (batch, pas un appel par joueur).

7. **AC7** — Les données de streak sont affichées même si la séance n'est pas encore clôturée (elles reflètent l'historique précédent).

8. **AC8** — Si l'appel API échoue, les streaks ne sont pas affichées mais la page reste fonctionnelle (silent fail avec console.error dev-only).

---

## Tasks

- [x] **T1 — Créer `getGroupMembersRecentStreaks` dans `@aureak/api-client`**

  Logique :
  1. Récupérer les 10 dernières séances du groupe (avant la séance actuelle, inclus) triées par date desc
  2. Pour chaque séance, récupérer les présences
  3. Calculer pour chaque joueur :
     - `consecutivePresences` : nombre de séances d'affilée avec status 'present' depuis la plus récente
     - `recentAbsences` : nombre d'absences dans les 5 dernières séances

  ```typescript
  export async function getGroupMembersRecentStreaks(
    groupId: string,
    sessionId: string
  ): Promise<Record<string, { consecutivePresences: number; recentAbsences: number }>> {
    // Fetch last 10 sessions of the group
    // For each session, fetch attendances
    // Compute streaks per child
  }
  ```

- [x] **T2 — Exporter depuis `@aureak/api-client/src/index.ts`**

- [x] **T3 — State dans la page**
  - `useState<Record<string, { consecutivePresences: number; recentAbsences: number }>>` : `memberStreaks`
  - Charger dans `load()` si `session.groupId` est défini
  - Silent fail (pas d'erreur affichée utilisateur si l'API échoue)

- [x] **T4 — Afficher dans `SquadCard` (Story 54-1)**
  - Passer `streak?: { consecutivePresences: number; recentAbsences: number }` dans les props de `SquadCard`
  - Afficher le sous-texte conditionnel sous le nom

- [x] **T5 — Styles sous-texte**
  - Couleurs : vert `colors.status.success` pour streak positive, orange `#F59E0B` pour absences
  - `fontSize: 10, fontWeight: '600'`
  - Pas d'espace réservé si pas de sous-texte (pas de `minHeight`)

- [x] **T6 — QA scan**
  - try/finally sur le chargement des streaks dans `load()`
  - Console guard sur l'erreur API (silent fail)
  - Vérifier que l'absence de données streak ne casse pas le layout de la carte

---

## Design détaillé

### Carte joueur avec streak
```
┌──────────────────┐
│       [JD]       │
│   Jean Dupont    │
│ 🔥 7 consécutives│  ← sous-texte vert, 10px
│  ✓ Présent      │  ← badge statut
└──────────────────┘

┌──────────────────┐
│       [ML]       │
│   Marie Laurent  │
│ ⚠️ 2 abs. récentes│  ← sous-texte orange, 10px
│  ✗ Absent       │
└──────────────────┘
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/packages/api-client/src/attendances.ts` | Ajouter `getGroupMembersRecentStreaks` |
| `aureak/packages/api-client/src/index.ts` | Exporter |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Charger les streaks + passer aux cartes |

---

## Pas de migration SQL

Le calcul est fait côté TypeScript depuis les données existantes.

---

## Commit

```
feat(epic-54): story 54-3 — streak joueur affiché sous le nom dans grille présences
```
