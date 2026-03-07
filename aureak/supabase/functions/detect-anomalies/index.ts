// Story 9.2 — Edge Function : détection d'anomalies opérationnelles (cron daily 7h)
// Cron: SELECT cron.schedule('detect-anomalies', '0 7 * * *', ...)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let inserted = 0
  const now = new Date()

  // ─── Règle 1 : sessions non clôturées depuis > 4h ─────────────────────────
  const fourHoursAgo = new Date(now.getTime() - 4 * 3600 * 1000).toISOString()
  const { data: unclosed } = await supabase
    .from('sessions')
    .select('id, tenant_id, implantation_id, scheduled_at, duration_minutes')
    .not('status', 'in', '("terminée","annulée")')
    .lt('scheduled_at', fourHoursAgo)

  for (const s of (unclosed ?? [])) {
    const { error } = await supabase.from('anomaly_events').insert({
      tenant_id    : s.tenant_id,
      anomaly_type : 'session_not_closed',
      severity     : 'warning',
      resource_type: 'session',
      resource_id  : s.id,
      metadata     : { implantation_id: s.implantation_id, scheduled_at: s.scheduled_at },
    })
    if (!error) inserted++
    // ON CONFLICT DO NOTHING géré par l'index unique anomaly_no_duplicate
  }

  // ─── Règle 2 : coach_feedback_missing (> 24h après clôture) ───────────────
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
  const { data: closedSessions } = await supabase
    .from('sessions')
    .select('id, tenant_id')
    .eq('status', 'terminée')
    .lt('closed_at', yesterday)

  const { data: withNotes } = await supabase
    .from('coach_session_notes')
    .select('session_id')

  const notedIds = new Set((withNotes ?? []).map((n: { session_id: string }) => n.session_id))

  for (const s of (closedSessions ?? [])) {
    if (!notedIds.has(s.id)) {
      const { error } = await supabase.from('anomaly_events').insert({
        tenant_id    : s.tenant_id,
        anomaly_type : 'coach_feedback_missing',
        severity     : 'info',
        resource_type: 'session',
        resource_id  : s.id,
        metadata     : {},
      })
      if (!error) inserted++
    }
  }

  // ─── Règle 3 : no_session_activity (14 jours sans séance planifiée) ────────
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString()
  const { data: implantations } = await supabase
    .from('implantations')
    .select('id, tenant_id')

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('implantation_id')
    .gte('scheduled_at', twoWeeksAgo)

  const activeImplantations = new Set(
    (recentSessions ?? []).map((s: { implantation_id: string }) => s.implantation_id)
  )

  for (const i of (implantations ?? [])) {
    if (!activeImplantations.has(i.id)) {
      const { error } = await supabase.from('anomaly_events').insert({
        tenant_id    : i.tenant_id,
        anomaly_type : 'no_session_activity',
        severity     : 'warning',
        resource_type: 'implantation',
        resource_id  : i.id,
        metadata     : {},
      })
      if (!error) inserted++
    }
  }

  // ─── Notification push admin pour anomalies critiques récentes ─────────────
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000).toISOString()
  const { data: criticals } = await supabase
    .from('anomaly_events')
    .select('tenant_id, anomaly_type, resource_id')
    .eq('severity', 'critical')
    .is('resolved_at', null)
    .gte('created_at', oneHourAgo)

  for (const c of (criticals ?? [])) {
    // Récupérer les admins du tenant
    const { data: admins } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('tenant_id', c.tenant_id)
      .eq('role', 'admin')
      .eq('is_active', true)

    for (const admin of (admins ?? [])) {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          tenantId   : c.tenant_id,
          recipientId: admin.user_id,
          eventType  : 'anomaly_critical',
          referenceId: c.resource_id,
          urgency    : 'urgent',
          title      : 'Anomalie critique détectée',
          body       : `Type : ${c.anomaly_type}`,
        }),
      })
    }
  }

  return new Response(JSON.stringify({ inserted }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
