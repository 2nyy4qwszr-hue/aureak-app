# Story 52-11 — Export card joueur PNG

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P3
**Dépend de** : story-52-1 (PlayerCard), story-52-6 (header fiche)

---

## Story

En tant qu'admin, je veux pouvoir exporter la carte joueur FUT-style en PNG via un bouton "Partager", afin de partager visuellement le profil d'un joueur sur les réseaux sociaux ou en communication interne.

---

## Acceptance Criteria

1. **AC1 — Bouton Partager** : Un bouton `Partager ↗` est positionné dans le header de la fiche joueur (`children/[childId]/page.tsx`), à côté du bouton retour. Visible uniquement sur Platform web (`Platform.OS === 'web'`).

2. **AC2 — Génération PNG** : Le clic sur "Partager" utilise l'API `html2canvas` ou `dom-to-image` pour capturer un conteneur HTML dédié (rendu hors écran) représentant la PlayerCard avec les données du joueur. L'image résultante est 320×440px (2× de la card 160×220px pour qualité écran Retina).

3. **AC3 — Contenu de la card export** : La card exportée contient :
   - Photo ou avatar initiales (80×80px)
   - Nom complet
   - Badge tier
   - Les 6 stats (PLO/TIR/TEC/TAC/PHY/MEN) en ligne basse
   - Logo Aureak en bas à droite (si SVG logo disponible, sinon texte "AUREAK" en gold)
   - Fond visuel correspondant au tier

4. **AC4 — Téléchargement direct** : Si `navigator.share` n'est pas disponible, l'image est téléchargée directement via un lien `<a download="joueur-{nom}.png">`. Nom de fichier : `aureak-card-{displayName}-{date}.png`.

5. **AC5 — Web Share API** : Si `navigator.share` est disponible (mobile Chrome/Safari), utiliser `navigator.share({ files: [pngFile], title: 'Carte joueur AUREAK' })`.

6. **AC6 — Loading state** : Pendant la génération du PNG (opération asynchrone), le bouton affiche un spinner et est désactivé. `try/finally` obligatoire sur le state `isExporting`.

7. **AC7 — Util séparé** : La logique de capture est dans `aureak/apps/web/app/(admin)/children/exportCardToPng.ts` (fonction pure `exportCardToPng(element: HTMLElement, filename: string): Promise<void>`).

---

## Tasks

- [x] **T1** — Installer `html2canvas` dans `aureak/apps/web` (ou vérifier si déjà présent) :
  ```bash
  cd aureak && npm install html2canvas --workspace=apps/web
  ```
  Alternative sans installation : utiliser l'API Canvas native via `OffscreenCanvas` si compatible.

- [x] **T2** — Créer `aureak/apps/web/app/(admin)/children/exportCardToPng.ts` :
  ```ts
  import html2canvas from 'html2canvas'

  export async function exportCardToPng(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null })
    const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'))
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename)] })) {
      await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })], title: 'Carte joueur AUREAK' })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  ```

- [x] **T3** — Dans `children/[childId]/page.tsx`, créer un conteneur `ref` dédié à la capture :
  ```tsx
  const cardExportRef = useRef<View>(null)
  ```
  Le conteneur doit contenir un `PlayerCard`-like composant avec les données du joueur, rendu hors-écran (opacity 0, position absolute, pointerEvents none).

- [x] **T4** — Ajouter le bouton Partager dans le header :
  ```tsx
  {Platform.OS === 'web' && (
    <Pressable onPress={handleExport} disabled={isExporting} style={styles.shareBtn}>
      <AureakText>{isExporting ? '...' : 'Partager ↗'}</AureakText>
    </Pressable>
  )}
  ```

- [x] **T5** — Implémenter `handleExport` :
  ```ts
  const [isExporting, setIsExporting] = useState(false)
  async function handleExport() {
    setIsExporting(true)
    try {
      const el = (cardExportRef.current as unknown as { _nativeTag?: number } & { getDOMNode?: () => HTMLElement }).getDOMNode?.()
      if (!el) return
      const filename = `aureak-card-${joueur.displayName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`
      await exportCardToPng(el, filename)
    } finally {
      setIsExporting(false)
    }
  }
  ```

- [x] **T6** — QA : try/finally présent sur `isExporting`. Console guard sur toute erreur de capture.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/exportCardToPng.ts` | Créer |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — bouton Partager + export |

---

## Notes techniques

- `html2canvas` capture le DOM HTML en canvas. Les styles inline React Native for Web sont généralement compatibles.
- `useCORS: true` est nécessaire si les images de joueurs sont hébergées sur un domaine Supabase Storage différent.
- Le conteneur de capture off-screen doit être rendu dans le DOM (opacity 0, not display none) pour que html2canvas puisse le capturer.
- Ajouter `html2canvas` aux `devDependencies` si utilisé uniquement côté web admin.
- Vérifier les Content Security Policy headers Supabase si les CORS posent problème sur les images.
