// Story 12.4 — Cron lundi 6h : attribue les quêtes hebdomadaires + expire les anciennes
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today  = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const periodStart = monday.toISOString().split('T')[0]
  const periodEnd   = sunday.toISOString().split('T')[0]

  // Expirer les quêtes de la semaine précédente
  await supabase
    .from('player_quests')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('period_end', periodStart)

  // Récupérer les quêtes hebdomadaires actives
  const { data: questDefs } = await supabase
    .from('quest_definitions')
    .select('id, target_value, tenant_id')
    .eq('recurrence', 'weekly')
    .eq('is_active', true)

  if (!questDefs?.length) {
    return new Response(JSON.stringify({ ok: true, assigned: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Enfants actifs (last_activity_at > 30 jours)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { data: activeChildren } = await supabase
    .from('player_progress')
    .select('child_id, tenant_id')
    .gte('last_activity_at', thirtyDaysAgo)

  const inserts: Record<string, unknown>[] = []
  for (const child of activeChildren ?? []) {
    for (const quest of questDefs.filter(q => q.tenant_id === child.tenant_id)) {
      inserts.push({
        tenant_id   : child.tenant_id,
        child_id    : child.child_id,
        quest_id    : quest.id,
        target_value: quest.target_value,
        period_start: periodStart,
        period_end  : periodEnd,
      })
    }
  }

  if (inserts.length) {
    await supabase
      .from('player_quests')
      .upsert(inserts, { onConflict: 'child_id,quest_id,period_start', ignoreDuplicates: true })
  }

  return new Response(JSON.stringify({ ok: true, assigned: inserts.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
