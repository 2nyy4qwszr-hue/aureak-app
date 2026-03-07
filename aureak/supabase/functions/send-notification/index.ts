// Story 7.1 — Edge Function centralisée : send-notification
// Gère urgence, canaux, idempotency (unique_send_once), Expo Push API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type NotificationPayload = {
  tenantId   : string
  recipientId: string
  eventType  : string
  referenceId: string
  urgency    : 'routine' | 'urgent'
  title      : string
  body       : string
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const payload: NotificationPayload = await req.json()

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, sms_enabled')
    .eq('user_id', payload.recipientId)
    .single()

  // Règle d'urgence : urgent → tous canaux activés ; routine → push uniquement
  const channels: string[] = payload.urgency === 'urgent'
    ? ['push', ...(prefs?.email_enabled ? ['email'] : []), ...(prefs?.sms_enabled ? ['sms'] : [])]
    : [(prefs?.push_enabled !== false) ? 'push' : null].filter(Boolean) as string[]

  for (const channel of channels) {
    // INSERT idempotent (ON CONFLICT DO NOTHING via unique_send_once)
    const { error: insertError } = await supabase
      .from('notification_send_logs')
      .insert({
        tenant_id   : payload.tenantId,
        recipient_id: payload.recipientId,
        channel,
        event_type  : payload.eventType,
        reference_id: payload.referenceId,
        urgency     : payload.urgency,
        status      : 'sent',
      })

    // 23505 = unique constraint violation — déjà envoyé
    if (insertError?.code === '23505') continue

    if (!insertError && channel === 'push') {
      // Récupérer les tokens Expo de l'utilisateur
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', payload.recipientId)

      for (const { token } of tokens ?? []) {
        try {
          const resp = await fetch('https://exp.host/--/api/v2/push/send', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
              to   : token,
              title: payload.title,
              body : payload.body,
            }),
          })
          const providerResponse = await resp.json()

          // Mettre à jour provider_response sur le log
          await supabase
            .from('notification_send_logs')
            .update({ provider_response: providerResponse })
            .eq('tenant_id', payload.tenantId)
            .eq('recipient_id', payload.recipientId)
            .eq('event_type', payload.eventType)
            .eq('reference_id', payload.referenceId)
            .eq('channel', channel)
        } catch {
          await supabase
            .from('notification_send_logs')
            .update({ status: 'failed', provider_response: { error: 'push_send_failed' } })
            .eq('tenant_id', payload.tenantId)
            .eq('recipient_id', payload.recipientId)
            .eq('event_type', payload.eventType)
            .eq('reference_id', payload.referenceId)
            .eq('channel', channel)
        }
      }
    }
    // email → Resend API (TODO Story 10.x)
    // sms → Twilio API (TODO Story 10.x)
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
