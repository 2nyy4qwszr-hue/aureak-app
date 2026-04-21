// Story 87.1 — Liste paginée des profils par rôle (commercial | manager | marketeur)
// Point d'accès unique pour les pages Académie de ces 3 rôles. Retourne email + avatar
// + dates ; filtres deleted/search côté Supabase pour éviter de charger toute la base.

import { supabase } from '../supabase'
import type { UserRole } from '@aureak/types'

export type ProfileRoleFilter = Extract<UserRole, 'commercial' | 'manager' | 'marketeur'>

export type ProfileListRow = {
  userId     : string
  displayName: string | null
  email      : string | null
  avatarUrl  : string | null
  createdAt  : string
  deletedAt  : string | null
}

export type ListProfilesByRoleOpts = {
  role           : ProfileRoleFilter
  page           : number
  pageSize       : number
  includeDeleted?: boolean
  deletedOnly?   : boolean
  searchText?    : string
}

/**
 * listProfilesByRole — profils d'un rôle donné, paginés + triés par display_name.
 * Filtre deleted_at IS NULL par défaut ; deletedOnly et includeDeleted inversent la logique.
 */
export async function listProfilesByRole(
  opts: ListProfilesByRoleOpts,
): Promise<{ data: ProfileListRow[]; count: number; error: unknown }> {
  try {
    let query = supabase
      .from('profiles')
      .select('user_id, display_name, email, avatar_url, created_at, deleted_at', { count: 'exact' })
      .eq('user_role', opts.role)
      .order('display_name', { ascending: true, nullsFirst: false })
      .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

    if (opts.deletedOnly) {
      query = query.not('deleted_at', 'is', null)
    } else if (!opts.includeDeleted) {
      query = query.is('deleted_at', null)
    }

    if (opts.searchText && opts.searchText.trim().length > 0) {
      query = query.ilike('display_name', `%${opts.searchText.trim()}%`)
    }

    const { data, count, error } = await query

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] listProfilesByRole error:', error)
      return { data: [], count: 0, error }
    }

    type Raw = {
      user_id     : string
      display_name: string | null
      email       : string | null
      avatar_url  : string | null
      created_at  : string
      deleted_at  : string | null
    }
    const rows: ProfileListRow[] = ((data ?? []) as Raw[]).map((r) => ({
      userId     : r.user_id,
      displayName: r.display_name,
      email      : r.email,
      avatarUrl  : r.avatar_url,
      createdAt  : r.created_at,
      deletedAt  : r.deleted_at,
    }))

    return { data: rows, count: count ?? 0, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] listProfilesByRole exception:', err)
    return { data: [], count: 0, error: err }
  }
}

// ============================================================================
// Story 87.1 — Managers avec accès étendus (≥ 1 override actif)
// ============================================================================

/**
 * countManagersWithOverrides — nombre de managers non supprimés ayant au moins
 * un override actif dans user_section_overrides. Utilisé par la stat card
 * "AVEC ACCÈS ÉTENDUS" de /academie/managers.
 */
export async function countManagersWithOverrides(): Promise<{ count: number; available: boolean; error: unknown }> {
  try {
    const { data: managers, error: mgrErr } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_role', 'manager')
      .is('deleted_at', null)

    if (mgrErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countManagersWithOverrides managers error:', mgrErr)
      return { count: 0, available: false, error: mgrErr }
    }

    const managerIds = ((managers ?? []) as { user_id: string }[]).map((m) => m.user_id)
    if (managerIds.length === 0) return { count: 0, available: true, error: null }

    const { data: overrides, error: ovErr } = await supabase
      .from('user_section_overrides')
      .select('profile_id')
      .in('profile_id', managerIds)
      .is('deleted_at', null)

    if (ovErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countManagersWithOverrides overrides error:', ovErr)
      return { count: 0, available: false, error: ovErr }
    }

    const distinctIds = new Set(((overrides ?? []) as { profile_id: string }[]).map((o) => o.profile_id))
    return { count: distinctIds.size, available: true, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countManagersWithOverrides exception:', err)
    return { count: 0, available: false, error: err }
  }
}

// ============================================================================
// Story 87.1 — Stats pipeline commerciaux (CRM Epic 85 — fallback si absent)
// ============================================================================

type CommercialStatsResult = {
  byCommercial: Record<string, number>
  total       : number
  available   : boolean
}

/**
 * La table commercial_contacts a été introduite par Epic 85. Si la migration
 * n'est pas déployée, les requêtes renvoient une erreur "relation does not exist"
 * → on renvoie available=false sans remonter l'erreur, l'UI affichera "—".
 */
function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  if (e.code === '42P01') return true
  return typeof e.message === 'string' && /relation .* does not exist/i.test(e.message)
}

/**
 * countActiveCommercialPipeline — contacts CRM en cours (non "pas_de_suite"),
 * groupés par commercial_id. Utilisé par la stat card PIPELINE EN COURS et
 * la colonne PIPELINE du tableau commerciaux.
 */
export async function countActiveCommercialPipeline(): Promise<CommercialStatsResult> {
  try {
    const { data, error } = await supabase
      .from('commercial_contacts')
      .select('commercial_id, status')
      .is('deleted_at', null)
      .neq('status', 'pas_de_suite')

    if (error) {
      if (isMissingRelationError(error)) {
        return { byCommercial: {}, total: 0, available: false }
      }
      if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countActiveCommercialPipeline error:', error)
      return { byCommercial: {}, total: 0, available: false }
    }

    const rows = (data ?? []) as { commercial_id: string }[]
    const byCommercial: Record<string, number> = {}
    for (const r of rows) {
      byCommercial[r.commercial_id] = (byCommercial[r.commercial_id] ?? 0) + 1
    }
    return { byCommercial, total: rows.length, available: true }
  } catch (err) {
    if (isMissingRelationError(err)) {
      return { byCommercial: {}, total: 0, available: false }
    }
    if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countActiveCommercialPipeline exception:', err)
    return { byCommercial: {}, total: 0, available: false }
  }
}

/**
 * countMonthlyClosedWon — contacts "en_cours" finalisés sur les 30 derniers jours.
 * Note : l'enum CommercialContactStatus n'a pas de valeur "closed_won" explicite ;
 * on utilise "en_cours" comme proxy de clôture positive (contact actif, pas rejeté).
 * Si la convention CRM évolue, cette requête sera ajustée en même temps que l'enum.
 */
export async function countMonthlyClosedWon(): Promise<CommercialStatsResult> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()

    const { data, error } = await supabase
      .from('commercial_contacts')
      .select('commercial_id')
      .is('deleted_at', null)
      .eq('status', 'en_cours')
      .gte('updated_at', thirtyDaysAgo)

    if (error) {
      if (isMissingRelationError(error)) {
        return { byCommercial: {}, total: 0, available: false }
      }
      if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countMonthlyClosedWon error:', error)
      return { byCommercial: {}, total: 0, available: false }
    }

    const rows = (data ?? []) as { commercial_id: string }[]
    const byCommercial: Record<string, number> = {}
    for (const r of rows) {
      byCommercial[r.commercial_id] = (byCommercial[r.commercial_id] ?? 0) + 1
    }
    return { byCommercial, total: rows.length, available: true }
  } catch (err) {
    if (isMissingRelationError(err)) {
      return { byCommercial: {}, total: 0, available: false }
    }
    if (process.env.NODE_ENV !== 'production') console.error('[profiles-by-role] countMonthlyClosedWon exception:', err)
    return { byCommercial: {}, total: 0, available: false }
  }
}
