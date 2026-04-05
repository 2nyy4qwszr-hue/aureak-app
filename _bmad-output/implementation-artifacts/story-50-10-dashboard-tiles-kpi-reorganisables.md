# Story 50.10 : Dashboard — Tiles KPI réorganisables

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux pouvoir réorganiser les tiles KPI du dashboard par drag & drop et que mon arrangement soit sauvegardé,
Afin de personnaliser mon dashboard selon mes priorités de gestion sans reconfiguration à chaque visite.

## Acceptance Criteria

**AC1 — Drag & drop natif fonctionnel**
- **Given** l'admin est sur le dashboard
- **When** il glisse-dépose un KPI tile vers une autre position
- **Then** les tiles se réorganisent visuellement et l'ordre est mis à jour

**AC2 — Persistance localStorage**
- **And** l'ordre est sauvegardé en `localStorage` avec la clé `aureak_kpi_order_{userId}` (ou `aureak_kpi_order` si l'userId n'est pas disponible)
- **And** au rechargement de la page, l'ordre sauvegardé est restauré
- **And** si la clé n'existe pas ou est invalide, l'ordre par défaut est utilisé

**AC3 — Feedback visuel pendant le drag**
- **And** la tile en cours de drag a `opacity: 0.5` et un `cursor: grabbing`
- **And** la zone de drop cible a un fond de surbrillance `colors.accent.goldLight` à 15% d'opacité avec une bordure pointillée `colors.accent.gold`

**AC4 — Pas de lib externe**
- **And** l'implémentation utilise uniquement les API HTML5 nativees : `draggable={true}`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd` — aucune dépendance `react-dnd`, `@dnd-kit`, `framer-motion` n'est ajoutée

**AC5 — IDs de tiles stables**
- **And** chaque KPI tile a un identifiant string stable : `'sessions'`, `'attendance'`, `'mastery'`, `'children'`, `'coaches'`, `'groups'`
- **And** le localStorage stocke un tableau de ces IDs dans l'ordre souhaité

**AC6 — Bouton "Réinitialiser"**
- **And** un bouton discret "Réinitialiser l'ordre" (taille 11, texte lien) efface le localStorage et restaure l'ordre par défaut

**AC7 — Fonctionnel sur tous les tiles existants**
- **And** les 6 KPI tiles actuels sont tous réorganisables
- **And** les tiles countdown (50-3), streak (50-6), météo (50-8) NE sont PAS réorganisables (ils ont leur propre position fixe dans le layout)

## Tasks / Subtasks

- [x] Task 1 — Définir les IDs de tiles et l'ordre par défaut (AC: #5)
  - [x] 1.1 Déclarer `type KpiTileId = 'sessions' | 'attendance' | 'mastery' | 'children' | 'coaches' | 'groups'`
  - [x] 1.2 Déclarer `const KPI_DEFAULT_ORDER: KpiTileId[] = ['children', 'attendance', 'mastery', 'sessions', 'coaches', 'groups']`

- [x] Task 2 — Gestion de l'ordre en state (AC: #2)
  - [x] 2.1 State `kpiOrder` initialisé depuis localStorage (avec fallback vers `KPI_DEFAULT_ORDER`)
  - [x] 2.2 `useEffect` sur `kpiOrder` pour écrire en localStorage (JSON.stringify)
  - [x] 2.3 Fonction `resetKpiOrder()` : vider localStorage + setState par défaut

