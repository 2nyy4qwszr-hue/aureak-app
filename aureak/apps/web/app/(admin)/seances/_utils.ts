// Utilitaires partagés entre les pages de séances
import type { Session } from '@aureak/types'

/**
 * Génère un label lisible pour le contentRef d'une séance.
 * Partagé entre [sessionId]/page.tsx et [sessionId]/edit.tsx.
 */
export function contentRefLabel(session: Session): string {
  const ref = session.contentRef
  if (!ref || !('method' in ref)) return '—'
  switch (ref.method) {
    case 'goal_and_player':
      return `GP #${(ref as {globalNumber:number}).globalNumber} · ${(ref as {half:string}).half} Rep.${(ref as {repeat:number}).repeat}`
    case 'technique': {
      const r = ref as {context:string; globalNumber?:number; concept?:string; sequence:number}
      return r.context === 'academie' ? `Technique #${r.globalNumber}` : `Stage ${r.concept} · ${r.sequence}`
    }
    case 'situationnel': {
      const r = ref as {label:string; subtitle?:string; blocCode:string}
      return r.subtitle ? `${r.label} — ${r.subtitle}` : r.label
    }
    case 'decisionnel': {
      const r = ref as {blocks:Array<{title:string}>}
      return `Décisionnel · ${r.blocks.length} bloc${r.blocks.length !== 1 ? 's' : ''}`
    }
    default: return '—'
  }
}

// Constantes de planification partagées
export const TERRAINS  = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
export const HOURS     = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
export const MINUTES   = [0, 15, 30, 45]
export const DURATIONS = [45, 60, 75, 90, 105, 120]
