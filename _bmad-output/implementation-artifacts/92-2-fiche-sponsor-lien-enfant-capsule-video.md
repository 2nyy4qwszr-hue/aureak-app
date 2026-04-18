# Story 92.2 : Fiche sponsor lien enfant capsule video

Status: done

## Story

En tant qu'admin,
je veux gerer les sponsors de l'academie avec un CRUD complet, pouvoir lier un sponsor a un enfant et suivre le statut des capsules video,
afin de piloter les partenariats sponsoring efficacement.

## Acceptance Criteria

1. Une table `sponsors` existe avec : `id`, `name`, `logo_url` (text nullable), `contact_name`, `contact_email`, `contact_phone`, `sponsorship_type` enum (`individual`, `club`, `corporate`, `media`), `amount` (numeric nullable), `currency` (text default 'EUR'), `start_date` (date), `end_date` (date nullable), `linked_child_id` (FK child_directory nullable), `capsule_status` enum (`not_started`, `filming`, `editing`, `published`) nullable, `notes` (text nullable), `created_at`, `updated_at`, `deleted_at`, `tenant_id`
2. La page `/partenariat/sponsors` affiche la liste des sponsors en cartes
3. Un formulaire permet de creer un nouveau sponsor (tous les champs)
4. Un formulaire d'edition permet de modifier un sponsor existant
5. Le lien enfant est optionnel — select searchable dans `child_directory`
6. Le statut capsule video est affiche avec badge colore et modifiable
7. Un bouton de suppression (soft-delete) est disponible
8. Filtre par type de sponsoring et par statut capsule

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1)
  - [x] Creer migration pour les enums `sponsorship_type` et `capsule_status`
  - [x] Creer table `sponsors` avec toutes les colonnes
  - [x] FK vers `child_directory(id)` nullable
  - [x] RLS : admin CRUD complet
  - [x] Index sur `sponsorship_type`, `linked_child_id`, `capsule_status`
- [x] Task 2 — Types TypeScript (AC: #1)
  - [x] Ajouter `SponsorshipType` et `CapsuleStatus` enums dans `@aureak/types/enums.ts`
  - [x] Ajouter type `Sponsor` dans `@aureak/types`
- [x] Task 3 — API client (AC: #2, #3, #4, #7)
  - [x] Creer `aureak/packages/api-client/src/admin/sponsors.ts`
  - [x] `listSponsors(filters?)` — avec filtre type + capsule_status
  - [x] `getSponsor(id)`
  - [x] `createSponsor(data)`
  - [x] `updateSponsor(id, data)`
  - [x] `deleteSponsor(id)` — soft-delete
- [x] Task 4 — Liste sponsors (AC: #2, #8)
  - [x] Page `/partenariat/sponsors` avec grille de cartes
  - [x] Chaque carte : nom, type, montant, enfant lie, badge capsule
  - [x] Filtres par type et statut capsule
- [x] Task 5 — Formulaire creation/edition (AC: #3, #4, #5, #6)
  - [x] Formulaire complet avec validation
  - [x] Select searchable pour lier un enfant (query child_directory)
  - [x] Dropdown capsule_status avec badge colore
  - [x] Mode creation et edition
  - [x] Try/finally sur setSaving
- [x] Task 6 — Suppression (AC: #7)
  - [x] Bouton supprimer avec confirmation
  - [x] Soft-delete via api-client

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
| `supabase/migrations/00151_create_sponsors.sql` | Creer | Enums + table + RLS |
| `aureak/packages/types/src/enums.ts` | Modifier | SponsorshipType, CapsuleStatus |
| `aureak/packages/types/src/sponsor.ts` | Creer | Type Sponsor |
| `aureak/packages/api-client/src/admin/sponsors.ts` | Creer | CRUD complet |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx` | Modifier | Remplacer placeholder |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/components/` | Creer | SponsorCard, SponsorForm |

### Dependencies
- Story 92-1 (partenariat hub) doit etre `done`

### Notes techniques
- Le numero de migration est indicatif — verifier au moment de l'implementation
- Le select searchable enfant reutilise le pattern de recherche child_directory existant
- `amount` est numeric et non integer pour supporter les centimes

## Dev Agent Record
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
