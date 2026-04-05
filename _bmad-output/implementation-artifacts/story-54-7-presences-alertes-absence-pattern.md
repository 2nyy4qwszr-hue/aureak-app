# Story 54-7 — Présences : Alertes absence pattern automatiques

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-7
- **Status** : done
- **Priority** : P2
- **Type** : Feature / Backend
- **Estimated effort** : L (5–8h)
- **Dependencies** : Story 7-2 (done — notifications in-app), Story 49-4 (ready — recordAttendance)

---

## User Story

**En tant qu'admin**, je veux recevoir une alerte automatique dans l'application quand un joueur est absent 3 séances consécutives ou plus dans le même groupe, afin d'être proactif dans le suivi d'assiduité sans devoir consulter manuellement les présences de chaque joueur.

---

## Contexte technique

### Options d'implémentation
**Option A (recommandée)** : Logique inline dans `recordAttendance` (dans `@aureak/api-client`) — après chaque enregistrement de présence `absent`, vérifier si le joueur a 3+ absences consécutives et créer une notification in-app si oui.

**Option B** : Edge Function `check-absence-alerts` déclenchée par webhook Supabase ou cron. Plus robuste mais plus complexe à déployer.

→ Choisir **Option A** pour éviter la complexité de déploiement Edge Function dans ce sprint. Un commentaire TODO documentera la migration future vers Option B.

### Table `inapp_notifications`
Vérifier si la table existe (Story 7-2). Si oui, utiliser la fonction d'insertion existante.

Schéma minimal attendu :
```sql
inapp_notifications (
  id         UUID PRIMARY KEY,
  tenant_id  UUID NOT NULL,
  user_id    UUID,          -- destinataire (null = broadcast)
  type       TEXT NOT NULL, -- 'absence_alert'
  payload    JSONB,         -- { childId, childName, groupName, absenceCount }
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## Acceptance Criteria

1. **AC1** — Chaque fois qu'une absence est enregistrée via `recordAttendance`, une vérification silencieuse est déclenchée pour compter les absences consécutives du joueur dans ce groupe.

2. **AC2** — Si le joueur a 3 absences consécutives : une notification est créée dans `inapp_notifications` avec `type = 'absence_alert'` et payload `{ childId, childName, absenceCount: 3, groupId, groupName }`.

3. **AC3** — L'alerte n'est créée qu'**une seule fois** par seuil (pas de doublon si l'admin re-enregistre l'absence). Vérification : si une alerte du même type existe déjà dans les dernières 24h pour ce joueur + groupe, ne pas créer de doublon.

4. **AC4** — Le badge de la sidebar "Notifications" est mis à jour (si la mécanique existe déjà via Story 7-2) pour refléter les nouvelles alertes.

5. **AC5** — Dans la page `/presences` ou dans la section présences de la séance, un bandeau d'alerte orange est affiché si des alertes absence sont actives pour des joueurs du groupe courant.

6. **AC6** — L'alerte est déclenchée uniquement pour le statut `absent` (pas pour `late`, `injured`, `excused`).

7. **AC7** — Si le calcul des absences consécutives échoue (erreur API), cela ne bloque PAS l'enregistrement de la présence — silent fail avec console.error dev-only.

8. **AC8** — La logique de vérification des absences est encapsulée dans une fonction `checkAbsenceAlertTrigger(childId, groupId, sessionId)` dans `@aureak/api-client` — pas inline dans `recordAttendance`.

---

## Tasks

- [x] **T1 — Vérifier la table `inapp_notifications`**
  - Chercher dans `supabase/migrations/` si la table existe
  - Si non, créer migration `NNNNN_inapp_notifications.sql` avec le schéma minimal ci-dessus
  - Ajouter RLS : `admin` peut tout lire, `coach` voit ses propres notifications

- [x] **T2 — Créer `checkAbsenceAlertTrigger` dans `@aureak/api-client`**

  ```typescript
  export async function checkAbsenceAlertTrigger(
    childId: string,
    groupId: string,
    sessionId: string
  ): Promise<void> {
    // 1. Get last 5 sessions of the group (by date desc, up to current session)
    // 2. Get attendances of childId for these sessions
    // 3. Count consecutive absences from most recent
    // 4. If >= 3: check no duplicate alert in last 24h
    // 5. If no duplicate: insert into inapp_notifications
  }
  ```

  Ne jamais throw — tout catch silencieux avec console.error dev-only.

- [x] **T3 — Intégrer dans `recordAttendance`**
  - Après l'upsert réussi dans `attendances`, si `status === 'absent'` :
    ```typescript
    if (status === 'absent') {
      // fire and forget — ne bloque pas
      checkAbsenceAlertTrigger(childId, groupId, sessionId).catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[recordAttendance] alert check failed:', err)
      })
    }
    ```
  - Note : `groupId` doit être récupéré depuis la session (`sessions.group_id`)

- [x] **T4 — Bandeau d'alerte dans la section présences**
  - Charger les alertes actives pour le groupe : `listActiveAbsenceAlerts(groupId)` — nouvelle fonction API
  - Si des alertes existent : afficher un bandeau orange au-dessus de la grille de présences
  - Message : "⚠️ {n} joueur(s) absents depuis 3+ séances" avec liste des noms

- [x] **T5 — Migration SQL (si inapp_notifications absente)**
  - Numéroter correctement depuis `ls supabase/migrations/ | tail -3`

- [x] **T6 — QA scan**
  - `checkAbsenceAlertTrigger` ne throw jamais
  - `recordAttendance` try/finally inchangé
  - Console guards partout
  - Pas de doublon d'alerte (vérification 24h)

---

## Design détaillé

### Bandeau alerte
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  2 joueurs absents depuis 3+ séances consécutives    │
│     Martin D. (4 abs.) · Julie L. (3 abs.)              │
│                                                [Ignorer] │
└─────────────────────────────────────────────────────────┘
fond #FEF3C7, bordure #F59E0B, texte #92400E
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/migrations/NNNNN_inapp_notifications.sql` | CREATE si absente |
| `aureak/packages/api-client/src/attendances.ts` | Ajouter `checkAbsenceAlertTrigger` + `listActiveAbsenceAlerts` |
| `aureak/packages/api-client/src/index.ts` | Exporter |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Charger alertes + afficher bandeau |

---

## Commit

```
feat(epic-54): story 54-7 — alertes absence pattern automatiques + bandeau in-app
```
