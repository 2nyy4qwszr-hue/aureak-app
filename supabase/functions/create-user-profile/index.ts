// Edge Function: create-user-profile
// Crée un profil utilisateur (fiche locale) ou invite par email.
// Requiert SUPABASE_SERVICE_ROLE_KEY dans les secrets du projet.
// Seuls les admins peuvent appeler cette fonction.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ───────────────────────────────────────────────────────────────────────

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

function err(status: number, message: string, step?: string): Response {
  const body = step ? { error: message, step } : { error: message }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  console.log('[create-user-profile] step: 0 — request received', req.method)

  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return err(405, 'Method not allowed')
  }

  // ── 1. Validate env ────────────────────────────────────────────────────────

  console.log('[create-user-profile] step: 1 — validating env vars')

  const supabaseUrl        = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey            = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('[create-user-profile] Missing required env vars:', {
      hasUrl    : !!supabaseUrl,
      hasService: !!serviceRoleKey,
      hasAnon   : !!anonKey,
    })
    return err(500, 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL', 'env-check')
  }

  console.log('[create-user-profile] step: 1 — env vars OK')

  // ── 2. Authenticate the calling admin ─────────────────────────────────────

  console.log('[create-user-profile] step: 2 — authenticating caller')

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error('[create-user-profile] step: 2 — missing Authorization header')
    return err(401, 'Missing Authorization header', 'auth-header')
  }

  // Use anon client to validate the caller's JWT
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth  : { autoRefreshToken: false, persistSession: false },
  })

  let callerUser: Awaited<ReturnType<typeof callerClient.auth.getUser>>['data']['user']

  try {
    const { data: { user }, error: authError } = await callerClient.auth.getUser()
    if (authError || !user) {
      console.error('[create-user-profile] step: 2 — getUser error:', authError?.message)
      return err(401, `Unauthorized: ${authError?.message ?? 'invalid token'}`, 'auth-getuser')
    }
    callerUser = user
    console.log('[create-user-profile] step: 2 — caller authenticated, userId:', user.id)
  } catch (e) {
    console.error('[create-user-profile] step: 2 — unexpected getUser exception:', e)
    return err(500, `Auth check failed: ${e instanceof Error ? e.message : String(e)}`, 'auth-exception')
  }

  // ── 3. Role check ──────────────────────────────────────────────────────────
  //
  // getUser() reads auth.users.raw_app_meta_data (not JWT claims).
  // The custom-access-token-hook only enriches JWT claims, not raw_app_meta_data.
  // → If app_metadata.role is missing from getUser(), decode the JWT directly.
  // → Also check user_metadata.role as a last resort (useful in local dev).

  console.log('[create-user-profile] step: 3 — role check')
  console.log('[create-user-profile] app_metadata:', JSON.stringify(callerUser!.app_metadata ?? {}))
  console.log('[create-user-profile] user_metadata:', JSON.stringify(callerUser!.user_metadata ?? {}))

  let callerRole: string | undefined = callerUser!.app_metadata?.role as string | undefined

  if (!callerRole) {
    console.log('[create-user-profile] step: 3 — app_metadata.role missing, trying JWT decode')
    try {
      const token      = authHeader.replace(/^Bearer /i, '')
      const payloadB64 = token.split('.')[1]
      const payload    = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
      console.log('[create-user-profile] step: 3 — JWT payload keys:', Object.keys(payload).join(', '))
      callerRole = (payload?.app_metadata as { role?: string } | undefined)?.role
        ?? (payload?.user_metadata as { role?: string } | undefined)?.role
        ?? (payload?.role as string | undefined)
    } catch (e) {
      console.error('[create-user-profile] step: 3 — JWT decode failed:', e)
      // callerRole stays undefined → 403 below
    }
  }

  if (!callerRole) {
    // Last resort: check user_metadata from getUser() result
    callerRole = callerUser!.user_metadata?.role as string | undefined
    if (callerRole) {
      console.log('[create-user-profile] step: 3 — role found in user_metadata:', callerRole)
    }
  }

  console.log('[create-user-profile] callerRole:', callerRole ?? 'none')

  if (callerRole !== 'admin') {
    console.error('[create-user-profile] step: 3 — UNAUTHORIZED: callerRole=', callerRole)
    return err(403, `Forbidden: requires admin role (caller has '${callerRole ?? 'none'}')`, 'role-check')
  }

  console.log('[create-user-profile] step: 3 — role check passed (admin)')

  // ── 4. Parse body ─────────────────────────────────────────────────────────

  console.log('[create-user-profile] step: 4 — parsing body')

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch (e) {
    console.error('[create-user-profile] step: 4 — JSON parse error:', e)
    return err(400, 'Invalid JSON body', 'body-parse')
  }

  const {
    mode,
    tenantId,
    role,
    firstName,
    lastName,
    email,
    phone,
    internalNotes,
    // Child-specific
    birthDate,
    gender,
    strongFoot,
    ageCategory,
    currentClub,
    implantationId,
    groupId,
    parentFirstName, parentLastName, parentEmail, parentPhone,
    parent2FirstName, parent2LastName, parent2Email, parent2Phone,
  } = body

  console.log('[create-user-profile] step: 4 — body parsed, mode:', mode, 'role:', role, 'tenantId:', tenantId)

  // Validate required fields
  if (!mode || (mode !== 'fiche' && mode !== 'invite')) {
    return err(400, "mode must be 'fiche' or 'invite'", 'body-validate')
  }
  if (!tenantId) return err(400, 'tenantId is required', 'body-validate')
  if (!role)     return err(400, 'role is required', 'body-validate')
  if (!firstName || !lastName) {
    return err(400, 'firstName and lastName are required', 'body-validate')
  }
  if (mode === 'invite' && !email) {
    return err(400, "email is required in 'invite' mode", 'body-validate')
  }

  const displayName = `${firstName} ${lastName}`.trim()

  // ── 5. Build admin Supabase client (service_role) ─────────────────────────

  console.log('[create-user-profile] step: 5 — building admin client')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 6. Create auth user ───────────────────────────────────────────────────

  console.log('[create-user-profile] step: 6 — creating auth user, mode:', mode)

  let userId: string

  try {
    if (mode === 'invite') {
      // Send magic link / password setup email
      const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
        email as string,
        {
          data: {
            role     : role,
            tenant_id: tenantId,
          },
        },
      )
      if (inviteErr || !inviteData?.user) {
        console.error('[create-user-profile] step: 6 — inviteUserByEmail error:', inviteErr)
        return err(400, `Auth invite failed: ${inviteErr?.message ?? 'unknown error'}`, 'auth-invite')
      }
      userId = inviteData.user.id
      console.log('[create-user-profile] step: 6 — invite sent, userId:', userId)

    } else {
      // Fiche mode — create a user record without sending any email
      // If no email, use an internal placeholder (Supabase requires unique email)
      const syntheticEmail = email
        ? String(email)
        : `fiche-${crypto.randomUUID()}@no-email.aureak.internal`

      console.log('[create-user-profile] step: 6 — createUser, syntheticEmail:', syntheticEmail ? '[provided]' : '[synthetic]')

      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email        : syntheticEmail,
        email_confirm: true,           // skip email confirmation
        app_metadata : { role, tenant_id: tenantId },
        user_metadata: { display_name: displayName },
      })

      if (createErr || !createData?.user) {
        console.error('[create-user-profile] step: 6 — createUser error:', createErr)
        return err(400, `Auth create failed: ${createErr?.message ?? 'unknown error'}`, 'auth-create')
      }
      userId = createData.user.id
      console.log('[create-user-profile] step: 6 — user created, userId:', userId)
    }
  } catch (e) {
    console.error('[create-user-profile] step: 6 — unexpected auth error:', e)
    return err(500, `Unexpected error during auth user creation: ${e instanceof Error ? e.message : String(e)}`, 'auth-exception')
  }

  // ── 7. Insert profile row ─────────────────────────────────────────────────

  console.log('[create-user-profile] step: 7 — inserting profile row')

  const profilePayload: Record<string, unknown> = {
    user_id     : userId,
    tenant_id   : tenantId,
    user_role   : role,
    display_name: displayName,
    status      : mode === 'invite' ? 'pending' : 'active',
  }

  // Child-specific columns — add them if the table supports them.
  // These columns are expected from migration 00003+ (child profile extension).
  if (role === 'child') {
    if (phone)          profilePayload.phone           = phone
    if (birthDate)      profilePayload.birth_date      = birthDate
    if (gender)         profilePayload.gender          = gender
    if (strongFoot)     profilePayload.strong_foot     = strongFoot
    if (ageCategory)    profilePayload.age_category    = ageCategory
    if (currentClub)    profilePayload.current_club    = currentClub
    if (internalNotes)  profilePayload.internal_notes  = internalNotes
    if (parentFirstName)  profilePayload.parent_first_name  = parentFirstName
    if (parentLastName)   profilePayload.parent_last_name   = parentLastName
    if (parentEmail)      profilePayload.parent_email       = parentEmail
    if (parentPhone)      profilePayload.parent_phone       = parentPhone
    if (parent2FirstName) profilePayload.parent2_first_name = parent2FirstName
    if (parent2LastName)  profilePayload.parent2_last_name  = parent2LastName
    if (parent2Email)     profilePayload.parent2_email      = parent2Email
    if (parent2Phone)     profilePayload.parent2_phone      = parent2Phone
  } else {
    if (phone)         profilePayload.phone          = phone
    if (internalNotes) profilePayload.internal_notes = internalNotes
  }

  const { error: profileErr } = await admin.from('profiles').insert(profilePayload)

  if (profileErr) {
    console.error('[create-user-profile] step: 7 — profiles insert error:', profileErr)
    // Roll back — delete the auth user we just created
    await admin.auth.admin.deleteUser(userId)
    return err(500, `Profile creation failed: ${profileErr.message} (code: ${profileErr.code})`, 'profile-insert')
  }

  console.log('[create-user-profile] step: 7 — profile row inserted')

  // ── 8. Add child to group (if specified) ─────────────────────────────────

  if (role === 'child' && groupId) {
    console.log('[create-user-profile] step: 8 — adding child to group:', groupId)
    const { error: groupErr } = await admin.from('group_members').insert({
      group_id : groupId,
      child_id : userId,
      tenant_id: tenantId,
      joined_at: new Date().toISOString(),
    })
    if (groupErr) {
      // Non-fatal — log but do not fail the whole request
      console.warn('[create-user-profile] step: 8 — group_members insert warning:', groupErr.message)
    } else {
      console.log('[create-user-profile] step: 8 — child added to group')
    }
  }

  // ── 9. Audit log ──────────────────────────────────────────────────────────

  console.log('[create-user-profile] step: 9 — writing audit log')

  await admin.from('audit_logs').insert({
    tenant_id  : tenantId,
    user_id    : callerUser!.id,
    entity_type: 'profile',
    entity_id  : userId,
    action     : mode === 'invite' ? 'user_invited' : 'user_fiche_created',
    metadata   : {
      role,
      display_name: displayName,
      email       : email ?? null,
      mode,
    },
  })

  console.log(`[create-user-profile] step: 9 — done. userId=${userId} role=${role} mode=${mode}`)

  return ok({ data: { userId } })
})
