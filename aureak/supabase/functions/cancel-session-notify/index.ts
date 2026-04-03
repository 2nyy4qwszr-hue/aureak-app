// Story 4.5 — Edge Function : notifications multicanal sur annulation de séance
// Story 41-3 — Ajout SMS Twilio + guards variables d'environnement
// Déclenchée via Database Webhook sur UPDATE sessions WHERE status = 'annulée'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Guards Twilio ─────────────────────────────────────────────────────────────
const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioFrom  = Deno.env.get('TWILIO_FROM_NUMBER')

const twilioAvailable = !!(twilioSid && twilioToken && twilioFrom)
if (!twilioAvailable) {
  console.warn('[cancel-session-notify] Twilio env vars missing — SMS skipped')
}

// ── Helper : envoyer un SMS via Twilio REST API ───────────────────────────────
async function sendTwilioSms(to: string, body: string): Promise<void> {
  if (!twilioAvailable) return
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
  const credentials = btoa(`${twilioSid}:${twilioToken}`)
  const formData = new URLSearchParams({ To: to, From: twilioFrom!, Body: body })
  const res = await fetch(url, {
    method : 'POST',
    headers: {
      Authorization : `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    console.warn('[cancel-session-notify] Twilio SMS failed:', res.status, text)
  }
}

Deno.serve(async (req: Request) => {
  const { record } = await req.json()

  // Vérifier que la session vient d'être annulée
  if (record.status !== 'annulée') {
    return new Response('skipped', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Récupérer les parents des enfants du roster
  const { data: attendees } = await supabase
    .from('session_attendees')
    .select('child_id, profiles!child_id(parent_child_links(parent_id))')
    .eq('session_id', record.id)

  const parentIds: string[] = [...new Set(
    (attendees ?? []).flatMap((a: { profiles?: { parent_child_links?: { parent_id: string }[] } }) =>
      a.profiles?.parent_child_links?.map(l => l.parent_id) ?? []
    )
  )]

  let processed = 0

  for (const parentId of parentIds) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled, email_enabled, sms_enabled, sms_phone_number')
      .eq('user_id', parentId)
      .single()

    const channels: string[] = [
      prefs?.push_enabled  ? 'push'  : null,
      prefs?.email_enabled ? 'email' : null,
      prefs?.sms_enabled   ? 'sms'   : null,
    ].filter(Boolean) as string[]

    // Si pas de préférences, envoyer push par défaut
    if (!prefs) channels.push('push')

    for (const channel of channels) {
      await supabase
        .from('notification_send_logs')
        .insert({
          tenant_id   : record.tenant_id,
          recipient_id: parentId,
          channel,
          event_type  : 'session_cancelled',
          reference_id: record.id,
          status      : 'sent',
          urgency     : 'urgent',
        })
        // Idempotent : ON CONFLICT DO NOTHING via unique_send_once
        .onConflict('tenant_id, recipient_id, reference_id, event_type, channel')
        .ignore()

      // ── SMS via Twilio ─────────────────────────────────────────────────────
      if (channel === 'sms' && twilioAvailable && prefs?.sms_phone_number) {
        const sessionLabel = record.label ?? `séance du ${record.date ?? ''}`
        const message = `Aureak : la séance "${sessionLabel}" a été annulée. Contactez votre académie pour plus d'informations.`
        await sendTwilioSms(prefs.sms_phone_number as string, message)
      }
      // TODO Story 7.1 : brancher send-notification Edge Function pour push & email
      // push → Expo Push API, email → Resend
    }

    processed++
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