- [x] Task 3 — Implémenter le DnD natif (AC: #1, #3, #4)
  - [x] 3.1 State `draggedId: KpiTileId | null` et `dragOverId: KpiTileId | null`
  - [x] 3.2 `handleDragStart(id)` : setDraggedId(id)
  - [x] 3.3 `handleDragOver(e, id)` : `e.preventDefault()` + setDragOverId(id)
  - [x] 3.4 `handleDrop(id)` : reorder le tableau `kpiOrder` en swappant draggedId ↔ id
  - [x] 3.5 `handleDragEnd()` : clearDraggedId + clearDragOverId

- [x] Task 4 — Wrapper `DraggableKpiCard` (AC: #1, #3)
  - [x] 4.1 Envelopper chaque `<KpiCard>` dans un `<div>` avec les handlers DnD
  - [x] 4.2 Appliquer `opacity: 0.5` quand `draggedId === tileId`
  - [x] 4.3 Appliquer la surbrillance dorée quand `dragOverId === tileId`
  - [x] 4.4 Attribut `draggable={true}` et `cursor: 'grab'`

- [x] Task 5 — Mapper l'ordre aux composants (AC: #7)
  - [x] 5.1 Rendu conditionnel via `kpiOrder.map(id => ...)` avec switch sur id
  - [x] 5.2 Tiles fixes (countdown/streak/météo) après les draggables

- [x] Task 6 — Bouton Réinitialiser (AC: #6)
  - [x] 6.1 Afficher "Réinitialiser l'ordre" en bas de la section KPI, uniquement si l'ordre diffère du défaut

- [x] Task 7 — QA scan
  - [x] 7.1 Vérifier que localStorage.getItem avec JSON.parse est entouré de try/catch
  - [x] 7.2 Vérifier que `e.preventDefault()` est bien appelé dans `onDragOver` (sinon le drop est annulé par le browser)
  - [x] 7.3 Vérifier que `draggedId` est nettoyé dans `handleDragEnd` même si pas de drop (sortie hors zone)

## Dev Notes

### Clé localStorage

```typescript
const KPI_ORDER_KEY = 'aureak_kpi_order'  // Simplifier sans userId pour l'instant
```

### Lecture du localStorage

```typescript
function loadKpiOrder(): KpiTileId[] {
  try {
    const raw = localStorage.getItem(KPI_ORDER_KEY)
    if (!raw) return KPI_DEFAULT_ORDER
    const parsed = JSON.parse(raw) as KpiTileId[]
    // Valider que tous les IDs attendus sont présents (robustesse si on ajoute des tiles)
    const isValid = KPI_DEFAULT_ORDER.every(id => parsed.includes(id))
    return isValid ? parsed : KPI_DEFAULT_ORDER
  } catch {
    return KPI_DEFAULT_ORDER
  }
}
```

### State drag & drop

```typescript
const [kpiOrder,   setKpiOrder]   = useState<KpiTileId[]>(loadKpiOrder)
const [draggedId,  setDraggedId]  = useState<KpiTileId | null>(null)
const [dragOverId, setDragOverId] = useState<KpiTileId | null>(null)

useEffect(() => {
  try {
    localStorage.setItem(KPI_ORDER_KEY, JSON.stringify(kpiOrder))
  } catch { /* quota exceeded */ }
}, [kpiOrder])

const handleDragStart = (id: KpiTileId) => setDraggedId(id)

const handleDragOver = (e: React.DragEvent, id: KpiTileId) => {
  e.preventDefault()
  if (id !== draggedId) setDragOverId(id)
}

const handleDrop = (targetId: KpiTileId) => {
  if (!draggedId || draggedId === targetId) return
  setKpiOrder(prev => {
    const next = [...prev]
    const fromIdx = next.indexOf(draggedId)
    const toIdx   = next.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return prev
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, draggedId)
    return next
  })
}

const handleDragEnd = () => {
  setDraggedId(null)
  setDragOverId(null)
}

const resetKpiOrder = () => {
  try { localStorage.removeItem(KPI_ORDER_KEY) } catch { /* ignore */ }
  setKpiOrder(KPI_DEFAULT_ORDER)
}
```

### Map de rendu des tiles

Créer une fonction qui retourne les props de chaque tile selon son ID :

```typescript
type KpiTileId = 'sessions' | 'attendance' | 'mastery' | 'children' | 'coaches' | 'groups'

const KPI_DEFAULT_ORDER: KpiTileId[] = ['sessions', 'attendance', 'mastery', 'children', 'coaches', 'groups']

function getKpiCardProps(id: KpiTileId, data: { ... }): KpiCardProps & { size: BentoSize; className: string } {
  switch (id) {
    case 'sessions':   return { label: 'Séances', value: data.totalSessions, accent: colors.accent.gold, size: 'large', className: 'bento-large', /* ... */ }
    case 'attendance': return { label: 'Présence moy.', value: data.avgAttendance != null ? `${data.avgAttendance}%` : '—', accent: rateColor(data.avgAttendance), size: 'medium', className: 'bento-medium', /* ... */ }
    // ... etc pour les 6 tiles
  }
}
```

### Wrapper DraggableKpiCard

```typescript
function DraggableKpiCard({
  id,
  draggedId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: {
  id         : KpiTileId
  draggedId  : KpiTileId | null
  dragOverId : KpiTileId | null
  onDragStart: (id: KpiTileId) => void
  onDragOver : (e: React.DragEvent, id: KpiTileId) => void
  onDrop     : (id: KpiTileId) => void
  onDragEnd  : () => void
  children   : React.ReactNode
}) {
  const isDragging  = draggedId  === id
  const isDropTarget = dragOverId === id && draggedId !== id

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={() => onDrop(id)}
      onDragEnd={onDragEnd}
      style={{
        opacity   : isDragging ? 0.5 : 1,
        cursor    : isDragging ? 'grabbing' : 'grab',
        outline   : isDropTarget ? `2px dashed ${colors.accent.gold}` : 'none',
        outlineOffset: isDropTarget ? 2 : 0,
        background : isDropTarget ? 'rgba(214,201,142,0.08)' : undefined,
        borderRadius: radius.card,
        transition : 'opacity 0.15s ease, outline 0.1s ease',
      }}
    >
      {children}
    </div>
  )
}
```

### Rendu bento avec DnD

```typescript
{/* Dans le return de DashboardPage, remplacer la grille KPI par : */}
<div className="bento-grid">
  {kpiOrder.map(id => {
    const props = getKpiCardProps(id, { totalSessions, avgAttendance, avgMastery, childrenTotal, coachesTotal, groupsTotal })
    return (
      <div key={id} className={props.className}>
        <DraggableKpiCard id={id} draggedId={draggedId} dragOverId={dragOverId}
          onDragStart={handleDragStart} onDragOver={handleDragOver}
          onDrop={handleDrop} onDragEnd={handleDragEnd}
        >
          <KpiCard {...props} />
        </DraggableKpiCard>
      </div>
    )
  })}
</div>

{/* Bouton reset si ordre différent du défaut */}
{JSON.stringify(kpiOrder) !== JSON.stringify(KPI_DEFAULT_ORDER) && (
  <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
    <button onClick={resetKpiOrder} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: colors.text.muted, textDecoration: 'underline' }}>
      Réinitialiser l'ordre
    </button>
  </div>
)}
```

### CSS à ajouter

```css
[draggable="true"] { user-select: none; }
[draggable="true"]:active { cursor: grabbing; }
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — DnD natif, `DraggableKpiCard`, `kpiOrder` state, `getKpiCardProps`, reset button
