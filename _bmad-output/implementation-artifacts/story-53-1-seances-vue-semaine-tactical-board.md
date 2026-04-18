# Story 53-1 — Séances : Vue semaine Tactical Board

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-1
- **Status** : done
- **Priority** : P1
- **Type** : Feature / UX
- **Estimated effort** : M (4–6h)
- **Dependencies** : Story 19-4 (done — page séances existante avec WeekView), Story 19-5 (done)

---

## User Story

**En tant qu'admin ou coach**, quand je consulte la liste des séances en vue semaine, je veux voir les slots colorés par méthode pédagogique organisés sur une grille jour/heure, avec la charge hebdo totale affichée en bas, afin de visualiser d'un coup d'œil la densité et la diversité pédagogique de la semaine en cours comme un vrai tableau tactique.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/_components/WeekView.tsx`
`aureak/apps/web/app/(admin)/seances/page.tsx` (ajout tab "Tactical Board")

### État actuel
`WeekView.tsx` existe et affiche les séances de la semaine sous forme de liste. Il reçoit :
- `sessions: SessionRowAdmin[]`
- `weekStart: Date`
- `coachNameMap: Map<string, string>`
- `groupMap: Map<string, string>`
- `implantMap: Map<string, string>`
- `onPress: (id: string) => void`
- `onEdit: (id: string) => void`

`SessionRowAdmin` contient : `id`, `groupId`, `sessionDate`, `startTime`, `duration`, `sessionType`, `status`, `coaches`.

### Ce qui est demandé
Une nouvelle vue semaine style "Tactical Board" : grille 7 colonnes (lun→dim) × slots horaires, avec chaque séance positionnée comme un slot coloré selon la méthode pédagogique (`sessionType`), et une barre de charge hebdo en bas.

La vue "Tactical Board" complète la vue liste existante via un **toggle de visualisation** dans WeekView (pas un tab supplémentaire dans `page.tsx`).

---

## Acceptance Criteria

1. **AC1** — La vue semaine propose un toggle "Liste / Grille" dans son header. Par défaut : mode "Grille" (Tactical Board).

2. **AC2** — La grille affiche 7 colonnes (Lun→Dim) avec la date en entête de chaque colonne. Les lignes représentent des plages horaires de 1h (7h→22h). Les séances hors plage visible sont placées dans la première ou dernière ligne.

3. **AC3** — Chaque séance est représentée par un bloc coloré selon son `sessionType` en utilisant `TYPE_COLOR` de `_components/constants.ts`. Le bloc affiche : nom du groupe (tronqué 20 car), heure de début, badge statut en bas du bloc.

4. **AC4** — Un clic sur un bloc navigue vers la fiche séance (`onPress(session.id)`).

5. **AC5** — La **barre de charge hebdo** est affichée en bas de la grille. Elle montre : nombre total de séances, durée totale en minutes, et une mini barre de progression colorée (vert ≤10 séances, orange 11–15, rouge >15).

6. **AC6** — La nav semaine précédente/suivante existante dans `page.tsx` continue de fonctionner normalement avec la vue Grille.

7. **AC7** — Si aucune séance sur la semaine, la grille est rendue vide (colonnes et horaires visibles) avec le message "Aucune séance cette semaine" centré.

8. **AC8** — Le toggle Liste/Grille est mémorisé dans `localStorage` avec la clé `aureak_weekview_mode` pour persister entre navigations.

---

## Tasks

- [x] **T1 — Lire `WeekView.tsx` existant**
  - Identifier la structure actuelle des props, le JSX, et les styles
  - Ne rien casser du mode liste existant

- [x] **T2 — Créer le composant grille**
  - Ajouter une fonction `TacticalBoardGrid` dans `WeekView.tsx`
  - Grille : `View` avec 7 colonnes `flexDirection: 'row'`
  - Plages : horaires 7h→22h, hauteur fixe 48px par heure
  - Positionnement des blocs : calculer `top` depuis `startTime`, `height` depuis `duration`

- [x] **T3 — Colorisation par méthode**
  - Importer `TYPE_COLOR` depuis `_components/constants.ts`
  - Chaque bloc = `View` avec `backgroundColor: TYPE_COLOR[session.sessionType] + '25'` + `borderLeftWidth: 3, borderLeftColor: TYPE_COLOR[session.sessionType]`

- [x] **T4 — Barre de charge hebdo**
  - Calculer : `totalSessions`, `totalMinutes = sessions.reduce(sum duration)`
  - Couleur : vert (#10B981) si ≤10, orange (#F59E0B) si 11–15, rouge (#EF4444) si >15
  - Afficher dans un `View` en bas de grille : label + barre progress + chiffres

- [x] **T5 — Toggle Liste/Grille**
  - `useState<'list' | 'grid'>` initialisé depuis `localStorage.getItem('aureak_weekview_mode') ?? 'grid'`
  - Deux boutons dans le header de WeekView
  - `useEffect` pour persister dans localStorage au changement

- [x] **T6 — QA scan**
  - Aucune couleur hardcodée (utiliser tokens `colors.*` sauf les couleurs de charge calculées)
  - Console guards sur tout catch
  - Aucun `try/finally` manquant (pas d'appels API dans ce composant — pas applicable)

---

## Design détaillé

### Tactical Board layout
```
┌─────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│     │  Lun 07   │  Mar 08   │  Mer 09   │  Jeu 10   │  Ven 11   │  Sam 12   │  Dim 13   │
├─────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ 8h  │           │           │           │           │           │           │           │
├─────┤           │ [U12 Tec] │           │           │           │           │           │
│ 9h  │ [U10 G&P] │           │           │ [U14 Sit] │           │ [U8 Tec]  │           │
├─────┤           │           │           │           │           │           │           │
│10h  │           │           │           │           │           │           │           │
└─────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Charge hebdo  ████████░░  4 séances · 360 min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/_components/WeekView.tsx` | Ajouter mode grille + toggle + barre de charge |

---

## Pas de migration SQL

Cette story est 100% front-end. Aucune table ni API nouvelle.

---

## Commit

```
feat(epic-53): story 53-1 — vue semaine Tactical Board avec slots colorés et charge hebdo
```
