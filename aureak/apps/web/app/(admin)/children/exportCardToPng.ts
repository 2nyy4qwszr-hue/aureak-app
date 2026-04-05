// exportCardToPng.ts — Utilitaire d'export de la carte joueur en PNG (Story 52-11)
// Utilise html2canvas pour capturer un conteneur HTML.
// Web Share API si disponible, sinon téléchargement direct.

import html2canvas from 'html2canvas'

/**
 * Capture l'élément HTML en PNG et déclenche le téléchargement ou le partage.
 * @param element   - Conteneur HTML à capturer
 * @param filename  - Nom du fichier PNG (ex: "aureak-card-DUPONT-2026-04-05.png")
 */
export async function exportCardToPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale          : 2,          // Retina quality (2×)
    useCORS        : true,       // Autorise les images cross-origin (Supabase Storage)
    backgroundColor: null,       // Fond transparent si la card l'est
    logging        : false,
  })

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('canvas.toBlob returned null'))
      },
      'image/png',
    )
  })

  const file = new File([blob], filename, { type: 'image/png' })

  // Web Share API — si disponible et compatible fichiers (mobile Chrome/Safari)
  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: 'Carte joueur AUREAK',
    })
    return
  }

  // Téléchargement direct via lien temporaire
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
