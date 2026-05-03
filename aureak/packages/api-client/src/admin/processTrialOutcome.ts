// Epic 89 — Story 89.6 : Logique métier pure
// Transforme un résultat de séance d'essai (present/absent/cancelled) en
// patch à appliquer sur child_directory. Pure function — aucun accès DB ici.
// L'appelant (api-client `recordTrialOutcome`) se charge du UPDATE Supabase.

import type { ProspectStatus, TrialOutcome } from '@aureak/types'

/** Patch à appliquer sur la ligne child_directory après traitement de l'essai. */
export type TrialOutcomePatch = {
  trialUsed      : true                    // toujours vrai une fois l'essai consommé
  trialOutcome   : TrialOutcome
  trialDate      : string                  // ISO 8601 (fourni par l'appelant, défaut = now)
  prospectStatus?: ProspectStatus          // maj conditionnelle (présent → 'candidat')
}

export type ProcessTrialOutcomeInput = {
  outcome         : TrialOutcome
  /** ISO 8601 — par défaut maintenant (injectable pour tests déterministes). */
  at?             : string
  /** Statut prospect actuel (pour décider d'une transition ou pas). */
  currentStatus?  : ProspectStatus | null
}

/**
 * Règles métier (Story 89.6, AC #4/#5/#6) :
 *   - present   → trial_used=true, trial_outcome='present',   prospect_status='candidat'
 *   - absent    → trial_used=true, trial_outcome='absent',    prospect_status inchangé (fin de parcours traçable — AC #5)
 *   - cancelled → trial_used=true, trial_outcome='cancelled', prospect_status inchangé
 *
 * La date `trial_date` est toujours mise à jour (= confirmation que l'essai a bien eu lieu).
 *
 * Le statut final `candidat` ne s'applique que si le prospect était déjà dans le funnel
 * (invite / contacte) — on ne veut pas faire "remonter" un gardien qui a déjà été inscrit.
 */
export function processTrialOutcome(
  input: ProcessTrialOutcomeInput,
): TrialOutcomePatch {
  const at = input.at ?? new Date().toISOString()

  if (input.outcome === 'present') {
    // Transition uniquement si le gardien est bien dans la phase d'essai (évite
    // d'écraser un statut plus avancé qu'un admin aurait déjà posé).
    const canPromote = input.currentStatus === 'invite'
                    || input.currentStatus === 'contacte'
                    || input.currentStatus === 'prospect'

    return {
      trialUsed      : true,
      trialOutcome   : 'present',
      trialDate      : at,
      ...(canPromote ? { prospectStatus: 'candidat' as ProspectStatus } : {}),
    }
  }

  // 'absent' ou 'cancelled' : on trace la consommation de l'essai sans promouvoir
  return {
    trialUsed    : true,
    trialOutcome : input.outcome,
    trialDate    : at,
  }
}
