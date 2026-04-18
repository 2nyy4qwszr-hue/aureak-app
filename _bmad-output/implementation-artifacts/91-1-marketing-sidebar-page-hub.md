# Story 91.1 : Marketing sidebar page hub

Status: done

## Story

En tant qu'admin ou marketeur,
je veux une section Marketing structuree avec 4 onglets (Mediatheque, Reseaux, Campagnes, Analytics),
afin d'organiser toutes les activites marketing depuis un hub centralise.

## Acceptance Criteria

1. La route `/marketing` affiche un hub avec une `MarketingNavBar` a 4 onglets
2. Onglets : Mediatheque / Reseaux sociaux / Campagnes / Analytics
3. Chaque onglet redirige vers sa sous-route (`/marketing/mediatheque`, `/marketing/reseaux`, `/marketing/campagnes`, `/marketing/analytics`)
4. Le layout suit le pattern `AcademieNavBar` existant (onglets horizontaux)
5. Pages placeholder avec empty state pour chaque onglet
6. Le placeholder existant de `/marketing` (story 86-4) est remplace par le vrai hub
7. L'item sidebar Marketing reste inchange (deja present depuis 86-4)

## Tasks / Subtasks

- [x] Task 1 — Layout marketing (AC: #1, #2, #4)
  - [x] Creer ou modifier `aureak/apps/web/app/(admin)/marketing/_layout.tsx` avec `MarketingNavBar`
  - [x] 4 onglets : Mediatheque / Reseaux sociaux / Campagnes / Analytics
- [x] Task 2 — Pages placeholder (AC: #3, #5)
  - [x] Creer `marketing/mediatheque/page.tsx` + `index.tsx` — empty state
  - [x] Creer `marketing/reseaux/page.tsx` + `index.tsx` — empty state
  - [x] Creer `marketing/campagnes/page.tsx` + `index.tsx` — empty state
  - [x] Creer `marketing/analytics/page.tsx` + `index.tsx` — empty state
- [x] Task 3 — Page racine (AC: #6)
  - [x] Modifier `marketing/page.tsx` pour rediriger vers `/marketing/mediatheque`
  - [x] Ou afficher le hub avec redirection automatique

## Dev Notes

### Contraintes Stack
Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText, AureakButton, Badge, Card, Input
- **Acces Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards obligatoires** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

### Fichiers a creer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/marketing/_layout.tsx` | Creer/Modifier | MarketingNavBar 4 onglets |
| `aureak/apps/web/app/(admin)/marketing/page.tsx` | Modifier | Remplacer placeholder par redirect |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/index.tsx` | Creer | Re-export |
| `aureak/apps/web/app/(admin)/marketing/reseaux/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/reseaux/index.tsx` | Creer | Re-export |
| `aureak/apps/web/app/(admin)/marketing/campagnes/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/campagnes/index.tsx` | Creer | Re-export |
| `aureak/apps/web/app/(admin)/marketing/analytics/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/analytics/index.tsx` | Creer | Re-export |

### Dependencies
- Story 86-1 (nouveaux roles DB) doit etre `done`
- Le placeholder `/marketing` de la story 86-4 doit exister

### References
- Pattern : `aureak/apps/web/app/(admin)/academie/_layout.tsx` (AcademieNavBar)
- Pattern : `aureak/apps/web/app/(admin)/prospection/_layout.tsx` (ProspectionNavBar, story 88-1)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A — story EXPRESS, pas de debug requis
### Completion Notes List
- Pattern identique a ProspectionNavBar (story 88.1) — 4 onglets au lieu de 3
- page.tsx racine = Redirect vers /marketing/mediatheque (remplace placeholder 86-4)
- Pas de migration DB, pas de types, pas d'api-client (story UI-only)
### File List
- `aureak/apps/web/app/(admin)/marketing/_layout.tsx` — layout avec MarketingNavBar + Slot
- `aureak/apps/web/app/(admin)/marketing/_components/MarketingNavBar.tsx` — navbar 4 onglets
- `aureak/apps/web/app/(admin)/marketing/page.tsx` — redirect vers mediatheque
- `aureak/apps/web/app/(admin)/marketing/index.tsx` — re-export
- `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` + `index.tsx`
- `aureak/apps/web/app/(admin)/marketing/reseaux/page.tsx` + `index.tsx`
- `aureak/apps/web/app/(admin)/marketing/campagnes/page.tsx` + `index.tsx`
- `aureak/apps/web/app/(admin)/marketing/analytics/page.tsx` + `index.tsx`
