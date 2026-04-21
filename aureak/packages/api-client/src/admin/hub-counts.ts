// Story 93.2 — Compteurs par hub (Activités, Méthodologie, Académie)
// Utilisés par les NavBar pour afficher des badges de count sur chaque onglet.
// Chaque fonction fait des requêtes `count: 'exact', head: true` en parallèle via Promise.allSettled
// → l'échec d'une query ne casse pas les autres (chaque count peut être null indépendamment).

import { supabase } from '../supabase'

// =============================================================================
// Helpers internes
// =============================================================================

/** Exécute une query count et retourne le nombre ou null en cas d'erreur.
 *  Accepte un PostgrestFilterBuilder (thenable) — on le `await` pour obtenir la réponse. */
async function safeCount(
  builder: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  try {
    const res = await builder
    if (res.error) {
      if (process.env.NODE_ENV !== 'production') console.error('[hub-counts] query error:', res.error)
      return null
    }
    return res.count ?? 0
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[hub-counts] query exception:', err)
    return null
  }
}

function monthRange(): { start: string; end: string } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

// =============================================================================
// Activités
// =============================================================================

export type ActivitesCounts = {
  seances    : number | null
  presences  : number | null
  evaluations: number | null
}

export async function getActivitesCounts(opts?: {
  periodStart?: Date
  periodEnd?  : Date
}): Promise<{ data: ActivitesCounts; error: unknown }> {
  const { start, end } = (() => {
    if (opts?.periodStart && opts?.periodEnd) {
      return { start: opts.periodStart.toISOString(), end: opts.periodEnd.toISOString() }
    }
    return monthRange()
  })()

  const [seances, presences, evaluations] = await Promise.all([
    safeCount(
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', start)
        .lt('scheduled_at', end)
        .is('deleted_at', null),
    ),
    safeCount(
      supabase
        .from('attendances')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
    ),
    safeCount(
      supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end)
        .is('deleted_at', null),
    ),
  ])

  return {
    data : { seances, presences, evaluations },
    error: null,
  }
}

// =============================================================================
// Méthodologie
// =============================================================================

export type MethodologieCounts = {
  seances    : number | null   // entraînements (table methodology_sessions)
  programmes : number | null
  themes     : number | null
  situations : number | null
  evaluations: number | null   // pas de table dédiée — always null jusqu'à implémentation future
}

export async function getMethodologieCounts(): Promise<{ data: MethodologieCounts; error: unknown }> {
  const [seances, programmes, themes, situations] = await Promise.all([
    safeCount(
      supabase
        .from('methodology_sessions')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
    safeCount(
      supabase
        .from('methodology_programmes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
    safeCount(
      supabase
        .from('methodology_themes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
    safeCount(
      supabase
        .from('methodology_situations')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
  ])

  return {
    data : { seances, programmes, themes, situations, evaluations: null },
    error: null,
  }
}

// =============================================================================
// Académie
// =============================================================================

export type AcademieCounts = {
  joueurs      : number | null
  coachs       : number | null
  scouts       : number | null // toujours null — rôle scout pas dans user_role enum (Epic 89)
  managers     : number | null
  commerciaux  : number | null
  marketeurs   : number | null
  clubs        : number | null
  implantations: number | null
}

export async function getAcademieCounts(): Promise<{ data: AcademieCounts; error: unknown }> {
  const profileCount = (role: string) =>
    safeCount(
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('user_role', role)
        .is('deleted_at', null),
    )

  const [joueurs, coachs, managers, commerciaux, marketeurs, clubs, implantations] = await Promise.all([
    profileCount('child'),
    profileCount('coach'),
    profileCount('manager'),
    profileCount('commercial'),
    profileCount('marketeur'),
    safeCount(
      supabase
        .from('club_directory')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
    safeCount(
      supabase
        .from('implantations')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ),
  ])

  return {
    data: {
      joueurs,
      coachs,
      scouts: null,
      managers,
      commerciaux,
      marketeurs,
      clubs,
      implantations,
    },
    error: null,
  }
}
