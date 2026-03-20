// Story 13.3 — Edge Function : coach-absence-handler
// Gère l'absence coach et le workflow de remplacement
// POST body: { action: 'report_absence' | 'accept_replacement', sessionId, coachId }
// Actions cron (escalate_60min, red_alert_2h) : requièrent X-Internal-Key header
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

type RequestBody =
  | { action: 'report_absence';    sessionId: string; coachId: string }
  | { action: 'accept_replacement'; sessionId: string; coachId: string }
  | { action: 'escalate_60min';    sessionId: string }
  | { action: 'red_alert_2h';      sessionId: string }

Deno.serve(async (req) => {
  const body = await req.json() as RequestBody

  // ── Actions initiées par un coach : vérification JWT obligatoire ──────────
  if (body.action === 'report_absence' || body.action === 'accept_replacement') {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Vérifier le token JWT via un client anon (ne bypasse pas RLS)
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Le coachId du body doit correspondre à l'utilisateur authentifié
    if (user.id !== body.coachId) {
      return new Response(JSON.stringify({ error: 'Forbidden: coachId mismatch' }), { status: 403 })
    }
  }

  // ── Actions cron (internes) : clé secrète partagée ────────────────────────
  if (body.action === 'escalate_60min' || body.action === 'red_alert_2h') {
    const internalKey = req.headers.get('X-Internal-Key') ?? ''
    const expectedKey = Deno.env.get('INTERNAL_CRON_KEY') ?? ''
    if (!expectedKey || internalKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }
  }

  if (body.action === 'report_absence') {
    return handleReportAbsence(body.sessionId, body.coachId)
  }
  if (body.action === 'accept_replacement') {
    return handleAcceptReplacement(body.sessionId, body.coachId)
  }
  if (body.action === 'escalate_60min') {
    return handleEscalate60min(body.sessionId)
  }
  if (body.action === 'red_alert_2h') {
    return handleRedAlert2h(body.sessionId)
  }

  return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400 })
})

