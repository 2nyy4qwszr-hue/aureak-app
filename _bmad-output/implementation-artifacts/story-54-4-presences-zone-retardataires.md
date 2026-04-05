# Story 54-4 — Présences : Zone retardataires

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-4
- **Status** : done
- **Priority** : P2
- **Type** : Feature / UX
- **Estimated effort** : S (2–4h)
- **Dependencies** : Story 54-1 (ready — squad overview), Story 49-4 (ready — toggle présence)

---

## User Story

**En tant qu'admin ou coach**, quand des joueurs arrivent en retard à une séance, je veux pouvoir les marquer comme "retardataires" via le statut `late`, les voir regroupés dans une section dédiée visuellement distincte, et pouvoir les basculer vers "présent" quand ils ont rejoint l'entraînement, afin de gérer clairement les retards sans les confondre avec les absences.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### Statut `late`
`AttendanceStatus` inclut déjà `'late'`. Le statut est géré via l'API `recordAttendance`.

### Ce qui est demandé
Dans la grille de présences (Story 54-1), ajouter une section visuelle séparée "Retardataires" qui agrège les joueurs avec `status === 'late'`, affiche leur badge orange, et propose un bouton pour les passer en "présent".

---

## Acceptance Criteria

1. **AC1** — Une section "Retardataires" avec un bandeau orange est affichée entre la section principale et les absents, uniquement si au moins 1 joueur a le statut `late`.

2. **AC2** — Les joueurs en retard ont leur carte dans la section "Retardataires" **ET** sont retirés de la grille principale (pas de doublon).

3. **AC3** — Chaque carte retardataire affiche : avatar avec fond orange, nom, badge "⏱ En retard" orange, et un bouton compact "→ Présent" pour basculer vers `present`.

4. **AC4** — Cliquer "→ Présent" appelle `recordAttendance(sessionId, childId, 'present')` avec optimistic update. La carte migre de la section "Retardataires" vers la section principale avec le statut "Présent".

5. **AC5** — Dans la grille principale, les joueurs qui ne sont ni présents, ni absents, ni retards voient une option "Retard" dans leur micro-menu de statut (Story 54-1 AC5).

6. **AC6** — Le compteur global (Story 54-1 AC6) est mis à jour : "X présents · Y absents · Z retardataires · W non enregistrés".

7. **AC7** — Si la section "Retardataires" est vide, elle n'est pas rendue.

---

## Tasks

- [x] **T1 — Segmenter les joueurs dans la grille**
  - Modifier le `useMemo` de tri des joueurs pour créer 3 groupes :
    - `lateMembers` : `attendanceMap[m.childId] === 'late'`
    - `mainMembers` : les autres (présents, absents, non enregistrés)

- [x] **T2 — Section "Retardataires"**
  - Composant local `LateZone` ou JSX inline
  - Bandeau header orange avec label "⏱ Retardataires ({n})"
  - Cards en row (layout horizontal compact, pas la grille 4 colonnes)
  - Bouton "→ Présent" sur chaque carte

- [x] **T3 — Handler "→ Présent"**
  - Réutiliser le `handleStatusChange` existant (Story 49-4 / 54-1) avec `status = 'present'`
  - L'optimistic update déplace la carte automatiquement (via re-compute du `useMemo`)

- [x] **T4 — Mise à jour du compteur**
  - Ajouter `lateCount` au calcul du compteur
  - Format : "6 présents · 2 absents · 1 retardataires · 1 non enregistrés"

- [x] **T5 — Option "Retard" dans le micro-menu**
  - S'assurer que le micro-menu de statut (Story 54-1) inclut bien l'option `late`
  - Si Story 54-1 n'est pas encore faite, documenter que cette story ajoute l'option `late`

- [x] **T6 — QA scan**
  - try/finally sur le handler de statut
  - Vérifier qu'aucun joueur n'apparaît dans les 2 sections simultanément
  - Console guards

---

## Design détaillé

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱ Retardataires (2)                   fond orange 10%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ML] Marie Laurent ⏱ En retard   [→ Présent]
[TB] Thomas B.     ⏱ En retard   [→ Présent]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Joueurs (6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[grille 4 colonnes...]
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter section "Retardataires" + segmentation de la grille |

---

## Pas de migration SQL

Utilise le statut `late` déjà dans `AttendanceStatus`.

---

## Commit

```
feat(epic-54): story 54-4 — zone retardataires dans la gestion des présences
```
