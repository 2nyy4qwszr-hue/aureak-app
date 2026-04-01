import { test, expect } from '@playwright/test'
import { loginAs, getCredentials } from './helpers/auth'

const CREDS = getCredentials('child')

test.describe('Child — flows critiques', () => {
  test.skip(!CREDS, 'E2E_CHILD_EMAIL / E2E_CHILD_PASSWORD non configurés — test ignoré')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREDS!.email, CREDS!.password)
    await expect(page).toHaveURL(/child\/dashboard/, { timeout: 15_000 })
  })

  test('dashboard — salutation visible', async ({ page }) => {
    await expect(page.getByText(/Bonjour/)).toBeVisible()
  })

  test('page Quiz accessible', async ({ page }) => {
    await page.goto('/child/quiz')
    await expect(page).toHaveURL(/child\/quiz/, { timeout: 10_000 })
  })

  test('page Progression accessible', async ({ page }) => {
    await page.goto('/child/progress')
    await expect(page).toHaveURL(/child\/progress/, { timeout: 10_000 })
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
