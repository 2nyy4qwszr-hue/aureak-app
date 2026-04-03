// Story tbd-digest-coach — Edge Function : weekly-digest-coach
// Cron : chaque lundi à 08h00 (configurer dans supabase/config.toml ou Supabase Dashboard)
// Envoie un digest hebdomadaire à chaque coach actif via Resend
// Contient : séances de la semaine passée, taux de présence, évaluations à compléter

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@aureak.be'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CoachRow {
  id         : string
  tenant_id  : string
  email      : string
  full_name  : string | null
}

interface SessionRow {
  id               : string
  scheduled_at     : string
  duration_minutes : number | null
  status           : string
  total_roster     : number | null
  member_present   : number | null
}

// ── Email builder ──────────────────────────────────────────────────────────────

function buildEmailHtml(coachName: string, sessions: SessionRow[], weekRange: string): string {
  const totalSessions = sessions.length
  const closedSessions = sessions.filter(s => s.status === 'realisee').length
  const totalPresent   = sessions.reduce((acc, s) => acc + (s.member_present ?? 0), 0)
  const totalRoster    = sessions.reduce((acc, s) => acc + (s.total_roster  ?? 0), 0)
  const attendanceRate = totalRoster > 0 ? Math.round((totalPresent / totalRoster) * 100) : null

  const sessionRows = sessions.map(s => {
    const date = new Date(s.scheduled_at).toLocaleDateString('fr-BE', { weekday: 'short', day: '2-digit', month: 'short' })
    const rate = s.total_roster && s.total_roster > 0
      ? `${Math.round(((s.member_present ?? 0) / s.total_roster) * 100)}%`
      : '–'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d9;color:#333">${date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d9;color:#333">${s.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d9;color:#333;text-align:center">${rate}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F3EFE7;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <!-- Header -->
    <div style="background:#C1AC5C;padding:24px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px">AUREAK</div>
      <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:4px">Digest hebdomadaire coach</div>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="font-size:15px;color:#333;margin:0 0 8px">Bonjour <strong>${coachName || 'Coach'}</strong>,</p>
      <p style="font-size:13px;color:#666;margin:0 0 24px">Voici votre résumé pour la semaine du <strong>${weekRange}</strong>.</p>

      <!-- KPIs -->
      <div style="display:flex;gap:12px;margin-bottom:24px">
        <div style="flex:1;background:#F3EFE7;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#C1AC5C">${totalSessions}</div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Séances</div>
        </div>
        <div style="flex:1;background:#F3EFE7;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#4CAF50">${attendanceRate !== null ? attendanceRate + '%' : '–'}</div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Présence</div>
        </div>
        <div style="flex:1;background:#F3EFE7;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#333">${closedSessions}/${totalSessions}</div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Clôturées</div>
        </div>
      </div>

      <!-- Sessions table -->
      ${sessions.length > 0 ? `
      <h3 style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">Séances de la semaine</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#F3EFE7">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.08em">Date</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.08em">Statut</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.08em">Présence</th>
          </tr>
        </thead>
        <tbody>${sessionRows}</tbody>
      </table>
      ` : `<p style="color:#888;font-size:13px">Aucune séance cette semaine.</p>`}

    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f0e8d9;font-size:11px;color:#aaa;text-align:center">
      Aureak · Académie gardiens de but · <a href="https://aureak.be" style="color:#C1AC5C">aureak.be</a>
    </div>
  </div>
</body>
</html>`
}

// ── Main ───────────────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  const now       = new Date()
  const weekAgo   = new Date(now.getTime() - 7 * 86400_000)
  const weekRange = `${weekAgo.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}`

  // 1. Lister tous les coaches actifs avec email
  const { data: coaches, error: coachError } = await supabase
    .from('profiles')
    .select('id, tenant_id, email:auth.users(email), full_name:display_name')
    .eq('role', 'coach')
    .eq('is_active', true)

  if (coachError || !coaches) {
    console.error('[weekly-digest-coach] coaches error:', coachError)
    return new Response(JSON.stringify({ error: 'Failed to load coaches' }), { status: 500 })
  }

  let sent = 0, errors = 0

  for (const coach of coaches as unknown as CoachRow[]) {
    if (!coach.email) { errors++; continue }

    // 2. Charger les séances du coach pour la semaine passée
    const { data: sessions } = await supabase
      .from('v_session_presence_summary')
      .select('id, scheduled_at, duration_minutes, status, total_roster, member_present')
      .gte('scheduled_at', weekAgo.toISOString())
      .lt('scheduled_at', now.toISOString())
      .eq('tenant_id', coach.tenant_id)

    const sessionList = (sessions ?? []) as SessionRow[]

    // 3. Envoyer le digest via Resend
    const html = buildEmailHtml(coach.full_name ?? coach.email, sessionList, weekRange)
    const res  = await fetch('https://api.resend.com/emails', {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify({
        from   : FROM_EMAIL,
        to     : [coach.email],
        subject: `Digest hebdomadaire Aureak — semaine du ${weekRange}`,
        html,
      }),
    })

    if (res.ok) {
      sent++
    } else {
      const errBody = await res.text().catch(() => 'unknown')
      console.error(`[weekly-digest-coach] Resend error for ${coach.email}:`, errBody)
      errors++
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
