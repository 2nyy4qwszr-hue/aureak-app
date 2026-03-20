// RBFA parser — normalise les résultats bruts GraphQL en RbfaClubResult — Story 28-1

import type { RbfaClubResult } from '@aureak/types'
import type { RbfaRawClub }   from './rbfa-search'

const NO_LOGO_MARKER = 'no_logo.jpg'
const RBFA_CLUB_URL  = (id: string) => `https://www.rbfa.be/fr/club/${id}`

/**
 * Normalise un résultat brut DoSearch en RbfaClubResult.
 * - logoUrl = null si la valeur RBFA est le placeholder no_logo.jpg
 * - ville / province = null (non retournés par DoSearch)
 */
export function parseRbfaClub(raw: RbfaRawClub): RbfaClubResult {
  const hasLogo = !!raw.logo && !raw.logo.includes(NO_LOGO_MARKER)
  return {
    rbfaId   : raw.id,
    nom      : raw.clubName,
    matricule: raw.registrationNumber ?? null,
    ville    : null,      // non fourni par DoSearch
    province : null,      // non fourni par DoSearch
    logoUrl  : hasLogo ? raw.logo : null,
    rbfaUrl  : RBFA_CLUB_URL(raw.id),
  }
}

/** Normalise une liste de résultats bruts. */
export function parseRbfaClubs(raws: RbfaRawClub[]): RbfaClubResult[] {
  return raws.map(parseRbfaClub)
}
