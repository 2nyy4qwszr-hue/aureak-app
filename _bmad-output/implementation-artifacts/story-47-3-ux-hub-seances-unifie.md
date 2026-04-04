# Story 47.3 : UX — Hub séances unifié (séances + présences + évaluations)

Status: done

## Story

En tant qu'admin Aureak gérant les séances terrain,
je veux un hub unifié où séances, présences et évaluations sont accessibles depuis un même dashboard de séance,
afin de ne pas jongler entre 3 sections différentes pour gérer une séance complète.

## Acceptance Criteria

1. La page `(admin)/seances/` affiche un hub avec 3 onglets ou sections : "Séances", "Présences", "Évaluations"
2. Depuis la fiche d'une séance `(admin)/seances/[sessionId]/`, des actions rapides permettent d'accéder directement aux présences et aux évaluations de cette séance
3. Les liens "Présences de cette séance" et "Évaluations de cette séance" sont affichés dans la fiche séance
4. Le design est cohérent Light Premium — tabs avec underline gold pour l'onglet actif

## Tasks / Subtasks

- [x] T1 — Ajouter actions rapides dans la fiche séance
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
  - [x] T1.2 — Ajouter une section "Actions" avec 2 boutons/liens :
    - "📋 Gérer les présences" → router.push vers `/(admin)/presences?sessionId=${sessionId}`
    - "⭐ Voir les évaluations" → router.push vers `/(admin)/evaluations?sessionId=${sessionId}`
  - [x] T1.3 — Style boutons : variant secondary du design system

- [x] T2 — Hub séances page principale
  - [x] T2.1 — Lire `aureak/apps/web/app/(admin)/seances/index.tsx`
  - [x] T2.2 — Ajouter un header avec 3 onglets : Séances | Présences | Évaluations
  - [x] T2.3 — Onglet actif = "Séances" par défaut, avec underline gold
  - [x] T2.4 — Cliquer sur "Présences" → router.push vers /presences ; "Évaluations" → router.push vers /evaluations

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Navigation fluide entre les 3 sections

## Dev Notes

### Pattern tabs navigation
```typescript
const tabs = [
  { label: 'Séances', route: '/(admin)/seances' },
  { label: 'Présences', route: '/(admin)/presences' },
  { label: 'Évaluations', route: '/(admin)/evaluations' },
]
// Tab actif détecté par pathname
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/index.tsx` | Ajouter tabs hub |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter actions rapides |

## Dev Agent Record

**Implémenté par** : Claude Code (claude-sonnet-4-6)
**Date** : 2026-04-04

### Modifications par fichier

1. **`aureak/apps/web/app/(admin)/seances/page.tsx`**
   - Import `usePathname` ajouté depuis `expo-router`
   - Constante `HUB_TABS` ajoutée (Séances / Présences / Évaluations)
   - Bloc JSX `hubTabsRow` inséré entre le header et le period selector
   - Styles `hubTabsRow`, `hubTab`, `hubTabActive` ajoutés (underline gold 2px sur onglet actif)
   - Détection onglet actif via `pathname` comparé à la route du tab

2. **`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`**
   - StyleSheet `actSt` ajouté avec style `quickBtn`
   - Section "Actions rapides" insérée juste avant les actions planification (annulation/report)
   - Bouton "📋 Gérer les présences" → `/(admin)/presences?sessionId=${sessionId}`
   - Bouton "⭐ Voir les évaluations" → `/(admin)/evaluations?sessionId=${sessionId}`

### QA
- try/finally : aucun nouveau setter de chargement ajouté → N/A
- Console guards : aucun nouveau console ajouté → N/A
- `npx tsc --noEmit` → 0 erreur

## File List

- `aureak/apps/web/app/(admin)/seances/page.tsx` — hub tabs ajoutés
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — actions rapides ajoutées
