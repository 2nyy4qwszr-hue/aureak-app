import { test, expect } from '@playwright/test'
import { loginAs, getCredentials } from './helpers/auth'

const CREDS = getCredentials('parent')

test.describe('Parent — flows critiques', () => {
  test.skip(!CREDS, 'E2E_PARENT_EMAIL / E2E_PARENT_PASSWORD non configurés — test ignoré')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREDS!.email, CREDS!.password)
    await expect(page).toHaveURL(/parent\/dashboard/, { timeout: 15_000 })
  })

  test('dashboard — salutation visible', async ({ page }) => {
    await expect(page.getByText(/Bonjour/)).toBeVisible()
  })

  test('section suivi joueur — visible (avec ou sans joueur lié)', async ({ page }) => {
    // Soit un joueur est affiché, soit l'empty state
    const hasPlayer  = await page.getByText(/Séances|Présences|Assiduité/).isVisible().catch(() => false)
    const emptyState = await page.getByText(/Aucun joueur associé/).isVisible().catch(() => false)
    expect(hasPlayer || emptyState).toBe(true)
  })

  test('navigation vers Mes demandes (tickets)', async ({ page }) => {
    await page.goto('/parent/tickets')
    await expect(page.getByText('Mes demandes')).toBeVisible({ timeout: 10_000 })
  })

  test('zéro erreur JS critique sur le dashboard', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('[api-client]')) {
        errors.push(msg.text())
      }
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})
