// Club matching — algorithme de scoring RBFA — Story 28-1 / fix 28-3
//
// Stratégie de scoring (total sur 100) :
//   matricule(55) + nomScore(max 55) — le meilleur des 4 comparateurs de nom :
//     1. Exact sur nom nettoyé (strips préfixes belges + stopwords)  → 55 pts
//     2. Containment par tokens (short ⊆ long)                       → 38 pts
//     3. Jaccard sur tokens nettoyés                            → 0-32 pts
//     4. Levenshtein ratio sur nom nettoyé                      → 0-20 pts
//
// Seuils : HIGH ≥ 55 → import auto | MEDIUM ≥ 25 → review manuelle | LOW → rejeté
// Note : ville/province ne sont PAS retournés par l'API DoSearch → ignorés.

import type { RbfaClubResult, RbfaMatchScore } from '@aureak/types'

// ── Poids ──────────────────────────────────────────────────────────────────────
const W_MATRICULE    = 55
const W_NOM_EXACT    = 55   // nom nettoyé identique
const W_NOM_CONTAINS = 38   // tous les tokens du court sont dans le long
const W_NOM_TOKEN    = 32   // Jaccard sur tokens * 32
const W_NOM_SIM      = 20   // Levenshtein ratio * 20

// ── Seuils de confiance ────────────────────────────────────────────────────────
const THRESHOLD_HIGH   = 55
const THRESHOLD_MEDIUM = 25

// ── Mots-préfixes courants dans les noms de clubs belges ──────────────────────
// Appliqués APRÈS normName() (majuscules, sans accents, sans ponctuation)
const PREFIX_TOKENS = new Set([
  'R', 'K', 'FC', 'RFC', 'KFC', 'KVC', 'RSC', 'RASC', 'RAS',
  'KV', 'SK', 'KSK', 'SV', 'VV', 'AS', 'BV', 'AV', 'DVO',
  'ROYAL', 'KONINKLIJK', 'FOOTBALL', 'SPORTING', 'RACING',
  'ATHLETIQUE', 'ATHLETIC', 'UNION', 'CERCLE', 'EXCELSIOR',
])

// Stopwords ignorés dans la comparaison par tokens
const STOP_TOKENS = new Set([
  'DE', 'DU', 'DES', 'LE', 'LA', 'LES', 'ET', 'EN',
  'VAN', 'DEN', 'DER', 'HET',
])

// ── Levenshtein ───────────────────────────────────────────────────────────────
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

// ── Normalisation ─────────────────────────────────────────────────────────────
function normName(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normMatricule(s: string | null | undefined): string {
  return (s ?? '').replace(/^0+/, '').trim()
}

/**
 * Tokenise un nom normalisé, retire les préfixes belges connus et les stopwords.
 * Ex : "RSC ANDERLECHT"   → ["ANDERLECHT"]
 *      "STANDARD DE LIEGE"→ ["STANDARD", "LIEGE"]
 *      "K V MECHELEN"     → ["MECHELEN"]
 */
function cleanTokens(normNom: string): string[] {
  const tokens = normNom.split(' ').filter(Boolean)
  // Strip les préfixes en début de liste (garde toujours au moins 1 token)
  let start = 0
  while (start < tokens.length - 1 && PREFIX_TOKENS.has(tokens[start])) {
    start++
  }
  return tokens.slice(start).filter(t => !STOP_TOKENS.has(t))
}

/** Jaccard index sur deux listes de tokens. */
function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let inter = 0
  for (const t of setA) { if (setB.has(t)) inter++ }
  const union = setA.size + setB.size - inter
  return union === 0 ? 0 : inter / union
}

/**
 * Vérifie si tous les tokens du tableau le plus court
 * sont présents dans le tableau le plus long.
 * "STANDARD LIEGE" ⊆ "STANDARD DE LIEGE" → true
 */
function tokenContains(a: string[], b: string[]): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  if (shorter.length === 0) return false
  const longerSet = new Set(longer)
  return shorter.every(t => longerSet.has(t))
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
 * @param singleResultBonus  true si ce candidat est le seul résultat RBFA — léger bonus.
 */
export function scoreCandidate(
  local    : ClubToMatch,
  candidate: RbfaClubResult,
  singleResultBonus = false,
): RbfaMatchScore {
  let matricule     = 0
  let nomExact      = 0
  let nomSimilarite = 0
  const ville    = 0
  const province = 0

  // ── Matricule ──────────────────────────────────────────────────────────────
  if (local.matricule && candidate.matricule) {
    const lm = normMatricule(local.matricule)
    const cm = normMatricule(candidate.matricule)
    if (lm && cm && lm === cm) matricule = W_MATRICULE
  }

  // ── Nom ────────────────────────────────────────────────────────────────────
  const lNorm   = normName(local.nom)
  const cNorm   = normName(candidate.nom)
  const lTokens = cleanTokens(lNorm)
  const cTokens = cleanTokens(cNorm)
  const lClean  = lTokens.join(' ')
  const cClean  = cTokens.join(' ')

  if (lClean === cClean && lClean.length > 0) {
    // 1. Exact après nettoyage des préfixes
    nomExact = W_NOM_EXACT

  } else if (tokenContains(lTokens, cTokens)) {
    // 2. Tous les tokens significatifs du plus court présents dans le plus long
    nomExact = W_NOM_CONTAINS

  } else {
    // 3. Jaccard sur tokens nettoyés
    const jacScore = Math.round(jaccard(lTokens, cTokens) * W_NOM_TOKEN)

    // 4. Levenshtein sur chaîne nettoyée (fallback)
    const maxLen = Math.max(lClean.length, cClean.length)
    const simScore = maxLen > 0
      ? Math.round((1 - levenshtein(lClean, cClean) / maxLen) * W_NOM_SIM)
      : 0

    nomSimilarite = Math.max(jacScore, simScore)
  }

  // Bonus candidat unique : aide à franchir le seuil MEDIUM pour les cas ambigus
  const bonus = (singleResultBonus && (nomExact > 0 || nomSimilarite > 10)) ? 8 : 0

  const total      = Math.min(100, matricule + nomExact + nomSimilarite + ville + province + bonus)
  const confidence = total >= THRESHOLD_HIGH ? 'high' : total >= THRESHOLD_MEDIUM ? 'medium' : 'low'

  return { total, matricule, nomExact, nomSimilarite, ville, province, confidence }
}

/**
 * Trouve le meilleur candidat RBFA parmi une liste.
 * Si un seul candidat est retourné, applique un léger bonus de confiance.
 */
export function findBestMatch(
  local     : ClubToMatch,
  candidates: RbfaClubResult[],
): { candidate: RbfaClubResult; score: RbfaMatchScore } | null {
  if (!candidates.length) return null

  const singleResult = candidates.length === 1
  let best: { candidate: RbfaClubResult; score: RbfaMatchScore } | null = null

  for (const candidate of candidates) {
    const score = scoreCandidate(local, candidate, singleResult)
    if (!best || score.total > best.score.total) {
      best = { candidate, score }
    }
  }

  return best
}
