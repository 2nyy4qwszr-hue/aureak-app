// Story 12.4 — Cron dimanche 19h : rappel quêtes incomplètes
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = new Date().toISOString().split('T')[0]

  // Trouver les quêtes actives non complétées de la semaine en cours
  const { data: activeQuests } = await supabase
    .from('player_quests')
    .select('child_id, tenant_id, quest_definitions(name), current_value, target_value')
    .eq('status', 'active')
    .eq('period_end', today)

  let sent = 0
  for (const q of activeQuests ?? []) {
    const questName = (q.quest_definitions as Record<string, string> | null)?.name ?? 'Quête'
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId   : q.tenant_id,
        recipientId: q.child_id,
        eventType  : 'quest_reminder',
        referenceId: q.child_id,
        urgency    : 'routine',
        title      : 'Ta quête se termine ce soir !',
        body       : `${questName} : ${q.current_value}/${q.target_value} — encore un effort !`,
      },
    })
    sent++
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
