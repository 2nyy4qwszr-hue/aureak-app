# Story 88.2 : Pipeline clubs — multi-contacts par prospect

Status: done

## Story

En tant que commercial,
je veux pouvoir gérer un pipeline de clubs prospects avec plusieurs contacts par club,
afin de cartographier l'organisation du club et remonter jusqu'au décisionnaire.

## Acceptance Criteria

1. Table `club_prospects` avec : `id`, `tenant_id` FK, `club_name`, `city`, `target_implantation_id` FK nullable, `status` enum `prospect_status`, `assigned_commercial_id` FK `auth.users`, `source` text, `notes` text, `created_at`, `updated_at`, `deleted_at`
2. Enum `prospect_status` : `premier_contact`, `mapping_orga`, `decisionnaire_identifie`, `rdv_qualifie`, `closing`, `converti`, `perdu`
3. Table `prospect_contacts` avec : `id`, `club_prospect_id` FK, `first_name`, `last_name`, `role` enum `club_contact_role`, `email`, `phone`, `is_decisionnaire` boolean default false, `notes` text, `created_at`, `updated_at`, `deleted_at`
4. Enum `club_contact_role` : `entraineur`, `directeur_sportif`, `president`, `secretaire`, `autre`
5. Types TypeScript miroir dans `@aureak/types` (camelCase)
6. API CRUD dans `@aureak/api-client/src/admin/prospection.ts` : `listClubProspects`, `getClubProspect`, `createClubProspect`, `updateClubProspect`, `updateClubProspectStatus`, `addProspectContact`, `updateProspectContact`, `deleteProspectContact`
7. Page `/developpement/prospection/clubs` remplacée par le CRM : StatCards (Total / En closing / Convertis ce mois / Contacts ce mois) + tableau prospects avec colonnes CLUB | VILLE | STATUT | CONTACTS | DECISIONNAIRE | COMMERCIAL | DERNIERE ACTION
8. Filtres par statut pipeline et par commercial assigné
9. Clic sur un prospect ouvre la fiche détail (`/developpement/prospection/clubs/[prospectId]`)
10. Formulaire modale ajout club prospect (React Hook Form + Zod)
11. Formulaire modale ajout contact sur un prospect (React Hook Form + Zod)
12. RLS : admin voit tout le tenant, commercial voit uniquement ses prospects assignés

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase `00148_create_club_prospects_pipeline.sql` (AC: #1, #2, #3, #4, #12)
  - [x] Enum `prospect_status` (7 valeurs)
  - [x] Enum `club_contact_role` (5 valeurs)
  - [x] Table `club_prospects` avec colonnes spécifiées, FK `tenants`, FK nullable `implantations`, FK `auth.users`
  - [x] Table `prospect_contacts` avec FK `club_prospects`, colonnes spécifiées
  - [x] Index sur `club_prospects(tenant_id, status)`, `club_prospects(assigned_commercial_id)`, `prospect_contacts(club_prospect_id)`
  - [x] RLS enable sur les 2 tables
  - [x] Policies SELECT/INSERT/UPDATE : admin = tout tenant, commercial = `assigned_commercial_id = auth.uid()`
  - [x] Trigger `updated_at` sur les 2 tables
  - [x] Soft-delete : filtrer `WHERE deleted_at IS NULL` dans les policies SELECT
- [x] Task 2 — Types TypeScript (AC: #5)
  - [x] `ProspectStatus` type union dans `enums.ts` + `PROSPECT_STATUS_LABELS` map
  - [x] `ClubContactRole` type union dans `enums.ts` + `CLUB_CONTACT_ROLE_LABELS` map
  - [x] `ClubProspect` entity dans `entities.ts`
  - [x] `ProspectContact` entity dans `entities.ts`
  - [x] `ClubProspectWithContacts` = `ClubProspect & { contacts: ProspectContact[] }`
  - [x] `CreateClubProspectParams`, `UpdateClubProspectParams`
  - [x] `CreateProspectContactParams`, `UpdateProspectContactParams`
  - [x] Exporter dans `index.ts`
- [x] Task 3 — API client (AC: #6)
  - [x] Créer `aureak/packages/api-client/src/admin/prospection.ts`
  - [x] `listClubProspects(filters?: { status?, commercialId? })` — select + join contacts count
  - [x] `getClubProspect(id)` — select + join contacts
  - [x] `createClubProspect(params)` — insert + return
  - [x] `updateClubProspect(id, params)` — update partiel
  - [x] `updateClubProspectStatus(id, status)` — update status seul
  - [x] `addProspectContact(clubProspectId, params)` — insert contact
  - [x] `updateProspectContact(id, params)` — update contact
  - [x] `deleteProspectContact(id)` — soft-delete contact
  - [x] Snake_case → camelCase mapping explicite sur chaque fonction (jamais `as Type[]`)
  - [x] Exporter dans `index.ts` du package
- [x] Task 4 — UI StatCards (AC: #7)
  - [x] Composant `ProspectionStatCards` dans `_components/`
  - [x] 4 cards : Total prospects, En closing, Convertis ce mois, Contacts ajoutés ce mois
  - [x] Pattern `StatCards` de `/activites/components/StatCards.tsx`
- [x] Task 5 — UI tableau prospects (AC: #7, #8, #9)
  - [x] Remplacer le contenu de la page `/developpement/prospection/clubs` par le tableau CRM
  - [x] 7 colonnes : CLUB | VILLE | STATUT (badge coloré) | NB CONTACTS | DECISIONNAIRE (nom ou "--") | COMMERCIAL | DERNIERE ACTION (date relative)
  - [x] Filtres : pills par statut pipeline + dropdown commercial
  - [x] `Pressable` sur chaque ligne → navigation vers fiche détail
- [x] Task 6 — UI fiche détail prospect (AC: #9)
  - [x] Page `/developpement/prospection/clubs/[prospectId]/page.tsx` + `index.tsx`
  - [x] En-tête : nom club, ville, statut (dropdown changement), commercial assigné
  - [x] Section contacts : liste avec rôle, email, phone, badge décisionnaire
  - [x] Bouton "Ajouter un contact"
  - [x] Placeholder timeline actions (story 88-3)
- [x] Task 7 — Formulaire ajout prospect (AC: #10)
  - [x] Modale `CreateProspectModal` — React Hook Form + Zod
  - [x] Champs : nom club, ville, implantation cible (select), source, notes
  - [x] Bouton "Ajouter un prospect" en haut de la page liste
- [x] Task 8 — Formulaire ajout contact (AC: #11)
  - [x] Modale `AddContactModal` — React Hook Form + Zod
  - [x] Champs : prénom, nom, rôle (select enum), email, phone, is_decisionnaire (toggle), notes

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`
- Snake_case → camelCase : mapping explicite après `select('*')` Supabase (jamais `as Type[]` direct)
- Forms : React Hook Form + Zod pour validation
- Soft-delete uniquement : `deleted_at` nullable, jamais de DELETE physique

### Architecture
- `club_prospects` est SEPAREE de `club_directory`. Un prospect n'est pas un club de l'annuaire tant qu'il n'est pas converti.
- La table `commercial_contacts` (epic 85, migration 00147) reste en place pour le registre existant. `club_prospects` est le nouveau pipeline CRM.
- Le mapping organisationnel (multi-contacts par club) est le coeur de cette feature.
- Le flag `is_decisionnaire` est crucial : tant qu'on n'a pas identifié le décisionnaire, le prospect reste en `mapping_orga`.
- Le numéro de migration doit suivre `00147` : utiliser `00148`.

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00148_create_club_prospects_pipeline.sql` | CRÉER | Enums + 2 tables + RLS + index + triggers |
| `aureak/packages/types/src/enums.ts` | MODIFIER | Ajouter `ProspectStatus`, `ClubContactRole` + labels |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `ClubProspect`, `ProspectContact`, params |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/prospection.ts` | CRÉER | CRUD club_prospects + prospect_contacts |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Exporter fonctions prospection |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | MODIFIER | Remplacer par vue CRM pipeline (ou déplacer dans clubs/) |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/page.tsx` | CRÉER | Page CRM pipeline clubs si séparation du hub |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/page.tsx` | CRÉER | Fiche détail prospect |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectionStatCards.tsx` | CRÉER | 4 stat cards |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectTable.tsx` | CRÉER | Tableau CRM |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/CreateProspectModal.tsx` | CRÉER | Formulaire ajout prospect |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/AddContactModal.tsx` | CRÉER | Formulaire ajout contact |

### Fichiers à NE PAS modifier
- `supabase/migrations/00147_create_commercial_contacts.sql` — migration existante epic 85
- `aureak/packages/api-client/src/admin/commercial-contacts.ts` — API existante epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionKPIs.tsx` — composant epic 85 (peut être réutilisé ou remplacé, mais pas modifié)

### Dépendances
- Story 88-1 done (hub + ProspectionNavBar) — les pages clubs sont dans le layout avec NavBar
- Migration 00147 (epic 85) — table `commercial_contacts` existante, ne pas confondre
- Table `tenants` — FK `tenant_id`
- Table `implantations` — FK nullable `target_implantation_id`
- Table `auth.users` — FK `assigned_commercial_id`

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
None

### Completion Notes List
- Migration 00148 : 2 enums + 2 tables + RLS (admin full tenant, commercial own prospects) + indexes + triggers
- Types : ProspectStatus, ClubContactRole enums + 6 entity/param types
- API : 8 fonctions CRUD avec snake_case -> camelCase explicite + enrichissement contacts count / decisionnaire / commercial name
- UI : Page CRM pipeline remplace l'ancienne page clubs, stat cards, tableau 7 colonnes, filtres pills, fiche detail, 2 modales React Hook Form + Zod
- radius.input n'existait pas dans tokens, remplace par radius.xs

### File List
- `supabase/migrations/00148_create_club_prospects_pipeline.sql`
- `aureak/packages/types/src/enums.ts`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/admin/prospection.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectionStatCards.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectTable.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/CreateProspectModal.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/AddContactModal.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/index.tsx`
