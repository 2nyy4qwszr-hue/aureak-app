/**
 * Tests RBAC Référentiel Pédagogique — Story 2.6
 *
 * Tests d'intégration requis (nécessitent Supabase local + données de test).
 * Skipped automatiquement si les variables d'environnement ne sont pas définies.
 *
 * Pour lancer ces tests localement :
 *   supabase start
 *   TEST_COACH_TOKEN=... TEST_ADMIN_TOKEN=... TEST_PARENT_TOKEN=... TEST_CLUB_TOKEN=... vitest run
 */
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect } from 'vitest'

const SUPABASE_URL  = process.env['SUPABASE_URL']
const ANON_KEY      = process.env['SUPABASE_ANON_KEY']
const COACH_TOKEN   = process.env['TEST_COACH_TOKEN']
const ADMIN_TOKEN   = process.env['TEST_ADMIN_TOKEN']
const PARENT_TOKEN  = process.env['TEST_PARENT_TOKEN']
const CLUB_TOKEN    = process.env['TEST_CLUB_TOKEN']

const hasIntegrationEnv =
  Boolean(SUPABASE_URL) &&
  Boolean(ANON_KEY) &&
  Boolean(COACH_TOKEN) &&
  Boolean(ADMIN_TOKEN) &&
  Boolean(PARENT_TOKEN) &&
  Boolean(CLUB_TOKEN)

function clientAs(token: string) {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

describe('RBAC Référentiel Pédagogique (Story 2.6)', () => {
  // Smoke test : vérifie que la section 2.6 est bien présente dans 00010_rls_policies.sql
  it('00010_rls_policies.sql contient la section Story 2.6', async () => {
    const { readFile } = await import('fs/promises')
    const { dirname, join } = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const migrationPath = join(__dirname, '../../../../supabase/migrations/00010_rls_policies.sql')
    const content = await readFile(migrationPath, 'utf-8')
    expect(content).toContain('STORY 2.6')
    expect(content).toContain('theme_groups')
    expect(content).toContain('quiz_questions')
  })

  it.skipIf(!hasIntegrationEnv)('coach peut SELECT themes sans erreur', async () => {
    const { data, error } = await clientAs(COACH_TOKEN!)
      .from('themes')
      .select('id')
      .limit(1)
    expect(error).toBeNull()
    // data peut être [] si aucune donnée, mais sans erreur de permission
    expect(Array.isArray(data)).toBe(true)
  })

  it.skipIf(!hasIntegrationEnv)('coach ne peut pas INSERT dans themes (erreur 42501)', async () => {
    const { error } = await clientAs(COACH_TOKEN!)
      .from('themes')
      .insert({ name: 'test-rbac', tenant_id: '00000000-0000-0000-0000-000000000000', theme_key: 'test' })
    expect(error).not.toBeNull()
    // PostgreSQL permission denied = code 42501
    expect(error!.code).toBe('42501')
  })

  it.skipIf(!hasIntegrationEnv)('admin peut INSERT + DELETE sur themes', async () => {
    const client = clientAs(ADMIN_TOKEN!)

    const { data: inserted, error: insertError } = await client
      .from('themes')
      .insert({ name: 'RBAC Test 2.6', theme_key: 'rbac-test-2-6' })
      .select()
      .single()

    expect(insertError).toBeNull()
    expect(inserted).not.toBeNull()

    const { error: deleteError } = await client
      .from('themes')
      .delete()
      .eq('id', (inserted as { id: string }).id)

    expect(deleteError).toBeNull()
  })

  it.skipIf(!hasIntegrationEnv)('parent retourne 0 rows sur SELECT themes', async () => {
    const { data, error } = await clientAs(PARENT_TOKEN!)
      .from('themes')
      .select('id')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it.skipIf(!hasIntegrationEnv)('club retourne 0 rows sur SELECT themes', async () => {
    const { data, error } = await clientAs(CLUB_TOKEN!)
      .from('themes')
      .select('id')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})
