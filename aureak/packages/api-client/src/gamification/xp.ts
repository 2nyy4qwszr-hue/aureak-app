// Story 59-1 — API XP étendu (xp_ledger + player_xp_progression)
// Story 59-3 — Leaderboard académie top 10
import { supabase } from '../supabase'
import type { XpLedgerEntry, PlayerXpSnapshot, XpEvent, LeaderboardEntry } from '@aureak/types'

// ── Barème XP (miroir de la Edge Function — lecture seule côté client) ─────────

export const XP_RATES: Record<string, number> = {
  ATTENDANCE          : 10,
  NOTE_HIGH           : 20,
  BADGE_EARNED        : 50,
  STAGE_PARTICIPATION : 30,
  SESSION_STREAK_5    : 75,
}

// ── awardXp — POST vers la Edge Function award-xp ─────────────────────────────

export async function awardXp(
  payload: XpEvent,
): Promise<{ data: { success: boolean; xpDelta: number } | null; error: unknown }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/award-xp`, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        Authorization  : `Bearer ${token}`,
      },
      body: JSON.stringify({
        child_id    : payload.childId,
        event_type  : payload.eventType,
        ref_id      : payload.refId,
        xp_override : payload.xpOverride,
        operation_id: payload.operationId,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      if (process.env.NODE_ENV !== 'production') console.error('[xp] awardXp error:', text)
      return { data: null, error: text }
    }

    const json = await res.json() as { success?: boolean; xp_delta?: number; idempotent?: boolean }
    return {
      data : { success: json.success ?? json.idempotent ?? false, xpDelta: json.xp_delta ?? 0 },
      error: null,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[xp] awardXp exception:', err)
    return { data: null, error: err }
  }
}

// ── getXpLedger — récupère les entrées xp_ledger d'un enfant ─────────────────

export async function getXpLedger(
  childId: string,
  limit = 50,
): Promise<{ data: XpLedgerEntry[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('xp_ledger')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXpLedger error:', error)
      return { data: [], error }
    }

    const entries: XpLedgerEntry[] = (data ?? []).map(r => ({
      id        : r.id,
      tenantId  : r.tenant_id,
      childId   : r.child_id,
      eventType : r.event_type,
      refId     : r.ref_id ?? null,
      xpDelta   : r.xp_delta,
      createdAt : r.created_at,
    }))

    return { data: entries, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[xp] getXpLedger exception:', err)
    return { data: [], error: err }
  }
}

// ── getXpProgression — récupère les snapshots mensuels d'un enfant ────────────

export async function getXpProgression(
  childId: string,
  limit = 12,
): Promise<{ data: PlayerXpSnapshot[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('player_xp_progression')
      .select('*')
      .eq('child_id', childId)
      .order('snapshot_month', { ascending: false })
      .limit(limit)

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXpProgression error:', error)
      return { data: [], error }
    }

    const snapshots: PlayerXpSnapshot[] = (data ?? []).map(r => ({
      id           : r.id,
      tenantId     : r.tenant_id,
      childId      : r.child_id,
      seasonId     : r.season_id ?? null,
      snapshotMonth: r.snapshot_month,
      xpTotal      : r.xp_total,
      xpDeltaMonth : r.xp_delta_month,
      levelTier    : r.level_tier,
      computedAt   : r.computed_at,
    }))

    return { data: snapshots, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[xp] getXpProgression exception:', err)
    return { data: [], error: err }
  }
}

// ── getXPLeaderboard — classement top N joueurs par XP (Story 59-3) ──────────

export async function getXPLeaderboard(
  limit = 10,
): Promise<{ data: LeaderboardEntry[]; error: unknown }> {
  try {
    const now      = new Date()
    const weekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
    const twoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // Requête principale : total XP par joueur
    const { data: totals, error: totalErr } = await supabase
      .from('xp_ledger')
      .select('child_id, xp_delta')

    if (totalErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXPLeaderboard totals error:', totalErr)
      return { data: [], error: totalErr }
    }

    // XP de cette semaine
    const { data: weekData, error: weekErr } = await supabase
      .from('xp_ledger')
      .select('child_id, xp_delta')
      .gte('created_at', weekAgo)

    if (weekErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXPLeaderboard week error:', weekErr)
      return { data: [], error: weekErr }
    }

    // XP semaine précédente (pour calcul évolution)
    const { data: prevWeekData, error: prevWeekErr } = await supabase
      .from('xp_ledger')
      .select('child_id, xp_delta')
      .gte('created_at', twoWeeks)
      .lt('created_at', weekAgo)

    if (prevWeekErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXPLeaderboard prevWeek error:', prevWeekErr)
      return { data: [], error: prevWeekErr }
    }

    // Agréger par child_id
    const totalMap    = new Map<string, number>()
    const weekMap     = new Map<string, number>()
    const prevWeekMap = new Map<string, number>()

    for (const r of totals ?? []) {
      totalMap.set(r.child_id, (totalMap.get(r.child_id) ?? 0) + r.xp_delta)
    }
    for (const r of weekData ?? []) {
      weekMap.set(r.child_id, (weekMap.get(r.child_id) ?? 0) + r.xp_delta)
    }
    for (const r of prevWeekData ?? []) {
      prevWeekMap.set(r.child_id, (prevWeekMap.get(r.child_id) ?? 0) + r.xp_delta)
    }

    // Tri par XP total DESC, top N
    const ranked = Array.from(totalMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)

    if (ranked.length === 0) return { data: [], error: null }

    const childIds = ranked.map(([id]) => id)

    // Récupérer profils
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', childIds)

    if (profileErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[xp] getXPLeaderboard profiles error:', profileErr)
      return { data: [], error: profileErr }
    }

    const profileMap = new Map(
      (profiles ?? []).map(p => [p.user_id, p]),
    )

    // Résoudre le tier de niveau
    function resolveLocalLevel(xp: number): string {
      if (xp >= 10000) return 'legend'
      if (xp >= 7000)  return 'diamond'
      if (xp >= 3500)  return 'platinum'
      if (xp >= 1500)  return 'gold'
      if (xp >= 500)   return 'silver'
      return 'bronze'
    }

    const entries: LeaderboardEntry[] = ranked.map(([childId, totalXp], idx) => {
      const profile     = profileMap.get(childId)
      const xpThisWeek  = weekMap.get(childId)     ?? 0
      const xpPrevWeek  = prevWeekMap.get(childId) ?? 0
      const evolution: 'up' | 'down' | 'stable' =
        xpThisWeek > xpPrevWeek ? 'up' :
        xpThisWeek < xpPrevWeek ? 'down' : 'stable'

      return {
        rank       : idx + 1,
        childId,
        displayName: profile?.display_name ?? 'Joueur inconnu',
        avatarUrl  : profile?.avatar_url   ?? null,
        totalXp,
        xpThisWeek,
        levelTier  : resolveLocalLevel(totalXp),
        evolution,
      }
    })

    return { data: entries, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[xp] getXPLeaderboard exception:', err)
    return { data: [], error: err }
  }
}
