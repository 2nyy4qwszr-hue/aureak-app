# Story 88.5 — Bibliothèque ressources commerciales

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.5
- **Story key** : `88-5-bibliotheque-ressources-commerciales`
- **Priorité** : P2
- **Dépendances** : Story 88-1 done (`ProspectionNavBar` à étendre)
- **Source** : brainstorming 2026-04-18 idée #14
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (migration 00164 + bucket Storage + 4 ressources seed + page Ressources + modale upload)

## Story

En tant que commercial,
je veux avoir accès aux documents commerciaux à jour (PowerPoint, flyers, tarifs) depuis la page Prospection,
afin de ne jamais chercher la dernière version d'un document avant un rendez-vous.

## Acceptance Criteria

1. Page `/developpement/prospection/ressources` accessible depuis un onglet "RESSOURCES" dans la `ProspectionNavBar`
2. 4 cards de ressources prédéfinies :
   - PowerPoint Club (PDF/PPTX) — présentation à envoyer aux clubs
   - Flyer Parents (PDF) — document à distribuer
   - Webpage One-pager (lien URL externe) — page web de présentation
   - Grille Tarifaire (PDF) — tarifs actuels
3. Chaque card affiche : icône type fichier, titre, description courte, date dernière mise à jour, bouton "Télécharger" ou "Ouvrir" (pour les liens URL)
4. L'admin peut uploader/mettre à jour les fichiers depuis la même page (bouton "Modifier" visible admin only)
5. Les fichiers sont stockés dans Supabase Storage bucket `commercial-resources`
6. Le commercial voit toujours la dernière version sans action de sa part
7. Table metadata `commercial_resources` pour tracker les fichiers et leurs métadonnées
8. RLS Storage : admin = upload/update/delete, commercial = lecture seule

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase `00164_create_commercial_resources.sql` (AC: #7)
  - [ ] Table `commercial_resources` : `id` UUID PK, `tenant_id` FK, `title` text, `description` text, `resource_type` enum `commercial_resource_type` (powerpoint, flyer, webpage, tarifs), `file_path` text nullable (chemin dans le bucket), `external_url` text nullable, `file_size` bigint nullable, `mime_type` text nullable, `uploaded_by` FK `auth.users` nullable, `created_at`, `updated_at`
  - [ ] Enum `commercial_resource_type` : `powerpoint`, `flyer`, `webpage`, `tarifs`
  - [ ] RLS enable : admin = CRUD, commercial = SELECT
  - [ ] Seed les 4 ressources prédéfinies (sans fichier, titre + description pré-remplis)
  - [ ] Trigger `updated_at`
- [ ] Task 2 — Supabase Storage bucket (AC: #5, #8)
  - [ ] Créer bucket `commercial-resources` via migration ou config
  - [ ] Storage policies : admin = INSERT/UPDATE/DELETE, tout utilisateur authentifié du tenant = SELECT
  - [ ] Limite taille fichier : 50MB
- [ ] Task 3 — Types TypeScript (AC: #7)
  - [ ] `CommercialResourceType` type union dans `enums.ts` + `COMMERCIAL_RESOURCE_TYPE_LABELS` + icons map
  - [ ] `CommercialResource` entity dans `entities.ts`
  - [ ] `UpdateCommercialResourceParams` : `{ title?, description?, externalUrl? }`
  - [ ] Exporter dans `index.ts`
- [ ] Task 4 — API client (AC: #4, #6)
  - [ ] Ajouter dans `aureak/packages/api-client/src/admin/prospection.ts` ou fichier dédié `commercial-resources.ts` :
  - [ ] `listCommercialResources()` — select all, order by resource_type
  - [ ] `updateCommercialResource(id, params)` — update metadata (admin)
  - [ ] `uploadCommercialResourceFile(id, file: File)` — upload vers bucket + update file_path/mime_type/file_size (admin)
  - [ ] `getResourceDownloadUrl(id)` — URL signée Supabase Storage (ou external_url pour webpage)
  - [ ] Snake_case → camelCase mapping explicite
- [ ] Task 5 — UI page Ressources (AC: #1, #2, #3)
  - [ ] Créer `/developpement/prospection/ressources/page.tsx` + `index.tsx`
  - [ ] Modifier `ProspectionNavBar` : ajouter onglet "RESSOURCES"
  - [ ] 4 cards en grille 2x2 (ou responsive)
  - [ ] Design card : icône type (document/link/spreadsheet), titre bold, description muted, date "Mis à jour le JJ/MM/AAAA", CTA "Télécharger" ou "Ouvrir le lien"
  - [ ] Si pas de fichier encore : affichage "Pas encore disponible" en grisé
- [ ] Task 6 — UI upload admin (AC: #4)
  - [ ] Bouton "Modifier" visible admin only sur chaque card
  - [ ] Modale d'upload : file picker (ou input URL pour webpage)
  - [ ] Progress bar pendant l'upload
  - [ ] Pour webpage : input URL au lieu du file picker
  - [ ] Mise à jour automatique de la card après upload

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`

### Architecture
- Les 4 ressources sont PREDEFINIES (seed). Pas de CRUD libre (pas de création/suppression de ressources). Seul le contenu (fichier/URL) et les métadonnées sont modifiables par l'admin.
- Pour la webpage : le champ `external_url` est utilisé au lieu de `file_path`. Le bouton devient "Ouvrir le lien" et ouvre dans un nouvel onglet.
- Le bucket Supabase Storage `commercial-resources` stocke les fichiers avec un chemin structuré : `{tenant_id}/{resource_type}/{filename}`.
- URL signée pour le téléchargement : utiliser `supabase.storage.from('commercial-resources').createSignedUrl(path, 3600)` (1h d'expiration).
- Numéro de migration : `00164` (après 00163 de story 88-4).

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00164_create_commercial_resources.sql` | CRÉER | Table + enum + RLS + seed + bucket |
| `aureak/packages/types/src/enums.ts` | MODIFIER | Ajouter `CommercialResourceType` + labels |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `CommercialResource`, params |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/prospection.ts` | MODIFIER | Ajouter fonctions CRUD + upload + download URL |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` | MODIFIER | Ajouter onglet "RESSOURCES" |
| `aureak/apps/web/app/(admin)/developpement/prospection/ressources/page.tsx` | CRÉER | Page 4 cards ressources |
| `aureak/apps/web/app/(admin)/developpement/prospection/ressources/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/ressources/_components/ResourceCard.tsx` | CRÉER | Card téléchargement/lien |
| `aureak/apps/web/app/(admin)/developpement/prospection/ressources/_components/UploadModal.tsx` | CRÉER | Modale upload admin |

### Fichiers à NE PAS modifier
- `supabase/migrations/00147_create_commercial_contacts.sql` — migration epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` — hub page existante
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/` — pages pipeline clubs (stories 88-2/88-3)

### Dépendances
- Story 88-1 done — `ProspectionNavBar` doit exister pour ajouter l'onglet "RESSOURCES"
- Supabase Storage configuré (bucket creation possible via migration SQL ou dashboard)
