import type { Page } from '@playwright/test'

export interface Credentials {
  email   : string
  password: string
}

/**
 * Retourne les credentials pour un rôle depuis les variables d'environnement.
 * Retourne null si les variables ne sont pas configurées.
 */
export function getCredentials(role: 'admin' | 'coach' | 'parent' | 'child'): Credentials | null {
  const map = {
    admin : { email: process.env['E2E_ADMIN_EMAIL'],  password: process.env['E2E_ADMIN_PASSWORD']  },
    coach : { email: process.env['E2E_COACH_EMAIL'],  password: process.env['E2E_COACH_PASSWORD']  },
    parent: { email: process.env['E2E_PARENT_EMAIL'], password: process.env['E2E_PARENT_PASSWORD'] },
    child : { email: process.env['E2E_CHILD_EMAIL'],  password: process.env['E2E_CHILD_PASSWORD']  },
  }
  const c = map[role]
  if (!c?.email || !c?.password) return null
  return { email: c.email, password: c.password }
}

/**
 * Effectue le login via la page /(auth)/login.
 *
 * Sélecteurs React Native Web :
 * - Email   : placeholder "admin@aureak.be" (commun à tous les rôles)
 * - Password: input[type="password"] (secureTextEntry → type=password sur web)
 * - Submit  : texte "Se connecter" (AureakButton → Pressable)
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/(auth)/login')
  await page.waitForSelector('input', { timeout: 10_000 })
  await page.getByPlaceholder('admin@aureak.be').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByText('Se connecter').click()
}
