// Club — Données dashboard club
// Conformité ARCH-1 : centralise les requêtes Supabase du dashboard club
// (remplace les accès directs dans club/dashboard/index.tsx).

import { supabase } from '../supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ClubRow = {
  userId         : string
  name           : string
  clubAccessLevel: 'partner' | 'common'
  tenantId       : string
}

export type ClubAttendanceRow = {
  childId : string
  status  : string
  sessions: { scheduledAt: string; implantationId: string } | null
}

export type ClubEvalRow = {
  childId    : string
  receptivite: string
  goutEffort : string
  attitude   : string
  topSeance  : 'star' | 'none'
  createdAt  : string
}

export type ClubUpcomingSession = {
  id             : string
  scheduledAt    : string
  durationMinutes: number
  location       : string | null
  status         : string
}

// ── Queries ────────────────────────────────────────────────────────────────────

/** Récupère le club d'un utilisateur (user_id = auth.users.id pour les clubs). */
export async function getClubByUserId(
  userId: string
): Promise<{ data: ClubRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('clubs')
    .select('user_id, name, club_access_level, tenant_id')
    .eq('user_id', userId)
    .single()

  if (error || !data) return { data: null, error }
  const row = data as { user_id: string; name: string; club_access_level: 'partner' | 'common'; tenant_id: string }
  return {
    data: {
      userId         : row.user_id,
      name           : row.name,
      clubAccessLevel: row.club_access_level,
      tenantId       : row.tenant_id,
    },
    error: null,
  }
}

/** Retourne les child_ids liés à un club (table club_child_links). */
export async function listChildIdsForClub(
  clubId: string
): Promise<{ data: string[]; error: unknown }> {
  const { data, error } = await supabase
    .from('club_child_links')
    .select('child_id')
    .eq('club_id', clubId)

  if (error) return { data: [], error }
  return {
    data: (data ?? []).map((l: { child_id: string }) => l.child_id),
    error: null,
  }
}

/** Récupère toutes les présences d'une liste d'enfants. */
export async function listAttendancesForChildren(
  childIds: string[]
): Promise<{ data: ClubAttendanceRow[]; error: unknown }> {
  if (childIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('attendances')
    .select('child_id, status, sessions(scheduled_at, implantation_id)')
    .in('child_id', childIds)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error }

  const rows = ((data ?? []) as unknown[]).map((r) => {
    const row = r as {
      child_id: string; status: string
      sessions: { scheduled_at: string; implantation_id: string } | null
    }
    return {
      childId : row.child_id,
      status  : row.status,
      sessions: row.sessions
        ? { scheduledAt: row.sessions.scheduled_at, implantationId: row.sessions.implantation_id }
        : null,
    }
  })
  return { data: rows, error: null }
}

/** Récupère toutes les évaluations d'une liste d'enfants. */
export async function listEvaluationsForChildren(
  childIds: string[]
): Promise<{ data: ClubEvalRow[]; error: unknown }> {
  if (childIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('session_evaluations_merged')
    .select('child_id, receptivite, gout_effort, attitude, top_seance, created_at')
    .in('child_id', childIds)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error }

  const rows = ((data ?? []) as unknown[]).map((r) => {
    const row = r as {
      child_id: string; receptivite: string; gout_effort: string
      attitude: string; top_seance: string; created_at: string
    }
    return {
      childId    : row.child_id,
      receptivite: row.receptivite,
      goutEffort : row.gout_effort,
      attitude   : row.attitude,
      topSeance  : row.top_seance as 'star' | 'none',
      createdAt  : row.created_at,
    }
  })
  return { data: rows, error: null }
}

/** Retourne les session_ids des session_attendees pour une liste d'enfants. */
export async function listAttendeeSessionsForChildren(
  childIds: string[]
): Promise<{ data: string[]; error: unknown }> {
  if (childIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('session_attendees')
    .select('session_id')
    .in('child_id', childIds)

  if (error) return { data: [], error }
  return {
    data: [...new Set((data ?? []).map((r: { session_id: string }) => r.session_id))],
    error: null,
  }
}

/** Liste les prochaines séances pour un ensemble de session_ids. */
export async function listUpcomingSessionsForIds(
  sessionIds: string[]
): Promise<{ data: ClubUpcomingSession[]; error: unknown }> {
  if (sessionIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, location, status')
    .in('id', sessionIds)
    .gt('scheduled_at', new Date().toISOString())
    .in('status', ['planifiée', 'en_cours'])
    .order('scheduled_at', { ascending: true })

  if (error) return { data: [], error }

  const rows = ((data ?? []) as unknown[]).map((r) => {
    const row = r as {
      id: string; scheduled_at: string; duration_minutes: number
      location: string | null; status: string
    }
    return {
      id             : row.id,
      scheduledAt    : row.scheduled_at,
      durationMinutes: row.duration_minutes,
      location       : row.location,
      status         : row.status,
    }
  })
  return { data: rows, error: null }
}
