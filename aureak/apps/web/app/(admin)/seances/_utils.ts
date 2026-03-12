// Utilitaires partagés entre les pages de séances
import type { Session, SessionContentRef, SessionType } from '@aureak/types'
import { SESSION_TYPE_LABELS } from '@aureak/types'

/**
 * Génère un label lisible pour le contentRef d'une séance.
 * Partagé entre [sessionId]/page.tsx et [sessionId]/edit.tsx.
 */
export function contentRefLabel(session: Session): string {
  const ref = session.contentRef
  if (!ref || !('method' in ref)) return '—'
  switch (ref.method) {
    case 'goal_and_player': {
      const r = ref as { module?: number; entNumber?: number; globalNumber?: number; half?: string; repeat?: number }
      // Nouveau format (Story 21.1) : module + entNumber
      if (r.entNumber !== undefined && r.module !== undefined)
        return `GP – Module ${r.module} – ENT ${r.entNumber}`
      // Ancien format (rétrocompat) : globalNumber + half + repeat
      return `GP #${r.globalNumber} · ${r.half} Rep.${r.repeat}`
    }
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

/**
 * Génère un titre lisible pour une séance à partir de sa méthode, son contentRef et son contexte.
 * Story 21.1 — utilisé pour pré-remplir le champ `label` (éditable) dans le formulaire de création.
 *
 * Exemples de sortie :
 *   goal_and_player → "Goal & Player – Module 2 – ENT 7"
 *   technique (académie) → "Technique – Module 3 – Séquence 4"
 *   technique (stage) → "Technique Stage – Relance courte – Séq. 2"
 *   situationnel → "Situationnel – TAB-03"
 *   decisionnel (2 blocs) → "Décisionnel – 2 blocs"
 *   autres → "Perfectionnement – #5"
 */
export function generateSessionLabel(
  sessionType : SessionType | '',
  contentRef  : SessionContentRef | null,
  contextType : 'academie' | 'stage',
  trainingNumber?: number,
): string {
  if (!sessionType) return ''
  const methodLabel = SESSION_TYPE_LABELS[sessionType as SessionType] ?? sessionType

  if (!contentRef || !('method' in contentRef)) {
    return trainingNumber ? `${methodLabel} – #${trainingNumber}` : methodLabel
  }

  switch (contentRef.method) {
    case 'goal_and_player': {
      const r = contentRef as { module?: number; entNumber?: number; sequence?: number; globalNumber?: number }
      // Nouveau format (Story 21.1) : module + entNumber
      if (r.entNumber !== undefined && r.module !== undefined) {
        return `Goal & Player – Module ${r.module} – ENT ${r.entNumber}`
      }
      // Ancien format (rétrocompat) : sequence + globalNumber
      if (r.globalNumber !== undefined) {
        return `Goal & Player – #${r.globalNumber}`
      }
      return 'Goal & Player'
    }
    case 'technique': {
      const r = contentRef as { context: string; globalNumber?: number; module?: number; sequence?: number; concept?: string }
      if (r.context === 'academie') {
        const mod = r.module ?? '?'
        const seq = r.sequence ?? '?'
        return `Technique – Module ${mod} – Séquence ${seq}`
      } else {
        // r.context !== 'academie' → forcément stage : utiliser r.context, pas contextType
        const concept = r.concept ?? ''
        const seq = (contentRef as { sequence?: number }).sequence ?? 1
        return `Technique Stage – ${concept} – Séq. ${seq}`
      }
    }
    case 'situationnel': {
      const r = contentRef as { label?: string; subtitle?: string }
      const base = r.label ?? 'Situationnel'
      return r.subtitle ? `Situationnel – ${base} – ${r.subtitle}` : `Situationnel – ${base}`
    }
    case 'decisionnel': {
      const r = contentRef as { blocks: Array<{ title: string }> }
      const count = r.blocks?.filter(b => b.title.trim()).length ?? 0
      return `Décisionnel – ${count} bloc${count !== 1 ? 's' : ''}`
    }
    default: {
      const num = trainingNumber ? ` – #${trainingNumber}` : ''
      return `${methodLabel}${num}`
    }
  }
}

// Constantes de planification partagées
export const TERRAINS  = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
export const HOURS     = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
export const MINUTES   = [0, 15, 30, 45]
export const DURATIONS = [45, 60, 75, 90, 105, 120]
