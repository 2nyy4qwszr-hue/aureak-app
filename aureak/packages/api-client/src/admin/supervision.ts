// Story 9.1, 9.2, 9.5 — API admin supervision
import { supabase } from '../supabase'

export type ImplantationStats = {
  implantation_id    : string
  implantation_name  : string
  tenant_id          : string
  sessions_total     : number
  sessions_closed    : number
  attendance_rate_pct: number
  mastery_rate_pct   : number
}

export type AnomalyEvent = {
  id           : string
  tenantId     : string
  anomalyType  : 'session_not_closed' | 'high_absenteeism' | 'coach_feedback_missing' | 'no_session_activity'
  severity     : 'info' | 'warning' | 'critical'
  resourceType : string
  resourceId   : string
  metadata     : Record<string, unknown>
  resolvedAt   : string | null
  resolvedBy   : string | null
  createdAt    : string
}

export async function getImplantationStats(
  from?: string,
  to?: string
): Promise<{ data: ImplantationStats[] | null; error: unknown }> {
  const { data, error } = await supabase.rpc('get_implantation_stats', {
    p_from: from ?? new Date(Date.now() - 30 * 86400000).toISOString(),
    p_to  : to   ?? new Date().toISOString(),
  })
  return { data: data as ImplantationStats[] | null, error }
}

export async function getComparisonReport(
  from: string,
  to  : string
): Promise<{ data: ImplantationStats[] | null; error: unknown }> {
  const { data, error } = await supabase.rpc('get_comparison_report', {
    p_from        : from,
    p_to          : to,
    p_metric_keys : null,
  })
  return { data: data as ImplantationStats[] | null, error }
}

export async function listAnomalies(): Promise<{ data: AnomalyEvent[]; error: unknown }> {
  const { data, error } = await supabase
    .from('anomaly_events')
    .select('*')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
  return { data: (data as AnomalyEvent[]) ?? [], error }
}

export async function resolveAnomaly(
  anomalyId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('resolve_anomaly', { p_anomaly_id: anomalyId })
  return { error }
}

export async function sendAdminMessage(
  recipientId: string,
  message    : string,
  urgency    : 'routine' | 'urgent' = 'routine'
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('send_admin_message', {
    p_recipient_id: recipientId,
    p_message     : message,
    p_urgency     : urgency,
  })
  return { data: data as string | null, error }
}

export async function listAdminMessages(
  recipientId?: string
): Promise<{ data: unknown[]; error: unknown }> {
  let query = supabase
    .from('admin_messages')
    .select('*')
    .order('sent_at', { ascending: false })

  if (recipientId) {
    query = query.eq('recipient_id', recipientId)
  }

  const { data, error } = await query
  return { data: data ?? [], error }
}
