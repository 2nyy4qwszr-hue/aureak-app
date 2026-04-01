// Story 5.6 — Edge Function : rappel J+1 pour données non synchronisées
// Planifiée via pg_cron : SELECT cron.schedule('sync-reminder', '0 8 * * *', ...)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayISO = yesterday.toISOString()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // Trouver les coaches avec des opérations en attente datant d'hier
  const { data: pendingOps } = await supabase
    .from('sync_queue')
    .select('actor_id, tenant_id')
    .in('status', ['pending', 'failed'])
    .gte('created_at', yesterdayISO)
    .lt('created_at', todayISO)

  if (!pendingOps?.length) {
    return new Response(JSON.stringify({ ok: true, notified: 0 }))
  }

  // Dédupliquer par actor_id
  const unique = new Map<string, { actor_id: string; tenant_id: string }>()
  for (const op of pendingOps) {
    if (!unique.has(op.actor_id)) {
      unique.set(op.actor_id, op)
    }
  }

  let notified = 0
  const dateLabel = yesterday.toLocaleDateString('fr-BE', { day: '2-digit', month: 'long' })

  for (const { actor_id, tenant_id } of unique.values()) {
    // Récupérer les push tokens du coach
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', actor_id)

    for (const { token } of tokens ?? []) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            to   : token,
            title: 'Données non synchronisées',
            body : `Des présences du ${dateLabel} n'ont pas été synchronisées — Ouvrez l'app`,
            data : { type: 'sync_reminder', tenant_id },
          }),
        })
        notified++
      } catch {
        // Ignorer les erreurs de push individuelles
      }
    }

    // Loguer dans notification_send_logs
    await supabase.from('notification_send_logs').insert({
      tenant_id  : tenant_id,
      recipient_id: actor_id,
      event_type : 'sync_reminder',
      channel    : 'push',
      status     : 'sent',
    }).maybeSingle()
  }

  return new Response(JSON.stringify({ ok: true, notified }))
})
