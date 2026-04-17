# Story 85.1 : Migration + Types + API Client — Registre Commercial

Status: done

## Story

En tant que développeur,
je veux créer la table `commercial_contacts`, l'enum `commercial_contact_status`, ajouter `commercial` au rôle utilisateur, et exposer les fonctions CRUD via `@aureak/api-client`,
afin que les stories UI suivantes aient une base de données et une API fonctionnelles.

## Context

Epic 85 — Registre Commercial Clubs. Ce module permet aux commerciaux de logger leurs contacts clubs pour éviter les doublons de prospection.

Source de données clubs : `club_directory` (table existante).
Dernière migration : `00146`. Cette story crée la migration `00147`.

## Dependencies

Aucune — première story de l'epic.

## Acceptance Criteria

1. La migration `00147_create_commercial_contacts.sql` crée :
   - Enum `commercial_contact_status` : `premier_contact | en_cours | en_attente | pas_de_suite`
   - `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'commercial'`
   - Table `commercial_contacts` avec colonnes : `id`, `tenant_id`, `club_directory_id`, `commercial_id`, `contact_name`, `contact_role`, `status`, `note`, `contacted_at`, `created_at`, `updated_at`, `deleted_at`
   - FK vers `club_directory(id)` et `auth.users(id)`
   - RLS : SELECT pour même tenant, INSERT/UPDATE pour même tenant + own commercial_id
   - Index sur `club_directory_id` et `commercial_id`
2. Types ajoutés dans `@aureak/types` :
   - `CommercialContactStatus` dans `enums.ts`
   - `CommercialContact` et `CommercialContactWithCommercial` dans `entities.ts`
   - `CreateCommercialContactParams` et `UpdateCommercialContactParams` dans `entities.ts`
3. Fonctions API dans `@aureak/api-client/src/admin/commercial-contacts.ts` :
   - `listCommercialContactsByClub(clubDirectoryId)` → `CommercialContactWithCommercial[]`
   - `listAllCommercialContacts()` → `CommercialContactWithCommercial[]`
   - `createCommercialContact(params)` → `CommercialContact`
   - `updateCommercialContact(params)` → `CommercialContact`
4. Fonctions exportées depuis `@aureak/api-client/src/index.ts`
5. Migration idempotente (IF NOT EXISTS partout)
6. snake_case → camelCase transformation dans les fonctions API (via transforms.ts existant)

## Tasks / Subtasks

- [x] T1 — Créer `supabase/migrations/00147_create_commercial_contacts.sql`
- [x] T2 — Ajouter `CommercialContactStatus` dans `aureak/packages/types/src/enums.ts`
- [x] T3 — Ajouter `CommercialContact`, `CommercialContactWithCommercial`, `CreateCommercialContactParams`, `UpdateCommercialContactParams` dans `aureak/packages/types/src/entities.ts`
- [x] T4 — Créer `aureak/packages/api-client/src/admin/commercial-contacts.ts` avec les 4 fonctions CRUD
- [x] T5 — Exporter les nouvelles fonctions depuis `aureak/packages/api-client/src/index.ts`
- [x] T6 — Vérifier `npx tsc --noEmit` sans erreur

## Files to Create / Modify

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00147_create_commercial_contacts.sql` | Créer — enum + table + RLS + index |
| `aureak/packages/types/src/enums.ts` | Ajouter `CommercialContactStatus` |
| `aureak/packages/types/src/entities.ts` | Ajouter types `CommercialContact*` |
| `aureak/packages/api-client/src/admin/commercial-contacts.ts` | Créer — 4 fonctions CRUD |
| `aureak/packages/api-client/src/index.ts` | Exporter les nouvelles fonctions |

## Commit

`feat(epic-85): story 85.1 — migration + types + api commercial contacts`
