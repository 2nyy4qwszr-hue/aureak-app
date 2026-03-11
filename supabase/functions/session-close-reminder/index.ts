// Story 13.3 — Edge Function : session-close-reminder
// Cron : toutes les 5 minutes
// Envoi de rappels push aux coaches qui n'ont pas clôturé leur séance
// Guard anti-doublon : vérifie notification_send_logs avant envoi
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const REMINDER_DELAY_MINUTES  = 5   // 1er rappel : fenêtre 5-20 min après la fin
const SECOND_REMINDER_MINUTES = 20  // 2e rappel : fenêtre 20-35 min après la fin
// Fenêtre maximale de recherche : scheduled_at dans les dernières X minutes
// On prend max_duration (180 min) + 35 min de marge pour couvrir toutes les séances longues
const SEARCH_WINDOW_MINUTES = 180 + 35  // 215 min avant now = ~3h35

Deno.serve(async (_req) => {
  const now = new Date()
  // Chercher les séances dont le scheduled_at est dans la fenêtre de recherche.
  // On filtre ensuite par endTime (= scheduled_at + duration) pour ne garder
  // que celles dont la FIN tombe dans les 35 min passées.
  const cutoffEarly = new Date(now.getTime() - REMINDER_DELAY_MINUTES * 60_000)
  const cutoffLate  = new Date(now.getTime() - SEARCH_WINDOW_MINUTES * 60_000)

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id, tenant_id, scheduled_at, duration_minutes,
      session_coaches!inner(coach_id, role)
    `)
    .eq('status', 'planifiée')
    .is('closed_at', null)
    .lte('scheduled_at', cutoffEarly.toISOString())
    .gte('scheduled_at', cutoffLate.toISOString())

  if (error) {
    console.error('session-close-reminder: query error', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0

  for (const session of (sessions ?? [])) {
    const sessionRow = session as Record<string, unknown>
    const sessionId  = sessionRow['id'] as string
    const tenantId   = sessionRow['tenant_id'] as string
    const coaches    = (sessionRow['session_coaches'] ?? []) as { coach_id: string; role: string }[]
    const leadCoach  = coaches.find(c => c.role === 'lead') ?? coaches[0]

    if (!leadCoach) continue

    const scheduledAt    = new Date(sessionRow['scheduled_at'] as string)
    const durationMs     = (sessionRow['duration_minutes'] as number) * 60_000
    const endTime        = new Date(scheduledAt.getTime() + durationMs)
    const minutesPastEnd = Math.floor((now.getTime() - endTime.getTime()) / 60_000)

    const isFirstReminder  = minutesPastEnd >= REMINDER_DELAY_MINUTES && minutesPastEnd < SECOND_REMINDER_MINUTES
    const isSecondReminder = minutesPastEnd >= SECOND_REMINDER_MINUTES

    if (!isFirstReminder && !isSecondReminder) continue

    const notifType = isFirstReminder ? 'close_reminder_1' : 'close_reminder_2'
    const logKey    = `${sessionId}:${notifType}`

    const { data: existing } = await supabase
      .from('notification_send_logs')
      .select('id')
      .eq('key', logKey)
      .maybeSingle()

    if (existing) continue

    await supabase.from('notification_send_logs').insert({ key: logKey, tenant_id: tenantId })

    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId,
        userId : leadCoach.coach_id,
        type   : 'session_close_reminder',
        payload: {
          sessionId,
          reminderNum: isFirstReminder ? 1 : 2,
          message    : `N'oubliez pas de clôturer votre séance — ${minutesPastEnd} min écoulées`,
        },
      },
    })

    sent++
  }

  return new Response(
    JSON.stringify({ processed: (sessions ?? []).length, sent }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
