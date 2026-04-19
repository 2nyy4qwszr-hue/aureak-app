// Story 89.5 — Edge Function : expire-waitlist
// À déclencher par un scheduler externe (pg_cron, GitHub Actions, etc.) — typiquement
// toutes les 15 minutes. Pour chaque entrée `notified` > 24h :
//   1. status='expired' (via SQL function expire_waitlist_entries())
//   2. Pour chaque groupe impacté, si un prospect suivant est en 'waiting',
//      on le notifie immédiatement (appel interne à notify-waitlist).
//
// Entrée : aucune (appel GET ou POST sans body).
// Sortie : { expired: number, notified: number }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1. Expire les entrées > 24h
  const { data: expired, error: expireErr } = await supabase.rpc('expire_waitlist_entries')
  if (expireErr) return json({ error: expireErr.message }, 500)

  const expiredList = (expired ?? []) as Array<{
    waitlist_id : string
    group_id    : string
    tenant_id   : string
    session_id  : string | null
  }>

  // 2. Pour chaque groupe, notifier le prospect suivant en 'waiting'
  //    On rappelle l'Edge Function notify-waitlist (réutilisation de la logique).
  let notifiedCount = 0
  for (const row of expiredList) {
    if (!row.session_id) continue
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-waitlist`, {
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          groupId  : row.group_id,
          sessionId: row.session_id,
          tenantId : row.tenant_id,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (res.ok && payload?.notified) notifiedCount++
    } catch (err) {
      if (Deno.env.get('DENO_ENV') !== 'production') console.warn('[expire-waitlist] notify-next failed:', err)
    }
  }

  return json({ expired: expiredList.length, notified: notifiedCount })
})
