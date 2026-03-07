// Story 8.4 — Edge Function cron : rappel révision espacée (daily 9h)
// Configuré dans Supabase Cron Jobs : 0 9 * * *
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().split('T')[0]

  // Tentatives avec révision due aujourd'hui (non encore révisées)
  const { data: dueAttempts } = await supabase
    .from('learning_attempts')
    .select('id, child_id, theme_id, tenant_id, themes(name)')
    .eq('mastery_status', 'acquired')
    .is('reviewed_at', null)
    .lte('review_due_at', `${today}T23:59:59Z`)

  let processed = 0

  for (const attempt of (dueAttempts ?? [])) {
    type AttemptRow = { child_id: string; tenant_id: string; themes?: { name: string } | null }
    const a = attempt as AttemptRow

    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        tenantId   : a.tenant_id,
        recipientId: a.child_id,
        eventType  : 'review_due',
        referenceId: a.child_id,
        urgency    : 'routine',
        title      : 'Révision à faire !',
        body       : `Il est temps de revalider "${a.themes?.name ?? 'un thème'}" !`,
      }),
    })

    processed++
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
