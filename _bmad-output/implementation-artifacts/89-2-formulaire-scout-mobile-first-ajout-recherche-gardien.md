# Story 89.2 : Formulaire scout mobile-first ajout/recherche gardien

Status: done

## Story

En tant que scout,
je veux une page dediee dans la section Prospection pour rechercher et ajouter des gardiens prospects,
afin de saisir rapidement les informations terrain sur mon mobile.

## Acceptance Criteria

1. La route `/prospection/gardiens` affiche une page avec recherche et ajout de gardiens
2. La recherche interroge `child_directory` avec filtre texte (nom, prenom, club)
3. Un bouton "Ajouter un gardien" ouvre un formulaire mobile-first
4. Le formulaire permet de saisir : nom, prenom, date de naissance, club actuel, categorie d'age, telephone parent, email parent, notes scout
5. A la soumission, le gardien est cree dans `child_directory` avec `prospect_status = 'identified'`
6. Le formulaire est responsive et optimise mobile (champs empiles, boutons larges)
7. Feedback visuel apres creation (toast ou message succes)

## Tasks / Subtasks

- [x] Task 1 — Page gardiens prospection (AC: #1)
  - [x] Modifier `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`
  - [x] Liste des prospects avec badge statut (reutilise ProspectBadge de 89-1)
- [x] Task 2 — Recherche (AC: #2)
  - [x] Input de recherche avec debounce (300ms)
  - [x] Query `child_directory` filtree par texte (nom, prenom, display_name, current_club) via api-client `.or()`
- [x] Task 3 — Formulaire ajout (AC: #3, #4, #5, #6)
  - [x] Modal formulaire mobile-first (AddProspectForm)
  - [x] Champs : nom, prenom, dateNaissance, clubActuel, categorieAge (select FOOTBALL_AGE_CATEGORIES), telephoneParent, emailParent, notes
  - [x] Validation Zod
  - [x] Soumission via api-client `createProspectChild` → `child_directory` insert avec `prospect_status = 'identified'`
- [x] Task 4 — Feedback (AC: #7)
  - [x] Message succes apres creation (banniere verte 3s)
  - [x] Try/finally sur setSaving

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
| `aureak/apps/web/app/(admin)/prospection/gardiens/page.tsx` | Modifier | Remplacer placeholder |
| `aureak/apps/web/app/(admin)/prospection/gardiens/components/AddProspectForm.tsx` | Creer | Formulaire mobile-first |
| `aureak/packages/api-client/src/admin/childDirectory.ts` | Modifier | createProspectChild |

### Dependencies
- Story 89-1 (statut prospect child_directory) doit etre `done`

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A
### Completion Notes List
- Recherche elargie : `listChildDirectory` utilise desormais `.or()` sur display_name, nom, prenom, current_club (au lieu de display_name seul)
- Debounce 300ms sur le champ de recherche pour eviter les requetes excessives
- `createProspectChild` cree l'entree avec `prospect_status = 'identified'` automatiquement et compose `display_name` depuis prenom+nom
- Formulaire modal mobile-first avec React Hook Form + Zod, pattern identique a CreateCoachProspectModal
- Banniere de succes verte avec disparition automatique apres 3s
- Zero erreurs TypeScript dans les fichiers modifies
### File List
- `aureak/packages/api-client/src/admin/child-directory.ts` (modified — search `.or()` + `createProspectChild`)
- `aureak/packages/api-client/src/index.ts` (modified — export `createProspectChild` + `CreateProspectChildParams`)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/_components/AddProspectForm.tsx` (created)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` (modified — bouton ajout, debounce, integration modale)
