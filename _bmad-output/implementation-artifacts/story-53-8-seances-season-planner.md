# Story 53-8 — Séances : Season Planner — vue mensuelle charge

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-8
- **Status** : done
- **Priority** : P3
- **Type** : Feature / Nouvelle page
- **Estimated effort** : L (6–9h)
- **Dependencies** : Story 19-4 (done — page séances existante avec navigation)

---

## User Story

**En tant qu'admin**, je veux une vue "Season Planner" dédiée affichant 5 semaines de séances sur un grid mensuel avec codes couleur de méthode et densité visuelle de charge, afin de planifier la saison d'un groupe et identifier les semaines surchargées ou creuses d'un seul coup d'œil.

---

## Contexte technique

### Fichiers à créer
- `aureak/apps/web/app/(admin)/seances/planner/page.tsx`
- `aureak/apps/web/app/(admin)/seances/planner/index.tsx` (re-export)

### Fichiers à modifier
- `aureak/apps/web/app/(admin)/seances/page.tsx` — ajouter lien "Planner" dans les actions

### API utilisée
- `listSessionsAdminView({ start, end, groupId })` — déjà existant, retourne `SessionRowAdmin[]`

---

## Acceptance Criteria

1. **AC1** — La page `/seances/planner` affiche un grid 5 colonnes (5 semaines) × N lignes de groupes, navigable par mois (nav prev/next identique à `page.tsx`).

2. **AC2** — Chaque cellule (semaine × groupe) affiche une mini barre horizontale divisée en segments colorés par `sessionType` (utilisant `TYPE_COLOR`). Si 0 séance : cellule grise avec "·". Si 1 séance : 1 segment. Si 3 séances : 3 segments.

3. **AC3** — La densité de charge est visualisée par la hauteur de la barre (1 séance = 8px, 2 = 16px, 3+ = 24px, cap à 24px) avec couleur de fond or si ≤2 séances, orange si 3, rouge si 4+.

4. **AC4** — Cliquer une cellule navigue vers `seances/page.tsx` avec la semaine et le groupe pré-filtrés (via query params ou navigation).

5. **AC5** — Un sélecteur d'implantation en haut filtre les groupes affichés (seulement les groupes de l'implantation sélectionnée).

6. **AC6** — La navigation mois précédent/suivant recherce les données via `listSessionsAdminView` avec les nouvelles bornes.

7. **AC7** — Les groupes transients (`is_transient = true`) sont exclus de la vue (non affichés).

8. **AC8** — Un état de chargement (skeleton) est affiché pendant la récupération des données. Les cellules vides s'affichent immédiatement, les données remplissent les cellules progressivement.

---

## Tasks

- [x] **T1 — Créer la structure de route**
  - `aureak/apps/web/app/(admin)/seances/planner/page.tsx` — composant principal
  - `aureak/apps/web/app/(admin)/seances/planner/index.tsx` — `export { default } from './page'`

- [x] **T2 — Calculer les 5 semaines du mois**
  - Fonction `getMonthWeeks(year: number, month: number): Date[][]` :
    - Retourne un tableau de 5 semaines (tableau de 7 dates)
    - Commence par le lundi de la semaine contenant le 1er du mois

- [x] **T3 — Charger les séances**
  - Utiliser `listSessionsAdminView({ start: monthStart, end: monthEnd, implantationId })`
  - Indexer par `groupId` + `weekStart` pour affichage rapide

- [x] **T4 — Composant `PlannerCell`**
  - Props : `{ sessions: SessionRowAdmin[]; onPress: () => void }`
  - Si `sessions.length === 0` : fond gris, point "·" centré
  - Sinon : barre colorée avec segments `TYPE_COLOR[sessionType]`
  - Indicateur de densité : fond or/orange/rouge en arrière-plan selon count

- [x] **T5 — Grid layout**
  - Header : 5 colonnes "Sem. du DD/MM" + colonne gauche = noms des groupes
  - Chaque ligne = 1 groupe, chaque cellule = 1 semaine
  - ScrollView vertical pour les groupes nombreux

- [x] **T6 — Sélecteur implantation + nav mois**
  - Réutiliser le pattern chips implantations de `page.tsx`
  - Nav prev/next avec `label: MONTHS_FR[month] year`

- [x] **T7 — Lien depuis `page.tsx`**
  - Ajouter bouton "📅 Season Planner" dans le header de `page.tsx`

- [x] **T8 — QA scan**
  - try/finally sur chargement
  - Console guards
  - `index.tsx` re-export correct

---

## Design détaillé

```
              Sem. 01/04   Sem. 08/04   Sem. 15/04   Sem. 22/04   Sem. 29/04
┌──────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ U10 Liège    │ ████ or    │ ·          │ ████ or    │ ██████ red │ ████ or    │
├──────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│ U12 Liège A  │ ·          │ ████ or    │ ████ or    │ ████ or    │ ·          │
├──────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│ U14 Namur    │ ████ or    │ ████ or    │ ·          │ ████ or    │ ████ or    │
└──────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/planner/page.tsx` | CREATE — Season Planner |
| `aureak/apps/web/app/(admin)/seances/planner/index.tsx` | CREATE — re-export |
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Ajouter lien "Season Planner" |

---

## Pas de migration SQL

Cette story utilise des API existantes.

---

## Commit

```
feat(epic-53): story 53-8 — season planner vue mensuelle charge par groupe
```
