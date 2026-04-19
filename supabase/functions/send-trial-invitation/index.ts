// Story 89.4 — Edge Function : send-trial-invitation
// Envoie une invitation séance gratuite au parent d'un gardien prospect via Resend.
//
// Entrée (body JSON) :
//   { childId, parentEmail, parentName?, implantationId?, message? }
//
// Effets :
//   1. Récupère le child_directory + nom/prénom gardien + implantation
//   2. Persiste l'email parent sur la fiche si vide (parent1_email en priorité)
//   3. Construit le HTML brandé Aureak et envoie via Resend
//   4. Insère la ligne `prospect_invitations` (traçabilité)
//   5. Met à jour `child_directory.prospect_status = 'invite'`
//   6. Retourne l'invitation (row) au client
//
// Sécurité : utilise le JWT de l'utilisateur appelant (Resend côté serveur +
// l'insert prospect_invitations est soumis aux policies RLS du tenant).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@aureak.be'

// ── CORS (edge → web) ─────────────────────────────────────────────────────────

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

// ── Email HTML template (aligné sur weekly-digest-coach) ──────────────────────

type EmailData = {
  parentName        : string | null
  gardienName       : string
  implantationName  : string | null
  implantationAddr  : string | null
  customMessage     : string | null
  scoutName         : string
}

