# Story 49-4 — UX Présences : liste pré-remplie des joueurs du groupe avec toggle présent/absent

## Metadata

- **Epic** : 49 — UX batch avril 2026 #2
- **Story** : 49-4
- **Status** : done
- **Priority** : P1
- **Type** : UX / Feature
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 46-1 (done — section "Joueurs du groupe" dans page séance)

---

## User Story

**En tant qu'admin ou coach**, quand j'ouvre la page d'une séance qui a un groupe assigné, je veux voir immédiatement tous les joueurs du groupe avec un toggle présent/absent pré-rempli, afin de pouvoir enregistrer les présences d'un seul coup d'œil sans avoir à naviguer vers une page séparée.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### État actuel
La page charge déjà :
- `listGroupMembersWithDetails(groupId)` → `groupMembers: GroupMemberWithDetails[]` (Story 46.1)
- `listAttendancesBySession(sessionId)` → `attendances: Attendance[]`

La section "Présences" (lignes 556–576) affiche uniquement les enregistrements existants dans `attendances`. Si aucune présence n'a encore été saisie, le message "Aucune présence enregistrée" s'affiche et l'utilisateur ne voit pas les joueurs du groupe.

La section "Joueurs du groupe" (lignes 449–497) affiche correctement tous les membres mais sans toggle d'interaction.

### Ce qui manque
Fusionner les deux : pour chaque membre du groupe, montrer son statut de présence actuel (ou "non enregistré" par défaut) avec un toggle interactif présent/absent.

### API disponibles
- **Lecture** : `listAttendancesBySession(sessionId)` — retourne `Attendance[]` avec `childId`, `status`
- **Écriture / upsert** : `recordAttendance({ sessionId, childId, tenantId, status, recordedBy })` dans `attendances.ts` — fait un upsert sur `(session_id, child_id)`
- **Type** : `AttendanceStatus` = `'present' | 'absent' | 'late' | 'trial' | 'injured' | 'excused'`

### Schéma table `attendances`
```sql
attendances (
  id           UUID PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES sessions(id),
  child_id     UUID NOT NULL,
  tenant_id    UUID NOT NULL,
  status       attendance_status NOT NULL,  -- present|absent|late|trial|injured|excused
  recorded_by  UUID,
  recorded_at  TIMESTAMPTZ,
  UNIQUE (session_id, child_id)
)
```

---

## Acceptance Criteria

1. **AC1** — Quand une séance a un groupe assigné, la section "Présences" affiche TOUS les membres du groupe (pas seulement ceux qui ont déjà une ligne dans `attendances`).

2. **AC2** — Chaque joueur est affiché sur une ligne avec : avatar initiales (fond or), nom en bold, et un toggle visuel présent (vert) / absent (rouge).

3. **AC3** — Si une présence existe déjà en DB pour ce joueur (`status = 'present'`), le toggle est affiché en vert/actif. Si absent ou aucun enregistrement, le toggle est affiché en rouge/inactif.

4. **AC4** — Cliquer le toggle déclenche un appel `recordAttendance` (upsert) avec le nouveau statut opposé (`present` ↔ `absent`). L'UI se met à jour de façon optimiste immédiatement, sans attendre la réponse serveur.

5. **AC5** — En cas d'erreur API sur le toggle, l'état optimiste est rollback (retour au statut précédent) et un message d'erreur discret est affiché dans la carte.

6. **AC6** — La section affiche un compteur : `Présences (X présents / Y joueurs)`.

7. **AC7** — Si la séance est de type "ponctuelle" (pas de `groupId`), la section affiche le message existant "Séance ponctuelle — aucun groupe fixe" et reste inchangée.

8. **AC8** — Les joueurs invités (guests via `session_attendees.is_guest = true`) continuent d'être gérés dans la section "Joueurs invités" distincte — ne pas les dupliquer ici.

