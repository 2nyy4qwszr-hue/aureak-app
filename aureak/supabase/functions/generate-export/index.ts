// Story 10.5 — Génère un export conforme (anonymisé ou RGPD)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts'

async function hashId(id: string, tenantSalt: string): Promise<string> {
  const data = new TextEncoder().encode(`${tenantSalt}:${id}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

type JobPayload = {
  jobId   : string
  tenantId: string
  requestedBy: string
  exportType: string
  filters : Record<string, unknown>
  format  : 'csv' | 'json'
}

Deno.serve(async (req) => {
  const payload: JobPayload = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Marquer processing
  await supabase.from('export_jobs').update({ status: 'processing' }).eq('id', payload.jobId)

  let exportData: unknown
  const tenantSalt = payload.tenantId

  if (payload.exportType === 'cross_implantation_anonymous') {
    const { data: stats } = await supabase
      .from('implantation_dashboard_stats')
      .select('*')
      .eq('tenant_id', payload.tenantId)

    // Hacher les IDs
    exportData = await Promise.all((stats ?? []).map(async s => ({
      implantation_id  : await hashId(s.implantation_id, tenantSalt),
      implantation_name: s.implantation_name, // nom gardé (pas nominatif individuel)
      sessions_total   : s.sessions_total,
      sessions_closed  : s.sessions_closed,
      attendance_rate_pct: s.attendance_rate_pct,
      mastery_rate_pct : s.mastery_rate_pct,
    })))

  } else if (payload.exportType === 'gdpr_personal_data') {
    // Filtré par consentements accordés
    const { data: consentedChildren } = await supabase
      .from('consents')
      .select('child_id')
      .eq('tenant_id', payload.tenantId)
      .eq('consent_type', 'data_processing')
      .eq('granted', true)

    const childIds = (consentedChildren ?? []).map(c => c.child_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .in('user_id', childIds)

    exportData = profiles ?? []

  } else {
    // attendance_report / evaluation_report / mastery_report
    let query = supabase.from('attendances').select('*').eq('tenant_id', payload.tenantId)
    if (payload.filters.from) query = query.gte('created_at', payload.filters.from as string)
    if (payload.filters.to)   query = query.lte('created_at', payload.filters.to as string)
    const { data } = await query
    exportData = data ?? []
  }

  // Sérialiser
  let fileContent: string
  let contentType: string
  let ext: string

  if (payload.format === 'json') {
    fileContent = JSON.stringify(exportData, null, 2)
    contentType = 'application/json'
    ext = 'json'
  } else {
    const rows = Array.isArray(exportData) ? exportData as Record<string, unknown>[] : []
    const headers = rows.length ? Object.keys(rows[0]) : []
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
    ].join('\n')
    fileContent = csv
    contentType = 'text/csv'
    ext = 'csv'
  }

  const fileName  = `exports/${payload.tenantId}/${payload.jobId}.${ext}`
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString()

  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(fileName, fileContent, { contentType, upsert: true })

  if (uploadError) {
    await supabase.from('export_jobs').update({ status: 'failed' }).eq('id', payload.jobId)
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 })
  }

  const { data: signed } = await supabase.storage.from('exports').createSignedUrl(fileName, 48 * 3600)

  await supabase.from('export_jobs').update({
    status    : 'ready',
    file_url  : signed?.signedUrl,
    expires_at: expiresAt,
  }).eq('id', payload.jobId)

  await supabase.from('audit_logs').insert({
    tenant_id  : payload.tenantId,
    user_id    : payload.requestedBy,
    action     : 'export_generated',
    entity_type: 'export_job',
    entity_id  : payload.jobId,
    metadata   : { export_type: payload.exportType, format: payload.format },
  })

  return new Response(JSON.stringify({ ok: true, fileUrl: signed?.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
