import { test, expect } from '@playwright/test'
import { loginAs, getCredentials } from './helpers/auth'

const CREDS = getCredentials('admin')

test.describe('Admin — flows critiques', () => {
  test.skip(!CREDS, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD non configurés — test ignoré')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREDS!.email, CREDS!.password)
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
  })

  test('dashboard — "Tableau de bord" visible', async ({ page }) => {
    await expect(page.getByText('Tableau de bord')).toBeVisible()
  })

  test('navigation Séances fonctionne', async ({ page }) => {
    await page.getByText('Séances').first().click()
    await expect(page).toHaveURL(/seances/, { timeout: 10_000 })
  })

  test('navigation Joueurs fonctionne', async ({ page }) => {
    await page.getByText('Joueurs').click()
    await expect(page).toHaveURL(/children/, { timeout: 10_000 })
  })

  test('navigation Thèmes fonctionne', async ({ page }) => {
    await page.getByText('Thèmes').click()
    await expect(page).toHaveURL(/methodologie\/themes/, { timeout: 10_000 })
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
