# Story 40-2 — Lists: bulk actions

**Epic:** 40
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux sélectionner plusieurs joueurs à la fois et leur appliquer une action groupée afin de gagner du temps lors des opérations de masse.

## Acceptance Criteria
- [ ] AC1: Chaque card de joueur dans `children/index.tsx` affiche une checkbox dans son coin supérieur gauche
- [ ] AC2: Une checkbox "Tout sélectionner / Tout désélectionner" est disponible dans le header de la liste
- [ ] AC3: Quand ≥1 joueur est sélectionné, une barre d'actions flottante apparaît en bas de l'écran
- [ ] AC4: La barre flottante affiche le nombre de joueurs sélectionnés et les actions disponibles
- [ ] AC5: Action "Marquer actif" — appelle `updateChildDirectoryEntry({ actif: true })` pour chaque `selectedId`, avec feedback toast de succès
- [ ] AC6: Action "Exporter CSV" — génère et télécharge un fichier CSV avec les champs: nom, statut, club, date de naissance, actif
- [ ] AC7: Une fois une action effectuée, la sélection est réinitialisée
- [ ] AC8: La barre flottante a un bouton "Annuler" pour vider la sélection sans action

## Tasks
- [ ] Modifier `aureak/apps/web/app/(admin)/children/index.tsx` — ajouter state `selectedIds: string[]`, checkbox par card, checkbox header "tout sélectionner"
- [ ] Créer `aureak/apps/web/app/(admin)/children/BulkActionBar.tsx` — barre flottante fixe en bas, compteur, boutons actions, bouton Annuler
- [ ] Implémenter `handleBulkMarkActif` dans `children/index.tsx` — `Promise.all` des updates avec try/finally + toast succès/erreur
- [ ] Implémenter `handleExportCSV` — construire string CSV depuis `selectedIds` filtrés dans `joueurs[]`, créer Blob, déclencher download via `<a href="..." download>`
- [ ] Vérifier QA: try/finally sur bulk update, console guards présents

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/children/index.tsx`
  - `aureak/apps/web/app/(admin)/children/BulkActionBar.tsx` (nouveau)
- Style barre flottante: `position: fixed`, `bottom: 24px`, `left: 50%`, `transform: translateX(-50%)`, fond `colors.sidebar` (dark), `shadows.lg`, `borderRadius: tokens.radius.md`, padding 16px, `zIndex: 200`
- Checkbox: utiliser composant natif React Native `<Pressable>` avec style custom ou `<input type="checkbox">` en web
- Export CSV: champs séparés par `;`, encodage UTF-8 BOM (`\uFEFF` en début) pour compatibilité Excel
- La barre flottante ne bloque pas la liste (sticky bottom, pas modal)
- Pas de migration Supabase nécessaire
- ATTENTION: les updates bulk peuvent être lents — afficher un spinner dans le bouton pendant l'exécution (try/finally pattern obligatoire)
