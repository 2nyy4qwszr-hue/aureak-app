// Story 89.6 — tests unitaires fonction pure processTrialOutcome

import { describe, expect, it } from 'vitest'
import { processTrialOutcome } from '../admin/processTrialOutcome'

describe('processTrialOutcome', () => {
  const FIXED = '2026-04-19T10:00:00.000Z'

  it('present + currentStatus=invite → promotion en candidat', () => {
    const patch = processTrialOutcome({
      outcome      : 'present',
      at           : FIXED,
      currentStatus: 'invite',
    })
    expect(patch).toEqual({
      trialUsed     : true,
      trialOutcome  : 'present',
      trialDate     : FIXED,
      prospectStatus: 'candidat',
    })
  })

  it('present + currentStatus=contacte → promotion OK', () => {
    const patch = processTrialOutcome({
      outcome      : 'present',
      at           : FIXED,
      currentStatus: 'contacte',
    })
    expect(patch.prospectStatus).toBe('candidat')
  })

  it('present + currentStatus=null → pas de promotion (prospect hors funnel)', () => {
    const patch = processTrialOutcome({
      outcome      : 'present',
      at           : FIXED,
      currentStatus: null,
    })
    expect(patch).toEqual({
      trialUsed    : true,
      trialOutcome : 'present',
      trialDate    : FIXED,
    })
    expect('prospectStatus' in patch).toBe(false)
  })

  it('absent → pas de deuxième chance (AC #5), pas de changement de statut', () => {
    const patch = processTrialOutcome({
      outcome      : 'absent',
      at           : FIXED,
      currentStatus: 'invite',
    })
    expect(patch).toEqual({
      trialUsed    : true,
      trialOutcome : 'absent',
      trialDate    : FIXED,
    })
    expect('prospectStatus' in patch).toBe(false)
  })

  it('cancelled → trace sans promotion', () => {
    const patch = processTrialOutcome({
      outcome      : 'cancelled',
      at           : FIXED,
      currentStatus: 'invite',
    })
    expect(patch.trialUsed).toBe(true)
    expect(patch.trialOutcome).toBe('cancelled')
    expect(patch.trialDate).toBe(FIXED)
    expect('prospectStatus' in patch).toBe(false)
  })

  it("sans 'at', utilise new Date().toISOString()", () => {
    const before = Date.now()
    const patch = processTrialOutcome({ outcome: 'present', currentStatus: 'invite' })
    const parsed = Date.parse(patch.trialDate)
    expect(parsed).toBeGreaterThanOrEqual(before)
    expect(parsed).toBeLessThanOrEqual(Date.now())
  })
})
