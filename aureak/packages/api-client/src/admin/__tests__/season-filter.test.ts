// Tests unitaires — filtre saison académie — Story 31-1
// Valide la logique pure : extraction year range + condition early-return
// Note : listJoueurs (Phase 1b) n'est pas testée ici car elle requiert Supabase.
//        Ces tests couvrent le pattern critiques identifiés en code review.

import { describe, it, expect } from 'vitest'

// ── Helper répliqué depuis children/index.tsx (logic must stay in sync) ──────
// Pattern: extrait "YYYY-YYYY" depuis un label de saison arbitraire
function extractSeasonYearRange(label: string | null | undefined): string | null {
  return label?.match(/\d{4}-\d{4}/)?.[0] ?? null
}

// ── shouldReturnEmpty : reproduit la condition d'early-return du load callback ─
// Quand acadStatus === 'current-season' ET seasonYearRange === null → 0 résultats
function shouldReturnEmpty(acadStatus: string, seasonYearRange: string | null): boolean {
  return acadStatus === 'current-season' && !seasonYearRange
}

// ── extractSeasonYearRange ────────────────────────────────────────────────────

describe('extractSeasonYearRange — Story 31-1 AC1', () => {
  it('extrait "2025-2026" depuis "AK.2025-2026" (format DB avec préfixe)', () => {
    expect(extractSeasonYearRange('AK.2025-2026')).toBe('2025-2026')
  })

  it('extrait "2025-2026" depuis un label sans préfixe', () => {
    expect(extractSeasonYearRange('2025-2026')).toBe('2025-2026')
  })

  it('extrait "2024-2025" depuis "Saison 2024-2025"', () => {
    expect(extractSeasonYearRange('Saison 2024-2025')).toBe('2024-2025')
  })

  it('extrait "2023-2024" depuis "Académie 2023-2024 (active)"', () => {
    expect(extractSeasonYearRange('Académie 2023-2024 (active)')).toBe('2023-2024')
  })

  it('retourne null si label est null', () => {
    expect(extractSeasonYearRange(null)).toBeNull()
  })

  it('retourne null si label est undefined', () => {
    expect(extractSeasonYearRange(undefined)).toBeNull()
  })

  it('retourne null si le label ne contient pas de pattern YYYY-YYYY', () => {
    expect(extractSeasonYearRange('Aucune saison')).toBeNull()
  })

  it('retourne null pour une chaine vide', () => {
    expect(extractSeasonYearRange('')).toBeNull()
  })

  it('prend le PREMIER pattern YYYY-YYYY si plusieurs présents', () => {
    expect(extractSeasonYearRange('2022-2023 ou 2023-2024')).toBe('2022-2023')
  })
})

// ── shouldReturnEmpty — early-return H1 fix ───────────────────────────────────

describe('shouldReturnEmpty — fix H1 : no active season → 0 players (Story 31-1)', () => {
  it('retourne true quand current-season ET seasonYearRange null', () => {
    expect(shouldReturnEmpty('current-season', null)).toBe(true)
  })

  it('retourne false quand current-season ET seasonYearRange non-null', () => {
    expect(shouldReturnEmpty('current-season', '2025-2026')).toBe(false)
  })

  it('retourne false quand acadStatus est "all" même si seasonYearRange null', () => {
    expect(shouldReturnEmpty('all', null)).toBe(false)
  })

  it('retourne false quand acadStatus est un autre statut académie', () => {
    expect(shouldReturnEmpty('ACADÉMICIEN', null)).toBe(false)
    expect(shouldReturnEmpty('ANCIEN', null)).toBe(false)
    expect(shouldReturnEmpty('PROSPECT', '2025-2026')).toBe(false)
  })
})
