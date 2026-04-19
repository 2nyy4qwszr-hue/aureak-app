// Story 89.5 + 89.6 — Edge Function : confirm-trial-slot
// Confirmée par le parent via le lien email (contient confirm_token).
//
// Entrée (body JSON) :
//   { confirmToken }
//
// Effets :
//   1. Valide token + status='notified' + notified_at dans les 24h
//   2. UPDATE trial_waitlist : status='confirmed', confirmed_at=NOW
//   3. INSERT session_attendees(session_id, child_id, attendance_type='trial')
//      → le gardien apparaît dans le roster "essai" de la séance
//   4. (Story 89.6) UPDATE child_directory : trial_used=true, trial_date=NOW
//      → trace le fait que le droit à l'essai gratuit est maintenant consommé.
//      `trial_outcome` reste null — on l'écrira quand l'admin enregistrera
//      l'attendance réelle (present/absent/cancelled) via recordTrialOutcome.
//
// Sécurité : SERVICE_ROLE_KEY requis (token = secret suffisant, lien public depuis email).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const CONFIRM_WINDOW_MS = 24 * 60 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')   return json({ error: 'method_not_allowed' }, 405)

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  let body: { confirmToken?: string }
  try { body = await req.json() } catch { return json({ error: 'invalid_body' }, 400) }

  const token = body.confirmToken
  if (!token) return json({ error: 'missing_confirm_token' }, 400)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1. Lecture + validation
  const { data: entry, error: readErr } = await supabase
    .from('trial_waitlist')
    .select('*')
    .eq('confirm_token', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (readErr)   return json({ error: readErr.message }, 500)
  if (!entry)    return json({ error: 'not_found' }, 404)

  if (entry.status === 'confirmed') {
    return json({ error: 'already_confirmed', entry }, 409)
  }
  if (entry.status === 'expired') {
    return json({ error: 'expired' }, 410)
  }
  if (entry.status !== 'notified') {
    return json({ error: 'invalid_status', status: entry.status }, 409)
  }

  if (!entry.notified_at) {
    return json({ error: 'missing_notified_at' }, 500)
  }
  const notifiedTs = new Date(entry.notified_at).getTime()
  if (Date.now() - notifiedTs > CONFIRM_WINDOW_MS) {
    await supabase
      .from('trial_waitlist')
      .update({ status: 'expired', expired_at: new Date().toISOString() })
      .eq('id', entry.id)
    return json({ error: 'window_elapsed' }, 410)
  }

  if (!entry.notified_session_id) {
    return json({ error: 'missing_session' }, 500)
  }

  // 2. Update → confirmed
  const { data: updated, error: updateErr } = await supabase
    .from('trial_waitlist')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', entry.id)
    .select('*')
    .single()

  if (updateErr) return json({ error: updateErr.message }, 500)

  // 3. Ajoute le gardien au roster de la séance (attendance_type='trial')
  //    Si le gardien existe dans `profiles` (compte auth), on utilise profiles.user_id
  //    sinon on skippe (child_directory uniquement) — le scout créera le compte au besoin.
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('child_directory_id', entry.child_id)
    .maybeSingle()

  if (profile?.user_id) {
    const { error: insertErr } = await supabase
      .from('session_attendees')
      .upsert({
        session_id      : entry.notified_session_id,
        child_id        : profile.user_id,
        tenant_id       : entry.tenant_id,
        is_guest        : true,
        attendance_type : 'trial',
      }, { onConflict: 'session_id,child_id' })

    if (insertErr && Deno.env.get('DENO_ENV') !== 'production') {
      console.warn('[confirm-trial-slot] session_attendees insert skipped:', insertErr.message)
    }
  }

  // 4. (Story 89.6) Marque l'essai gratuit comme consommé sur child_directory.
  //    AC #4 : dès confirmation → trial_used=true, trial_date=NOW.
  //    `trial_outcome` reste null → sera renseigné après la séance réelle
  //    (present/absent/cancelled) via recordTrialOutcome côté admin.
  //    Non bloquant — un échec ici n'empêche pas la confirmation waitlist.
  const { error: trialErr } = await supabase
    .from('child_directory')
    .update({
      trial_used: true,
      trial_date: new Date().toISOString(),
    })
    .eq('id', entry.child_id)

  if (trialErr && Deno.env.get('DENO_ENV') !== 'production') {
    console.warn('[confirm-trial-slot] child_directory trial_used update skipped:', trialErr.message)
  }

  return json({ ok: true, entry: updated })
})
