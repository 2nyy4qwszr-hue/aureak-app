// Story 9.3 — Edge Function : export CSV comparaison inter-implantations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const url   = new URL(req.url)
  const from  = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString()
  const to    = url.searchParams.get('to')   ?? new Date().toISOString()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data } = await supabase.rpc('get_comparison_report', {
    p_from        : from,
    p_to          : to,
    p_metric_keys : null,
  })

  if (!data) {
    return new Response('Aucune donnée', { status: 404 })
  }

  // Génération CSV anonymisé — aucun nom de joueur ou coach
  const rows = Array.isArray(data) ? data : []
  const headers = ['Implantation', 'Séances totales', 'Séances terminées', 'Taux présence %', 'Taux maîtrise %']
  const csvRows = rows.map((r: Record<string, unknown>) => [
    String(r.implantation_name ?? ''),
    String(r.sessions_total ?? 0),
    String(r.sessions_closed ?? 0),
    String(r.attendance_rate_pct ?? 0),
    String(r.mastery_rate_pct ?? 0),
  ])

  const csv = [headers, ...csvRows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  // Upload sur Supabase Storage (bucket exports — créer manuellement)
  const filename = `comparison-${from.split('T')[0]}-to-${to.split('T')[0]}.csv`
  await supabase.storage
    .from('exports')
    .upload(filename, new Blob([csv], { type: 'text/csv' }), { upsert: true })

  // Lien signé 48h
  const { data: signedUrl } = await supabase.storage
    .from('exports')
    .createSignedUrl(filename, 48 * 3600)

  return new Response(JSON.stringify({ url: signedUrl?.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
