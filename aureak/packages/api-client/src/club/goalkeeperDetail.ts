// Club — Données complètes de la fiche gardien
// Conformité ARCH-1 : agrège les 4 requêtes Supabase de goalkeepers/[childId]/index.tsx.

import { supabase } from '../supabase'
import type { EvaluationSignal } from '@aureak/types'

// ── Types ──────────────────────────────────────────────────────────────────────

export type GoalkeeperDetailAtt = {
  id       : string
  status   : string
  createdAt: string
  sessions : {
    id              : string
    scheduledAt     : string
    durationMinutes : number
    location        : string | null
    implantationId  : string
    implantationName: string | null
  } | null
}

export type GoalkeeperDetailEval = {
  sessionId  : string
  receptivite: EvaluationSignal
  goutEffort : EvaluationSignal
  attitude   : EvaluationSignal
  topSeance  : 'star' | 'none'
  createdAt  : string
}

export type GoalkeeperDetail = {
  displayName        : string | null
  attendances        : GoalkeeperDetailAtt[]
  evaluations        : GoalkeeperDetailEval[]
  upcomingSessionIds : string[]
}

// ── Query ──────────────────────────────────────────────────────────────────────

/**
 * Charge toutes les données de la fiche gardien en parallèle :
 * profil, présences (+ join sessions/implantations), évaluations, session_attendees.
 */
export async function getGoalkeeperDetail(
  childId: string
): Promise<{ data: GoalkeeperDetail | null; error: unknown }> {
  const [profileRes, attendRes, evalRes, saRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', childId)
      .single(),
    supabase
      .from('attendances')
      .select('id, status, created_at, sessions(id, scheduled_at, duration_minutes, location, implantation_id, implantations(name))')
      .eq('child_id', childId)
      .order('created_at', { ascending: false }),
    supabase
      .from('session_evaluations_merged')
      .select('session_id, receptivite, gout_effort, attitude, top_seance, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: false }),
    supabase
      .from('session_attendees')
      .select('session_id')
      .eq('child_id', childId),
  ])

  const error = profileRes.error ?? attendRes.error ?? evalRes.error ?? saRes.error
  if (error) return { data: null, error }

  const attendances: GoalkeeperDetailAtt[] = ((attendRes.data ?? []) as unknown[]).map((r) => {
    const row = r as {
      id: string; status: string; created_at: string
      sessions: {
        id: string; scheduled_at: string; duration_minutes: number
        location: string | null; implantation_id: string
        implantations: { name: string } | null
      } | null
    }
    return {
      id       : row.id,
      status   : row.status,
      createdAt: row.created_at,
      sessions : row.sessions ? {
        id              : row.sessions.id,
        scheduledAt     : row.sessions.scheduled_at,
        durationMinutes : row.sessions.duration_minutes,
        location        : row.sessions.location,
        implantationId  : row.sessions.implantation_id,
        implantationName: row.sessions.implantations?.name ?? null,
      } : null,
    }
  })

  const evaluations: GoalkeeperDetailEval[] = ((evalRes.data ?? []) as unknown[]).map((r) => {
    const row = r as {
      session_id: string; receptivite: string; gout_effort: string
      attitude: string; top_seance: string; created_at: string
    }
    return {
      sessionId  : row.session_id,
      receptivite: row.receptivite as EvaluationSignal,
      goutEffort : row.gout_effort as EvaluationSignal,
      attitude   : row.attitude   as EvaluationSignal,
      topSeance  : row.top_seance as 'star' | 'none',
      createdAt  : row.created_at,
    }
  })

  const upcomingSessionIds = [...new Set(
    (saRes.data ?? []).map((r: { session_id: string }) => r.session_id)
  )]

  return {
    data: {
      displayName       : (profileRes.data as { display_name: string } | null)?.display_name ?? null,
      attendances,
      evaluations,
      upcomingSessionIds,
    },
    error: null,
  }
}
