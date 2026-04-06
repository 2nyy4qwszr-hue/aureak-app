// Story 59-4 — API badges : listBadgeDefinitions + listPlayerBadges
import { supabase } from '../supabase'
import type { BadgeDefinition, PlayerBadge } from '@aureak/types'

// ── listBadgeDefinitions — liste toutes les définitions de badges du tenant ────

export async function listBadgeDefinitions(
  tenantId?: string,
): Promise<{ data: BadgeDefinition[]; error: unknown }> {
  try {
    let query = supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('points', { ascending: true })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] listBadgeDefinitions error:', error)
      return { data: [], error }
    }

    const badges: BadgeDefinition[] = (data ?? []).map(r => ({
      id         : r.id,
      tenantId   : r.tenant_id,
      code       : r.code,
      label      : r.label,
      description: r.description ?? null,
      iconUrl    : r.icon_url ?? null,
      points     : r.points,
      season     : r.season ?? null,
      isActive   : r.is_active,
      createdAt  : r.created_at,
    }))

    return { data: badges, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] listBadgeDefinitions exception:', err)
    return { data: [], error: err }
  }
}

// ── listPlayerBadges — liste les badges débloqués par un joueur ───────────────

export async function listPlayerBadges(
  childId: string,
): Promise<{ data: PlayerBadge[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('player_badges')
      .select('*')
      .eq('child_id', childId)
      .order('awarded_at', { ascending: false })

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] listPlayerBadges error:', error)
      return { data: [], error }
    }

    const badges: PlayerBadge[] = (data ?? []).map(r => ({
      id       : r.id,
      tenantId : r.tenant_id,
      childId  : r.child_id,
      badgeId  : r.badge_id,
      awardedAt: r.awarded_at,
      source   : r.source,
      refId    : r.ref_id ?? null,
    }))

    return { data: badges, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] listPlayerBadges exception:', err)
    return { data: [], error: err }
  }
}

// ── getAchievementDetails — fetch joueur+badge pour un INSERT Realtime (Story 59-9) ──

export type AchievementToastData = {
  playerName   : string
  badgeLabel   : string
  badgeIconUrl : string | null
}

export async function getAchievementDetails(
  childId : string,
  badgeId : string,
): Promise<{ data: AchievementToastData | null; error: unknown }> {
  try {
    const [playerResult, badgeResult] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', childId).single(),
      supabase.from('badge_definitions').select('label, icon_url').eq('id', badgeId).single(),
    ])

    if (playerResult.error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] getAchievementDetails player error:', playerResult.error)
      return { data: null, error: playerResult.error }
    }

    if (badgeResult.error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] getAchievementDetails badge error:', badgeResult.error)
      return { data: null, error: badgeResult.error }
    }

    return {
      data: {
        playerName  : playerResult.data?.display_name ?? 'Joueur',
        badgeLabel  : badgeResult.data?.label         ?? 'Badge',
        badgeIconUrl: badgeResult.data?.icon_url      ?? null,
      },
      error: null,
    }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[badges] getAchievementDetails exception:', err)
    return { data: null, error: err }
  }
}
