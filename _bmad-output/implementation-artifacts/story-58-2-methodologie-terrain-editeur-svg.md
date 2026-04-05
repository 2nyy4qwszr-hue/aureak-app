# Story 58-2 — Méthodologie : Éditeur terrain schématique SVG

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : low
**Effort** : L (journée complète)

---

## Contexte

Les coachs décrivent actuellement leurs exercices en texte libre. Cette story introduit un éditeur schématique SVG simple dans la fiche détail d'une situation : terrain vue du dessus avec zones marquées, cercles draggables représentant les joueurs, et flèches traçables représentant les déplacements. Le schéma est persisté en JSON dans une colonne `diagram_json` sur `methodology_situations`.

---

## User Story

**En tant que** coach Aureak,
**je veux** dessiner un schéma tactique simplifié directement dans la fiche de mon exercice,
**afin de** communiquer visuellement la disposition des joueurs et les trajectoires de déplacement sans quitter l'application.

---

## Acceptance Criteria

- [ ] AC1 — Un composant `TacticalEditor.tsx` est créé dans `aureak/apps/web/app/(admin)/methodologie/_components/` — il reçoit `value: DiagramData | null` et `onChange: (data: DiagramData) => void`
- [ ] AC2 — Le composant affiche un terrain SVG statique vue du dessus (rectangle vert foncé avec lignes de terrain blanches : ligne médiane, deux surfaces de réparation, deux points de penalty, cercle central) en taille fixe 400×280px (ratio 10:7)
- [ ] AC3 — Des **cercles draggables** représentent les joueurs : couleur blanche (équipe A) ou rouge (équipe B), diamètre 18px. L'utilisateur peut ajouter un joueur équipe A via un bouton "+ Joueur A" et équipe B via "+ Joueur B" — maximum 11 joueurs par équipe
- [ ] AC4 — Le drag des cercles est implémenté via `onMouseDown` / `onMouseMove` / `onMouseUp` (web) sans librairie externe — les coordonnées sont stockées en % du terrain (0-100 × 0-100) pour être indépendantes de la taille d'affichage
- [ ] AC5 — L'utilisateur peut tracer des **flèches** en mode "Flèche" (toggle button) : `onMouseDown` sur le terrain = origine, `onMouseUp` = destination ; une flèche SVG (`<line>` + `<marker>` `arrowhead`) est dessinée en jaune (`colors.accent.gold`)
- [ ] AC6 — Un bouton "Effacer" supprime tous les éléments (joueurs + flèches) après confirmation inline
- [ ] AC7 — Le type `DiagramData` est défini dans `@aureak/types` : `{ players: Player[], arrows: Arrow[] }` où `Player = { id, team: 'A'|'B', x: number, y: number }` et `Arrow = { id, x1, y1, x2, y2 }`
- [ ] AC8 — La colonne `diagram_json JSONB NULL` est ajoutée à `methodology_situations` via migration `00120` ; l'API `updateMethodologySituation` accepte `diagramJson` dans ses paramètres
- [ ] AC9 — Dans `methodologie/situations/[situationKey]/page.tsx`, l'éditeur est intégré en section "Schéma tactique" avec bouton "Enregistrer le schéma" déclenché manuellement (pas d'auto-save) ; `try/finally` sur `setSavingDiagram`
- [ ] AC10 — `console.error` guardé ; zéro hardcode hors des constantes SVG terrain (`FIELD_COLOR`, `LINE_COLOR`)

---

## Tasks

### T1 — Migration `00120`

Fichier : `supabase/migrations/00120_methodology_situations_diagram.sql`

```sql
-- Story 58-2 — Schéma tactique JSON sur situations pédagogiques
ALTER TABLE methodology_situations
  ADD COLUMN IF NOT EXISTS diagram_json JSONB NULL;

COMMENT ON COLUMN methodology_situations.diagram_json IS
  'Schéma tactique sérialisé (DiagramData) — joueurs + flèches en coordonnées % terrain';
```

- [ ] Migration créée

### T2 — Type `DiagramData` dans `@aureak/types`

```typescript
export type DiagramPlayer = {
  id   : string      // UUID
  team : 'A' | 'B'
  x    : number      // 0–100 (% largeur terrain)
  y    : number      // 0–100 (% hauteur terrain)
}

export type DiagramArrow = {
  id : string
  x1 : number; y1: number
  x2 : number; y2: number
}

export type DiagramData = {
  players : DiagramPlayer[]
  arrows  : DiagramArrow[]
}
```

- [ ] Types ajoutés

### T3 — Extension API `updateMethodologySituation`

Fichier : `aureak/packages/api-client/src/methodology.ts`

Ajouter `diagramJson?: DiagramData | null` dans les paramètres d'update, mapper vers `diagram_json` en base.

- [ ] API étendue

### T4 — Composant `TacticalEditor`

Fichier : `aureak/apps/web/app/(admin)/methodologie/_components/TacticalEditor.tsx` (nouveau)

Implémentation en SVG natif web via `<svg>` dans un composant React web-only.

Terrain SVG (constantes) :
```typescript
const FIELD_W     = 400
const FIELD_H     = 280
const FIELD_COLOR = '#1a472a'
const LINE_COLOR  = 'rgba(255,255,255,0.6)'
```

Terrain dessiné avec `<rect>`, `<line>`, `<circle>` SVG standard — pas de canvas.

Drag player via `useRef` pour les coordonnées en cours de drag, `useState` pour la liste finale.

- [ ] Composant `TacticalEditor` créé
- [ ] Drag & drop joueurs fonctionnel
- [ ] Tracé flèches fonctionnel
- [ ] Bouton "Effacer" avec confirmation

### T5 — Intégration dans la fiche situation

Fichier : `aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx`

Ajouter section "Schéma tactique" avec `TacticalEditor` et bouton "Enregistrer".

```typescript
const [savingDiagram, setSavingDiagram] = useState(false)

const handleSaveDiagram = async (data: DiagramData) => {
  setSavingDiagram(true)
  try {
    const { error } = await updateMethodologySituation(situation.id, { diagramJson: data })
    if (error && process.env.NODE_ENV !== 'production')
      console.error('[SituationPage] saveDiagram error:', error)
  } finally {
    setSavingDiagram(false)
  }
}
```

- [ ] Section intégrée avec try/finally

---

## Dépendances

- Epic 20 `done` — `methodology_situations` table + API existants

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00120_methodology_situations_diagram.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — `DiagramData`, `DiagramPlayer`, `DiagramArrow` |
| `aureak/packages/api-client/src/methodology.ts` | Modifier — `diagramJson` dans update |
| `aureak/apps/web/app/(admin)/methodologie/_components/TacticalEditor.tsx` | Créer |
| `aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx` | Modifier — section schéma |

---

## QA post-story

```bash
grep -n "setSavingDiagram" aureak/apps/web/app/(admin)/methodologie/situations/\[situationKey\]/page.tsx
grep -n "console\." aureak/apps/web/app/(admin)/methodologie/_components/TacticalEditor.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-2 — méthodologie éditeur terrain SVG drag & drop joueurs + flèches
```
