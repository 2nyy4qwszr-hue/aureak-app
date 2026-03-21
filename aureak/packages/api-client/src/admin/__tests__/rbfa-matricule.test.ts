// Tests unitaires — propagation matricule RBFA — Story 29-1
// Valide que le parser mappe correctement registrationNumber → matricule
// et que buildMatchedClubPayload (la vraie fonction utilisée en production) inclut le matricule.

import { describe, it, expect } from 'vitest'
import { parseRbfaClub }          from '../rbfa-parser'
import { buildMatchedClubPayload } from '../rbfa-sync'

// ── parseRbfaClub — mapping registrationNumber → matricule ───────────────────

describe('rbfa-parser — matricule mapping (Story 29-1)', () => {
  it('mappe registrationNumber en matricule quand presente', () => {
    const raw = { id: '42', clubName: 'FC Test', registrationNumber: '1234', logo: null }
    expect(parseRbfaClub(raw).matricule).toBe('1234')
  })

  it('retourne null quand registrationNumber est null', () => {
    const raw = { id: '42', clubName: 'FC Test', registrationNumber: null, logo: null }
    expect(parseRbfaClub(raw).matricule).toBeNull()
  })

  it('retourne null quand registrationNumber est undefined', () => {
    const raw = { id: '42', clubName: 'FC Test', registrationNumber: undefined, logo: null }
    expect(parseRbfaClub(raw as never).matricule).toBeNull()
  })

  it('preserve les autres champs quand matricule est present', () => {
    const raw = { id: '99', clubName: 'R. Anderlecht', registrationNumber: '5678', logo: 'https://cdn.rbfa.be/logo.png' }
    const result = parseRbfaClub(raw)
    expect(result.rbfaId).toBe('99')
    expect(result.nom).toBe('R. Anderlecht')
    expect(result.matricule).toBe('5678')
    expect(result.logoUrl).toBe('https://cdn.rbfa.be/logo.png')
  })
})

// ── buildMatchedClubPayload — fonction réelle utilisée par rbfa-sync.ts et club-match-reviews.ts ──
// Ces tests valident directement le code qui fait la mise à jour en production (AC1 & AC2).

describe('buildMatchedClubPayload — propagation matricule (Story 29-1 AC1/AC2)', () => {
  const baseCandidate = {
    rbfaId  : 'rbfa-99',
    rbfaUrl : 'https://www.rbfa.be/fr/club/99',
    logoUrl : null,
    matricule: null as string | null,
  }

  it('inclut matricule dans le payload quand le candidat en a un', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate, matricule: '1234' },
      resolvedLogoUrl: null,
      confidence     : 85,
      storagePath    : null,
    })
    expect(payload.matricule).toBe('1234')
  })

  it('n\'inclut PAS matricule quand candidat.matricule est null', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate, matricule: null },
      resolvedLogoUrl: null,
      confidence     : 85,
      storagePath    : null,
    })
    expect('matricule' in payload).toBe(false)
  })

  it('n\'inclut PAS matricule quand candidat.matricule est chaine vide', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate, matricule: '' },
      resolvedLogoUrl: null,
      confidence     : 85,
      storagePath    : null,
    })
    expect('matricule' in payload).toBe(false)
  })

  it('inclut logo_path quand storagePath est fourni', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate, matricule: '5678' },
      resolvedLogoUrl: 'https://cdn.rbfa.be/logo.png',
      confidence     : 92,
      storagePath    : 'club-logos/tenant-id/club-id/logo.webp',
    })
    expect(payload.logo_path).toBe('club-logos/tenant-id/club-id/logo.webp')
    expect(payload.matricule).toBe('5678')
    expect(payload.rbfa_status).toBe('matched')
    expect(payload.rbfa_confidence).toBe(92)
  })

  it('n\'inclut PAS logo_path quand storagePath est null', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate },
      resolvedLogoUrl: null,
      confidence     : 60,
      storagePath    : null,
    })
    expect('logo_path' in payload).toBe(false)
  })

  it('payload contient toujours les champs RBFA obligatoires', () => {
    const payload = buildMatchedClubPayload({
      candidate      : { ...baseCandidate, matricule: '0001' },
      resolvedLogoUrl: null,
      confidence     : 70,
      storagePath    : null,
    })
    expect(payload.rbfa_id).toBe('rbfa-99')
    expect(payload.rbfa_url).toBe('https://www.rbfa.be/fr/club/99')
    expect(payload.rbfa_status).toBe('matched')
    expect(payload.last_verified_at).toBeDefined()
  })
})
