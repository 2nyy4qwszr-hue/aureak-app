// Smoke tests — vérification de l'API publique de auth.ts
// Valide la signature TypeScript des exports (pas de test d'intégration Supabase)

import { describe, it, expect } from 'vitest'
import * as auth from './auth'

describe('@aureak/api-client — auth exports', () => {
  it('signIn est une fonction exportée', () => {
    expect(typeof auth.signIn).toBe('function')
  })

  it('signOut est une fonction exportée', () => {
    expect(typeof auth.signOut).toBe('function')
  })

  it('getSession est une fonction exportée', () => {
    expect(typeof auth.getSession).toBe('function')
  })

  it('inviteUser est une fonction exportée', () => {
    expect(typeof auth.inviteUser).toBe('function')
  })

  it('disableUser est une fonction exportée', () => {
    expect(typeof auth.disableUser).toBe('function')
  })
})
