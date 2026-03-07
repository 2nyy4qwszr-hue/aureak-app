// Edge Function : create-user-profile
// Crée un utilisateur Auth (fiche locale ou invitation) + profil + child_metadata
// Requiert service_role — jamais exposé côté client
// Appelée depuis packages/api-client/src/admin/profiles.ts via supabase.functions.invoke()

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Vérifier que l'appelant est admin ─────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller || caller.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Lire les paramètres ───────────────────────────────────────────────
    const body = await req.json()
    const {
      mode,           // 'fiche' | 'invite'
      tenantId,
      role,
      firstName,
      lastName,
      email,
      phone,
      internalNotes,
      // Enfant
      birthDate,
      gender,
      strongFoot,
      ageCategory,
      currentClub,
      implantationId,
      groupId,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      parent2FirstName,
      parent2LastName,
      parent2Email,
      parent2Phone,
    } = body

    if (!tenantId || !role) {
      return new Response(JSON.stringify({ error: 'tenantId and role are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Client admin avec service_role ───────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Créer l'utilisateur Auth ──────────────────────────────────────────
    let userId: string

    if (mode === 'invite') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'email is required for invite mode' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        { data: { role, tenant_id: tenantId } },
      )
      if (authError || !authData?.user) {
        return new Response(JSON.stringify({ error: authError?.message ?? 'Auth invite failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = authData.user.id
    } else {
      // mode === 'fiche' : email fantôme, aucun email envoyé
      const ficheEmail = email ||
        `fiche.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@noemail.aureak.local`
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: ficheEmail,
        email_confirm: true,
        user_metadata: { role, tenant_id: tenantId },
      })
      if (authError || !authData?.user) {
        return new Response(JSON.stringify({ error: authError?.message ?? 'Auth create failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = authData.user.id
    }

    // ── Insérer le profil ─────────────────────────────────────────────────
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || null
    const { error: profileError } = await adminClient.from('profiles').insert({
      user_id       : userId,
      tenant_id     : tenantId,
      user_role     : role,
      status        : 'pending',
      display_name  : displayName,
      first_name    : firstName    ?? null,
      last_name     : lastName     ?? null,
      phone         : phone        ?? null,
      internal_notes: internalNotes ?? null,
      invite_status : mode === 'invite' ? 'invited' : 'not_invited',
    })

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Insérer child_metadata (enfant uniquement) ────────────────────────
    if (role === 'child') {
      const { error: metaError } = await adminClient.from('child_metadata').insert({
        child_id          : userId,
        birth_date        : birthDate        ?? null,
        gender            : gender           ?? null,
        strong_foot       : strongFoot       ?? null,
        age_category      : ageCategory      ?? null,
        current_club      : currentClub      ?? null,
        implantation_id   : implantationId   ?? null,
        group_id          : groupId          ?? null,
        parent_first_name : parentFirstName  ?? null,
        parent_last_name  : parentLastName   ?? null,
        parent_email      : parentEmail      ?? null,
        parent_phone      : parentPhone      ?? null,
        parent2_first_name: parent2FirstName ?? null,
        parent2_last_name : parent2LastName  ?? null,
        parent2_email     : parent2Email     ?? null,
        parent2_phone     : parent2Phone     ?? null,
      })

      if (metaError) {
        console.warn('[create-user-profile] child_metadata insert error:', metaError)
        // Non-fatal: le profil est créé, les métadonnées peuvent être ajoutées plus tard
      }
    }

    return new Response(JSON.stringify({ data: { userId } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[create-user-profile] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