function buildEmailHtml(data: EmailData): string {
  const greeting = data.parentName ? `Bonjour ${escapeHtml(data.parentName)}` : 'Bonjour'
  const gardien  = escapeHtml(data.gardienName)
  const implBlock = data.implantationName
    ? `
      <div style="background:#F3EFE7;border-radius:8px;padding:16px;margin:16px 0">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Implantation proposée</div>
        <div style="font-size:15px;font-weight:700;color:#333">${escapeHtml(data.implantationName)}</div>
        ${data.implantationAddr ? `<div style="font-size:13px;color:#666;margin-top:4px">${escapeHtml(data.implantationAddr)}</div>` : ''}
      </div>`
    : ''
  const msgBlock = data.customMessage
    ? `
      <div style="background:#FFF;border:1px solid #f0e8d9;border-radius:8px;padding:16px;margin:16px 0">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Message de ${escapeHtml(data.scoutName)}</div>
        <div style="font-size:14px;color:#333;line-height:1.5;white-space:pre-wrap">${escapeHtml(data.customMessage)}</div>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F3EFE7;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <!-- Header -->
    <div style="background:#C1AC5C;padding:24px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px">AUREAK</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">Académie de gardiens de but</div>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="font-size:16px;color:#333;margin:0 0 16px">${greeting},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px">
        Nous avons repéré le potentiel de <strong>${gardien}</strong> et nous serions ravis de l'accueillir
        pour une <strong>séance gratuite d'essai</strong> à l'académie Aureak.
      </p>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 16px">
        Cette séance permet à ${gardien} de découvrir notre méthode et à nos entraîneurs spécialisés
        gardiens de but de mieux connaître son profil et ses objectifs.
      </p>

      ${implBlock}
      ${msgBlock}

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0 16px">
        <a href="mailto:contact@aureak.be?subject=Séance%20gratuite%20–%20${encodeURIComponent(data.gardienName)}"
           style="display:inline-block;background:#C1AC5C;color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;font-size:14px">
          Répondre pour réserver
        </a>
      </div>

      <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0">
        Pour organiser la séance, répondez directement à cet email ou contactez-nous au
        <a href="mailto:contact@aureak.be" style="color:#C1AC5C">contact@aureak.be</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f0e8d9;font-size:11px;color:#aaa;text-align:center">
      Aureak · Académie gardiens de but · <a href="https://aureak.be" style="color:#C1AC5C">aureak.be</a>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Auth — utiliser le token user pour bénéficier des policies RLS
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  let body: {
    childId        ?: string
    parentEmail    ?: string
    parentName     ?: string | null
    implantationId ?: string | null
    message        ?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { childId, parentEmail } = body
  if (!childId || !parentEmail) {
    return json({ error: 'childId et parentEmail requis' }, 400)
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(parentEmail)) {
    return json({ error: 'Email parent invalide' }, 400)
  }

  // Récupérer l'utilisateur courant
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData?.user) {
    return json({ error: 'Utilisateur non authentifié' }, 401)
  }
  const userId   = authData.user.id
  const tenantId = (authData.user.app_metadata as Record<string, string> | undefined)?.tenant_id
  if (!tenantId) return json({ error: 'tenant_id absent du JWT' }, 401)

  // 1. Charger le child (identité + parents existants)
  const { data: childData, error: childErr } = await supabase
    .from('child_directory')
    .select('id, display_name, nom, prenom, parent1_email, parent2_email')
    .eq('id', childId)
    .is('deleted_at', null)
    .single()

  if (childErr || !childData) {
    return json({ error: 'Gardien introuvable' }, 404)
  }

  const child = childData as Record<string, unknown>
  const fullName = (child.prenom || child.nom)
    ? `${(child.prenom as string | null) ?? ''} ${(child.nom as string | null) ?? ''}`.trim()
    : (child.display_name as string)

  // 2. Optionnel — charger l'implantation choisie
  let implantationName: string | null = null
  let implantationAddr: string | null = null
  if (body.implantationId) {
    const { data: impl } = await supabase
      .from('implantations')
      .select('name, address')
      .eq('id', body.implantationId)
      .is('deleted_at', null)
      .single()
    if (impl) {
      implantationName = (impl.name as string | null) ?? null
      implantationAddr = (impl.address as string | null) ?? null
    }
  }

  // 3. Récupérer le nom de l'expéditeur (scout/admin connecté)
  const { data: scoutProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()
  const scoutName = (scoutProfile?.display_name as string | null) ?? 'l\'équipe Aureak'

  // 4. Persister l'email parent sur le child (si slot vide)
  const hasP1 = !!(child.parent1_email as string | null)
  const hasP2 = !!(child.parent2_email as string | null)
  const updateFields: Record<string, unknown> = { prospect_status: 'invite' }
  if (!hasP1) {
    updateFields.parent1_email = parentEmail
    if (body.parentName) updateFields.parent1_nom = body.parentName
  } else if (!hasP2 && (child.parent1_email as string) !== parentEmail) {
    updateFields.parent2_email = parentEmail
    if (body.parentName) updateFields.parent2_nom = body.parentName
  }

  const { error: updErr } = await supabase
    .from('child_directory')
    .update(updateFields)
    .eq('id', childId)
  if (updErr) {
    console.error('[send-trial-invitation] child update error:', updErr)
  }

  // 5. Envoyer le mail via Resend
  const html = buildEmailHtml({
    parentName      : body.parentName ?? null,
    gardienName     : fullName,
    implantationName,
    implantationAddr,
    customMessage   : body.message ?? null,
    scoutName,
  })
  const subject = `Invitation à une séance gratuite pour ${fullName} — Aureak`

  let resendId: string | null = null
  let status: 'sent' | 'failed' = 'sent'

  const resendRes = await fetch('https://api.resend.com/emails', {
    method : 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify({
      from   : FROM_EMAIL,
      to     : [parentEmail],
      subject,
      html,
    }),
  })

  if (resendRes.ok) {
    const rb = await resendRes.json().catch(() => ({})) as { id?: string }
    resendId = rb.id ?? null
  } else {
    status = 'failed'
    const errBody = await resendRes.text().catch(() => 'unknown')
    console.error('[send-trial-invitation] Resend error:', errBody)
  }

  // 6. Insert trace — même si Resend a échoué, on trace la tentative pour audit
  const { data: inviteRow, error: inviteErr } = await supabase
    .from('prospect_invitations')
    .insert({
      tenant_id       : tenantId,
      child_id        : childId,
      invited_by      : userId,
      parent_email    : parentEmail,
      parent_name     : body.parentName ?? null,
      implantation_id : body.implantationId ?? null,
      message         : body.message ?? null,
      status,
      resend_id       : resendId,
    })
    .select()
    .single()

  if (inviteErr) {
    console.error('[send-trial-invitation] insert invitation error:', inviteErr)
    return json({ error: 'Impossible d\'enregistrer l\'invitation', detail: inviteErr.message }, 500)
  }

  if (status === 'failed') {
    return json({ error: 'Envoi email échoué — invitation tracée en statut failed', invitation: inviteRow }, 500)
  }

  return json({ invitation: inviteRow })
})
