// Story 10.3 — Génère un export RGPD complet pour un utilisateur
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Payload = {
  requestId  : string
  requesterId: string
  targetId   : string
  tenantId   : string
}

Deno.serve(async (req) => {
  const payload: Payload = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Marquer en processing
  await supabase
    .from('gdpr_requests')
    .update({ status: 'processing' })
    .eq('id', payload.requestId)

  // Compiler les données
  const [
    { data: profile },
    { data: consents },
    { data: attendances },
    { data: evaluations },
    { data: attempts },
    { data: tickets },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', payload.targetId).single(),
    supabase.from('consents').select('*').eq('parent_id', payload.requesterId).eq('child_id', payload.targetId),
    supabase.from('attendances').select('*').eq('child_id', payload.targetId),
    supabase.from('session_evaluations_merged').select('*').eq('child_id', payload.targetId),
    supabase.from('learning_attempts').select('*').eq('child_id', payload.targetId),
    supabase.from('tickets').select('*').eq('parent_id', payload.requesterId),
  ])

  const exportData = {
    generated_at: new Date().toISOString(),
    profile,
    consents    : consents ?? [],
    attendances : attendances ?? [],
    evaluations : evaluations ?? [],
    learning_attempts: attempts ?? [],
    tickets     : tickets ?? [],
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  const fileName    = `gdpr-export/${payload.tenantId}/${payload.requestId}.json`

  // Upload Storage
  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(fileName, jsonContent, { contentType: 'application/json', upsert: true })

  if (uploadError) {
    await supabase.from('gdpr_requests').update({ status: 'failed' }).eq('id', payload.requestId)
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 })
  }

  // Lien signé 72h
  const { data: signed } = await supabase.storage
    .from('exports')
    .createSignedUrl(fileName, 72 * 3600)

  // UPDATE request
  await supabase.from('gdpr_requests').update({
    status      : 'completed',
    file_url    : signed?.signedUrl,
    processed_at: new Date().toISOString(),
  }).eq('id', payload.requestId)

  // Audit
  await supabase.from('audit_logs').insert({
    tenant_id  : payload.tenantId,
    user_id    : payload.requesterId,
    action     : 'gdpr_export_generated',
    entity_type: 'gdpr_request',
    entity_id  : payload.requestId,
    metadata   : { target_id: payload.targetId },
  })

  return new Response(JSON.stringify({ ok: true, fileUrl: signed?.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
