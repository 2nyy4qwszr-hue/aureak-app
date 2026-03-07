// Edge Function : Custom Access Token Hook
// Exécutée à chaque émission de JWT (connexion + refresh token)
// Enrichit app_metadata avec { role, tenant_id } depuis la table profiles
// Configurée dans : supabase/config.toml [auth.hook.custom_access_token]
// Dashboard remote : Authentication → Hooks → Custom Access Token

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { user_id, claims } = await req.json()

    // Le hook utilise service_role — jamais exposé côté client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role, tenant_id, status')
      .eq('user_id', user_id)
      .single()

    // Profil absent ou utilisateur désactivé : retourner le JWT sans enrichissement.
    // RLS retournera 0 résultats pour toutes les tables tenant-aware.
    // L'app doit détecter l'absence de role/tenant_id et déclencher signOut().
    if (!profile || profile.status === 'disabled') {
      return new Response(JSON.stringify({ claims }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const enrichedClaims = {
      ...claims,
      app_metadata: {
        ...claims.app_metadata,
        role      : profile.user_role,
        tenant_id : profile.tenant_id,
      },
    }

    return new Response(JSON.stringify({ claims: enrichedClaims }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[custom-access-token-hook] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
