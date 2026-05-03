// Epic 89 — Story 89.6 : Séance gratuite usage unique traçable
// API client : enregistrement de l'issue d'un essai, override admin, stats funnel.

import { supabase } from '../supabase'
import { processTrialOutcome } from './processTrialOutcome'
import type { ProspectStatus, TrialOutcome } from '@aureak/types'

// ── Enregistrement issue séance d'essai (AC #4/#5/#6) ─────────────────────────

export type RecordTrialOutcomeParams = {
  childId : string
  outcome : TrialOutcome
  /** Optionnel — défaut = now(). Utile pour backfill manuel admin. */
  at?     : string
}

/**
 * Applique le résultat d'une séance d'essai au gardien prospect :
 *   - trial_used = true
 *   - trial_date = at (ou now)
 *   - trial_outcome = outcome
 *   - prospect_status = 'candidat' si outcome='present' ET prospect dans funnel (AC #6)
 *
 * Lit d'abord le prospect_status courant pour décider si on promeut en 'candidat'
 * (cf. règles dans `processTrialOutcome`). Retourne le patch appliqué.
 */
export async function recordTrialOutcome(
  params: RecordTrialOutcomeParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 1. Lecture du statut courant (pour transition conditionnelle)
  const { data: current, error: readErr } = await supabase
    .from('child_directory')
    .select('prospect_status, trial_used')
    .eq('id', params.childId)
    .maybeSingle()

  if (readErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-usage] recordTrialOutcome read error:', readErr)
    return { ok: false, error: readErr.message }
  }
  if (!current) return { ok: false, error: 'child_not_found' }

  // 2. Calcul du patch via la fonction pure business-logic
  const patch = processTrialOutcome({
    outcome      : params.outcome,
    at           : params.at,
    currentStatus: (current.prospect_status as ProspectStatus | null) ?? null,
  })

  // 3. Snake-case pour l'update Supabase
  const payload: Record<string, unknown> = {
    trial_used   : patch.trialUsed,
    trial_outcome: patch.trialOutcome,
    trial_date   : patch.trialDate,
  }
  if (patch.prospectStatus !== undefined) {
    payload.prospect_status = patch.prospectStatus
  }

  const { error: updateErr } = await supabase
    .from('child_directory')
    .update(payload)
    .eq('id', params.childId)

  if (updateErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-usage] recordTrialOutcome update error:', updateErr)
    return { ok: false, error: updateErr.message }
  }

  return { ok: true }
}

// ── Override admin (AC #8) — remet à zéro le droit à l'essai gratuit ─────────

/**
 * Réinitialise le droit à l'essai gratuit — override admin exceptionnel.
 * (ex: enfant malade le jour de l'essai, on lui redonne sa chance.)
 *
 * Reset : trial_used=false, trial_date=null, trial_outcome=null.
 *         prospect_status inchangé — l'admin décide séparément.
 *
 * RLS : la policy UPDATE de child_directory réserve déjà les writes aux admins
 *       du tenant (via `current_user_role() IN ('admin', ...)` dans les
 *       migrations antérieures). Aucune policy spécifique n'est nécessaire
 *       pour cette opération au-delà du check admin côté app.
 */
export async function resetTrialRight(
  childId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('child_directory')
    .update({
      trial_used   : false,
      trial_date   : null,
      trial_outcome: null,
    })
    .eq('id', childId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-usage] resetTrialRight error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

// ── Funnel stats (AC #7) ──────────────────────────────────────────────────────

export type ProspectFunnelStats = {
  /** Total prospects — prospectStatus non null. */
  prospect : number
  /** Contactés — prospectStatus='contacte' ou plus avancé. */
  contacte : number
  /** Invités à la séance gratuite. */
  invite   : number
  /** Candidats (présents à l'essai, en attente d'inscription). */
  candidat : number
  /** Inscrits = Académiciens (statut 'ACADÉMICIEN' ou 'NOUVEAU_ACADÉMICIEN'). */
  inscrit  : number
  /** Essais consommés (info complémentaire — tous outcomes). */
  trialsUsed: number
  /** Essais dont outcome='absent' (fin de parcours). */
  trialsAbsent: number
}

/**
 * Compte les gardiens par étape du funnel prospection :
 *   prospect → contacté → invité → candidat → inscrit.
 *
 * Implémentation naïve (V1, AC #7) : on fait une seule requête sur
 * child_directory et on agrège côté client. À remplacer par une RPC SQL si
 * le volume devient un problème (>10k lignes).
 */
export async function getProspectFunnelStats(): Promise<ProspectFunnelStats> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('prospect_status, trial_used, trial_outcome, statut')
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[trial-usage] getProspectFunnelStats error:', error)
    throw error
  }

  const stats: ProspectFunnelStats = {
    prospect    : 0,
    contacte    : 0,
    invite      : 0,
    candidat    : 0,
    inscrit     : 0,
    trialsUsed  : 0,
    trialsAbsent: 0,
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const ps = row.prospect_status as ProspectStatus | null
    const statut = (row.statut as string | null) ?? null
    const used = row.trial_used === true
    const outcome = row.trial_outcome as TrialOutcome | null

    // Chaque statut compte AUSSI pour les étapes antérieures (funnel cumulatif)
    if (ps === 'prospect' || ps === 'contacte' || ps === 'invite' || ps === 'candidat') {
      stats.prospect += 1
    }
    if (ps === 'contacte' || ps === 'invite' || ps === 'candidat') {
      stats.contacte += 1
    }
    if (ps === 'invite' || ps === 'candidat') {
      stats.invite += 1
    }
    if (ps === 'candidat') {
      stats.candidat += 1
    }

    // Inscrit = académicien (hors prospect_status actuel — ils peuvent l'avoir été)
    if (statut === 'ACADÉMICIEN' || statut === 'NOUVEAU_ACADÉMICIEN') {
      stats.inscrit += 1
    }

    if (used) stats.trialsUsed += 1
    if (outcome === 'absent') stats.trialsAbsent += 1
  }

  return stats
}
