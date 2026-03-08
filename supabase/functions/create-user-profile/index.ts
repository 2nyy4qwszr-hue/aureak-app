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

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return err(405, 'Method not allowed')
  }

  // ── 1. Validate env ────────────────────────────────────────────────────────

  const supabaseUrl        = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey            = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('[create-user-profile] Missing required env vars:', {
      hasUrl    : !!supabaseUrl,
      hasService: !!serviceRoleKey,
      hasAnon   : !!anonKey,
    })
    return err(500, 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL')
  }

  // ── 2. Authenticate the calling admin ─────────────────────────────────────

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return err(401, 'Missing Authorization header')
  }

  // Use anon client to validate the caller's JWT
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth  : { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()

  if (authError || !callerUser) {
    console.error('[create-user-profile] Auth error:', authError?.message)
    return err(401, `Unauthorized: ${authError?.message ?? 'invalid token'}`)
  }

  const callerRole = callerUser.app_metadata?.role as string | undefined
  if (callerRole !== 'admin') {
    console.error('[create-user-profile] Caller is not admin, role:', callerRole)
    return err(403, `Forbidden: requires admin role (caller has '${callerRole ?? 'none'}')`)
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err(400, 'Invalid JSON body')
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

  // Validate required fields
  if (!mode || (mode !== 'fiche' && mode !== 'invite')) {
    return err(400, "mode must be 'fiche' or 'invite'")
  }
  if (!tenantId) return err(400, 'tenantId is required')
  if (!role)     return err(400, 'role is required')
  if (!firstName || !lastName) {
    return err(400, 'firstName and lastName are required')
  }
  if (mode === 'invite' && !email) {
    return err(400, "email is required in 'invite' mode")
  }

  const displayName = `${firstName} ${lastName}`.trim()

  // ── 4. Build admin Supabase client (service_role) ─────────────────────────

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 5. Create auth user ───────────────────────────────────────────────────

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
        console.error('[create-user-profile] inviteUserByEmail error:', inviteErr)
        return err(400, `Auth invite failed: ${inviteErr?.message ?? 'unknown error'}`)
      }
      userId = inviteData.user.id

    } else {
      // Fiche mode — create a user record without sending any email
      // If no email, use an internal placeholder (Supabase requires unique email)
      const syntheticEmail = email
        ? String(email)
        : `fiche-${crypto.randomUUID()}@no-email.aureak.internal`

      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email        : syntheticEmail,
        email_confirm: true,           // skip email confirmation
        app_metadata : { role, tenant_id: tenantId },
        user_metadata: { display_name: displayName },
      })

      if (createErr || !createData?.user) {
        console.error('[create-user-profile] createUser error:', createErr)
        return err(400, `Auth create failed: ${createErr?.message ?? 'unknown error'}`)
      }
      userId = createData.user.id
    }
  } catch (e) {
    console.error('[create-user-profile] Unexpected auth error:', e)
    return err(500, `Unexpected error during auth user creation: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 6. Insert profile row ─────────────────────────────────────────────────

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
    console.error('[create-user-profile] profiles insert error:', profileErr)
    // Roll back — delete the auth user we just created
    await admin.auth.admin.deleteUser(userId)
    return err(500, `Profile creation failed: ${profileErr.message} (code: ${profileErr.code})`)
  }

  // ── 7. Add child to group (if specified) ─────────────────────────────────

  if (role === 'child' && groupId) {
    const { error: groupErr } = await admin.from('group_members').insert({
      group_id : groupId,
      child_id : userId,
      tenant_id: tenantId,
      joined_at: new Date().toISOString(),
    })
    if (groupErr) {
      // Non-fatal — log but do not fail the whole request
      console.warn('[create-user-profile] group_members insert warning:', groupErr.message)
    }
  }

  // ── 8. Audit log ──────────────────────────────────────────────────────────

  await admin.from('audit_logs').insert({
    tenant_id  : tenantId,
    user_id    : callerUser.id,
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

  console.log(`[create-user-profile] ✓ Created userId=${userId} role=${role} mode=${mode}`)

  return ok({ data: { userId } })
})
