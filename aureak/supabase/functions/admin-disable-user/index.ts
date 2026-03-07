// Edge Function : admin-disable-user
// Révoque toutes les sessions actives d'un utilisateur (requiert service_role)
// Appelée depuis packages/api-client/src/auth.ts via supabase.functions.invoke()
// RÈGLE : seul l'admin peut appeler cette fonction (vérifié via JWT claim)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Vérifier que l'appelant est un admin (via JWT du contexte)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Client avec la clé du JWT appelant (pour vérifier le rôle)
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller || caller.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Client avec service_role pour les opérations admin
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Mettre à jour le profil
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'disabled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (profileError) {
      console.error('[admin-disable-user] Profile update error:', profileError)
      return new Response(JSON.stringify({ error: 'Failed to disable profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Révoquer toutes les sessions actives
    // auth.admin.deleteUser() supprime l'utilisateur — utiliser signOut via admin API
    // Supabase v2: invalidateAllRefreshTokens via admin endpoint
    const { error: signOutError } = await adminClient.auth.admin.signOut(userId, 'others')

    if (signOutError) {
      // Non-fatal : le profil est déjà désactivé, le hook JWT bloquera le prochain refresh
      console.warn('[admin-disable-user] Session revocation warning:', signOutError)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[admin-disable-user] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
