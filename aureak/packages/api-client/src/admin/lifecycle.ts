// Story 10.1 — API cycle de vie utilisateur
import { supabase } from '../supabase'

export async function suspendUser(
  userId: string,
  reason?: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('suspend_user', {
    p_user_id: userId,
    p_reason : reason ?? null,
  })
  return { error }
}

export async function reactivateUser(userId: string): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('reactivate_user', { p_user_id: userId })
  return { error }
}

export async function requestUserDeletion(userId: string): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('request_user_deletion', { p_user_id: userId })
  return { error }
}

export async function listLifecycleEvents(
  userId: string,
): Promise<{ data: unknown[]; error: unknown }> {
  const { data, error } = await supabase
    .from('user_lifecycle_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}
