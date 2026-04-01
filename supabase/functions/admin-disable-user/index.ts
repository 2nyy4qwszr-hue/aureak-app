// Edge Function: admin-disable-user
// Désactive un compte utilisateur et révoque toutes ses sessions actives.
// Requiert SUPABASE_SERVICE_ROLE_KEY — jamais exposé côté client.
// Seuls les admins peuvent appeler cette fonction.
//
// Corps attendu : { userId: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status : 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return err(405, 'Method not allowed')
  }

  // ── 1. Vérifier les variables d'environnement ──────────────────────────────

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('[admin-disable-user] Missing env vars')
    return err(500, 'Server misconfiguration')
  }

  // ── 2. Authentifier l'appelant ─────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return err(401, 'Missing Authorization header')
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth  : { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()

  if (authError || !callerUser) {
    return err(401, `Unauthorized: ${authError?.message ?? 'invalid token'}`)
  }

  const callerRole = callerUser.app_metadata?.role as string | undefined
  if (callerRole !== 'admin') {
    return err(403, `Forbidden: requires admin role (caller has '${callerRole ?? 'none'}')`)
  }

  // ── 3. Parser le body ──────────────────────────────────────────────────────

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err(400, 'Invalid JSON body')
  }

  const { userId } = body as { userId?: string }
  if (!userId) {
    return err(400, 'userId is required')
  }

  // Ne pas permettre à un admin de se désactiver lui-même
  if (userId === callerUser.id) {
    return err(400, 'Cannot disable your own account')
  }

  // ── 4. Marquer le profil comme disabled ───────────────────────────────────

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: profileError } = await admin
    .from('profiles')
    .update({ status: 'disabled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (profileError) {
    console.error('[admin-disable-user] Profile update error:', profileError)
    return err(500, `Failed to disable profile: ${profileError.message}`)
  }

  // ── 5. Révoquer toutes les sessions actives ────────────────────────────────
  // updateUserById avec ban_duration="none" invalide tous les refresh tokens
  // sans supprimer le compte (contrairement à deleteUser).

  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',  // ~100 ans = ban permanent jusqu'à réactivation
  })

  if (banError) {
    // Non-fatal : le profil est déjà disabled, la RLS bloquera l'accès
    console.warn('[admin-disable-user] Ban error (non-fatal):', banError.message)
  }

  // ── 6. Audit trail ─────────────────────────────────────────────────────────

  const tenantId = callerUser.app_metadata?.tenant_id as string | undefined

  if (tenantId) {
    await admin.from('audit_logs').insert({
      tenant_id  : tenantId,
      user_id    : callerUser.id,
      entity_type: 'profile',
      entity_id  : userId,
      action     : 'user_disabled',
      metadata   : { disabled_by: callerUser.id },
    })
  }

  console.log(`[admin-disable-user] ✓ Disabled userId=${userId} by admin=${callerUser.id}`)

  return ok({ data: { userId, disabled: true } })
})
