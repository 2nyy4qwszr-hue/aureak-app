# Story 57-1 — Implantations : Photo drag & drop upload premium

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Story 49-6 a introduit un bouton "Changer la photo" via `input.click()`. Cette story enrichit l'expérience avec un drag & drop natif, une preview immédiate avant upload, et une compression côté client à 800px max pour limiter la taille des fichiers dans le bucket Storage.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** glisser-déposer une image directement sur la zone upload et voir un aperçu avant de confirmer,
**afin de** gagner du temps et vérifier la photo choisie avant de la publier.

---

## Acceptance Criteria

- [ ] AC1 — La zone de couverture d'une implantation (en mode édition) accepte le drag & drop : `onDragOver` empêche le comportement par défaut et affiche un état hover visuel (bordure or pulsante)
- [ ] AC2 — Au `drop`, le fichier image est extrait de `event.dataTransfer.files[0]` et envoyé au handler de compression
- [ ] AC3 — La compression client réduit l'image à 800px de large maximum (sans agrandir) via `HTMLCanvasElement` + `canvas.toBlob('image/jpeg', 0.85)` avant upload — les images inférieures à 800px ne sont pas agrandies
- [ ] AC4 — Une preview `<Image source={{ uri: previewUrl }}>` s'affiche immédiatement dans la zone de couverture dès que le fichier est sélectionné (drag & drop ou clic), avant que l'upload Storage ne soit terminé — la preview est une URL objet locale (`URL.createObjectURL`)
- [ ] AC5 — Pendant l'upload, un indicateur de progression visuel (barre fine or en bas de la zone couverture) est visible ; une fois terminé, l'indicateur disparaît et la photo DB remplace la preview locale
- [ ] AC6 — Si l'upload échoue, la preview locale est retirée et un message d'erreur inline s'affiche sous la zone (texte rouge `colors.accent.red`) ; try/finally sur `setUploadingPhoto`
- [ ] AC7 — Seuls les fichiers `image/*` sont acceptés — les autres types affichent un message d'erreur inline "Format non supporté (PNG, JPG, WebP uniquement)"
- [ ] AC8 — Le bouton "Changer la photo / + Ajouter une photo" existant (clic standard) coexiste avec le drag & drop ; les deux chemins partagent le même handler de compression et d'upload
- [ ] AC9 — Zéro hardcode de couleur ou d'espacement — tokens `@aureak/theme` uniquement
- [ ] AC10 — `console.error` guardé `process.env.NODE_ENV !== 'production'` sur tous les chemins d'erreur

---

## Tasks

### T1 — Utilitaire de compression image

Fichier : `aureak/packages/api-client/src/utils/compress-image.ts` (nouveau fichier)

```typescript
/**
 * Compresse une image côté client à maxWidth px maximum (sans agrandir).
 * Retourne un Blob JPEG à qualité 0.85.
 */
export async function compressImage(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const width  = Math.min(img.naturalWidth, maxWidth)
      const height = Math.round(img.naturalHeight * (width / img.naturalWidth))
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}
```

- [ ] Fichier `compress-image.ts` créé et exporté depuis `@aureak/api-client`

### T2 — State drag & drop + preview dans `ImplantationCard`

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

Ajouter les props suivantes sur `ImplantationCard` :
```typescript
previewUrl    : string | null          // URL objet locale (avant upload)
isDragOver    : boolean
onDragOver    : (e: DragEvent) => void
onDragLeave   : () => void
onDrop        : (e: DragEvent) => void
```

State dans la page principale :
```typescript
const [previewUrls, setPreviewUrls]   = useState<Record<string, string>>({})
const [dragOverId,  setDragOverId]    = useState<string | null>(null)
```

- [ ] State `previewUrls` et `dragOverId` ajoutés dans la page principale
- [ ] Props drag & drop passées à `ImplantationCard`

### T3 — Handler drag & drop dans la page principale

```typescript
const handleDrop = async (implId: string, e: React.DragEvent) => {
  e.preventDefault()
  setDragOverId(null)
  const file = e.dataTransfer.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    // afficher erreur inline — géré via state dédié
    return
  }
  const previewUrl = URL.createObjectURL(file)
  setPreviewUrls(prev => ({ ...prev, [implId]: previewUrl }))
  setUploadingPhoto(implId)
  try {
    const compressed = await compressImage(file)
    const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' })
    const { publicUrl, error } = await uploadImplantationPhoto(implId, compressedFile)
    if (error) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[Implantations] handleDrop upload error:', error)
      setPreviewUrls(prev => { const n = { ...prev }; delete n[implId]; return n })
      return
    }
    setImplantations(prev =>
      prev.map(i => i.id === implId ? { ...i, photoUrl: publicUrl } : i)
    )
    setPreviewUrls(prev => { const n = { ...prev }; delete n[implId]; return n })
    URL.revokeObjectURL(previewUrl)
  } finally {
    setUploadingPhoto(null)
  }
}
```

- [ ] Handler `handleDrop` implémenté avec try/finally
- [ ] `compressImage` importé depuis `@aureak/api-client`

### T4 — Indicateur de progression dans la zone couverture

Dans `ImplantationCard`, en bas de la zone coverContainer, ajouter une barre fine conditionnelle :
```tsx
{uploadingPhoto && (
  <View style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: colors.accent.gold,
    opacity: 0.9,
  }} />
)}
```

Et l'état hover drag & drop :
```tsx
{isDragOver && (
  <View style={{
    position: 'absolute', inset: 0,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    backgroundColor: colors.accent.gold + '10',
    zIndex: 10,
  } as any} />
)}
```

- [ ] Barre de progression conditionnelle implémentée
- [ ] Overlay hover drag & drop implémenté

---

## Dépendances

- Story 49-6 `done` — `uploadImplantationPhoto` + `ImplantationCard` + state `uploadingPhoto` existants

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/utils/compress-image.ts` | Créer |
| `aureak/packages/api-client/src/index.ts` | Modifier — export `compressImage` |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — drag & drop + preview + compression |

---

## QA post-story

```bash
grep -n "setUploadingPhoto(null)" aureak/apps/web/app/(admin)/implantations/index.tsx
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
grep -n "catch(() => {})" aureak/apps/web/app/(admin)/implantations/index.tsx
```

---

## Commit message cible

```
feat(epic-57): story 57-1 — implantations drag & drop photo + preview + compression 800px
```
