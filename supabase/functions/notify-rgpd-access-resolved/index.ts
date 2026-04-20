// Story 89.3 — Edge Function : notify-rgpd-access-resolved
// Notifie par email le requester quand sa demande d'accès RGPD est résolue
// (approved / rejected).
//
// Entrée (body JSON) :
//   { requestId: UUID }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@aureak.be'
const APP_URL        = Deno.env.get('PUBLIC_APP_URL') ?? 'https://app.aureak.be'

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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ── Template email ───────────────────────────────────────────────────────────

type EmailData = {
  requesterName  : string | null
  gardienName    : string
  status         : 'approved' | 'rejected'
  note           : string | null
  prospectUrl    : string
}

function buildEmailHtml(data: EmailData): string {
  const greeting = data.requesterName ? `Bonjour ${escapeHtml(data.requesterName)}` : 'Bonjour'
  const gardien  = escapeHtml(data.gardienName)
  const approved = data.status === 'approved'
  const headline = approved
    ? `Votre demande d'accès a été <strong>approuvée</strong>.`
    : `Votre demande d'accès a été <strong>rejetée</strong>.`
  const accent = approved ? '#44944A' : '#B6443F'
  const ctaLabel = approved ? 'Consulter la fiche' : 'Retour à la plateforme'

  const noteBlock = data.note
    ? `
      <div style="background:#FFF;border:1px solid #f0e8d9;border-radius:8px;padding:16px;margin:16px 0">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Note de l'administrateur</div>
        <div style="font-size:14px;color:#333;line-height:1.5;white-space:pre-wrap">${escapeHtml(data.note)}</div>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F3EFE7;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:${accent};padding:24px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px">AUREAK</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">Réponse à votre demande d'accès</div>
    </div>

    <div style="padding:32px">
      <p style="font-size:16px;color:#333;margin:0 0 16px">${greeting},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px">
        ${headline} Le prospect concerné est <strong>${gardien}</strong>.
      </p>

      ${noteBlock}

      <div style="text-align:center;margin:28px 0 16px">
        <a href="${escapeHtml(data.prospectUrl)}"
           style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;font-size:14px">
          ${ctaLabel}
        </a>
      </div>

      <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0">
        ${approved
          ? 'Les coordonnées parent du prospect sont désormais visibles pour vous directement sur sa fiche.'
          : 'Si vous pensez que votre demande nécessite une révision, recontactez un administrateur.'}
      </p>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #f0e8d9;font-size:11px;color:#aaa;text-align:center">
      Aureak · Académie gardiens de but · <a href="https://aureak.be" style="color:#C1AC5C">aureak.be</a>
    </div>
  </div>
</body>
</html>`
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  let body: { requestId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { requestId } = body
  if (!requestId) return json({ error: 'requestId requis' }, 400)

  // Charger la request (status + requester + child)
  const { data: request, error: reqErr } = await supabase
    .from('prospect_access_requests')
    .select('id, status, child_id, requester_id, resolved_note')
    .eq('id', requestId)
    .is('deleted_at', null)
    .maybeSingle()
  if (reqErr || !request) {
    return json({ error: 'Demande introuvable', detail: reqErr?.message }, 404)
  }

  const status = request.status as string
  if (status !== 'approved' && status !== 'rejected') {
    return json({ ok: true, note: 'Statut non résolu — aucune notification envoyée' })
  }

  const { data: requester } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('user_id', request.requester_id as string)
    .maybeSingle()

  const requesterEmail = requester?.email as string | null
  if (!requesterEmail) {
    return json({ ok: true, note: 'Requester sans email — aucune notification envoyée' })
  }

  const { data: child } = await supabase
    .from('child_directory')
    .select('display_name')
    .eq('id', request.child_id as string)
    .maybeSingle()

  const gardienName = (child?.display_name as string | null) ?? 'le prospect concerné'

  const prospectUrl = `${APP_URL}/children/${request.child_id}`
  const html = buildEmailHtml({
    requesterName: (requester?.display_name as string | null) ?? null,
    gardienName,
    status       : status as 'approved' | 'rejected',
    note         : (request.resolved_note as string | null) ?? null,
    prospectUrl,
  })
  const subject = status === 'approved'
    ? `[Aureak] Demande d'accès approuvée — ${gardienName}`
    : `[Aureak] Demande d'accès rejetée — ${gardienName}`

  const resendRes = await fetch('https://api.resend.com/emails', {
    method : 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify({
      from   : FROM_EMAIL,
      to     : [requesterEmail],
      subject,
      html,
    }),
  })
  if (!resendRes.ok) {
    const errBody = await resendRes.text().catch(() => 'unknown')
    console.error('[notify-rgpd-access-resolved] Resend error:', errBody)
    return json({ error: 'Envoi email échoué', detail: errBody }, 500)
  }

  return json({ ok: true })
})
