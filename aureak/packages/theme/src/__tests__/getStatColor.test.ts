// Tests unitaires — getStatColor / getStatColorClass / STAT_THRESHOLDS (Story 60.5)
// Vitest — mock tokens pour isolation
import { describe, it, expect } from 'vitest'

// Import direct depuis le module source (pas d'alias @aureak/theme pour éviter la config Tamagui dans tests)
import { getStatColor, getStatColorClass, STAT_THRESHOLDS } from '../statColors'

describe('getStatColor', () => {
  it('cas high : value >= thresholdHigh → colors.status.success (#10B981)', () => {
    const color = getStatColor(85, 80, 60)
    expect(color).toBe('#10B981')
  })

  it('cas medium : value >= thresholdLow && value < thresholdHigh → colors.accent.gold', () => {
    const color = getStatColor(70, 80, 60)
    expect(color).toBe('#C1AC5C')
  })

  it('cas low : value < thresholdLow → colors.status.errorStrong (#E05252)', () => {
    const color = getStatColor(50, 80, 60)
    expect(color).toBe('#E05252')
  })

  it('cas record : isRecord=true → colors.accent.gold indépendamment des seuils', () => {
    const color = getStatColor(10, 80, 60, true)
    expect(color).toBe('#C1AC5C')
  })

  it('cas limite exact thresholdHigh → high', () => {
    const color = getStatColor(80, 80, 60)
    expect(color).toBe('#10B981')
  })

  it('cas limite exact thresholdLow → medium', () => {
    const color = getStatColor(60, 80, 60)
    expect(color).toBe('#C1AC5C')
  })
})

describe('getStatColorClass', () => {
  it('cas high → stat-good', () => {
    expect(getStatColorClass(85, 80, 60)).toBe('stat-good')
  })

  it('cas medium → stat-medium', () => {
    expect(getStatColorClass(70, 80, 60)).toBe('stat-medium')
  })

  it('cas low → stat-low', () => {
    expect(getStatColorClass(50, 80, 60)).toBe('stat-low')
  })
})

describe('STAT_THRESHOLDS', () => {
  it('attendance : { high: 80, low: 60 }', () => {
    expect(STAT_THRESHOLDS.attendance).toEqual({ high: 80, low: 60 })
  })

  it('mastery : { high: 4.0, low: 3.0 }', () => {
    expect(STAT_THRESHOLDS.mastery).toEqual({ high: 4.0, low: 3.0 })
  })

  it('progression : { high: 75, low: 50 }', () => {
    expect(STAT_THRESHOLDS.progression).toEqual({ high: 75, low: 50 })
  })

  it('xp : { high: 500, low: 200 }', () => {
    expect(STAT_THRESHOLDS.xp).toEqual({ high: 500, low: 200 })
  })
})
