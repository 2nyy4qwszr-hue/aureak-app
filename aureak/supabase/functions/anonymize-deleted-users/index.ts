// Story 10.1 — Cron mensuel : anonymise les comptes pending_deletion > 30 jours
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  // Trouver utilisateurs pending_deletion depuis > 30 jours
  const { data: toAnonymize, error } = await supabase
    .from('user_lifecycle_events')
    .select('user_id, tenant_id')
    .eq('event_type', 'deletion_requested')
    .lt('created_at', cutoff.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let count = 0
  for (const row of toAnonymize ?? []) {
    // Vérifier que le statut est bien pending_deletion
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', row.user_id)
      .single()

    if (profile?.status !== 'pending_deletion') continue

    // Anonymiser
    await supabase
      .from('profiles')
      .update({
        first_name : 'Supprimé',
        last_name  : '',
        email      : null,
        status     : 'deleted',
      })
      .eq('user_id', row.user_id)

    // Journal
    await supabase
      .from('user_lifecycle_events')
      .insert({
        tenant_id  : row.tenant_id,
        user_id    : row.user_id,
        event_type : 'deleted',
        metadata   : { anonymized_at: new Date().toISOString() },
      })

    count++
  }

  return new Response(JSON.stringify({ ok: true, anonymized: count }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
