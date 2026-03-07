// Story 4.4 — Planification récurrente & gestion des exceptions
import { supabase } from '../supabase'
import type { Session } from '@aureak/types'

export type RecurrenceRule = {
  freq : 'weekly'
  day  : string
  count?: number
  until?: string | null
}

export type GenerateRecurrenceParams = {
  rule             : RecurrenceRule
  implantationId   : string
  groupId          : string
  startDate        : string  // ISO date 'YYYY-MM-DD'
  time             : string  // 'HH:MM'
  durationMinutes? : number
  location?        : string
  themeIds?        : string[]
  coaches?         : { coachId: string; role?: string }[]
}

export async function generateRecurrenceSessions(
  params: GenerateRecurrenceParams
): Promise<{ data: number | null; error: unknown }> {
  const { data, error } = await supabase.rpc('generate_recurrence_sessions', {
    p_rule: params.rule,
    p_base_session_params: {
      implantation_id : params.implantationId,
      group_id        : params.groupId,
      start_date      : params.startDate,
      time            : params.time,
      duration_minutes: params.durationMinutes ?? 90,
      location        : params.location ?? null,
      theme_ids       : params.themeIds ?? [],
      coaches         : params.coaches ?? [],
    },
  })

  return { data: data as number | null, error }
}

export async function cancelRecurrenceSeries(
  seriesId: string,
  reason?: string
): Promise<{ data: number | null; error: unknown }> {
  const { data, error } = await supabase.rpc('cancel_recurrence_series', {
    p_series_id: seriesId,
    p_reason   : reason ?? 'Série récurrente annulée',
  })

  return { data: data as number | null, error }
}

export async function cancelSessionRpc(
  sessionId: string,
  reason   : string
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('cancel_session', {
    p_session_id: sessionId,
    p_reason    : reason,
  })

  return { error }
}

export async function modifySingleException(
  sessionId: string,
  changes  : Partial<Pick<Session, 'scheduledAt' | 'durationMinutes' | 'location'>>
): Promise<{ data: Session | null; error: unknown }> {
  // Archiver l'occurrence originale
  await supabase
    .from('sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Récupérer l'originale pour copier les paramètres
  const { data: original } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!original) return { data: null, error: new Error('Session non trouvée') }

  const { data, error } = await supabase.rpc('create_session_full', {
    p_params: {
      implantation_id     : (original as Session).implantationId,
      group_id            : (original as Session).groupId,
      scheduled_at        : changes.scheduledAt ?? (original as Session).scheduledAt,
      duration_minutes    : changes.durationMinutes ?? (original as Session).durationMinutes,
      location            : changes.location ?? (original as Session).location,
      is_exception        : true,
      original_session_id : sessionId,
      theme_ids           : [],
      coaches             : [],
    },
  })

  return { data: data as Session | null, error }
}
