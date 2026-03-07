// Story 4.6 — Confirmation présence coach & gestion du bloc
import { supabase } from '../supabase'

export async function confirmCoachPresence(
  sessionId: string,
  deviceId?: string
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('confirm_coach_presence', {
    p_session_id: sessionId,
    p_device_id : deviceId ?? null,
  })

  return { error }
}

export async function getCoachPresenceStatus(
  sessionId: string
): Promise<{ data: boolean; error: unknown }> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { data: false, error: new Error('Non authentifié') }

  const { data, error } = await supabase
    .from('coach_presence_confirmations')
    .select('coach_id')
    .eq('session_id', sessionId)
    .eq('coach_id', user.user.id)
    .maybeSingle()

  return { data: data !== null, error }
}

export async function canCloseSession(
  sessionId: string
): Promise<{ data: boolean | null; error: unknown }> {
  const { data, error } = await supabase.rpc('can_close_session', {
    p_session_id: sessionId,
  })

  return { data: data as boolean | null, error }
}
