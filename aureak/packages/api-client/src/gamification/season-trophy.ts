// Story 59-10 — API Season Trophy : données pour le trophée visuel fin de saison
import { supabase } from '../supabase'
import type { SeasonTrophyData } from '@aureak/types'

export type { SeasonTrophyData }

/**
 * getSeasonTrophyData — récupère les données de la saison précédente terminée.
 * Retourne null si aucune saison éligible (is_current = false ET end_date < CURRENT_DATE).
 * Condition d'affichage (AC5) : une saison terminée doit exister.
 */
export async function getSeasonTrophyData(
  seasonId?: string,
): Promise<{ data: SeasonTrophyData | null; error: unknown }> {
  try {
    let query = supabase
      .from('academy_seasons')
      .select('id, label, start_date, end_date, is_current')
      .eq('is_current', false)
      .lt('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false })
      .limit(1)

    if (seasonId) {
      query = supabase
        .from('academy_seasons')
        .select('id, label, start_date, end_date, is_current')
        .eq('id', seasonId)
        .limit(1)
    }

    const { data, error } = await query

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[season-trophy] getSeasonTrophyData error:', error)
      return { data: null, error }
    }

    if (!data || data.length === 0) {
      // Aucune saison terminée — tile masquée
      return { data: null, error: null }
    }

    const season = data[0]

    // Comptage badges accordés cette saison (approximation : toute la durée de saison)
    const { count: badgeCount, error: badgeErr } = await supabase
      .from('player_badges')
      .select('id', { count: 'exact', head: true })
      .gte('awarded_at', season.start_date)
      .lte('awarded_at', season.end_date)

    if (badgeErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[season-trophy] badgeCount error:', badgeErr)
    }

    const result: SeasonTrophyData = {
      season: {
        id       : season.id,
        label    : season.label,
        startDate: season.start_date,
        endDate  : season.end_date,
      },
      badgeCount: badgeCount ?? 0,
    }

    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[season-trophy] getSeasonTrophyData exception:', err)
    return { data: null, error: err }
  }
}
