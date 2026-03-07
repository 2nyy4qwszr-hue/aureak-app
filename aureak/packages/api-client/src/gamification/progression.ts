// Story 12.5 — API progression thèmes & skill cards
import { supabase } from '../supabase'

export type MasteryStatus = 'not_started' | 'in_progress' | 'acquired' | 'revalidated'

export type ThemeProgressEntry = {
  id            : string
  name          : string
  description   : string | null
  masteryStatus : MasteryStatus
  firstAcquiredAt: string | null
  reviewDue     : boolean
  skillCards    : {
    id             : string
    slug           : string
    name           : string
    rarity         : 'common' | 'rare' | 'epic' | 'legendary'
    unlock_condition: string
  }[]
}

export type SkillCardCollectionEntry = {
  id             : string
  slug           : string
  name           : string
  description    : string | null
  rarity         : 'common' | 'rare' | 'epic' | 'legendary'
  illustration_url: string | null
  theme_id       : string
  collected      : boolean
  collected_at   : string | null
}

export async function getChildThemeProgression(
  childId: string,
): Promise<ThemeProgressEntry[]> {
  const [themesResult, masteryResult, reviewResult] = await Promise.all([
    supabase
      .from('themes')
      .select('id, name, description, skill_cards(id, slug, name, rarity, unlock_condition)'),
    supabase
      .from('player_theme_mastery')
      .select('theme_id, mastery_status, first_acquired_at, last_attempt_at, review_count')
      .eq('child_id', childId),
    supabase
      .from('learning_attempts')
      .select('theme_id, review_due_at')
      .eq('child_id', childId)
      .eq('mastery_status', 'acquired')
      .is('reviewed_at', null)
      .lte('review_due_at', new Date().toISOString()),
  ])

  const masteryMap = new Map(
    (masteryResult.data ?? []).map(m => [m.theme_id, m]),
  )
  const reviewSet = new Set(
    (reviewResult.data ?? []).map(r => r.theme_id),
  )

  return (themesResult.data ?? []).map(t => ({
    id            : t.id,
    name          : t.name,
    description   : t.description ?? null,
    masteryStatus : (masteryMap.get(t.id)?.mastery_status ?? 'not_started') as MasteryStatus,
    firstAcquiredAt: masteryMap.get(t.id)?.first_acquired_at ?? null,
    reviewDue     : reviewSet.has(t.id),
    skillCards    : (t.skill_cards as ThemeProgressEntry['skillCards']) ?? [],
  }))
}

export async function getSkillCardCollection(
  childId: string,
): Promise<SkillCardCollectionEntry[]> {
  const [allCardsResult, collectedResult] = await Promise.all([
    supabase.from('skill_cards').select('*'),
    supabase.from('player_skill_cards').select('skill_card_id, collected_at').eq('child_id', childId),
  ])

  const collectedMap = new Map(
    (collectedResult.data ?? []).map(c => [c.skill_card_id, c.collected_at]),
  )

  const RARITY_ORDER: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }

  return ((allCardsResult.data ?? []) as SkillCardCollectionEntry[])
    .map(card => ({
      ...card,
      collected   : collectedMap.has(card.id),
      collected_at: collectedMap.get(card.id) ?? null,
    }))
    .sort((a, b) =>
      (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0)
    )
}