// ─────────────────────────────────────────────────────────────────────────────
async function handleReportAbsence(sessionId: string, absentCoachId: string) {
  // 1. Récupérer la séance + tenant
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, tenant_id, group_id, scheduled_at')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !sessionRow) {
    return new Response(JSON.stringify({ error: 'session not found' }), { status: 404 })
  }

  const row       = sessionRow as Record<string, unknown>
  const tenantId  = row['tenant_id'] as string
  const groupId   = row['group_id']  as string

  // 2. Récupérer les remplaçants du groupe (ordre : assistant → remplaçant)
  const { data: staffRows } = await supabase
    .from('group_staff')
    .select('coach_id, role')
    .eq('group_id', groupId)
    .neq('coach_id', absentCoachId)
    .in('role', ['assistant', 'remplacant'])

  const ROLE_PRIORITY: Record<string, number> = { assistant: 1, remplacant: 2 }
  const replacements = ((staffRows ?? []) as { coach_id: string; role: string }[])
    .sort((a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99))

  // 3. Récupérer admins + responsable implantation
  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin')
    .eq('tenant_id', tenantId)

  const adminIds = ((admins ?? []) as { user_id: string }[]).map(a => a.user_id)

  // 4. Notifier admins
  for (const adminId of adminIds) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId : adminId,
        type   : 'coach_absence_alert',
        payload: { sessionId, absentCoachId, message: 'Un coach est absent — remplacement requis' },
      },
    })
  }

  // 5. Notifier remplaçants (dans l'ordre)
  for (const staff of replacements) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId : staff.coach_id,
        type   : 'coach_absence_alert',
        payload: {
          sessionId,
          absentCoachId,
          message    : 'Vous êtes sollicité pour remplacer un coach absent',
          canAccept  : true,
        },
      },
    })
  }

  // 6. Stocker le flag d'absence sur la séance (champ metadata ou audit)
  await supabase.from('audit_logs').insert({
    tenant_id  : tenantId,
    entity_type: 'session',
    entity_id  : sessionId,
    action     : 'coach_absence_reported',
    metadata   : { absentCoachId, notifiedCount: replacements.length + adminIds.length },
  })

  return new Response(
    JSON.stringify({ ok: true, notified: replacements.length + adminIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
async function handleAcceptReplacement(sessionId: string, replacingCoachId: string) {
  // 1. Récupérer la séance
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, tenant_id, group_id')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !sessionRow) {
    return new Response(JSON.stringify({ error: 'session not found' }), { status: 404 })
  }

  const row      = sessionRow as Record<string, unknown>
  const tenantId = row['tenant_id'] as string
  const groupId  = row['group_id']  as string

  // 2. Vérifier qu'il n'y a pas déjà un remplaçant accepté (idempotent)
  const { data: existing } = await supabase
    .from('session_coaches')
    .select('coach_id, role')
    .eq('session_id', sessionId)
    .eq('role', 'lead')
    .neq('coach_id', replacingCoachId)
    .single()

  if (!existing) {
    return new Response(JSON.stringify({ error: 'no absent coach found or already replaced' }), { status: 409 })
  }

  // 3. Mettre à jour session_coaches : nouveau lead
  await supabase
    .from('session_coaches')
    .upsert(
      { session_id: sessionId, coach_id: replacingCoachId, tenant_id: tenantId, role: 'lead' },
      { onConflict: 'session_id,coach_id' }
    )

  // 4. Récupérer les autres remplaçants pour les notifier
  const { data: staffRows } = await supabase
    .from('group_staff')
    .select('coach_id')
    .eq('group_id', groupId)
    .neq('coach_id', replacingCoachId)
    .in('role', ['assistant', 'remplacant'])

  const { data: replacingProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', replacingCoachId)
    .single()

  const replacingName = (replacingProfile as Record<string, unknown> | null)?.['display_name'] as string ?? 'Un coach'

  for (const staff of (staffRows ?? []) as { coach_id: string }[]) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId : staff.coach_id,
        type   : 'replacement_accepted',
        payload: {
          sessionId,
          replacingCoachId,
          message: `${replacingName} a accepté le remplacement`,
        },
      },
    })
  }

  // 5. Log audit
  await supabase.from('audit_logs').insert({
    tenant_id  : tenantId,
    entity_type: 'session',
    entity_id  : sessionId,
    action     : 'replacement_accepted',
    metadata   : { replacingCoachId },
  })

  return new Response(
    JSON.stringify({ ok: true, replacingCoachId }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Escalade 60 min : aucun remplaçant accepté après 60 min → alerte admins
async function handleEscalate60min(sessionId: string) {
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, tenant_id, scheduled_at')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !sessionRow) {
    return new Response(JSON.stringify({ error: 'session not found' }), { status: 404 })
  }

  const row      = sessionRow as Record<string, unknown>
  const tenantId = row['tenant_id'] as string

  // Vérifier qu'il n'y a toujours pas de remplaçant lead
  const { data: leadCoach } = await supabase
    .from('session_coaches')
    .select('coach_id')
    .eq('session_id', sessionId)
    .eq('role', 'lead')
    .maybeSingle()

  // Si un coach lead existe, l'escalade est annulée
  if (leadCoach) {
    return new Response(JSON.stringify({ ok: true, skipped: 'replacement_found' }), { status: 200 })
  }

  // Notifier tous les admins
  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin')
    .eq('tenant_id', tenantId)

  const adminIds = ((admins ?? []) as { user_id: string }[]).map(a => a.user_id)
  for (const adminId of adminIds) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId : adminId,
        type   : 'replacement_escalation',
        payload: {
          sessionId,
          message: "⚠ Aucun remplaçant n'a accepté après 60 minutes — action requise",
        },
      },
    })
  }

  await supabase.from('audit_logs').insert({
    tenant_id  : tenantId,
    entity_type: 'session',
    entity_id  : sessionId,
    action     : 'replacement_escalated_60min',
    metadata   : { notifiedAdmins: adminIds.length },
  })

  return new Response(
    JSON.stringify({ ok: true, notified: adminIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTE ROUGE J-2h : séance dans 2h sans remplaçant → alerte prioritaire
async function handleRedAlert2h(sessionId: string) {
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, tenant_id, scheduled_at, group_id')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !sessionRow) {
    return new Response(JSON.stringify({ error: 'session not found' }), { status: 404 })
  }

  const row      = sessionRow as Record<string, unknown>
  const tenantId = row['tenant_id'] as string

  // Vérifier qu'il n'y a toujours pas de remplaçant lead
  const { data: leadCoach } = await supabase
    .from('session_coaches')
    .select('coach_id')
    .eq('session_id', sessionId)
    .eq('role', 'lead')
    .maybeSingle()

  if (leadCoach) {
    return new Response(JSON.stringify({ ok: true, skipped: 'replacement_found' }), { status: 200 })
  }

  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin')
    .eq('tenant_id', tenantId)

  const adminIds = ((admins ?? []) as { user_id: string }[]).map(a => a.user_id)
  for (const adminId of adminIds) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId  : adminId,
        type    : 'red_alert_no_coach',
        priority: 'high',
        payload : {
          sessionId,
          scheduledAt: row['scheduled_at'],
          message    : '🔴 ALERTE ROUGE — Séance dans 2h sans aucun remplaçant confirmé. Annulez ou intervenez maintenant.',
        },
      },
    })
  }

  await supabase.from('audit_logs').insert({
    tenant_id  : tenantId,
    entity_type: 'session',
    entity_id  : sessionId,
    action     : 'red_alert_no_coach_2h',
    metadata   : { notifiedAdmins: adminIds.length, scheduledAt: row['scheduled_at'] },
  })

  return new Response(
    JSON.stringify({ ok: true, redAlert: true, notified: adminIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
