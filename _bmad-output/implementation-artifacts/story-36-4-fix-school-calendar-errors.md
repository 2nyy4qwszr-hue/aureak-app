# Story 36-4 — Page fix: school-calendar error states

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que mainteneur, je veux que les états d'erreur de `settings/school-calendar/page.tsx` utilisent des tokens `@aureak/theme` et qu'un composant `ErrorBanner` réutilisable soit extrait afin d'éliminer les couleurs hardcodées et faciliter la réutilisation.

## Acceptance Criteria
- [ ] AC1: Un composant `ErrorBanner` existe dans `@aureak/ui` avec props `message: string` et `onDismiss?: () => void`.
- [ ] AC2: `ErrorBanner` utilise `colors.accent.red` pour le fond, `colors.text.*` pour le texte — aucune couleur hardcodée.
- [ ] AC3: `settings/school-calendar/page.tsx` lignes 131, 176, 240-241 n'ont plus de couleurs hex hardcodées.
- [ ] AC4: `clubs/new.tsx` utilise `<ErrorBanner />` à la place de son pattern inline d'erreur actuel.
- [ ] AC5: grep `#DC2626\|#FEF2F2\|#FCA5A5` dans les fichiers modifiés retourne 0 résultats.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/settings/school-calendar/page.tsx` lignes 125-245 pour identifier tous les patterns d'erreur hardcodés.
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/new.tsx` pour identifier le pattern `ErrorBanner` existant à extraire.
- [ ] Créer `aureak/packages/ui/src/ErrorBanner.tsx` — composant avec `message`, `onDismiss?`, fond `colors.accent.red` (ou token rouge clair selon hiérarchie), texte `colors.text.*`, bouton fermer optionnel.
- [ ] Exporter `ErrorBanner` depuis `aureak/packages/ui/src/index.ts`.
- [ ] Remplacer les couleurs hardcodées dans `settings/school-calendar/page.tsx` lignes 131, 176, 240-241 par `<ErrorBanner />` ou tokens directs selon le contexte.
- [ ] Remplacer le pattern d'erreur inline dans `clubs/new.tsx` par `<ErrorBanner />`.
- [ ] QA scan : grep couleurs erreur hardcodées dans les 2 fichiers modifiés.

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/ErrorBanner.tsx` (créer)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/settings/school-calendar/page.tsx`
  - `aureak/apps/web/app/(admin)/clubs/new.tsx`
- Correspondances couleurs :
  - `#DC2626` → `colors.accent.red`
  - `#FEF2F2` → fond rouge très clair — créer token `colors.status.errorBg` si absent ou utiliser `colors.accent.red` à 10% opacity via hex `#DC262619`
  - `#FCA5A5` → bordure/texte rouge doux — utiliser `colors.accent.red` avec opacity ou token existant
- Le composant `ErrorBanner` doit être utilisable dans toutes les pages admin (import depuis `@aureak/ui`)
