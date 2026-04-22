# Story 91.2 — Médiathèque : upload coachs + validation admin

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 91 — Marketing
- **Story ID** : 91.2
- **Story key** : `91-2-mediatheque-upload-coachs-validation-admin`
- **Priorité** : P2
- **Dépendances** : Story 91-1 done (`/marketing/mediatheque` doit exister avec layout + NavBar)
- **Source** : brainstorming 2026-04-18 idée #28
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (migration 00168 + bucket Storage + CRUD + 2 vues role-aware upload/validation)

## Story

En tant que coach,
je veux uploader des photos et vidéos dans une médiathèque,
afin de partager du contenu visuel pour la communication de l'académie.

En tant qu'admin ou marketeur,
je veux valider ou rejeter les médias soumis par les coachs,
afin de contrôler le contenu publié.

## Acceptance Criteria

1. Bucket Supabase Storage `media-library` existe avec policies : coachs = INSERT own, admin/marketeur = SELECT/UPDATE/DELETE all (même tenant), limite 50MB images / 500MB vidéos
2. Table `media_items` avec colonnes :
   - `id` UUID PK
   - `tenant_id` UUID FK → `tenants.id`
   - `uploaded_by` UUID FK → `auth.users.id`
   - `file_path` TEXT (chemin dans le bucket `{tenant_id}/{uploaded_by}/{filename}`)
   - `file_type` enum `media_file_type` (`image` | `video`)
   - `title` TEXT NOT NULL
   - `description` TEXT
   - `status` enum `media_item_status` : `pending`, `approved`, `rejected`
   - `approved_by` UUID FK → `auth.users.id` nullable
   - `approved_at` TIMESTAMPTZ nullable
   - `rejection_reason` TEXT nullable
   - `file_size` BIGINT nullable
   - `mime_type` TEXT nullable
   - `created_at`, `updated_at`, `deleted_at` (soft-delete)
3. Types TypeScript miroir dans `@aureak/types` (camelCase) : `MediaFileType`, `MediaItemStatus`, `MediaItem`, `CreateMediaItemParams`
4. API dans `@aureak/api-client/src/admin/media-items.ts` :
   - `listMediaItems(filters?: { status?, uploadedBy? })`
   - `uploadMediaItem(file, metadata)` — upload Storage + insert DB
   - `approveMediaItem(id)` — status → `approved` + `approved_by` = auth.uid() + `approved_at` = now()
   - `rejectMediaItem(id, reason)` — status → `rejected` + `rejection_reason`
   - `getMediaItemUrl(id)` — URL signée Supabase Storage (1h)
5. Page `/marketing/mediatheque` avec **vue role-aware** :
   - **Coach** : formulaire d'upload (fichier, titre, description) + liste de ses propres médias avec badge statut
   - **Admin / Marketeur** : galerie de tous les médias du tenant avec filtres par statut (`pending` par défaut) + boutons approuver/rejeter inline
