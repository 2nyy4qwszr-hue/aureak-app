import { test, expect } from '@playwright/test'
import { loginAs, getCredentials } from './helpers/auth'

const CREDS = getCredentials('coach')

test.describe('Coach — flows critiques', () => {
  test.skip(!CREDS, 'E2E_COACH_EMAIL / E2E_COACH_PASSWORD non configurés — test ignoré')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREDS!.email, CREDS!.password)
    await expect(page).toHaveURL(/coach\/dashboard/, { timeout: 15_000 })
  })

  test('dashboard — salutation visible', async ({ page }) => {
    await expect(page.getByText(/Bonjour/)).toBeVisible()
  })

  test('navigation Mes séances fonctionne', async ({ page }) => {
    await page.getByText('Mes séances').click()
    await expect(page).toHaveURL(/coach\/sessions/, { timeout: 10_000 })
  })

  test('page séances — bouton "Nouvelle séance" visible', async ({ page }) => {
    await page.goto('/coach/sessions')
    await expect(page.getByText('+ Nouvelle séance')).toBeVisible({ timeout: 10_000 })
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
