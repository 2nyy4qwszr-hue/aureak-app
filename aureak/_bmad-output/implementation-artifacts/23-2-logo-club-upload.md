# Story 23.2 : Logo club — upload et affichage

Status: review

## Story

En tant qu'administrateur Aureak,
je veux pouvoir uploader et afficher un logo pour chaque club de l'annuaire,
afin de rendre la liste et les fiches clubs visuellement identifiables.

## Contexte

Les fiches clubs n'avaient aucun support visuel. Cette story ajoute un logo uploadable (image) stocké dans un bucket Supabase Storage privé, avec affichage sous forme d'initiale en fallback.

**État avant :** `ClubDirectoryEntry` sans champ logo — pas de support Storage.

## Scope IN

- Migration 00079 : ajout colonne `logo_path TEXT NULL` sur `club_directory`
- Bucket Supabase Storage `club-logos` (privé, signed URLs)
- API : `uploadClubLogo`, `deleteClubLogo`, `getClubLogoSignedUrl` dans `club-directory.ts`
- UI `clubs/[clubId]/page.tsx` :
  - Title row : affichage du logo (56×56) ou initiale en fallback
  - Section "Logo du club" en mode édition : `<input type="file">` + bouton suppression

## Scope OUT

- Pas d'upload logo dans `clubs/new.tsx` (ajout après création)
- Pas de batch signed URLs dans `listClubDirectory` (prévu pour 23.5)
- Pas de recadrage/compression côté client

## Impacts Base de Données

### Migration 00079 : `club_logo_path`

```sql
ALTER TABLE club_directory ADD COLUMN logo_path TEXT NULL;
COMMENT ON COLUMN club_directory.logo_path
  IS 'Chemin Storage Supabase du logo du club (bucket club-logos). NULL si aucun logo.';
```

### Bucket Storage

- Nom : `club-logos` (à créer dans Supabase Dashboard — bucket privé)
- Path : `{tenantId}/{clubId}/logo.{ext}`
- Politique : accès lecture via signed URLs uniquement

## Impacts Types TypeScript

### `@aureak/types/src/entities.ts`

```ts
// Ajouté dans ClubDirectoryEntry
logoPath: string | null  // chemin Storage brut
```

## Impacts API

### `@aureak/api-client/src/admin/club-directory.ts`

- `mapRow()` : `logoPath: (r.logo_path as string | null) ?? null`
- `getClubLogoSignedUrl(logoPath)` : signed URL 1h via `supabase.storage.from('club-logos').createSignedUrl`
- `uploadClubLogo({ clubId, tenantId, file })` : upload + update `logo_path` en DB
- `deleteClubLogo({ clubId, logoPath })` : remove Storage + `logo_path = null` en DB

## Critères d'Acceptation

1. Migration 00079 s'applique sans erreur
2. Bucket `club-logos` créé dans Supabase
3. Upload d'un logo depuis la fiche club persiste (visible au rechargement)
4. Suppression du logo fonctionne
5. Fallback initiale affiché si pas de logo
6. Aucune erreur TypeScript

## Tasks / Subtasks

- [x] Créer migration 00079 (AC: 1)
- [x] Ajouter `logoPath` dans `ClubDirectoryEntry` (AC: 6)
- [x] Mettre à jour `mapRow()` (AC: 6)
- [x] Implémenter `getClubLogoSignedUrl`, `uploadClubLogo`, `deleteClubLogo` (AC: 3, 4)
- [x] Exporter depuis `index.ts` (AC: 6)
- [x] UI `clubs/[clubId]/page.tsx` — title row + section édition (AC: 3, 4, 5)
- [x] Vérification TypeScript — aucune erreur nouvelle

## Dev Notes

### Structure de fichiers impactée

- `supabase/migrations/00079_club_logo_path.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ — logoPath)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ — mapRow + 3 fonctions Storage)
- `aureak/packages/api-client/src/index.ts` (MODIFIÉ — exports)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ — logo UI)

### Note bucket

Le bucket `club-logos` doit être créé manuellement dans le Supabase Dashboard (Storage > New bucket > privé).
Ou via `supabase/config.toml` si géré en local.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Migration 00079 : colonne `logo_path TEXT NULL` ajoutée sur `club_directory`.
- Bucket `club-logos` (privé, signed URLs 3600s) — à créer dans Supabase Dashboard.
- `logoPath` ajouté dans `ClubDirectoryEntry` et `mapRow`.
- 3 fonctions Storage exportées : `getClubLogoSignedUrl`, `uploadClubLogo`, `deleteClubLogo`.
- UI : title row affiche logo 56×56 ou initiale fallback ; section "Logo du club" en mode édition avec `<input type="file">` + suppression.
- Aucune erreur TypeScript nouvelle.

### File List

- `supabase/migrations/00079_club_logo_path.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/index.ts` (MODIFIÉ)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ)
