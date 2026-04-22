# Story 90.1 — Pipeline entraîneurs — 4 étapes

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 90 — Prospection Entraîneurs
- **Story ID** : 90.1
- **Story key** : `90-1-pipeline-entraineurs-4-etapes`
- **Priorité** : P2
- **Dépendances** : Story 88-1 done (placeholder `/prospection/entraineurs/` à remplacer) + Epic 86 done ✅ (rôles commercial + permissions)
- **Source** : brainstorming 2026-04-18 idée #25
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (migration 00166 + 1 table + 1 enum + API CRUD + page pipeline + fiche détail + 1 modale)

## Story

En tant qu'admin ou commercial,
je veux gérer un pipeline de prospection d'entraîneurs en 4 étapes (identifié → info → formation → actif),
afin de suivre le recrutement des coachs candidats depuis le premier contact jusqu'à leur activation.

## Acceptance Criteria

1. Table `coach_prospects` avec : `id`, `tenant_id` FK, `first_name`, `last_name`, `email`, `phone`, `city`, `status` enum `coach_prospect_status`, `current_club` text nullable, `specialite` text nullable (ex. "gardiens U13", "analyse vidéo"), `assigned_commercial_id` FK `auth.users` nullable, `recommended_by_coach_id` FK `profiles` nullable (préparation story 90-2), `source` text, `notes` text, `created_at`, `updated_at`, `deleted_at`
2. Enum `coach_prospect_status` : `identifie`, `info_envoyee`, `en_formation`, `actif`, `perdu` (5 valeurs — 4 étapes + 1 dead end)
3. Types TypeScript miroir dans `@aureak/types` (camelCase) : `CoachProspect`, `CoachProspectStatus`, `COACH_PROSPECT_STATUS_LABELS`
4. API CRUD dans `@aureak/api-client/src/admin/coach-prospection.ts` : `listCoachProspects`, `getCoachProspect`, `createCoachProspect`, `updateCoachProspect`, `updateCoachProspectStatus`
5. Page `/developpement/prospection/entraineurs` : StatCards (Total / En formation / Actifs ce trimestre / Perdus) + tableau prospects avec colonnes PRÉNOM NOM | VILLE | STATUT | SPÉCIALITÉ | COMMERCIAL | DERNIERE ACTION
6. Filtres par statut pipeline et par commercial assigné
7. Clic sur un prospect ouvre la fiche détail (`/developpement/prospection/entraineurs/[prospectId]`)
8. Fiche détail : en-tête (nom, ville, statut avec dropdown changement), coordonnées (email, phone), section club actuel + spécialité, notes admin/commercial
9. Formulaire modale ajout coach prospect (React Hook Form + Zod)
10. RLS : admin voit tout le tenant, commercial voit uniquement ses prospects assignés
11. Le placeholder créé par story 88-1 (`/prospection/entraineurs/page.tsx` empty state) est remplacé par la vraie page pipeline

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase `00166_create_coach_prospects_pipeline.sql` (AC: #1, #2, #10)
  - [ ] Enum `coach_prospect_status` (5 valeurs : `identifie`, `info_envoyee`, `en_formation`, `actif`, `perdu`)
  - [ ] Table `coach_prospects` avec colonnes spécifiées, FK `tenants`, FK nullable `auth.users` (assigned_commercial_id), FK nullable `profiles` (recommended_by_coach_id — préparation 90-2)
  - [ ] Index sur `coach_prospects(tenant_id, status)`, `coach_prospects(assigned_commercial_id)`, `coach_prospects(recommended_by_coach_id)`
  - [ ] RLS enable
  - [ ] Policies SELECT/INSERT/UPDATE : admin = tout tenant, commercial = `assigned_commercial_id = auth.uid()`, coach recommendeur = SELECT sur ses propres recommandations
  - [ ] Trigger `updated_at`
  - [ ] Soft-delete : filtrer `WHERE deleted_at IS NULL` dans les policies SELECT
- [ ] Task 2 — Types TypeScript (AC: #3)
  - [ ] `CoachProspectStatus` type union dans `enums.ts` + `COACH_PROSPECT_STATUS_LABELS` map
  - [ ] `CoachProspect` entity dans `entities.ts`
  - [ ] `CreateCoachProspectParams`, `UpdateCoachProspectParams`
  - [ ] Exporter dans `index.ts`
- [ ] Task 3 — API client (AC: #4)
  - [ ] Créer `aureak/packages/api-client/src/admin/coach-prospection.ts`
  - [ ] `listCoachProspects(filters?: { status?, commercialId? })` — select + snake→camel mapping
  - [ ] `getCoachProspect(id)` — select single
  - [ ] `createCoachProspect(params)` — insert + return
  - [ ] `updateCoachProspect(id, params)` — update partiel
  - [ ] `updateCoachProspectStatus(id, status)` — update status seul
  - [ ] Snake_case → camelCase mapping explicite sur chaque fonction (jamais `as Type[]`)
  - [ ] Exporter dans `index.ts` du package
- [ ] Task 4 — UI StatCards (AC: #5)
  - [ ] Composant `CoachProspectionStatCards` dans `entraineurs/_components/`
  - [ ] 4 cards : Total prospects, En formation, Actifs ce trimestre, Perdus
  - [ ] Pattern `StatCards` de `/activites/components/StatCards.tsx`
- [ ] Task 5 — UI tableau prospects (AC: #5, #6, #7)
  - [ ] Remplacer le contenu de `/prospection/entraineurs/page.tsx` (placeholder story 88-1) par le tableau pipeline
  - [ ] 6 colonnes : PRÉNOM NOM | VILLE | STATUT (badge coloré) | SPÉCIALITÉ | COMMERCIAL | DERNIÈRE ACTION (date relative)
  - [ ] Filtres : pills par statut pipeline + dropdown commercial
  - [ ] `Pressable` sur chaque ligne → navigation vers fiche détail
- [ ] Task 6 — UI fiche détail prospect entraîneur (AC: #7, #8)
  - [ ] Page `/developpement/prospection/entraineurs/[prospectId]/page.tsx` + `index.tsx`
  - [ ] En-tête : prénom nom, ville, statut (dropdown changement 5 valeurs), commercial assigné
  - [ ] Section coordonnées : email, phone (cliquables `mailto:` / `tel:`)
  - [ ] Section profil : club actuel, spécialité (formats libres)
  - [ ] Section notes : textarea notes commercial/admin
  - [ ] Placeholder section "Recommandation" (à remplir par story 90-2)
- [ ] Task 7 — Formulaire ajout prospect entraîneur (AC: #9)
  - [ ] Modale `CreateCoachProspectModal` — React Hook Form + Zod
  - [ ] Champs : prénom, nom, email, phone, ville, club actuel, spécialité, commercial assigné (select), source, notes
  - [ ] Bouton "Ajouter un entraîneur" en haut de la page liste

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
- `coach_prospects` est une table **autonome** (séparée de `profiles` des coachs actifs). Un prospect devient éventuellement un coach mais la table `coach_prospects` garde l'historique du pipeline même après conversion.
- Le statut `actif` marque la fin du pipeline ; le profil auth coach est créé via le flow d'invitation standard (Epic 87 — invitation dédiée commercial/manager/marketeur, pattern réutilisable pour coach).
- La FK `recommended_by_coach_id` est ajoutée **dès la migration 90-1** mais utilisée uniquement par story 90-2. Nullable par défaut.
- Numérotation migration : **00166** (après Epic 88 qui réserve 00161-00165).

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00166_create_coach_prospects_pipeline.sql` | CRÉER | Enum + table + RLS + index + trigger |
| `aureak/packages/types/src/enums.ts` | MODIFIER | Ajouter `CoachProspectStatus` + labels |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `CoachProspect` + params |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/coach-prospection.ts` | CRÉER | CRUD coach_prospects |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Exporter fonctions coach-prospection |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx` | REMPLACER | Page pipeline (au lieu du placeholder story 88-1) |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/index.tsx` | CONSERVER | Re-export existant |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/[prospectId]/page.tsx` | CRÉER | Fiche détail prospect entraîneur |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/[prospectId]/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachProspectionStatCards.tsx` | CRÉER | 4 stat cards |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachProspectTable.tsx` | CRÉER | Tableau pipeline |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CreateCoachProspectModal.tsx` | CRÉER | Formulaire ajout prospect |

### Fichiers à NE PAS modifier
- `supabase/migrations/00161_create_club_prospects_pipeline.sql` — Epic 88 (clubs prospects, indépendant)
- `aureak/packages/api-client/src/admin/prospection.ts` — Epic 88 (CRM clubs, ne pas confondre)
- `aureak/apps/web/app/(admin)/academie/coachs/` — Epic 87 (coachs actifs, indépendant)
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` — story 88-1 (déjà bon)

### Dépendances
- Story 88-1 done (hub + ProspectionNavBar + placeholder `/entraineurs/`) — cette story remplace le placeholder
- Epic 86 done (rôle `commercial` + permissions `developpement.prospection`)
- Table `tenants` — FK `tenant_id`
- Table `auth.users` — FK `assigned_commercial_id`
- Table `profiles` — FK `recommended_by_coach_id` (préparation story 90-2)

### Notes migration
- La migration crée la colonne `recommended_by_coach_id` **dès maintenant** pour éviter un ALTER TABLE en 90-2. La colonne reste nullable et ignorée en 90-1.
- Pas de contrainte `CHECK` sur la spécialité (format libre) — les suggestions viendront en UI via autocomplete plus tard.
- Soft-delete obligatoire : `deleted_at timestamptz` + filtrage dans RLS SELECT.
