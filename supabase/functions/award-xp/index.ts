// Edge Function : award-xp
// Story 59-1 — Point d'entrée HTTP unique pour créditer des XP
// Format Deno — appelé par admin ou coach authentifié

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Barème XP (constante facile à modifier) ───────────────────────────────────

const XP_RATES: Record<string, number> = {
  ATTENDANCE          : 10,
  NOTE_HIGH           : 20,
  BADGE_EARNED        : 50,
  STAGE_PARTICIPATION : 30,
  SESSION_STREAK_5    : 75,
}

const VALID_EVENT_TYPES = Object.keys(XP_RATES)

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')    ?? ''
  const supabaseKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader     = req.headers.get('Authorization') ?? ''

  // Créer client avec JWT du caller pour valider son rôle
  const callerClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
    auth  : { persistSession: false },
  })

  let body: {
    child_id     : string
    event_type   : string
    ref_id?      : string
    xp_override? : number
    operation_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Validation JWT ──────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await callerClient.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Vérification rôle (admin ou coach uniquement) ───────────────────────────
  const serviceClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin or coach required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Validation payload ──────────────────────────────────────────────────────
  const { child_id, event_type, ref_id, xp_override, operation_id } = body

  if (!child_id || !event_type) {
    return new Response(JSON.stringify({ error: 'child_id and event_type are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!VALID_EVENT_TYPES.includes(event_type)) {
    return new Response(JSON.stringify({ error: `Invalid event_type. Allowed: ${VALID_EVENT_TYPES.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Idempotence via processed_operations ────────────────────────────────────
  if (operation_id) {
    const { data: existing } = await serviceClient
      .from('processed_operations')
      .select('operation_id')
      .eq('operation_id', operation_id)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ idempotent: true, xp_delta: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Récupérer tenant_id de l'enfant ────────────────────────────────────────
  const { data: childProfile } = await serviceClient
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', child_id)
    .single()

  if (!childProfile) {
    return new Response(JSON.stringify({ error: 'Child not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const xp_delta   = xp_override ?? XP_RATES[event_type]
  const tenant_id  = childProfile.tenant_id

  // ── Insertion xp_ledger + processed_operations (try/finally) ───────────────
  try {
    const { error: insertErr } = await serviceClient
      .from('xp_ledger')
      .insert({
        tenant_id,
        child_id,
        event_type,
        ref_id  : ref_id ?? null,
        xp_delta,
      })

    if (insertErr) {
      console.error('[award-xp] xp_ledger insert error:', insertErr.message)
      return new Response(JSON.stringify({ error: 'Failed to insert XP', details: insertErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Marquer l'opération comme traitée
    if (operation_id) {
      await serviceClient
        .from('processed_operations')
        .insert({ operation_id, tenant_id })
        .throwOnError()
        .then(() => {/* noop */})
        .catch((err: unknown) => {
          console.error('[award-xp] processed_operations insert error:', err)
        })
    }

    return new Response(JSON.stringify({ success: true, xp_delta, event_type, child_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    // try/finally : aucun state React ici mais pattern explicitement documenté
    // (requis par CLAUDE.md pour toute logique d'insertion)
  }
})
