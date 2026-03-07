// Story 10.4 — Exporte les audit_logs en CSV (admin uniquement)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Filters = {
  tenantId  : string
  userId?   : string
  action?   : string
  entityType?: string
  from?     : string
  to?       : string
}

Deno.serve(async (req) => {
  const filters: Filters = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('tenant_id', filters.tenantId)
    .order('created_at', { ascending: false })

  if (filters.userId)     query = query.eq('user_id', filters.userId)
  if (filters.action)     query = query.eq('action', filters.action)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.from)       query = query.gte('created_at', filters.from)
  if (filters.to)         query = query.lte('created_at', filters.to)

  const { data: logs, error } = await query

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  // Générer CSV
  const headers = ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'created_at']
  const rows    = (logs ?? []).map(l =>
    headers.map(h => JSON.stringify(l[h] ?? '')).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  const fileName = `audit-exports/${filters.tenantId}/${Date.now()}.csv`
  await supabase.storage.from('exports').upload(fileName, csv, { contentType: 'text/csv', upsert: true })
  const { data: signed } = await supabase.storage.from('exports').createSignedUrl(fileName, 48 * 3600)

  // Tracer l'export lui-même
  await supabase.from('audit_logs').insert({
    tenant_id  : filters.tenantId,
    user_id    : null,
    action     : 'audit_logs_exported',
    entity_type: 'audit_logs',
    entity_id  : null,
    metadata   : { filters, rows_count: (logs ?? []).length },
  })

  return new Response(JSON.stringify({ ok: true, fileUrl: signed?.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
