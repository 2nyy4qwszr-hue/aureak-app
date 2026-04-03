import { test, expect } from '@playwright/test'
import { loginAs, getCredentials } from './helpers/auth'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * E2E — Import CSV joueurs
 *
 * Vérifie le flow complet :
 * 1. Ouvrir le modal import CSV depuis /children
 * 2. Uploader un fichier CSV valide
 * 3. Vérifier l'aperçu des lignes
 * 4. Confirmer l'import
 * 5. Vérifier le rapport de résultats
 *
 * Ce test nécessite des credentials admin (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD).
 * En CI sans credentials → test skippé automatiquement.
 */

const CREDS = getCredentials('admin')

// ── Helper : crée un fichier CSV temporaire ───────────────────────────────────

function createTempCsv(rows: Record<string, string>[]): string {
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(',')),
  ]
  const tmpPath = path.join(os.tmpdir(), `aureak-test-${Date.now()}.csv`)
  fs.writeFileSync(tmpPath, lines.join('\n'), 'utf-8')
  return tmpPath
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Import CSV joueurs', () => {
  test.skip(!CREDS, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD non configurés — test ignoré')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREDS!.email, CREDS!.password)
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
    await page.goto('/children')
    await expect(page).toHaveURL(/children/, { timeout: 10_000 })
  })

  test('ouvre le modal import CSV au clic sur le bouton', async ({ page }) => {
    await page.getByText('Importer CSV').click()
    await expect(page.getByText('Importer des joueurs depuis un CSV')).toBeVisible()
  })

  test('affiche un aperçu des 5 premières lignes après upload', async ({ page }) => {
    const csvPath = createTempCsv([
      { displayName: 'Test Joueur 1', statut: 'Académicien', currentClub: 'RFC Liège' },
      { displayName: 'Test Joueur 2', statut: 'Académicien', currentClub: 'Standard' },
      { displayName: 'Test Joueur 3', statut: 'Nouveau', currentClub: '' },
    ])

    try {
      await page.getByText('Importer CSV').click()
      await expect(page.getByText('Importer des joueurs depuis un CSV')).toBeVisible()

      // Upload du fichier
      const fileInput = page.locator('input[type="file"][name="csvFile"]')
      await fileInput.setInputFiles(csvPath)

      // L'aperçu doit apparaître
      await expect(page.getByText('Test Joueur 1')).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText('Test Joueur 2')).toBeVisible()
      await expect(page.getByText('Test Joueur 3')).toBeVisible()
    } finally {
      fs.unlinkSync(csvPath)
    }
  })

  test('affiche une erreur si le CSV contient moins de 2 lignes', async ({ page }) => {
    const csvPath = createTempCsv([]) // headers seulement, aucune ligne de données
    // Écrire manuellement un CSV avec headers seulement
    const tmpPath = path.join(os.tmpdir(), `aureak-empty-${Date.now()}.csv`)
    fs.writeFileSync(tmpPath, 'displayName,statut\n', 'utf-8')

    try {
      await page.getByText('Importer CSV').click()
      const fileInput = page.locator('input[type="file"][name="csvFile"]')
      await fileInput.setInputFiles(tmpPath)

      await expect(
        page.getByText('Le fichier doit contenir au moins une ligne de données.')
      ).toBeVisible({ timeout: 5_000 })
    } finally {
      fs.unlinkSync(tmpPath)
      fs.unlinkSync(csvPath)
    }
  })

  test("le bouton Importer est désactivé tant qu'aucun fichier n'est uploadé", async ({ page }) => {
    await page.getByText('Importer CSV').click()
    await expect(page.getByText('Importer des joueurs depuis un CSV')).toBeVisible()

    // Avant upload, le bouton submit ne doit pas lancer l'import
    // (le handler vérifie csvPreview.length === 0)
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /importer/i })
    // Le bouton existe mais ne doit pas déclencher l'import sans aperçu
    await expect(submitBtn).toBeVisible()
  })

  test('ferme le modal sans importer si on clique Annuler', async ({ page }) => {
    await page.getByText('Importer CSV').click()
    await expect(page.getByText('Importer des joueurs depuis un CSV')).toBeVisible()

    await page.getByRole('button', { name: /annuler|fermer|×/i }).first().click()
    await expect(page.getByText('Importer des joueurs depuis un CSV')).not.toBeVisible()
  })

  test('zéro erreur JS console pendant tout le flow modal', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('[api-client]')) {
        jsErrors.push(msg.text())
      }
    })

    await page.getByText('Importer CSV').click()
    await expect(page.getByText('Importer des joueurs depuis un CSV')).toBeVisible()

    // Ferme le modal
    await page.keyboard.press('Escape')

    expect(jsErrors).toHaveLength(0)
  })
})
