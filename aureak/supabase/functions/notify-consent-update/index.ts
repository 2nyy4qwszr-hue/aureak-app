// Story 10.2 — Notifie les parents lors d'une mise à jour de version de consentement
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Payload = {
  tenantId    : string
  consentType : string
  newVersion  : number
  textSummary : string
}

Deno.serve(async (req) => {
  const payload: Payload = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Récupérer tous les parents du tenant ayant ce type de consentement
  const { data: parents } = await supabase
    .from('consents')
    .select('parent_id')
    .eq('tenant_id', payload.tenantId)
    .eq('consent_type', payload.consentType)
    .eq('granted', true)

  const uniqueParents = [...new Set((parents ?? []).map(p => p.parent_id))]

  for (const parentId of uniqueParents) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId   : payload.tenantId,
        recipientId: parentId,
        eventType  : 'consent_update',
        referenceId: `${payload.consentType}_v${payload.newVersion}`,
        urgency    : 'routine',
        title      : 'Mise à jour des consentements',
        body       : payload.textSummary,
      },
    })
  }

  return new Response(JSON.stringify({ ok: true, notified: uniqueParents.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
