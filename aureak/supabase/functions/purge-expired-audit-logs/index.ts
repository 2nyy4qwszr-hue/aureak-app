// Story 10.4 — Cron mensuel : purge les audit_logs expirés selon rétention tenant
// NOTE : Utilise service_role qui contourne les policies RLS no_delete
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: settings } = await supabase
    .from('tenant_retention_settings')
    .select('tenant_id, retention_years')

  let totalDeleted = 0

  for (const s of settings ?? []) {
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - s.retention_years)

    const { count } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .eq('tenant_id', s.tenant_id)
      .lt('created_at', cutoff.toISOString())

    totalDeleted += count ?? 0
  }

  return new Response(JSON.stringify({ ok: true, deleted: totalDeleted }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
