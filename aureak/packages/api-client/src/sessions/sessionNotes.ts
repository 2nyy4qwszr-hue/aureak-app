// Sessions — Notes par joueur pour la page notes coach (ARCH-1)
// Consolide les 3 requêtes directes de coach/sessions/[sessionId]/notes/index.tsx

import { supabase } from '../supabase'

export type SessionAttendeeWithNote = {
  childId    : string
  isGuest    : boolean
  coachNotes : string | null
  displayName: string
}

/**
 * Charge les participants d'une séance avec leurs notes coach et leur nom d'affichage.
 * Résout les noms via `profiles` (joueurs auth) et `child_directory` (invités).
 */
export async function listSessionAttendeesWithNotes(
  sessionId: string,
): Promise<{ data: SessionAttendeeWithNote[]; error: unknown }> {
  const { data: attendees, error: attError } = await supabase
    .from('session_attendees')
    .select('child_id, is_guest, coach_notes')
    .eq('session_id', sessionId)

  if (attError || !attendees || attendees.length === 0) {
    return { data: [], error: attError ?? null }
  }

  const rows = attendees as { child_id: string; is_guest: boolean; coach_notes: string | null }[]
  const allIds    = rows.map(r => r.child_id)
  const guestSet  = new Set(rows.filter(r => r.is_guest).map(r => r.child_id))
  const regularIds = allIds.filter(id => !guestSet.has(id))

  // Résolution des noms en parallèle
  const [profilesRes, dirRes] = await Promise.all([
    regularIds.length > 0
      ? supabase.from('profiles').select('user_id, display_name').in('user_id', regularIds)
      : Promise.resolve({ data: [] as { user_id: string; display_name: string }[], error: null }),
    guestSet.size > 0
      ? supabase.from('child_directory').select('id, display_name').in('id', [...guestSet])
      : Promise.resolve({ data: [] as { id: string; display_name: string }[], error: null }),
  ])

  const nameMap = new Map<string, string>([
    ...((profilesRes.data ?? []) as { user_id: string; display_name: string }[])
      .map(p => [p.user_id, p.display_name] as [string, string]),
    ...((dirRes.data ?? []) as { id: string; display_name: string }[])
      .map(d => [d.id, d.display_name] as [string, string]),
  ])

  return {
    data: rows.map(r => ({
      childId    : r.child_id,
      isGuest    : r.is_guest,
      coachNotes : r.coach_notes,
      displayName: nameMap.get(r.child_id) ?? r.child_id.slice(0, 8),
    })),
    error: null,
  }
}
