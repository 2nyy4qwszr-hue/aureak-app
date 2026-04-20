// Story 89.3 — Edge Function : notify-rgpd-access-request
// Notifie par email l'admin du tenant + le créateur initial quand un utilisateur
// soumet une demande d'accès aux coordonnées RGPD d'un prospect.
//
// Entrée (body JSON) :
//   { requestId: UUID }
//
// Effets :
//   1. Charge la request + le child + le requester
//   2. Liste les admins du tenant + created_by (créateur initial) du child
//   3. Envoie un email brandé Aureak à chaque destinataire via Resend
//
// Sécurité : utilise le JWT de l'utilisateur appelant (RLS tenant appliquée sur
// la request + les profiles admin).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@aureak.be'
const APP_URL        = Deno.env.get('PUBLIC_APP_URL') ?? 'https://app.aureak.be'

// ── CORS ─────────────────────────────────────────────────────────────────────

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
  recipientName  : string | null
  requesterName  : string
  gardienName    : string
  reason         : string
  requestedAt    : string
  reviewUrl      : string
}

function buildEmailHtml(data: EmailData): string {
  const greeting  = data.recipientName ? `Bonjour ${escapeHtml(data.recipientName)}` : 'Bonjour'
  const requester = escapeHtml(data.requesterName)
  const gardien   = escapeHtml(data.gardienName)
  const reason    = escapeHtml(data.reason)
  const when      = new Date(data.requestedAt).toLocaleString('fr-BE', { dateStyle: 'long', timeStyle: 'short' })

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F3EFE7;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#C1AC5C;padding:24px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px">AUREAK</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">Demande d'accès RGPD</div>
    </div>

    <div style="padding:32px">
      <p style="font-size:16px;color:#333;margin:0 0 16px">${greeting},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px">
        <strong>${requester}</strong> a demandé l'accès aux coordonnées parent du prospect
        <strong>${gardien}</strong>.
      </p>

      <div style="background:#FFF;border:1px solid #f0e8d9;border-radius:8px;padding:16px;margin:16px 0">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Motif de la demande</div>
        <div style="font-size:14px;color:#333;line-height:1.5;white-space:pre-wrap">${reason}</div>
        <div style="font-size:12px;color:#888;margin-top:12px">Demandé le ${when}</div>
      </div>

      <div style="text-align:center;margin:28px 0 16px">
        <a href="${escapeHtml(data.reviewUrl)}"
           style="display:inline-block;background:#C1AC5C;color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;font-size:14px">
          Examiner la demande
        </a>
      </div>

      <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0">
        Cette demande restera en attente tant qu'un administrateur ne l'aura pas approuvée ou rejetée.
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

  // 1. Charger la request + child + requester
  const { data: request, error: reqErr } = await supabase
    .from('prospect_access_requests')
    .select('id, tenant_id, child_id, requester_id, reason, requested_at')
    .eq('id', requestId)
    .is('deleted_at', null)
    .maybeSingle()

  if (reqErr || !request) {
    return json({ error: 'Demande introuvable', detail: reqErr?.message }, 404)
  }

  const { data: child } = await supabase
    .from('child_directory')
    .select('display_name, created_by')
    .eq('id', request.child_id as string)
    .maybeSingle()

  const { data: requester } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('user_id', request.requester_id as string)
    .maybeSingle()

  const gardienName   = (child?.display_name as string | null) ?? 'Prospect inconnu'
  const requesterName = (requester?.display_name as string | null)
    ?? (requester?.email as string | null)
    ?? 'Un utilisateur'

  // 2. Destinataires : admins du tenant + créateur initial
  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, user_role')
    .eq('tenant_id', request.tenant_id as string)
    .eq('user_role', 'admin')

  const recipients = new Map<string, { name: string | null; email: string }>()
  for (const a of (admins ?? []) as Record<string, unknown>[]) {
    const email = a.email as string | null
    if (email) recipients.set(email, { name: (a.display_name as string | null) ?? null, email })
  }

  // Ajouter le créateur initial s'il n'est pas déjà admin
  if (child?.created_by) {
    const { data: creator } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', child.created_by as string)
      .maybeSingle()
    const creatorEmail = creator?.email as string | null
    if (creatorEmail && !recipients.has(creatorEmail)) {
      recipients.set(creatorEmail, {
        name : (creator?.display_name as string | null) ?? null,
        email: creatorEmail,
      })
    }
  }

  if (recipients.size === 0) {
    return json({ ok: true, note: 'Aucun destinataire trouvé' })
  }

  // 3. Envoyer le mail à chaque destinataire
  const reviewUrl = `${APP_URL}/admin/rgpd/prospect-access`
  let sent   = 0
  let failed = 0

  for (const [email, meta] of recipients) {
    const html = buildEmailHtml({
      recipientName: meta.name,
      requesterName,
      gardienName,
      reason       : (request.reason as string) ?? '',
      requestedAt  : (request.requested_at as string) ?? new Date().toISOString(),
      reviewUrl,
    })
    const subject = `[Aureak] Demande d'accès RGPD pour ${gardienName}`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify({
        from   : FROM_EMAIL,
        to     : [email],
        subject,
        html,
      }),
    })
    if (resendRes.ok) {
      sent++
    } else {
      failed++
      const errBody = await resendRes.text().catch(() => 'unknown')
      console.error('[notify-rgpd-access-request] Resend error:', email, errBody)
    }
  }

  return json({ ok: true, sent, failed, recipients: recipients.size })
})
