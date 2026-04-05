# Story 60.7 : Analytics — Export rapport PDF mensuel académie

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux générer et télécharger un rapport PDF mensuel de l'académie incluant les stats globales, les chiffres par groupe et le top joueurs,
Afin de partager un bilan professionnel avec les clubs partenaires ou les parents.

## Acceptance Criteria

**AC1 — Bouton "Exporter PDF" dans Stats Room**
- **Given** l'admin est sur `/analytics`
- **When** il clique sur "Exporter PDF mensuel"
- **Then** une modale s'ouvre avec : sélecteur du mois cible, sélecteur implantation (ou "Toutes"), case à cocher sections incluses (Présences, Progression, Top joueurs)

**AC2 — Génération PDF A4 côté client**
- **And** au clic "Générer", le PDF est généré côté client via `jspdf` + `html2canvas` (CDN dynamique ou npm)
- **And** le PDF A4 portrait inclut : header Aureak (logo texte + date), section stats globales, tableau par groupe, top 10 joueurs, pied de page avec date de génération

**AC3 — Contenu rapport**
- **And** le rapport contient : taux de présence global, nb séances du mois, nb joueurs actifs, tableau par groupe (nom, séances, taux présence, note maîtrise moyenne), top 5 joueurs par présence

**AC4 — Mise en page premium**
- **And** le PDF utilise la typographie Montserrat (si disponible) ou Helvetica, fond blanc, accents or `#C9A84C`, séparateurs fins gris, valeurs colorées selon seuils

**AC5 — Nom de fichier explicite**
- **And** le fichier téléchargé est nommé `aureak-rapport-[YYYY-MM]-[implantation].pdf` (ex. `aureak-rapport-2026-04-all.pdf`)

**AC6 — État de chargement**
- **And** pendant la génération (peut prendre 2-4s), un spinner s'affiche sur le bouton "Générer" avec le texte "Génération..."
- **And** le try/finally garantit que le spinner disparaît même en cas d'erreur

**AC7 — Fallback message d'erreur**
- **And** si la génération échoue (jspdf non disponible, données vides), un message toast s'affiche : "Impossible de générer le PDF — vérifiez votre connexion"

## Tasks / Subtasks

- [ ] Task 1 — Installer `jspdf` dans `apps/web` (AC: #2)
  - [ ] 1.1 `cd aureak && npm install jspdf --workspace=apps/web`
  - [ ] 1.2 Vérifier compatibilité avec Expo Router web (import dynamique si nécessaire)

- [ ] Task 2 — Créer `generateMonthlyReport.ts` dans `apps/web/app/(admin)/analytics/` (AC: #2, #3, #4, #5)
  - [ ] 2.1 Fonction `generateMonthlyReport(data: MonthlyReportData, options: ReportOptions): Promise<void>`
  - [ ] 2.2 Construire le PDF section par section : header, stats globales, tableau groupes, top joueurs
  - [ ] 2.3 Appliquer couleurs or/vert/rouge selon valeurs (réutiliser logique `getStatColor`)
  - [ ] 2.4 `doc.save(filename)` pour déclencher le téléchargement

- [ ] Task 3 — API : collecter les données du rapport (AC: #3)
  - [ ] 3.1 Créer `getMonthlyReportData(month: string, implantationId?: string)` dans `@aureak/api-client/src/analytics.ts`
  - [ ] 3.2 Agréger : sessions du mois, taux présence par groupe, top 5 joueurs
  - [ ] 3.3 Type `MonthlyReportData` dans `@aureak/types/analytics.ts`

- [ ] Task 4 — Modale d'export dans `analytics/page.tsx` (AC: #1, #6, #7)
  - [ ] 4.1 State `showExportModal: boolean` + `isGenerating: boolean`
  - [ ] 4.2 Formulaire : sélecteur mois (12 derniers mois), sélecteur implantation, checkboxes sections
  - [ ] 4.3 Handler `handleGenerate` avec try/finally sur `isGenerating`
  - [ ] 4.4 Toast d'erreur si génération échoue

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier try/finally obligatoire sur `isGenerating`
  - [ ] 5.2 Vérifier console guards dans `generateMonthlyReport.ts`
  - [ ] 5.3 Vérifier import dynamique jspdf pour éviter SSR crash

## Dev Notes

### Import dynamique jspdf (éviter crash Expo SSR)

```typescript
// generateMonthlyReport.ts
export async function generateMonthlyReport(data: MonthlyReportData, options: ReportOptions) {
  const { jsPDF } = await import('jspdf')  // import dynamique
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  // ... construction du PDF
}
```

### Structure PDF

```
Page 1 :
├── Header : "AUREAK — Académie des Gardiens" + mois/année + implantation
├── Section "Chiffres clés" : 4 KPIs en ligne
├── Section "Par groupe" : tableau à 4 colonnes
└── Section "Top joueurs présence" : liste numérotée 1-5

Footer : "Généré le [date] — Aureak Academy Platform"
```

### Type ReportOptions

```typescript
export interface ReportOptions {
  month         : string        // 'YYYY-MM'
  implantationId: string | null // null = toutes
  sections      : { presences: boolean; progression: boolean; topPlayers: boolean }
  filename      : string
}
```

### Notes QA
- Import jspdf dynamique obligatoire (pas de `import` statique en haut de fichier)
- `isGenerating` dans try/finally — BLOCKER si oublié
- Console guard dans `generateMonthlyReport.ts` pour les erreurs de génération

## File List

- `aureak/apps/web/app/(admin)/analytics/generateMonthlyReport.ts` — créer
- `aureak/packages/api-client/src/analytics.ts` — modifier (ajouter getMonthlyReportData)
- `aureak/packages/types/src/analytics.ts` — modifier (ajouter MonthlyReportData, ReportOptions)
- `aureak/apps/web/app/(admin)/analytics/page.tsx` — modifier (bouton export + modale)
- `aureak/apps/web/package.json` — modifier (ajouter jspdf)
