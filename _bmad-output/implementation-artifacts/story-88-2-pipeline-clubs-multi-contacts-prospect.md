# Story 88.2 — Pipeline clubs — multi-contacts par prospect

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.2
- **Story key** : `88-2-pipeline-clubs-multi-contacts-prospect`
- **Priorité** : P1
- **Dépendances** : Stories 88-1 done + Epic 85 sur main (migration 00147 `commercial_contacts` existante)
- **Source** : brainstorming 2026-04-18 idées #8, #9, #10
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : L (migration 00161 + 2 tables + 2 enums + API CRUD + pages CRM + 2 modales RHF/Zod)

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

> **Notes d'implémentation (2026-04-22)** :
> - `prospect_status` renommé en `club_prospect_status` (DB) et `ClubProspectStatus` (TS) — collision avec enum existant `prospect_status` (epic 89, enfants).
> - `updateClubProspectStatus` renommé en `updateClubProspectStatusById` pour respecter la convention du generator renommage bulk.
> - Composants UI placés dans `aureak/apps/web/components/admin/prospection/` (respect ADR 005, pas dans `app/_components/`).
> - Lien timeline actions = placeholder dans fiche détail (sera intégré en story 88.3).
> - Les imports dans `page.tsx` utilisent `type ProfileListRow` depuis `@aureak/api-client` (le type n'est pas re-exporté par `@aureak/types`).

- [x] Task 1 — Migration Supabase `00161_create_club_prospects_pipeline.sql` (AC: #1, #2, #3, #4, #12)
  - [ ] Enum `prospect_status` (7 valeurs)
  - [ ] Enum `club_contact_role` (5 valeurs)
  - [ ] Table `club_prospects` avec colonnes spécifiées, FK `tenants`, FK nullable `implantations`, FK `auth.users`
  - [ ] Table `prospect_contacts` avec FK `club_prospects`, colonnes spécifiées
  - [ ] Index sur `club_prospects(tenant_id, status)`, `club_prospects(assigned_commercial_id)`, `prospect_contacts(club_prospect_id)`
  - [ ] RLS enable sur les 2 tables
  - [ ] Policies SELECT/INSERT/UPDATE : admin = tout tenant, commercial = `assigned_commercial_id = auth.uid()`
  - [ ] Trigger `updated_at` sur les 2 tables
  - [ ] Soft-delete : filtrer `WHERE deleted_at IS NULL` dans les policies SELECT
- [ ] Task 2 — Types TypeScript (AC: #5)
  - [ ] `ProspectStatus` type union dans `enums.ts` + `PROSPECT_STATUS_LABELS` map
  - [ ] `ClubContactRole` type union dans `enums.ts` + `CLUB_CONTACT_ROLE_LABELS` map
  - [ ] `ClubProspect` entity dans `entities.ts`
  - [ ] `ProspectContact` entity dans `entities.ts`
  - [ ] `ClubProspectWithContacts` = `ClubProspect & { contacts: ProspectContact[] }`
  - [ ] `CreateClubProspectParams`, `UpdateClubProspectParams`
  - [ ] `CreateProspectContactParams`, `UpdateProspectContactParams`
  - [ ] Exporter dans `index.ts`
- [ ] Task 3 — API client (AC: #6)
  - [ ] Créer `aureak/packages/api-client/src/admin/prospection.ts`
  - [ ] `listClubProspects(filters?: { status?, commercialId? })` — select + join contacts count
  - [ ] `getClubProspect(id)` — select + join contacts
  - [ ] `createClubProspect(params)` — insert + return
  - [ ] `updateClubProspect(id, params)` — update partiel
  - [ ] `updateClubProspectStatus(id, status)` — update status seul
  - [ ] `addProspectContact(clubProspectId, params)` — insert contact
  - [ ] `updateProspectContact(id, params)` — update contact
  - [ ] `deleteProspectContact(id)` — soft-delete contact
  - [ ] Snake_case → camelCase mapping explicite sur chaque fonction (jamais `as Type[]`)
  - [ ] Exporter dans `index.ts` du package
- [ ] Task 4 — UI StatCards (AC: #7)
  - [ ] Composant `ProspectionStatCards` dans `_components/`
  - [ ] 4 cards : Total prospects, En closing, Convertis ce mois, Contacts ajoutés ce mois
  - [ ] Pattern `StatCards` de `/activites/components/StatCards.tsx`
- [ ] Task 5 — UI tableau prospects (AC: #7, #8, #9)
  - [ ] Remplacer le contenu de la page `/developpement/prospection/clubs` par le tableau CRM
  - [ ] 7 colonnes : CLUB | VILLE | STATUT (badge coloré) | NB CONTACTS | DECISIONNAIRE (nom ou "--") | COMMERCIAL | DERNIERE ACTION (date relative)
  - [ ] Filtres : pills par statut pipeline + dropdown commercial
  - [ ] `Pressable` sur chaque ligne → navigation vers fiche détail
- [ ] Task 6 — UI fiche détail prospect (AC: #9)
  - [ ] Page `/developpement/prospection/clubs/[prospectId]/page.tsx` + `index.tsx`
  - [ ] En-tête : nom club, ville, statut (dropdown changement), commercial assigné
  - [ ] Section contacts : liste avec rôle, email, phone, badge décisionnaire
  - [ ] Bouton "Ajouter un contact"
  - [ ] Placeholder timeline actions (story 88-3)
- [ ] Task 7 — Formulaire ajout prospect (AC: #10)
  - [ ] Modale `CreateProspectModal` — React Hook Form + Zod
  - [ ] Champs : nom club, ville, implantation cible (select), source, notes
  - [ ] Bouton "Ajouter un prospect" en haut de la page liste
- [ ] Task 8 — Formulaire ajout contact (AC: #11)
  - [ ] Modale `AddContactModal` — React Hook Form + Zod
  - [ ] Champs : prénom, nom, rôle (select enum), email, phone, is_decisionnaire (toggle), notes

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
- Le numéro de migration doit suivre `00147` : utiliser `00161`.

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00161_create_club_prospects_pipeline.sql` | CRÉER | Enums + 2 tables + RLS + index + triggers |
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
