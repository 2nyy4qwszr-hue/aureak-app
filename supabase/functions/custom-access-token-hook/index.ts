// Edge Function: custom-access-token-hook
// Hook Supabase Auth — exécuté à chaque émission de JWT (login + refresh).
// Enrichit app_metadata avec { role, tenant_id } depuis la table profiles.
//
// IMPORTANT : cette fonction est appelée par Supabase Auth internalement,
// pas par les clients. Elle n'accepte pas de preflight CORS.
// Configurer dans Supabase Dashboard :
//   Authentication → Hooks → Custom Access Token → URL de cette fonction
//
// Corps reçu de Supabase Auth :
//   { user_id: string, claims: object }
// Réponse attendue :
//   { claims: object }  ← avec app_metadata enrichi

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Supabase Auth hooks utilisent POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status : 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 1. Parse le payload du hook ────────────────────────────────────────────

  let payload: { user_id: string; claims: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { user_id, claims } = payload

  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id in payload' }), {
      status : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Vérifier les variables d'environnement ──────────────────────────────

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[custom-access-token-hook] Missing env vars:', {
      hasUrl    : !!supabaseUrl,
      hasService: !!serviceRoleKey,
    })
    // Retourner les claims non-enrichis plutôt que de bloquer l'auth
    return new Response(JSON.stringify({ claims }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 3. Lire le profil avec service_role (bypasse RLS) ─────────────────────

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile, error } = await admin
    .from('profiles')
    .select('user_role, tenant_id, status')
    .eq('user_id', user_id)
    .single()

  if (error) {
    // Profil introuvable → retourner claims sans enrichissement
    // (l'utilisateur aura un JWT sans role/tenant_id → RLS bloquera tout accès)
    console.warn('[custom-access-token-hook] Profile not found for user_id:', user_id, error.message)
    return new Response(JSON.stringify({ claims }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 4. Compte désactivé → ne pas injecter de rôle ─────────────────────────

  if (profile.status === 'disabled') {
    console.warn('[custom-access-token-hook] Disabled user attempted login:', user_id)
    // JWT sans role/tenant_id → toutes les RLS policies retourneront 0 résultats
    // useAuthStore détectera l'absence de role → signOut() automatique
    return new Response(JSON.stringify({ claims }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 5. Enrichir app_metadata ───────────────────────────────────────────────

  const enrichedClaims = {
    ...claims,
    app_metadata: {
      ...(claims.app_metadata as Record<string, unknown> ?? {}),
      role     : profile.user_role,
      tenant_id: profile.tenant_id,
    },
  }

  return new Response(JSON.stringify({ claims: enrichedClaims }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
