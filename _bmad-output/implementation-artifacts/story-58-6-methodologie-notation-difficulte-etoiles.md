# Story 58-6 — Méthodologie : Notation difficulté 1–5 étoiles

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Les situations pédagogiques n'ont pas de niveau de difficulté explicite en base. Cette story ajoute une colonne `difficulty_level INT DEFAULT 3` sur `methodology_situations`, un composant de notation par étoiles dans la fiche et dans la card, et un filtre par difficulté dans la liste.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** noter la difficulté de chaque exercice de 1 à 5 étoiles et filtrer la bibliothèque par niveau,
**afin d'** adapter mes séances au niveau des joueurs et trouver rapidement des exercices appropriés.

---

## Acceptance Criteria

- [ ] AC1 — La migration `00121` ajoute `difficulty_level INT NOT NULL DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5)` sur `methodology_situations`
- [ ] AC2 — Le type TS `MethodologySituation` expose `difficultyLevel: number` (1–5)
- [ ] AC3 — L'API `mapMethodologySituation` mappe `difficulty_level → difficultyLevel` ; `createMethodologySituation` et `updateMethodologySituation` acceptent `difficultyLevel`
- [ ] AC4 — Un composant `StarRating` est créé dans `aureak/packages/ui/src/StarRating.tsx` avec props `value: number` (1–5), `onChange?: (v: number) => void` (si `undefined` = read-only), `size?: number` (défaut 18)
- [ ] AC5 — `StarRating` en mode interactif : clic sur une étoile = appel `onChange(i)` ; hover sur une étoile = preview (étoiles 1..i en or `colors.accent.gold`, étoiles i+1..5 en gris `colors.border.light`)
- [ ] AC6 — `StarRating` est exporté depuis `@aureak/ui` et utilisé dans `SituationCard` (read-only, remplace la version inline actuelle de story 58-1) et dans la fiche `situations/[situationKey]/page.tsx` (interactif)
- [ ] AC7 — Dans la fiche détail, le changement d'étoiles déclenche immédiatement `updateMethodologySituation({ difficultyLevel: v })` avec `try/finally` sur `setSavingDifficulty` et mise à jour optimiste locale
- [ ] AC8 — Dans la page liste `situations/index.tsx`, ajouter un filtre "Difficulté" : 5 boutons étoile (1★ à 5★) en mode multi-select ; la sélection filtre la grille côté client (pas de refetch)
- [ ] AC9 — Le label de difficulté est : `1 = Débutant`, `2 = Facile`, `3 = Intermédiaire`, `4 = Avancé`, `5 = Expert` — affiché en tooltip ou label sous les étoiles dans la fiche
- [ ] AC10 — `console.error` guardé ; zéro hardcode ; `try/finally` sur `setSavingDifficulty`

---

## Tasks

### T1 — Migration `00121`

Fichier : `supabase/migrations/00121_methodology_situations_difficulty.sql`

```sql
-- Story 58-6 — Niveau de difficulté sur situations pédagogiques
ALTER TABLE methodology_situations
  ADD COLUMN IF NOT EXISTS difficulty_level INT NOT NULL DEFAULT 3
    CONSTRAINT chk_difficulty_level CHECK (difficulty_level BETWEEN 1 AND 5);

COMMENT ON COLUMN methodology_situations.difficulty_level IS
  '1=Débutant 2=Facile 3=Intermédiaire 4=Avancé 5=Expert';
```

- [ ] Migration créée

### T2 — Type TS + API

Fichier : `aureak/packages/types/src/entities.ts`
Ajouter `difficultyLevel: number` dans `MethodologySituation`.

Fichier : `aureak/packages/api-client/src/methodology.ts`
- `mapMethodologySituation` : ajouter `difficultyLevel: row.difficulty_level ?? 3`
- `createMethodologySituation` / `updateMethodologySituation` : ajouter `difficultyLevel?: number` → `difficulty_level`

- [ ] Type mis à jour
- [ ] Fonctions API étendues

### T3 — Composant `StarRating`

Fichier : `aureak/packages/ui/src/StarRating.tsx` (nouveau)

```tsx
import { colors } from '@aureak/theme'

type Props = {
  value    : number        // 1–5
  onChange?: (v: number) => void
  size?    : number
}

export function StarRating({ value, onChange, size = 18 }: Props) {
  const [hovered, setHovered] = useState(0)
  const display = hovered > 0 ? hovered : value

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Pressable
          key={i}
          disabled={!onChange}
          onPress={() => onChange?.(i)}
          onHoverIn={() => setHovered(i)}
          onHoverOut={() => setHovered(0)}
        >
          <Text style={{
            fontSize : size,
            color    : i <= display ? colors.accent.gold : colors.border.light,
          }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
```

- [ ] Composant `StarRating` créé et exporté depuis `@aureak/ui`

### T4 — Constante `DIFFICULTY_LABELS`

Fichier : `aureak/packages/types/src/enums.ts`

```typescript
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Débutant',
  2: 'Facile',
  3: 'Intermédiaire',
  4: 'Avancé',
  5: 'Expert',
}
```

- [ ] Constante ajoutée et exportée

### T5 — Intégration fiche détail

Fichier : `aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx`

```typescript
const [savingDifficulty, setSavingDifficulty] = useState(false)

const handleDifficultyChange = async (v: number) => {
  setSavingDifficulty(true)
  try {
    const { error } = await updateMethodologySituation(situation.id, { difficultyLevel: v })
    if (error) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[SituationPage] difficulty save error:', error)
      return
    }
    setSituation(prev => prev ? { ...prev, difficultyLevel: v } : prev)
  } finally {
    setSavingDifficulty(false)
  }
}
```

Affichage :
```tsx
<StarRating value={situation.difficultyLevel} onChange={handleDifficultyChange} size={22} />
<AureakText variant="caption" style={{ color: colors.text.muted }}>
  {DIFFICULTY_LABELS[situation.difficultyLevel]}
</AureakText>
```

- [ ] Intégration fiche avec try/finally

### T6 — Filtre difficulté dans la liste

Fichier : `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx`

```typescript
const [filterDifficulty, setFilterDifficulty] = useState<number[]>([])

const filtered = situations.filter(s =>
  filterDifficulty.length === 0 || filterDifficulty.includes(s.difficultyLevel)
)
```

Boutons filtre : `[1,2,3,4,5].map(i => <Pressable onPress={() => toggleDifficultyFilter(i)}>★×i</Pressable>)`

- [ ] Filtre multi-select implémenté

---

## Dépendances

- Story 58-1 `done` — `SituationCard` + `MethodologySituation` — pour intégrer `StarRating` en read-only

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00121_methodology_situations_difficulty.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — `difficultyLevel` |
| `aureak/packages/types/src/enums.ts` | Modifier — `DIFFICULTY_LABELS` |
| `aureak/packages/api-client/src/methodology.ts` | Modifier — mapper + paramètre |
| `aureak/packages/ui/src/StarRating.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — export `StarRating` |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | Modifier — filtre difficulté |
| `aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx` | Modifier — notation interactive |

---

## QA post-story

```bash
grep -n "setSavingDifficulty" aureak/apps/web/app/(admin)/methodologie/situations/\[situationKey\]/page.tsx
grep -n "console\." aureak/packages/ui/src/StarRating.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-6 — méthodologie notation difficulté 1-5 étoiles + filtre liste
```
