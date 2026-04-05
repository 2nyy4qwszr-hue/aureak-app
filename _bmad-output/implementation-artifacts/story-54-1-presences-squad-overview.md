# Story 54-1 — Présences : Vue Squad Overview — joueurs avec statut

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-1
- **Status** : done
- **Priority** : P1
- **Type** : UX / Feature
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 49-4 (ready — toggle présent/absent basique), Story 46-1 (done — groupMembers chargés)

---

## User Story

**En tant qu'admin ou coach**, quand j'ouvre la section présences d'une séance avec un groupe assigné, je veux voir une grille compacte de tous les joueurs du groupe avec leur avatar initiales, leur nom, et leur badge de statut actuel (présent/absent/retard/inconnu), afin d'avoir une vue d'ensemble visuelle du squad avant même de commencer la saisie.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### Relation avec Story 49-4
Cette story est une amélioration de la section présences de la Story 49-4. Elle améliore le layout en passant d'une liste verticale à une grille de cartes joueurs compactes (Squad View).

### Données disponibles
- `groupMembers: GroupMemberWithDetails[]` — membres du groupe
- `attendances: Attendance[]` — présences enregistrées
- `attendanceMap: Record<string, AttendanceStatus | null>` — map child_id → statut (si Story 49-4 est done, sinon à créer)

---

## Acceptance Criteria

1. **AC1** — La section présences affiche les joueurs dans une **grille 4 colonnes** (desktop) / 2 colonnes (mobile ≤768px), avec une carte par joueur.

2. **AC2** — Chaque carte joueur contient : avatar initiales (cercle 40px, fond selon statut), prénom + nom en bold, et un badge de statut coloré en bas de carte.

3. **AC3** — Les couleurs d'avatar selon statut : présent = fond vert (#10B981) à 25% + texte vert; absent = fond rouge à 25% + texte rouge; late = fond orange à 25% + texte orange; non enregistré = fond or à 20% + texte or.

4. **AC4** — Le badge de statut en bas de carte affiche : "✓ Présent" (vert), "✗ Absent" (rouge), "⏱ Retard" (orange), "?" (or, non enregistré).

5. **AC5** — Cliquer une carte joueur ouvre un micro-menu (inline dans la carte) avec les options de statut : Présent, Absent, Retard, Blessé, Excusé. La sélection appelle `recordAttendance` et met à jour le statut de la carte.

6. **AC6** — Un compteur global est affiché au-dessus de la grille : "X présents · Y absents · Z non enregistrés".

7. **AC7** — Les cartes sont triées par nom (alphabétique) — les joueurs non enregistrés en dernier pour attirer l'attention.

8. **AC8** — La grille remplace visuellement la liste verticale de la Story 49-4, mais conserve la même logique de toggle et d'optimistic update.

---

## Tasks

- [x] **T1 — Lire la section présences actuelle dans `[sessionId]/page.tsx`**
  - Identifier le JSX existant de la liste présences (lignes de toggle vertical)
  - Identifier les states `attendanceMap`, `attendanceToggling` si déjà existants (Story 49-4)
  - Si Story 49-4 n'est pas done, implémenter la logique complète (states + handlers)

- [x] **T2 — Composant `SquadStatusGrid`**
  - Composant local dans `page.tsx`
  - Props :
    ```typescript
    type SquadStatusGridProps = {
      members: GroupMemberWithDetails[]
      attendanceMap: Record<string, AttendanceStatus | null>
      onStatusChange: (childId: string, status: AttendanceStatus) => void
      toggling: Set<string>
    }
    ```
  - Grille : `flexDirection: 'row', flexWrap: 'wrap', gap: space.sm`
  - Chaque carte : `width: 'calc(25% - 12px)'` desktop (via style inline ou media query workaround)

- [x] **T3 — Carte joueur `SquadCard`**
  - Composant local imbriqué
  - Avatar 40px avec couleur dynamique selon statut
  - Badge statut en bas
  - Pressable qui toggle un state local `showMenu: boolean`
  - Si `showMenu` : afficher 5 options de statut en row compacte

- [x] **T4 — Compteur global**
  - `useMemo` : calculer `presentCount`, `absentCount`, `unknownCount`
  - Afficher au-dessus de la grille en row de 3 métriques

- [x] **T5 — Tri des joueurs**
  - `useMemo` pour trier : présent + absent + late (alphabétique), puis non enregistrés (alphabétique)

- [x] **T6 — Remplacer la liste verticale**
  - Remplacer le JSX de liste par `<SquadStatusGrid>`
  - Conserver tous les states et handlers existants

- [x] **T7 — QA scan**
  - try/finally sur `onStatusChange` (handler existant)
  - Console guards
  - Vérifier que le fallback séance ponctuelle (sans groupe) reste intact

---

## Design détaillé

```
Présences (6 présents · 2 absents · 0 non enregistrés)

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   [JD]   │  │   [ML]   │  │   [TB]   │  │   [AK]   │
│ Jean D.  │  │ Marie L. │  │ Thomas B.│  │ Alex K.  │
│ ✓ Présent│  │ ✗ Absent │  │ ✓ Présent│  │ ⏱ Retard │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Remplacer liste présences par `SquadStatusGrid` |

---

## Pas de migration SQL

Cette story utilise les API existantes.

---

## Commit

```
feat(epic-54): story 54-1 — squad overview présences en grille de cartes joueurs
```
