# Story 58-3 — Méthodologie : Drag d'une situation vers une séance

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : medium
**Effort** : M (demi-journée)

---

## Contexte

Actuellement, pour associer une situation pédagogique à une séance, le coach doit naviguer dans la fiche séance et y ajouter manuellement. Cette story permet de glisser une `SituationCard` depuis la bibliothèque `/methodologie/situations` directement dans le planning d'une séance ouverte, via le drag & drop HTML5 natif.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** glisser un exercice depuis la bibliothèque et le déposer sur une séance ouverte,
**afin de** construire le contenu pédagogique de façon fluide et visuelle.

---

## Acceptance Criteria

- [ ] AC1 — Chaque `SituationCard` dans `methodologie/situations/index.tsx` est draggable (`draggable={true}`, `onDragStart` transmet `{ type: 'situation', situationId: string }` via `event.dataTransfer.setData('application/json', ...)`)
- [ ] AC2 — La card en cours de drag affiche un aperçu réduit (opacité 0.7) et un curseur `grabbing`
- [ ] AC3 — Quand la page `seances/[sessionId]/` est ouverte dans un second onglet ou dans un panneau latéral, elle expose une **drop zone** visible : zone "Déposer un exercice ici" avec bordure or pulsante, hauteur 80px, fond `colors.accent.gold + '10'`
- [ ] AC4 — La drop zone est active uniquement quand un drag de type `application/json` avec `type: 'situation'` est en cours (`onDragOver` vérifie le type) — sinon elle reste invisible
- [ ] AC5 — Au `drop` sur la zone, l'appel API `addSituationToSession(sessionId, situationId)` est déclenché — cette fonction existe déjà dans `@aureak/api-client` (liaison `methodology_session_situations`) ; si elle n'existe pas, la créer
- [ ] AC6 — Après le drop réussi, la liste des situations de la séance se recharge et la situation ajoutée est mise en surbrillance (fond `colors.accent.gold + '18'`) pendant 2 secondes via `setTimeout`
- [ ] AC7 — Si la situation est déjà liée à la séance, afficher un toast ou message inline "Exercice déjà dans cette séance" (`colors.accent.red`) sans re-ajouter
- [ ] AC8 — La drop zone est également visible dans la page de création de séance `seances/new.tsx` à l'étape "Contenu" — le drag & drop fonctionne de la même façon et ajoute la situation à la liste en attente (state local pré-persist)
- [ ] AC9 — `try/finally` sur `setAddingSituation` ; `console.error` guardé
- [ ] AC10 — Sur mobile / touch, le drag & drop n'est pas disponible — à la place, un bouton "Ajouter à la séance en cours" apparaît en bas de chaque `SituationCard` si une séance est "active" (sélectionnée via un context ou query param `?sessionId=`)

---

## Tasks

### T1 — Drag start sur `SituationCard`

Fichier : `aureak/packages/ui/src/SituationCard.tsx`

Ajouter prop `draggable?: boolean` et handler `onDragStart` :
```tsx
<Pressable
  onStartShouldSetResponder={() => false}
  // web drag
  {...(draggable ? {
    draggable: true,
    onDragStart: (e: any) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type       : 'situation',
        situationId: situation.id,
      }))
      e.dataTransfer.effectAllowed = 'copy'
    },
  } : {})}
>
```

- [ ] `draggable` prop ajoutée sur `SituationCard`

### T2 — Drop zone dans `seances/[sessionId]/`

Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/index.tsx`

```typescript
const [isDragOver,     setIsDragOver]     = useState(false)
const [addingSituation, setAddingSituation] = useState(false)
const [highlightedSitId, setHighlightedSitId] = useState<string | null>(null)

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  try {
    const raw = e.dataTransfer.types.includes('application/json')
    if (raw) setIsDragOver(true)
  } catch { /* ignore */ }
}

const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragOver(false)
  const raw = e.dataTransfer.getData('application/json')
  if (!raw) return
  const payload = JSON.parse(raw)
  if (payload.type !== 'situation') return

  setAddingSituation(true)
  try {
    const { error } = await addSituationToSession(sessionId, payload.situationId)
    if (error) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[SessionPage] handleDrop error:', error)
      return
    }
    setHighlightedSitId(payload.situationId)
    setTimeout(() => setHighlightedSitId(null), 2000)
    await reloadSituations()
  } finally {
    setAddingSituation(false)
  }
}
```

Drop zone JSX :
```tsx
<View
  onDragOver={handleDragOver}
  onDragLeave={() => setIsDragOver(false)}
  onDrop={handleDrop}
  style={{
    height         : 80,
    borderWidth    : 2,
    borderStyle    : 'dashed',
    borderColor    : isDragOver ? colors.accent.gold : colors.border.goldSolid + '40',
    borderRadius   : radius.card,
    backgroundColor: isDragOver ? colors.accent.gold + '10' : 'transparent',
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : space.md,
  } as any}
>
  <AureakText variant="caption" style={{ color: colors.text.muted }}>
    {addingSituation ? 'Ajout en cours...' : 'Déposer un exercice ici'}
  </AureakText>
</View>
```

- [ ] Drop zone implémentée avec try/finally

### T3 — Fonction API `addSituationToSession` (si absente)

Fichier : `aureak/packages/api-client/src/methodology.ts`

Vérifier si `addSituationToSession(sessionId, situationId)` existe. Si non :
```typescript
export async function addSituationToSession(
  sessionId  : string,
  situationId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_situations')
    .upsert({ session_id: sessionId, situation_id: situationId }, { onConflict: 'session_id,situation_id' })
  if (error && process.env.NODE_ENV !== 'production')
    console.error('[addSituationToSession] error:', error)
  return { error }
}
```

- [ ] Fonction vérifiée ou créée

---

## Dépendances

- Story 58-1 `done` — `SituationCard` existante
- Epic 20 `done` — `methodology_session_situations` table existante

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/SituationCard.tsx` | Modifier — prop `draggable` + `onDragStart` |
| `aureak/packages/api-client/src/methodology.ts` | Modifier — `addSituationToSession` (si absent) |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/index.tsx` | Modifier — drop zone |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | Modifier — `draggable={true}` sur cards |

---

## QA post-story

```bash
grep -n "setAddingSituation" aureak/apps/web/app/(admin)/seances/\[sessionId\]/index.tsx
grep -n "console\." aureak/apps/web/app/(admin)/seances/\[sessionId\]/index.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-3 — méthodologie drag situation depuis bibliothèque vers séance
```