9. **AC9** — Pas de migration SQL requise (utilise l'API existante `recordAttendance`).

---

## Tasks

- [x] **T1 — Audit API**
  - Vérifier que `recordAttendance` est bien exporté depuis `@aureak/api-client` (`src/index.ts` ou barrel)
  - Si non exporté, ajouter l'export
  - Vérifier que `session.tenantId` est disponible dans la page (déjà chargé via `getSessionById`)

- [x] **T2 — State local**
  - Ajouter `useState` : `attendanceMap: Record<string, AttendanceStatus | null>` (clé = childId)
  - Ajouter `useState` : `attendanceToggling: Set<string>` (childIds en cours de sauvegarde — pour désactiver le toggle pendant l'appel)
  - Ajouter `useState` : `attendanceError: string | null` (erreur globale de la section)

- [x] **T3 — Logique merge au chargement**
  - Après `load()`, construire `attendanceMap` initial :
    ```typescript
    const map: Record<string, AttendanceStatus | null> = {}
    // Initialiser tous les membres du groupe à null (absent implicite)
    groupMembers.forEach(m => { map[m.childId] = null })
    // Écraser avec les présences existantes
    attendances.forEach(a => { map[a.childId] = a.status as AttendanceStatus })
    setAttendanceMap(map)
    ```

- [x] **T4 — Handler toggle**
  - Fonction `handleTogglePresence(childId: string)` :
    1. Si `attendanceToggling.has(childId)` → return (debounce)
    2. Calculer `newStatus`: si actuel = `'present'` → `'absent'`, sinon → `'present'`
    3. **Optimistic update** : `setAttendanceMap(prev => ({ ...prev, [childId]: newStatus }))`
    4. `setAttendanceToggling(prev => new Set([...prev, childId]))`
    5. Appeler `recordAttendance({ sessionId, childId, tenantId: session.tenantId, status: newStatus, recordedBy: '' })`
    6. En cas d'erreur : rollback `setAttendanceMap` au statut précédent + `setAttendanceError('Erreur lors de la mise à jour')`
    7. `finally`: retirer de `attendanceToggling`
  - Respect règle try/finally obligatoire (CLAUDE.md §3)

- [x] **T5 — UI section Présences**
  - Remplacer la section "Présences" existante (lignes 556–576 de la page actuelle) par la nouvelle UI :
    - Si `session.groupId` : afficher la liste fusionnée groupe + attendances
    - Si `!session.groupId` : afficher les présences existantes seulement (comportement actuel)
  - Chaque ligne membre du groupe :
    ```
    [Avatar initiales or] [Nom bold] [sous-titre: âge]    [Toggle vert/rouge]
    ```
  - Toggle : `Pressable` avec fond vert (`#10B981`) si présent, rouge (`colors.accent.red`) si absent/null
  - Label dans le toggle : "Présent" (vert) / "Absent" (rouge)
  - Opacity 0.5 sur la ligne si `attendanceToggling.has(childId)` (sauvegarde en cours)
  - Compteur en label de section : `Présences (${presentCount} / ${groupMembers.length})`

- [x] **T6 — Suppression doublon section "Joueurs du groupe"**
  - La section "Joueurs du groupe" (Story 46.1) devient redondante si elle est fusionnée dans "Présences"
  - **Option A (recommandée)** : Conserver la section "Joueurs du groupe" telle quelle (lecture seule, compacte) et ajouter la section "Présences" juste en dessous avec le toggle. Les deux coexistent.
  - **Option B** : Fusionner en une seule section "Joueurs & Présences". Plus concis mais modifie Story 46.1.
  - Choisir Option A pour limiter la surface de changement et respecter la règle "ne pas implémenter plus que ce que la story demande".

- [x] **T7 — QA scan**
  - Vérifier try/finally sur `handleTogglePresence`
  - Vérifier console guards (`process.env.NODE_ENV !== 'production'`)
  - Vérifier qu'aucune couleur hardcodée n'a été introduite (utiliser tokens)

---

## Design détaillé

### Maquette ligne joueur

```
┌─────────────────────────────────────────────────────────────┐
│  [JD]  Jean Dupont                          [ ✓ Présent ]   │
│        12 ans                                               │
├─────────────────────────────────────────────────────────────┤
│  [ML]  Marie Laurent                        [ ✗ Absent  ]   │
│        11 ans                                               │
└─────────────────────────────────────────────────────────────┘
```

- Avatar : cercle 36px, fond `colors.accent.gold + '30'`, texte gold 12px bold (identique à la section joueurs du groupe existante)
- Toggle présent : fond `colors.status.success` (`#10B981`), texte blanc "Présent", bordure radius.xs
- Toggle absent : fond `colors.accent.red`, texte blanc "Absent", bordure radius.xs
- Toggle width fixe ~80px, paddingHorizontal space.sm, paddingVertical 4
- Ligne désactivée pendant appel : opacity 0.6

### Label section

```
Présences (3 présents / 8 joueurs)
```

### Message d'erreur (si rollback)

```
⚠ Erreur lors de la mise à jour — réessayez
```
Affiché dans la card, fond `#FEF3C7`, texte `#D97706`, disparaît après 4s (`setTimeout`)

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter state `attendanceMap`, `attendanceToggling`, `attendanceError`. Ajouter logique merge dans `load()`. Ajouter `handleTogglePresence`. Remplacer section Présences. |
| `aureak/packages/api-client/src/index.ts` | Vérifier export `recordAttendance` — ajouter si manquant |

---

## Pas de migration SQL

Cette story n'introduit aucune migration. Elle utilise exclusivement des API et tables existantes :
- `attendances` (upsert via `recordAttendance`)
- `group_members` + `child_directory` (lecture via `listGroupMembersWithDetails`)

---

## Notes d'implémentation

- `recordedBy` : pour un admin, passer `''` (vide) est acceptable en attendant l'auth user. Mieux : récupérer `supabase.auth.getUser()` dans le handler et passer l'ID réel.
- Le toggle ne gère que `present` ↔ `absent`. Les statuts `late`, `trial`, `injured`, `excused` sont des statuts avancés gérés via la page `/presences` dédiée (lien "Actions rapides" existant). Si un joueur a un statut avancé, afficher son statut avec une couleur neutre (gold) et désactiver le toggle (ne pas écraser un statut avancé avec un simple toggle).
- Un statut avancé = `status` ∈ `['late', 'trial', 'injured', 'excused']` → afficher badge coloré + désactiver toggle.

---

## Validation post-implémentation

1. Ouvrir la page d'une séance avec un groupe ayant des membres
2. Vérifier que tous les joueurs s'affichent dans la section Présences, même sans présence enregistrée
3. Cliquer un toggle → vérification optimiste immédiate → recharger la page → statut persisté
4. Cliquer le toggle à nouveau → retour à "Absent" → persisté
5. Vérifier le compteur (X / Y) se met à jour à chaque toggle
6. Tester une séance ponctuelle (sans groupe) → section Présences affiche l'ancien comportement
7. Playwright : screenshot de la section Présences avant et après toggle

---

## Commit

```
feat(epic-49): story 49-4 — présences pré-remplies avec toggle par joueur du groupe
```
