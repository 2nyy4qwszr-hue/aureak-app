// Story 89.5 — Edge Function : notify-waitlist
// Déclenchée par le trigger trg_notify_waitlist_on_absence (AFTER INSERT sur
// attendances quand status=absent). Notifie le premier prospect en waitlist
// (FIFO) du groupe concerné.
//
// Entrée (body JSON, appel service-role-key depuis pg_net) :
//   { groupId, sessionId, tenantId }
//
// Effets :
//   1. Récupère la première entrée trial_waitlist(status='waiting', group_id=groupId)
//      par ordre requested_at ASC.
//   2. Récupère gardien (child_directory) + groupe + implantation + date séance.
//   3. Envoie un email au parent (lien confirm_token) via Resend.
//   4. UPDATE trial_waitlist : status='notified', notified_at=NOW,
//      notified_session_id=sessionId.
//
// Sécurité : appel avec SERVICE_ROLE_KEY (bypass RLS). L'URL publique de
// confirmation est dérivée de APP_URL env var.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL        = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@aureak.be'
const APP_URL           = Deno.env.get('APP_URL') ?? 'https://app.aureak.be'

const corsHeaders = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildEmailHtml(data: {
  parentName        : string | null
  gardienName       : string
  groupName         : string
  implantationName  : string | null
  sessionDate       : string | null
  confirmUrl        : string
}): string {
  const greeting = data.parentName ? `Bonjour ${escapeHtml(data.parentName)}` : 'Bonjour'
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F3EFE7;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#C1AC5C;padding:24px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px">AUREAK</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">Académie de gardiens de but</div>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:20px;color:#2D2318;margin:0 0 16px">Une place s'est libérée !</h1>
      <p style="font-size:15px;color:#333;line-height:1.6">${greeting},</p>
      <p style="font-size:15px;color:#333;line-height:1.6">
        Une place vient de se libérer dans le groupe <strong>${escapeHtml(data.groupName)}</strong>
        ${data.implantationName ? ` à ${escapeHtml(data.implantationName)}` : ''}.
        ${data.sessionDate ? `La séance a lieu le <strong>${escapeHtml(data.sessionDate)}</strong>.` : ''}
      </p>
      <p style="font-size:15px;color:#333;line-height:1.6">
        Votre gardien <strong>${escapeHtml(data.gardienName)}</strong> peut profiter de cette séance d'essai gratuite.
      </p>
      <div style="background:#FFF8E7;border:1px solid #E8DCB0;border-radius:8px;padding:16px;margin:24px 0">
        <div style="font-size:13px;color:#8B6F1F;font-weight:700">⏰ Vous avez 24 heures pour confirmer</div>
        <div style="font-size:12px;color:#8B6F1F;margin-top:4px">Au-delà, la place sera proposée au prospect suivant.</div>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="${data.confirmUrl}" style="display:inline-block;background:#C1AC5C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
          Confirmer la participation
        </a>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.5;margin-top:32px">
        Si vous ne souhaitez plus participer, vous pouvez ignorer cet email — la place sera proposée automatiquement au prospect suivant.
      </p>
    </div>
    <div style="background:#2D2318;padding:16px 32px;text-align:center">
      <div style="font-size:11px;color:rgba(255,255,255,.6)">Aureak — Académie de gardiens de but</div>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')   return json({ error: 'method_not_allowed' }, 405)

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  let body: { groupId?: string; sessionId?: string; tenantId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const { groupId, sessionId, tenantId } = body
  if (!groupId || !sessionId || !tenantId) {
    return json({ error: 'missing_params' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1. Prochain prospect en waitlist (FIFO)
  const { data: waitlistRows, error: waitlistErr } = await supabase
    .from('trial_waitlist')
    .select('id, child_id, parent_email, confirm_token, implantation_id')
    .eq('group_id', groupId)
    .eq('tenant_id', tenantId)
    .eq('status', 'waiting')
    .is('deleted_at', null)
    .order('requested_at', { ascending: true })
    .limit(1)

  if (waitlistErr) return json({ error: waitlistErr.message }, 500)
  if (!waitlistRows || waitlistRows.length === 0) {
    return json({ ok: true, notified: false, reason: 'no_waiting_prospect' })
  }

  const entry = waitlistRows[0]

  // 2. Infos pour le mail
  const [
    { data: child },
    { data: group },
    { data: session },
  ] = await Promise.all([
    supabase.from('child_directory').select('nom, prenom, parent1_name').eq('id', entry.child_id).maybeSingle(),
    supabase.from('groups').select('name').eq('id', groupId).maybeSingle(),
    supabase.from('sessions').select('scheduled_at').eq('id', sessionId).maybeSingle(),
  ])

  const { data: implantation } = entry.implantation_id
    ? await supabase.from('implantations').select('name').eq('id', entry.implantation_id).maybeSingle()
    : { data: null }

  const gardienName = child
    ? `${child.prenom ?? ''} ${child.nom ?? ''}`.trim() || 'votre gardien'
    : 'votre gardien'

  const sessionDate = session?.scheduled_at
    ? new Date(session.scheduled_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : null

  const confirmUrl = `${APP_URL}/trial-confirm/${entry.confirm_token}`

  // 3. Envoi Resend
  if (!RESEND_API_KEY) {
    if (Deno.env.get('DENO_ENV') !== 'production') console.warn('[notify-waitlist] RESEND_API_KEY missing — skip email send')
  } else {
    const html = buildEmailHtml({
      parentName      : (child?.parent1_name as string | null) ?? null,
      gardienName,
      groupName       : group?.name ?? 'un groupe',
      implantationName: (implantation as { name?: string } | null)?.name ?? null,
      sessionDate,
      confirmUrl,
    })

    const resendRes = await fetch('https://api.resend.com/emails', {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify({
        from   : FROM_EMAIL,
        to     : entry.parent_email,
        subject: `Une place s'est libérée pour ${gardienName} — Aureak`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const errBody = await resendRes.text()
      return json({ error: 'resend_failed', details: errBody }, 502)
    }
  }

  // 4. Update waitlist entry
  const { error: updateErr } = await supabase
    .from('trial_waitlist')
    .update({
      status              : 'notified',
      notified_at         : new Date().toISOString(),
      notified_session_id : sessionId,
    })
    .eq('id', entry.id)

  if (updateErr) return json({ error: updateErr.message }, 500)

  return json({ ok: true, notified: true, waitlistId: entry.id })
})
