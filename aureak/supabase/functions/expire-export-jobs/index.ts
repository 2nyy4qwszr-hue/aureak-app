// Story 10.5 — Cron : expire les export jobs et supprime les fichiers Storage
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: expired } = await supabase
    .from('export_jobs')
    .select('id, tenant_id, file_url')
    .eq('status', 'ready')
    .lt('expires_at', new Date().toISOString())

  let count = 0
  for (const job of expired ?? []) {
    if (job.file_url) {
      // Extraire le path depuis l'URL signée
      const url = new URL(job.file_url)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/exports\/(.+)/)
      if (pathMatch) {
        await supabase.storage.from('exports').remove([pathMatch[1]])
      }
    }

    await supabase
      .from('export_jobs')
      .update({ status: 'expired', file_url: null })
      .eq('id', job.id)

    count++
  }

  return new Response(JSON.stringify({ ok: true, expired: count }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
