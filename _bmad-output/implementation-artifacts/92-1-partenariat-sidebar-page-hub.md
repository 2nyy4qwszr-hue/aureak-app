# Story 92.1 : Partenariat sidebar page hub

Status: done

## Story

En tant qu'admin,
je veux une section Partenariat structuree avec 3 onglets (Sponsors, Clubs Partenaires, Capsules Video),
afin d'organiser la gestion des partenariats depuis un hub centralise.

## Acceptance Criteria

1. La route `/partenariat` affiche un hub avec une `PartenariatNavBar` a 3 onglets
2. Onglets : Sponsors / Clubs Partenaires / Capsules Video
3. Chaque onglet redirige vers sa sous-route (`/partenariat/sponsors`, `/partenariat/clubs`, `/partenariat/capsules`)
4. Le layout suit le pattern `AcademieNavBar` existant (onglets horizontaux)
5. Pages placeholder avec empty state pour chaque onglet
6. Le placeholder existant de `/partenariat` (story 86-4) est remplace par le vrai hub
7. L'item sidebar Partenariat reste inchange (deja present depuis 86-4)

## Tasks / Subtasks

- [x] Task 1 — Layout partenariat (AC: #1, #2, #4)
  - [x] Creer ou modifier `aureak/apps/web/app/(admin)/developpement/partenariats/_layout.tsx` avec `PartenariatNavBar`
  - [x] 3 onglets : Sponsors / Clubs Partenaires / Capsules Video
- [x] Task 2 — Pages placeholder (AC: #3, #5)
  - [x] Creer `partenariats/sponsors/page.tsx` + `index.tsx` — empty state
  - [x] Creer `partenariats/clubs/page.tsx` + `index.tsx` — empty state
  - [x] Creer `partenariats/capsules/page.tsx` + `index.tsx` — empty state
- [x] Task 3 — Page racine (AC: #6)
  - [x] Modifier `partenariats/page.tsx` pour rediriger vers `/developpement/partenariats/sponsors`

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
| `aureak/apps/web/app/(admin)/partenariat/_layout.tsx` | Creer/Modifier | PartenariatNavBar 3 onglets |
| `aureak/apps/web/app/(admin)/partenariat/page.tsx` | Modifier | Remplacer placeholder par redirect |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/index.tsx` | Creer | Re-export |
| `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/partenariat/clubs/index.tsx` | Creer | Re-export |
| `aureak/apps/web/app/(admin)/partenariat/capsules/page.tsx` | Creer | Placeholder |
| `aureak/apps/web/app/(admin)/partenariat/capsules/index.tsx` | Creer | Re-export |

### Dependencies
- Story 86-1 (nouveaux roles DB) doit etre `done`
- Le placeholder `/partenariat` de la story 86-4 doit exister

### References
- Pattern : `aureak/apps/web/app/(admin)/academie/_layout.tsx` (AcademieNavBar)
- Pattern : `aureak/apps/web/app/(admin)/prospection/_layout.tsx` (ProspectionNavBar, story 88-1)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A
### Completion Notes List
- Hub Partenariat cree sous `/developpement/partenariats/` (route existante du placeholder story 63.3)
- PartenariatNavBar 3 onglets : Sponsors / Clubs Partenaires / Capsules Video
- Pattern identique a ProspectionNavBar (story 88.1)
- Page racine redirige vers `/developpement/partenariats/sponsors`
- 3 pages placeholder empty state creees
### File List
- `aureak/apps/web/app/(admin)/developpement/partenariats/_layout.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/_components/PartenariatNavBar.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` (modifie — redirect)
- `aureak/apps/web/app/(admin)/developpement/partenariats/sponsors/page.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/sponsors/index.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/clubs/page.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/clubs/index.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/capsules/page.tsx` (cree)
- `aureak/apps/web/app/(admin)/developpement/partenariats/capsules/index.tsx` (cree)
