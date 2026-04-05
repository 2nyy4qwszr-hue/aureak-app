import { describe, it, expect } from 'vitest'
import { computeImplantationHealth } from '../implantation-health'

describe('computeImplantationHealth', () => {
  it('retourne green pour 100%/100%', () => {
    expect(computeImplantationHealth(100, 100).level).toBe('green')
  })
  it('retourne red pour 0%/0%', () => {
    expect(computeImplantationHealth(0, 0).level).toBe('red')
  })
  it('seuil exact 75 → green', () => {
    // 75×0.6 + 75×0.4 = 75
    expect(computeImplantationHealth(75, 75).level).toBe('green')
  })
  it('seuil exact 50 → gold', () => {
    expect(computeImplantationHealth(50, 50).level).toBe('gold')
  })
  it('score 49 → red', () => {
    expect(computeImplantationHealth(49, 49).level).toBe('red')
  })
})
