import { describe, it, expect } from 'vitest'
import { filterByAudience } from '../referentiel/filterByAudience'

const profile = { role: 'coach', ageGroup: 'U8', programs: ['golden_player'] }

describe('filterByAudience', () => {
  it('retourne tout si audience vide', () => {
    const items = [{ id: '1', targetAudience: {} }]
    expect(filterByAudience(items, profile)).toHaveLength(1)
  })

  it('filtre par rôle', () => {
    const items = [{ id: '1', targetAudience: { roles: ['admin'], age_groups: [] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })

  it('filtre par age_group', () => {
    const items = [{ id: '1', targetAudience: { roles: ['coach'], age_groups: ['U11'] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })

  it('filtre par programme', () => {
    const items = [{ id: '1', targetAudience: { roles: ['coach'], age_groups: ['U8'], programs: ['gardien_elite'] } }]
    expect(filterByAudience(items, profile)).toHaveLength(0)
  })

  it('retourne les items qui correspondent à tous les critères', () => {
    const items = [
      { id: '1', targetAudience: { roles: ['coach'], age_groups: ['U8'], programs: ['golden_player'] } },
      { id: '2', targetAudience: { roles: ['admin'], age_groups: ['U8'] } },
    ]
    expect(filterByAudience(items, profile)).toHaveLength(1)
    expect(filterByAudience(items, profile)[0].id).toBe('1')
  })

  it('retourne les items sans restriction de programme si user a le programme requis', () => {
    const items = [{ id: '1', targetAudience: { roles: ['coach'], age_groups: ['U8'], programs: ['golden_player', 'gardien_elite'] } }]
    expect(filterByAudience(items, profile)).toHaveLength(1)
  })
})
