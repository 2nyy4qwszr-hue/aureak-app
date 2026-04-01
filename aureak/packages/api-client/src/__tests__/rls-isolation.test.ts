// Test d'intégration RLS — isolation cross-tenant
// PRÉREQUIS : Supabase local démarré (`supabase start`) avec données de seed
// Variables d'env requises (ignorées si absentes — test skippé automatiquement) :
//   TEST_TENANT_A_JWT       JWT d'un utilisateur actif du tenant A
//   TEST_TENANT_A_ID        UUID du tenant A
//   TEST_TENANT_B_JWT       JWT d'un utilisateur actif du tenant B
//   TEST_DISABLED_USER_JWT  JWT d'un utilisateur désactivé (status=disabled)
//
// Seed : supabase/seed.ts (à créer) — crée les deux tenants + users de test

import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Ces tests nécessitent un Supabase local en cours d'exécution.
// Ils sont skippés automatiquement si les env vars ne sont pas définies (CI sans Docker).
const SUPABASE_URL      = process.env['SUPABASE_URL']
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY']
const TENANT_A_JWT      = process.env['TEST_TENANT_A_JWT']
const TENANT_A_ID       = process.env['TEST_TENANT_A_ID']
const TENANT_B_JWT      = process.env['TEST_TENANT_B_JWT']
const DISABLED_USER_JWT = process.env['TEST_DISABLED_USER_JWT']

const hasIntegrationEnv = !!(SUPABASE_URL && SUPABASE_ANON_KEY && TENANT_A_JWT && TENANT_B_JWT)

function makeClient(jwt: string) {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
}

describe('RLS — isolation cross-tenant', () => {
  it.skipIf(!hasIntegrationEnv)(
    'tenant A ne voit pas les profiles de tenant B',
    async () => {
      const clientA = makeClient(TENANT_A_JWT!)
      const { data, error } = await clientA
        .from('profiles')
        .select('user_id, tenant_id')
        .limit(200)

      expect(error).toBeNull()
      // Toutes les lignes retournées appartiennent au tenant A
      expect(data?.every((p) => p.tenant_id === TENANT_A_ID)).toBe(true)
    },
  )

  it.skipIf(!hasIntegrationEnv)(
    'tenant B ne voit pas les profiles de tenant A',
    async () => {
      const clientB = makeClient(TENANT_B_JWT!)
      const { data, error } = await clientB
        .from('profiles')
        .select('user_id, tenant_id')
        .limit(200)

      expect(error).toBeNull()
      // Aucun profil du tenant A ne doit apparaître
      expect(data?.some((p) => p.tenant_id === TENANT_A_ID)).toBe(false)
    },
  )

  it.skipIf(!hasIntegrationEnv || !DISABLED_USER_JWT)(
    'utilisateur désactivé (status=disabled) retourne 0 rows sur profiles',
    async () => {
      const clientDisabled = makeClient(DISABLED_USER_JWT!)
      const { data, error } = await clientDisabled.from('profiles').select('*')

      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    },
  )

  it.skipIf(!hasIntegrationEnv || !DISABLED_USER_JWT)(
    'utilisateur désactivé retourne 0 rows sur coach_implantation_assignments',
    async () => {
      const clientDisabled = makeClient(DISABLED_USER_JWT!)
      const { data, error } = await clientDisabled
        .from('coach_implantation_assignments')
        .select('*')

      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    },
  )
})

// Tests unitaires (sans Supabase) — vérifient que les helpers d'isolation existent bien dans l'API
import { readdir, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '../../../../../supabase/migrations')

describe('RLS — vérification structure policies (smoke)', () => {
  it('les migrations existent dans le repo', async () => {
    const files = await readdir(migrationsDir)
    expect(files).toContain('00090_rls_policies_complete.sql')
    expect(files).toContain('00003_create_profiles.sql')
  })

  it('00090_rls_policies_complete.sql contient les fonctions durcies', async () => {
    const content = await readFile(join(migrationsDir, '00090_rls_policies_complete.sql'), 'utf8')
    expect(content).toContain('is_active_user()')
    expect(content).toContain('current_tenant_id()')
    expect(content).toContain('current_user_role()')
    expect(content).toContain('REVOKE ALL ON FUNCTION')
    expect(content).toContain('coach_implantation_assignments')
  })
})
