// Story 55-7 — Orchestration génération PDF scouting
// Côté client uniquement — pas de SSR.

import type { ScoutingPDFProps } from '../components/pdf/ScoutingPDF'

/**
 * Télécharge la photo d'un joueur en base64 pour l'inclure dans le PDF.
 * Utilise fetch + FileReader pour contourner les restrictions CORS.
 * Retourne null si la photo est indisponible.
 */
async function fetchPhotoAsBase64(url: string): Promise<string | null> {
  try {
    const res  = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Génère et télécharge la fiche scouting PDF pour un joueur.
 * Appelle setGenerating(true) avant et setGenerating(false) en finally.
 * Retourne une erreur string si les données sont insuffisantes.
 */
export async function generateAndDownloadScoutingPDF(
  data: Omit<ScoutingPDFProps, 'photoBase64' | 'generatedAt'> & { photoUrl?: string | null },
  setGenerating: (v: boolean) => void,
): Promise<{ error: string | null }> {
  // Validation : bloquer si aucune évaluation
  if (data.evalCount === 0) {
    return { error: 'Pas assez d\'évaluations pour générer un scouting.' }
  }

  setGenerating(true)
  try {
    // Import dynamique pour éviter le SSR crash (react-pdf est client-only)
    const [{ pdf }, { ScoutingPDF, buildFileName }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../components/pdf/ScoutingPDF'),
    ])

    // Fetch photo en base64 (hors du try principal pour un fallback gracieux)
    const photoBase64 = data.photoUrl ? await fetchPhotoAsBase64(data.photoUrl) : null

    const props: ScoutingPDFProps = {
      ...data,
      photoBase64,
      generatedAt: new Date().toISOString(),
    }

    const blob     = await pdf(ScoutingPDF(props)).toBlob()
    const url      = window.URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = buildFileName(data.playerName)
    a.click()
    window.URL.revokeObjectURL(url)

    return { error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[generateScoutingPDF] error:', err)
    return { error: 'Erreur lors de la génération du PDF.' }
  } finally {
    setGenerating(false)
  }
}
