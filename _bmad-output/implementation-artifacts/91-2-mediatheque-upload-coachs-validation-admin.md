# Story 91.2 : Mediatheque upload coachs validation admin

Status: done

## Story

En tant que coach,
je veux uploader des photos et videos dans une mediatheque,
afin de partager du contenu visuel pour la communication de l'academie.

En tant qu'admin,
je veux valider ou rejeter les medias soumis par les coachs,
afin de controler le contenu publie.

## Acceptance Criteria

1. Un bucket Storage Supabase `media-library` existe avec les policies appropriees
2. Une table `media_items` existe avec : `id`, `uploaded_by` (FK profiles), `file_path`, `file_type` (image/video), `title`, `description`, `status` enum (`draft`, `pending`, `approved`, `rejected`), `approved_by` (FK profiles nullable), `approved_at` (timestamp nullable), `created_at`, `updated_at`, `deleted_at`, `tenant_id`
3. Les coachs peuvent uploader des fichiers (images, videos) depuis `/marketing/mediatheque`
4. Le formulaire d'upload est mobile-first : selection fichier, titre, description
5. Le statut initial est `pending` apres soumission
6. L'admin voit une galerie avec filtres par statut (pending, approved, rejected)
7. L'admin peut approuver ou rejeter un media avec un clic
8. Soft-delete uniquement

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #2, #8)
  - [x] Creer migration pour l'enum `media_item_status` : `draft`, `pending`, `approved`, `rejected`
  - [x] Creer table `media_items` avec toutes les colonnes
  - [x] RLS : coach peut inserer/lire ses propres medias, admin peut tout lire/modifier
  - [x] Creer bucket `media-library` avec policies Storage
- [x] Task 2 — Types TypeScript (AC: #2)
  - [x] Ajouter `MediaItemStatus` enum dans `@aureak/types/enums.ts`
  - [x] Ajouter type `MediaItem` dans `@aureak/types`
- [x] Task 3 — API client (AC: #3, #6, #7)
  - [x] Creer `aureak/packages/api-client/src/admin/mediaItems.ts`
  - [x] `uploadMediaItem(file, metadata)` — upload Storage + insert DB
  - [x] `listMediaItems(filters?)` — avec filtre par statut
  - [x] `approveMediaItem(id)` / `rejectMediaItem(id)`
- [x] Task 4 — Upload coach (AC: #3, #4, #5)
  - [x] Interface upload dans `/marketing/mediatheque`
  - [x] Formulaire : selection fichier, titre, description
  - [x] Preview avant soumission
  - [x] Try/finally sur setUploading
- [x] Task 5 — Galerie admin (AC: #6, #7)
  - [x] Grille de medias avec thumbnails
  - [x] Filtres par statut
  - [x] Boutons approuver/rejeter sur chaque carte
  - [x] Badge statut colore

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
| `supabase/migrations/00150_create_media_items.sql` | Creer | Enum + table + RLS + bucket |
| `aureak/packages/types/src/enums.ts` | Modifier | MediaItemStatus |
| `aureak/packages/types/src/mediaItem.ts` | Creer | Type MediaItem |
| `aureak/packages/api-client/src/admin/mediaItems.ts` | Creer | Upload + CRUD |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` | Modifier | Remplacer placeholder |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/components/` | Creer | UploadForm, MediaGrid, MediaCard |

### Dependencies
- Story 91-1 (marketing hub) doit etre `done`

### Notes techniques
- Le numero de migration (00150) est indicatif — verifier `ls supabase/migrations/ | tail -5` au moment de l'implementation
- L'upload Storage Supabase passe par `supabase.storage.from('media-library').upload()` mais doit etre encapsule dans api-client
- Prevoir des limites de taille fichier (ex: 50MB images, 500MB videos)

## Dev Agent Record
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
