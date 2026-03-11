// Admin — Gestion des comptes utilisateurs (profiles)
// Regroupe les fonctions de liste et de consultation de profil
// pour éviter les accès Supabase directs dans les composants (ARCH rule).

import { supabase } from '../supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRow = {
  userId      : string
  displayName : string
  email       : string | null
  phone       : string | null
  userRole    : string
  status      : string
  inviteStatus: string
  createdAt   : string
  lastSignInAt: string | null
}

export type ListUsersOpts = {
  search?    : string
  role?      : string   // 'all' ou rôle précis
  page?      : number
  pageSize?  : number
}

// ── listUsers ─────────────────────────────────────────────────────────────────

/**
 * Liste paginée des comptes actifs (deleted_at IS NULL).
 * Retourne les données et le compte total pour la pagination.
 */
export async function listUsers(
  opts: ListUsersOpts = {},
): Promise<{ data: UserRow[]; total: number; error: unknown }> {
  const { search, role, page = 0, pageSize = 30 } = opts

  let query = supabase
    .from('profiles')
    .select('user_id, display_name, email, phone, user_role, status, invite_status, created_at, last_sign_in_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (role && role !== 'all') {
    query = query.eq('user_role', role)
  }
  if (search?.trim()) {
    query = query.or(`display_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
  }

  const { data, count, error } = await query
  if (error) return { data: [], total: 0, error }

  const rows: UserRow[] = ((data ?? []) as {
    user_id: string; display_name: string; email: string | null; phone: string | null
    user_role: string; status: string; invite_status: string
    created_at: string; last_sign_in_at: string | null
  }[]).map(r => ({
    userId      : r.user_id,
    displayName : r.display_name,
    email       : r.email,
    phone       : r.phone,
    userRole    : r.user_role,
    status      : r.status,
    inviteStatus: r.invite_status,
    createdAt   : r.created_at,
    lastSignInAt: r.last_sign_in_at,
  }))

  return { data: rows, total: count ?? 0, error: null }
}

// ── getUserProfile ────────────────────────────────────────────────────────────

/**
 * Charge le profil complet d'un utilisateur par son userId.
 */
export async function getUserProfile(
  userId: string,
): Promise<{ data: UserRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, phone, user_role, status, invite_status, created_at, last_sign_in_at')
    .eq('user_id', userId)
    .single()

  if (error || !data) return { data: null, error: error ?? new Error('Not found') }

  const r = data as {
    user_id: string; display_name: string; email: string | null; phone: string | null
    user_role: string; status: string; invite_status: string
    created_at: string; last_sign_in_at: string | null
  }

  return {
    data: {
      userId      : r.user_id,
      displayName : r.display_name,
      email       : r.email,
      phone       : r.phone,
      userRole    : r.user_role,
      status      : r.status,
      inviteStatus: r.invite_status,
      createdAt   : r.created_at,
      lastSignInAt: r.last_sign_in_at,
    },
    error: null,
  }
}
