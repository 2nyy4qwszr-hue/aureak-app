/**
 * setup-e2e-users.mjs
 * Crée ou met à jour les utilisateurs de test E2E pour Aureak.
 *
 * Usage :
 *   cd scripts && npm install && node setup-e2e-users.mjs
 *
 * Requiert dans aureak/.env (ou variables d'environnement) :
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   E2E_TENANT_ID  (optionnel — auto-détecté si absent)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ── Chargement du .env ─────────────────────────────────────────────────────
function loadEnv(envPath) {
  try {
    const raw = readFileSync(envPath, 'utf-8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^([^=\s#][^=\s]*)\s*=\s*(.*)$/)
      if (!match) continue
      const [, key, val] = match
      if (!process.env[key]) {
        process.env[key] = val.replace(/^(['"])(.*)\1$/, '$2').trim()
      }
    }
  } catch {
    // fichier absent — on continue avec process.env
  }
}

loadEnv(join(__dirname, '../aureak/.env'))

// ── Variables d'environnement ──────────────────────────────────────────────
const SUPABASE_URL             = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const E2E_TENANT_ID            = process.env.E2E_TENANT_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌  Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.')
  console.error('   → Renseignez-les dans aureak/.env ou en variables d\'environnement.\n')
  process.exit(1)
}

// ── Utilisateurs de test ───────────────────────────────────────────────────
const TEST_USERS = [
  { email: 'admin@test.com',  password: 'Test1234!',  role: 'admin',  displayName: 'Admin E2E'  },
  { email: 'coach@test.com',  password: 'Test1234!',  role: 'coach',  displayName: 'Coach E2E'  },
  { email: 'parent@test.com', password: 'Test1234!',  role: 'parent', displayName: 'Parent E2E' },
]

// ── Client Supabase (service role — bypasse RLS) ───────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers logs ───────────────────────────────────────────────────────────
const log = {
  ok:    (msg) => console.log(`  ✅  ${msg}`),
  error: (msg) => console.log(`  ❌  ${msg}`),
  info:  (msg) => console.log(`  ℹ️   ${msg}`),
}

// ── Vérification que la table profiles existe ──────────────────────────────
async function checkProfilesTableExists() {
  const { error } = await supabase.from('profiles').select('user_id').limit(1)
  if (error && error.code === '42P01') {
    log.error('La table "profiles" n\'existe pas.')
    console.error('   → Exécutez d\'abord les migrations : supabase db push\n')
    process.exit(1)
  }
  if (error) {
    // Toute autre erreur (RLS, réseau) est non-bloquante ici
    log.info(`Vérification profiles : ${error.message}`)
    return
  }
  log.ok('Table "profiles" vérifiée.')
}

// ── Récupération du tenant ─────────────────────────────────────────────────
async function getTenantId() {
  if (E2E_TENANT_ID) {
    log.info(`Tenant forcé via E2E_TENANT_ID : ${E2E_TENANT_ID}`)
    return E2E_TENANT_ID
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !data) {
    log.error(`Impossible de récupérer le tenant : ${error?.message ?? 'aucun résultat'}`)
    console.error('   → Créez un tenant ou renseignez E2E_TENANT_ID dans aureak/.env\n')
    process.exit(1)
  }

  log.info(`Tenant auto-détecté : "${data.name}" (${data.id})`)
  return data.id
}

// ── Recherche d'un utilisateur existant par email ─────────────────────────
async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error(`listUsers : ${error.message}`)
  return data.users.find((u) => u.email === email) ?? null
}

// ── Création ou mise à jour de l'utilisateur auth ─────────────────────────
// Toujours : email_confirm = true + app_metadata avec role et tenant_id
async function upsertAuthUser(email, password, role, tenantId) {
  const existing = await findUserByEmail(email)

  const metadata = { role, tenant_id: tenantId }

  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata:  metadata,
    })
    if (error) throw new Error(`createUser(${email}) : ${error.message}`)
    log.ok(`Auth créé : ${email}`)
    return data.user
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata:  metadata,
  })
  if (error) throw new Error(`updateUser(${email}) : ${error.message}`)
  log.ok(`Auth mis à jour : ${email}`)
  return data.user
}

// ── Upsert dans la table profiles ─────────────────────────────────────────
// status = 'active' explicitement (le trigger handle_user_confirmation
// ne tire que sur UPDATE auth.users, pas sur INSERT)
async function upsertProfile(userId, tenantId, role, displayName) {
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id:      userId,
      tenant_id:    tenantId,
      user_role:    role,
      status:       'active',
      display_name: displayName,
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`upsertProfile(${userId}) : ${error.message}`)
  log.ok(`Profile actif : ${displayName} [${role}]`)
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Setup E2E users — Aureak')
  console.log(`   URL : ${SUPABASE_URL}\n`)

  await checkProfilesTableExists()
  const tenantId = await getTenantId()

  let success = 0
  let failure  = 0

  for (const user of TEST_USERS) {
    console.log(`\n── ${user.email}`)
    try {
      const authUser = await upsertAuthUser(user.email, user.password, user.role, tenantId)
      await upsertProfile(authUser.id, tenantId, user.role, user.displayName)
      success++
    } catch (err) {
      log.error(err.message)
      failure++
    }
  }

  console.log('\n─────────────────────────────────────────')
  console.log(`✅  ${success} utilisateur(s) configuré(s)`)
  if (failure > 0) {
    console.log(`❌  ${failure} erreur(s) — voir les détails ci-dessus`)
    process.exit(1)
  }
  console.log('')
}

main()
