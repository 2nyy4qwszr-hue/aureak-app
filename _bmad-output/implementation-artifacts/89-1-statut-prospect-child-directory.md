# Story 89.1 : Statut prospect sur child_directory

Status: done

## Story

En tant qu'admin ou scout,
je veux un statut prospect sur chaque gardien de l'annuaire (child_directory),
afin de suivre ou en est chaque prospect dans le pipeline de recrutement.

## Acceptance Criteria

1. Une colonne `prospect_status` enum (`identified`, `contacted`, `trial_scheduled`, `trial_done`, `converted`, `lost`) existe sur `child_directory` (nullable, defaut NULL = non prospect)
2. Un badge visuel colore affiche le statut prospect dans la liste des enfants annuaire
3. Un filtre par statut prospect est disponible dans la liste enfants annuaire
4. Le statut est modifiable depuis la fiche enfant annuaire (dropdown)
5. Les couleurs des badges utilisent les tokens `@aureak/theme`
6. La migration est idempotente et ne casse pas les donnees existantes

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #6)
  - [x] Creer `supabase/migrations/00149_add_child_prospect_status.sql` (00149 car 00148 existait deja)
  - [x] Creer l'enum `child_prospect_status` : `identified`, `contacted`, `trial_scheduled`, `trial_done`, `converted`, `lost`
  - [x] Ajouter colonne `prospect_status child_prospect_status NULL DEFAULT NULL` sur `child_directory`
- [x] Task 2 — Types TypeScript (AC: #1)
  - [x] Ajouter `ChildProspectStatus` enum dans `@aureak/types/enums.ts` (nom distinct de `ProspectStatus` clubs)
  - [x] Mettre a jour le type `ChildDirectoryEntry` dans `@aureak/types/entities.ts` pour inclure `prospectStatus`
- [x] Task 3 — API client (AC: #4)
  - [x] Ajouter `updateChildProspectStatus(childId, status)` dans `@aureak/api-client/src/admin/child-directory.ts`
  - [x] Ajouter support `prospectStatus` dans `listChildDirectory`, `updateChildDirectoryEntry`, `toEntry`
- [x] Task 4 — Badge prospect (AC: #2, #5)
  - [x] Creer composant `ProspectBadge` inline dans la page gardiens
  - [x] Couleur par statut via tokens theme (`childProspectStatusColors` dans `@aureak/theme/tokens.ts`)
- [x] Task 5 — Filtre prospect (AC: #3)
  - [x] Ajouter pills de filtre `prospect_status` dans la page gardiens
  - [x] Filtrer cote Supabase (query param `prospectStatus`)
- [x] Task 6 — Modification statut (AC: #4)
  - [x] Dropdown `ProspectStatusDropdown` dans chaque ligne du tableau
  - [x] Try/finally sur le state setter `setSaving`

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
| `supabase/migrations/00148_add_prospect_status_child_directory.sql` | Creer | Enum + colonne |
| `aureak/packages/types/src/enums.ts` | Modifier | Ajouter ProspectStatus |
| `aureak/packages/types/src/childDirectory.ts` | Modifier | Ajouter prospectStatus |
| `aureak/packages/api-client/src/admin/childDirectory.ts` | Modifier | updateProspectStatus |
| `aureak/apps/web/app/(admin)/academie/joueurs/` | Modifier | Badge + filtre |

### Dependencies
- Story 88-1 (hub prospection sidebar) doit etre `done`

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A
### Completion Notes List
- Enum PostgreSQL nommé `child_prospect_status` (distinct de `prospect_status` pour clubs pipeline Story 88.2)
- Type TS nommé `ChildProspectStatus` (distinct de `ProspectStatus`)
- Migration 00149 (pas 00148 comme indiqué dans la story, car 00148 existait déjà)
- Couleurs prospect ajoutées dans `@aureak/theme/tokens.ts` via `childProspectStatusColors`
- Page gardiens remplace le placeholder par une vraie liste filtrable avec badges et dropdown
### File List
- `supabase/migrations/00149_add_child_prospect_status.sql` (created)
- `aureak/packages/types/src/enums.ts` (modified)
- `aureak/packages/types/src/entities.ts` (modified)
- `aureak/packages/api-client/src/admin/child-directory.ts` (modified)
- `aureak/packages/api-client/src/index.ts` (modified)
- `aureak/packages/theme/src/tokens.ts` (modified)
- `aureak/packages/theme/src/index.ts` (modified)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` (rewritten)