6. Formulaire upload mobile-first : sélection fichier (`<input type="file">` ou équivalent RN), titre requis, description optionnelle, preview avant soumission, progress bar pendant upload
7. Statut initial = `pending` après soumission (pas de publication automatique)
8. Modale de rejet avec raison obligatoire (min 5 caractères)
9. Badge statut coloré : `pending` orange, `approved` vert, `rejected` rouge
10. Soft-delete uniquement (jamais de DELETE physique côté UI)
11. RLS :
    - Coach : SELECT/UPDATE/DELETE `WHERE uploaded_by = auth.uid()` + INSERT avec `uploaded_by = auth.uid()`
    - Admin / Marketeur : SELECT/UPDATE/DELETE tout le tenant (via `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`)

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase `00168_create_media_items.sql` (AC: #1, #2, #10, #11)
  - [x] Enum `media_file_type` : `image`, `video`
  - [x] Enum `media_item_status` : `pending`, `approved`, `rejected`
  - [x] Table `media_items` avec toutes les colonnes spécifiées
  - [x] Index sur `media_items(tenant_id, status)` et `media_items(uploaded_by, created_at DESC)`
  - [x] RLS enable, policies coach own + admin/marketeur all-tenant
  - [x] Trigger `updated_at`
  - [x] Bucket Supabase Storage `media-library` (via SQL `insert into storage.buckets`)
  - [x] Policies Storage : INSERT coach own path, SELECT/UPDATE/DELETE admin/marketeur
- [x] Task 2 — Types TypeScript (AC: #3)
  - [x] `MediaFileType` type union + label map dans `enums.ts`
  - [x] `MediaItemStatus` type union + `MEDIA_ITEM_STATUS_LABELS` + color map dans `enums.ts`
  - [x] `MediaItem` entity dans `entities.ts` (avec `uploaderDisplayName` optionnel pour vue admin)
  - [x] `CreateMediaItemParams` : `{ title, description?, fileType, filePath, fileSize?, mimeType? }`
  - [x] Exporter dans `index.ts`
- [x] Task 3 — API client (AC: #4)
  - [x] Créer `aureak/packages/api-client/src/admin/media-items.ts`
  - [x] `listMediaItems` — select + join profiles pour uploaderDisplayName, order by `created_at DESC`
  - [x] `uploadMediaItem(file, metadata)` — `supabase.storage.from('media-library').upload(path, file)` + `insert into media_items` en transaction
  - [x] `approveMediaItem(id)` — update status + approved_by + approved_at
  - [x] `rejectMediaItem(id, reason)` — update status + rejection_reason (validation longueur reason côté API)
  - [x] `getMediaItemUrl(id)` — `createSignedUrl(path, 3600)`
  - [x] Snake_case → camelCase mapping explicite (jamais `as Type[]`)
  - [x] Exporter dans `aureak/packages/api-client/src/index.ts`
- [x] Task 4 — Vue coach upload (AC: #5, #6, #7)
  - [x] Modifier `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx`
  - [x] Détection rôle via `useCurrentRole` : si `coach` → affichage UploadForm + liste perso
  - [x] Composant `UploadForm` dans `_components/` : file picker, input titre (RHF+Zod), textarea description, preview, progress bar
  - [x] Try/finally sur `setUploading`
  - [x] Validation côté client : taille max 50MB image / 500MB vidéo (rejeter avant upload), mime type allowlist
- [x] Task 5 — Vue admin/marketeur galerie (AC: #5, #8, #9)
  - [x] Si rôle `admin` ou `marketeur` → galerie grille responsive (2 colonnes mobile, 3-4 desktop)
  - [x] Composant `MediaGrid` : cards avec thumbnail, titre, uploader, date, badge statut
  - [x] Filtres pills : `Tous | En attente | Validés | Rejetés` (défaut : "En attente")
  - [x] Boutons inline "Approuver" (vert) / "Rejeter" (rouge) sur cards `pending`
  - [x] Modale `RejectModal` avec textarea raison obligatoire (min 5 chars, Zod)
- [x] Task 6 — Vue liste perso coach (AC: #5, #9)
  - [x] Sous le formulaire d'upload : liste compacte des médias uploadés par le coach
  - [x] Chaque entrée : thumbnail + titre + badge statut + raison rejet (si rejeté)
  - [x] Pas d'actions admin sur cette vue

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement/upload
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client` (y compris Storage)
- Snake_case → camelCase mapping explicite après `select('*')` Supabase
- Forms : React Hook Form + Zod pour validation
- Soft-delete uniquement

### Architecture
- **Upload path structuré** : `{tenant_id}/{uploaded_by}/{uuid-filename}` — permet le cleanup futur + isolation tenant
- **Statut par défaut** = `pending` (pas `draft`) — simplification vs. version initiale : pas de mode brouillon pour le coach
- **Rôle marketeur** a les mêmes permissions que admin sur la médiathèque (via RLS check `current_user_role() IN ('admin', 'marketeur')`)
- Le marketeur peut aussi uploader (mais ses uploads vont aussi en `pending` → admin valide — sauf si décision produit contraire)
- URL signées 1h pour l'affichage des thumbnails (renouveler à l'expiration si nécessaire)
- Numéro de migration : **00168** (après Epic 88 jusqu'à 00165 et Epic 90 qui réserve 00166 + 00167)

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00168_create_media_items.sql` | CRÉER | 2 enums + table + RLS + bucket + Storage policies |
| `aureak/packages/types/src/enums.ts` | MODIFIER | Ajouter `MediaFileType`, `MediaItemStatus` + labels + colors |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `MediaItem`, `CreateMediaItemParams` |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/media-items.ts` | CRÉER | CRUD + upload + signed URL |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Exporter fonctions médiathèque |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` | MODIFIER | Remplacer placeholder 91-1 par vue role-aware |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/_components/UploadForm.tsx` | CRÉER | Formulaire upload coach |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/_components/MediaGrid.tsx` | CRÉER | Galerie admin/marketeur |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/_components/MediaCard.tsx` | CRÉER | Card thumbnail + badge + actions |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/_components/RejectModal.tsx` | CRÉER | Modale rejet avec raison |

### Fichiers à NE PAS modifier
- `aureak/apps/web/app/(admin)/marketing/_components/MarketingNavBar.tsx` — story 91-1
- `aureak/apps/web/app/(admin)/marketing/_layout.tsx` — story 91-1

### Dépendances
- Story 91-1 done — layout `(admin)/marketing/` + `mediatheque/page.tsx` placeholder créé
- Epic 86 done — rôle `marketeur` présent, `useCurrentRole` hook disponible
- Table `tenants` — FK `tenant_id`
- Table `auth.users` / `profiles` — FK `uploaded_by`, `approved_by`

### Note historique
Story initialement implémentée dans mega-PR #20 (closed 2026-04-18). Contenu ré-adapté :
- Migration renumérotée `00150` → `00168` (collisions Epic 86 + Epic 89 + Epic 88 + Epic 90 sur main)
- Rôle `marketeur` inclus dans les permissions (Epic 86 done, pas le cas lors de la PR initiale)
- Suppression du statut `draft` (simplification)
