import { test, expect } from '@playwright/test'

test.describe('Smoke — Aureak Web', () => {
  test('la page d\'accueil charge sans erreur critique', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    // Aucune erreur console critique (exclut les warnings de dev normaux)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Warning:') &&
        !err.includes('DevTools') &&
        !err.includes('favicon')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('la page design-system charge et affiche le titre', async ({ page }) => {
    await page.goto('/design-system')
    await expect(page.getByText('Design System AUREAK')).toBeVisible()
  })
})
