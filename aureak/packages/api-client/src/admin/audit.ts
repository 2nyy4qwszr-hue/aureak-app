// Story 10.4 — API journal d'audit
import { supabase } from '../supabase'

export type AuditLog = {
  id         : string
  tenant_id  : string
  user_id    : string | null
  action     : string
  entity_type: string | null
  entity_id  : string | null
  metadata   : Record<string, unknown>
  created_at : string
}

export type AuditFilters = {
  userId?    : string
  action?    : string
  entityType?: string
  from?      : string
  to?        : string
}

export async function listAuditLogs(
  filters: AuditFilters = {},
): Promise<{ data: AuditLog[]; error: unknown }> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filters.userId)     query = query.eq('user_id', filters.userId)
  if (filters.action)     query = query.eq('action', filters.action)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.from)       query = query.gte('created_at', filters.from)
  if (filters.to)         query = query.lte('created_at', filters.to)

  const { data, error } = await query
  return { data: (data as AuditLog[]) ?? [], error }
}
