# Story 55.7 : Évaluations — Export scouting PDF

Status: done

## Story

En tant que coach ou administrateur,
Je veux exporter une fiche de scouting professionnelle en PDF pour un joueur,
Afin de partager un rapport complet avec des clubs, agents ou parents dans un format imprimable et crédible.

## Contexte & Décisions de Design

### Contenu du PDF (format A4 portrait)
Page 1 :
- Header : logo Aureak + nom joueur + photo + date génération
- Section identité : date naissance, club actuel, groupe, saison
- Radar chart 6 axes (moyennes toutes évaluations)
- Timeline croissance (dernières 10 séances)
- Bloc résumé : note moyenne, nb séances, meilleure note, progression

Page 2 (optionnelle si beaucoup d'évaluations) :
- Tableau des 10 dernières évaluations (date, séance, note, commentaire coach)

### Technologie
Utiliser `react-pdf` (package `@react-pdf/renderer`) déjà disponible dans le monorepo ou à installer. Génération côté client (pas d'Edge Function). Composant `ScoutingPDF` avec sous-composants `PDFRadar` et `PDFTimeline` adaptés pour `@react-pdf/renderer` (pas de SVG natif React Native).

### Déclenchement
Bouton "Exporter PDF scouting" dans `children/[childId]/page.tsx` (section évaluations) + dans la page `evaluations/comparison.tsx`.

## Acceptance Criteria

**AC1 — PDF généré avec toutes les sections**
- **Given** un joueur avec au moins 3 évaluations
- **When** l'admin clique sur "Exporter PDF scouting"
- **Then** un PDF A4 est téléchargé automatiquement
- **And** le PDF contient : header avec logo, identité joueur, radar, timeline, tableau évaluations

**AC2 — Radar chart dans le PDF**
- **Given** le PDF généré
- **When** on ouvre la page 1
- **Then** un radar chart 6 axes est visible avec les moyennes du joueur
- **And** les axes sont labellisés, les valeurs lisibles

**AC3 — Timeline dans le PDF**
- **Given** le PDF généré
- **When** on ouvre la page 1
- **Then** une courbe de progression est visible avec les 10 dernières notes
- **And** les dates sont affichées sur l'axe X

**AC4 — Photo joueur dans le header**
- **Given** un joueur avec photo Storage
- **When** le PDF est généré
- **Then** la photo apparaît dans le header (cercle 80px)
- **And** si pas de photo, un placeholder initiales (rectangle coloré) est utilisé

**AC5 — Nom de fichier structuré**
- **Given** un export PDF
- **When** le fichier est téléchargé
- **Then** le nom est `scouting-[prenom-nom]-[YYYY-MM-DD].pdf`
- **And** les accents et espaces sont normalisés (slug)

**AC6 — État de chargement pendant la génération**
- **Given** l'utilisateur qui clique sur "Exporter PDF"
- **When** la génération est en cours
- **Then** le bouton affiche "Génération en cours..." et est désactivé
- **And** après téléchargement, le bouton revient à l'état initial

**AC7 — Fallback si données insuffisantes**
- **Given** un joueur avec 0 évaluations
- **When** l'admin tente l'export
- **Then** un message d'erreur "Pas assez d'évaluations pour générer un scouting" s'affiche
- **And** aucun PDF vide n'est téléchargé

## Tasks

- [x] Installer / vérifier `@react-pdf/renderer` dans le workspace
- [x] Créer `aureak/apps/web/utils/generateScoutingPDF.ts` (orchestration données + rendu PDF)
- [x] Créer `aureak/apps/web/components/pdf/ScoutingPDF.tsx` (layout react-pdf, PDFRadar et PDFTimeline inclus)
- [x] Créer `aureak/apps/web/components/pdf/PDFRadar.tsx` (inclus dans ScoutingPDF.tsx)
- [x] Créer `aureak/apps/web/components/pdf/PDFTimeline.tsx` (inclus dans ScoutingPDF.tsx)
- [x] Ajouter bouton "Exporter PDF scouting" dans `children/[childId]/page.tsx`
- [x] Implémenter try/finally sur `setGenerating` (loading state)
- [x] Génération nom de fichier slug
- [x] Validation : bloquer export si < 1 évaluation
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : cliquer bouton export, vérifier téléchargement déclenché (app non démarrée)

## Fichiers concernés

- `aureak/apps/web/utils/generateScoutingPDF.ts` (nouveau)
- `aureak/apps/web/components/pdf/ScoutingPDF.tsx` (nouveau)
- `aureak/apps/web/components/pdf/PDFRadar.tsx` (nouveau)
- `aureak/apps/web/components/pdf/PDFTimeline.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (bouton export)
- `package.json` workspace root ou `aureak/apps/web/package.json` (@react-pdf/renderer)

## Dépendances

- Story 55-2 (RadarChart) — les données radar sont réutilisées
- Story 55-3 (GrowthChart) — les données timeline sont réutilisées
- API `getAverageEvaluationsByPlayer` et `listRecentEvaluationsForChild`

## Notes techniques

- `@react-pdf/renderer` ne supporte pas les composants RN natifs — utiliser ses composants propres (View, Text, Svg, Path)
- Charger la photo via `fetch` + `base64` pour l'inclure dans le PDF sans CORS
- Taille page : `{ format: 'A4', orientation: 'portrait' }`
