// @aureak/api-client — Recherche unifiée pour la Command Palette (Story 51.3)
// Agrège joueurs, clubs et séances en une seule requête parallèle.

import { supabase } from '../supabase'

// ── Types de résultat bruts (internes, non exposés en tant que CommandResult) ──

export type SearchPlayerResult = {
  id         : string
  displayName: string
  currentClub: string | null
  statut     : string | null
}

export type SearchClubResult = {
  id      : string
  name    : string
  province: string | null
}

export type SearchSessionResult = {
  id         : string
  groupName  : string | null
  scheduledAt: string
  status     : string | null
}

export type UnifiedSearchResult = {
  players : SearchPlayerResult[]
  clubs   : SearchClubResult[]
  sessions: SearchSessionResult[]
}

// ── Fonction principale ────────────────────────────────────────────────────────

/**
 * Recherche unifiée : joueurs, clubs et séances correspondant à `query`.
 * Chaque catégorie retourne au maximum 5 résultats.
 * Les erreurs par catégorie sont silencieuses (ne font pas échouer les autres).
 */
export async function searchUnified(query: string): Promise<UnifiedSearchResult> {
  const q = query.trim()

  const [playersRes, clubsRes, sessionsRes] = await Promise.allSettled([
    // Joueurs — child_directory
    supabase
      .from('child_directory')
      .select('id, display_name, current_club, statut')
      .ilike('display_name', `%${q}%`)
      .is('deleted_at', null)
      .eq('actif', true)
      .limit(5),

    // Clubs — club_directory
    supabase
      .from('club_directory')
      .select('id, nom, province')
      .ilike('nom', `%${q}%`)
      .is('deleted_at', null)
      .limit(5),

    // Séances — sessions avec le nom du groupe
    supabase
      .from('sessions')
      .select('id, scheduled_at, status, groups(name)')
      .ilike('groups.name', `%${q}%`)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(5),
  ])

  const players: SearchPlayerResult[] =
    playersRes.status === 'fulfilled' && !playersRes.value.error
      ? (
          (playersRes.value.data ?? []) as {
            id: string
            display_name: string
            current_club: string | null
            statut: string | null
          }[]
        ).map(r => ({
          id         : r.id,
          displayName: r.display_name,
          currentClub: r.current_club,
          statut     : r.statut,
        }))
      : []

  const clubs: SearchClubResult[] =
    clubsRes.status === 'fulfilled' && !clubsRes.value.error
      ? (
          (clubsRes.value.data ?? []) as {
            id: string
            nom: string
            province: string | null
          }[]
        ).map(r => ({
          id      : r.id,
          name    : r.nom,
          province: r.province,
        }))
      : []

  // Les séances nécessitent un join — on filtre côté client si le join retourne null
  const sessionsRaw =
    sessionsRes.status === 'fulfilled' && !sessionsRes.value.error
      ? (sessionsRes.value.data ?? [])
      : []

  type SessionRaw = {
    id          : string
    scheduled_at: string
    status      : string | null
    // Supabase retourne un tableau pour les joins 1-N même si c'est FK
    groups      : { name: string }[] | { name: string } | null
  }

  const sessions: SearchSessionResult[] = (sessionsRaw as unknown as SessionRaw[])
    .map(r => {
      const g = Array.isArray(r.groups) ? r.groups[0] : r.groups
      return { raw: r, groupName: g?.name ?? null }
    })
    .filter(({ groupName }) => groupName?.toLowerCase().includes(q.toLowerCase()))
    .map(({ raw, groupName }) => ({
      id         : raw.id,
      groupName,
      scheduledAt: raw.scheduled_at,
      status     : raw.status,
    }))

  return { players, clubs, sessions }
}
