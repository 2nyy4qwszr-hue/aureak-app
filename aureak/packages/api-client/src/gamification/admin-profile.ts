// Story 59-8 — API Profil Admin (XP + stats activité)
import { supabase } from '../supabase'
import type { AdminProfile, AdminActivityStats } from '@aureak/types'

export type { AdminProfile, AdminActivityStats }

/** getAdminProfile — récupère le profil complet d'un admin avec XP et level */
export async function getAdminProfile(
  adminId: string,
): Promise<{ data: AdminProfile | null; error: unknown }> {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, tenant_id, display_name, avatar_url, created_at, role')
      .eq('id', adminId)
      .single()

    if (profileErr || !profile) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] getAdminProfile profile error:', profileErr)
      return { data: null, error: profileErr }
    }

    // Total XP depuis le ledger (admin accumule des XP via ses actions)
    const { data: xpRows, error: xpErr } = await supabase
      .from('xp_ledger')
      .select('xp_delta')
      .eq('child_id', adminId)

    if (xpErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] getAdminProfile xp error:', xpErr)
    }

    const totalXp = (xpRows ?? []).reduce((acc, r) => acc + (r.xp_delta ?? 0), 0)

    const result: AdminProfile = {
      id         : profile.id,
      tenantId   : profile.tenant_id,
      displayName: profile.display_name ?? 'Administrateur',
      avatarUrl  : profile.avatar_url ?? null,
      role       : 'admin',
      memberSince: profile.created_at,
      totalXp,
    }

    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] getAdminProfile exception:', err)
    return { data: null, error: err }
  }
}

/** getAdminActivityStats — KPI d'activité d'un admin */
export async function getAdminActivityStats(
  adminId: string,
): Promise<{ data: AdminActivityStats | null; error: unknown }> {
  try {
    // Séances créées
    const { count: sessionsCreated, error: sessErr } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', adminId)
      .is('deleted_at', null)

    if (sessErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] sessionsCreated error:', sessErr)
    }

    // Joueurs gérés (présences validées par l'admin — approximation : séances de l'académie)
    const { count: playersManaged, error: playerErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'child')

    if (playerErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] playersManaged error:', playerErr)
    }

    // Badges accordés (approx : entrées xp_ledger de type BADGE_EARNED toutes tenants)
    const { count: badgesAwarded, error: badgeErr } = await supabase
      .from('player_badges')
      .select('id', { count: 'exact', head: true })
      .eq('awarded_by', adminId)

    if (badgeErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] badgesAwarded error:', badgeErr)
    }

    // Évaluations validées (sessions clôturées par l'admin)
    const { count: evaluationsValidated, error: evalErr } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .not('closed_at', 'is', null)
      .eq('created_by', adminId)

    if (evalErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] evaluationsValidated error:', evalErr)
    }

    const result: AdminActivityStats = {
      sessionsCreated    : sessionsCreated    ?? 0,
      playersManaged     : playersManaged     ?? 0,
      badgesAwarded      : badgesAwarded      ?? 0,
      evaluationsValidated: evaluationsValidated ?? 0,
    }

    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] getAdminActivityStats exception:', err)
    return { data: null, error: err }
  }
}
