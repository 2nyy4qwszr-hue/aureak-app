// Club matching — algorithme de scoring RBFA — Story 28-1
// Score total sur 100 : matricule(60) + nomExact(20) + nomSimilarité(0-12) + ville(5) + province(3)

import type { RbfaClubResult, RbfaMatchScore } from '@aureak/types'

// ── Poids ──────────────────────────────────────────────────────────────────────
const W_MATRICULE      = 60
const W_NOM_EXACT      = 20
const W_NOM_SIMILARITE = 12   // max attribuable si nom non exact
const W_VILLE          = 5
const W_PROVINCE       = 3

// ── Seuils de confiance ────────────────────────────────────────────────────────
const THRESHOLD_HIGH   = 75
const THRESHOLD_MEDIUM = 40

// ── Levenshtein (pure, sans dépendance externe) ────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarityRatio(a: string, b: string): number {
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen
}

// ── Normalisation ──────────────────────────────────────────────────────────────
function normName(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^A-Z0-9 ]/g, ' ')      // non-alphanum → espace
    .replace(/\s+/g, ' ')
    .trim()
}

function normMatricule(s: string | null | undefined): string {
  return (s ?? '').replace(/^0+/, '').trim()  // strip zéros de tête
}

// ── Types ──────────────────────────────────────────────────────────────────────
export type ClubToMatch = {
  nom      : string
  matricule: string | null | undefined
  ville    : string | null | undefined
  province : string | null | undefined
}

// ── Scoring ────────────────────────────────────────────────────────────────────

/**
 * Calcule le score de matching entre un club local et un candidat RBFA.
 * Retourne un RbfaMatchScore avec le total normalisé 0–100.
 */
export function scoreCandidate(local: ClubToMatch, candidate: RbfaClubResult): RbfaMatchScore {
  let matricule     = 0
  let nomExact      = 0
  let nomSimilarite = 0
  let ville         = 0
  let province      = 0

  // Matricule
  if (local.matricule && candidate.matricule) {
    const lm = normMatricule(local.matricule)
    const cm = normMatricule(candidate.matricule)
    if (lm && cm && lm === cm) matricule = W_MATRICULE
  }

  // Nom
  const lNom = normName(local.nom)
  const cNom = normName(candidate.nom)
  if (lNom === cNom) {
    nomExact = W_NOM_EXACT
  } else {
    nomSimilarite = Math.round(similarityRatio(lNom, cNom) * W_NOM_SIMILARITE)
  }

  // Ville
  if (local.ville && candidate.ville) {
    const lV = normName(local.ville)
    const cV = normName(candidate.ville)
    if (lV && cV && lV === cV) ville = W_VILLE
  }

  // Province
  if (local.province && candidate.province) {
    const lP = normName(local.province)
    const cP = normName(candidate.province)
    if (lP && cP && (lP === cP || cP.includes(lP) || lP.includes(cP))) province = W_PROVINCE
  }

  const total      = Math.min(100, matricule + nomExact + nomSimilarite + ville + province)
  const confidence = total >= THRESHOLD_HIGH ? 'high' : total >= THRESHOLD_MEDIUM ? 'medium' : 'low'

  return { total, matricule, nomExact, nomSimilarite, ville, province, confidence }
}

/**
 * Trouve le meilleur candidat RBFA parmi une liste.
 * Retourne null si aucun candidat n'est disponible.
 */
export function findBestMatch(
  local     : ClubToMatch,
  candidates: RbfaClubResult[],
): { candidate: RbfaClubResult; score: RbfaMatchScore } | null {
  if (!candidates.length) return null

  let best: { candidate: RbfaClubResult; score: RbfaMatchScore } | null = null

  for (const candidate of candidates) {
    const score = scoreCandidate(local, candidate)
    if (!best || score.total > best.score.total) {
      best = { candidate, score }
    }
  }

  return best
}
