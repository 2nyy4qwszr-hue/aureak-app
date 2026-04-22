# Story 96.1 — Lier `club_prospects` à `club_directory` (anti-doublon)

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 96 — Pipeline prospects ancré sur l'annuaire clubs
- **Story ID** : 96.1
- **Story key** : `96-1-prospect-club-directory-linking`
- **Priorité** : P1
- **Dépendances** : Epic 88 done ✅ (tables `club_prospects` + `club_directory` existent)
- **Source** : feedback utilisateur 2026-04-22 — "quand je choisi un club, elle n'est pas reliée à celle des clubs… J'aimerais choisir un club de la base de donnée afin de ne pas avoir de doublon"
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (1 migration + 1 API search + 1 composant autocomplete + modification CreateProspectModal + fiche prospect + affichage tableau)

## Contexte

En Epic 88 (story 88.2), `club_prospects.club_name` est un `TEXT` libre : le commercial tape le nom du club à la main. Résultat :
- **Doublons garantis** : "RCS Onhaye", "R.C.S Onhaye", "R.C.S ONhaye" — trois prospects pour le même club.
- **Pas d'enrichissement** : pas de matricule RBFA, pas de logo, pas d'adresse, alors que tout est déjà dans `club_directory` (678 clubs Notion + enrichissement RBFA).
- **Pas de traçabilité inverse** : impossible de voir depuis un club de l'annuaire s'il est en cours de prospection, et par qui.

## Story

En tant que commercial ou admin,
je veux sélectionner un club depuis l'annuaire existant (`club_directory`) au moment de créer un prospect,
afin d'éviter les doublons, hériter automatiquement des infos du club (matricule, ville, logo) et permettre une vue croisée depuis l'annuaire.

## Acceptance Criteria

1. La table `club_prospects` a une colonne `club_directory_id UUID` nullable, FK vers `club_directory(id)` avec `ON DELETE SET NULL`
2. Contrainte d'unicité partielle : **un seul prospect actif (`deleted_at IS NULL` ET `status NOT IN ('converti','perdu')`) par `club_directory_id` par tenant** — l'index empêche le doublon applicatif
3. La modale `CreateProspectModal` remplace le champ texte "Nom du club" par un **autocomplete** qui cherche dans `club_directory` (par `nom` ou `matricule`, debounce 250ms, min 2 caractères, 15 résultats max)
4. Chaque résultat de l'autocomplete affiche : nom du club, matricule RBFA (si présent), ville, province — suffit à distinguer deux clubs homonymes
5. Sélection d'un club → les champs `clubName`, `city` sont pré-remplis depuis `club_directory` et non éditables ensuite ; `club_directory_id` est stocké
6. Si le club cherché n'existe pas dans l'annuaire → un bouton **"Créer un club absent de l'annuaire"** ouvre une section de saisie manuelle avec les 2 champs historiques (`clubName` + `city`). Dans ce cas `club_directory_id` reste NULL, et un warning visuel informe que ce prospect n'est pas rattaché à l'annuaire
7. La fiche détail prospect `/clubs/[prospectId]` affiche, si `club_directory_id` est présent : matricule, ville, province, logo (ligne dédiée sous le titre) + un lien "Voir dans l'annuaire" vers `/academie/clubs/[clubDirectoryId]` (si la page existe)
8. Le tableau pipeline affiche un **badge "Non lié"** discret sur les prospects dont `club_directory_id = NULL` (visibilité de la dette)
9. À la tentative de création d'un doublon (même `club_directory_id` + prospect actif existant), l'API retourne une erreur claire : `"Ce club a déjà un prospect actif (<statut>) assigné à <commercial>."`
10. Les prospects existants **ne sont pas migrés automatiquement** (rétro-backfill reporté en 96.2 si besoin). La colonne reste NULL pour les entrées créées avant 00166.

## Tasks / Subtasks

- [ ] **Task 1 — Migration `00166_club_prospects_directory_link.sql`** (AC: #1, #2)
  - [ ] `ALTER TABLE club_prospects ADD COLUMN club_directory_id UUID REFERENCES club_directory(id) ON DELETE SET NULL`
  - [ ] Index partiel unique : `CREATE UNIQUE INDEX uq_club_prospects_active_directory ON club_prospects(tenant_id, club_directory_id) WHERE deleted_at IS NULL AND status NOT IN ('converti','perdu') AND club_directory_id IS NOT NULL`
  - [ ] Index non-unique : `CREATE INDEX idx_club_prospects_directory ON club_prospects(club_directory_id) WHERE deleted_at IS NULL`
  - [ ] `COMMENT` explicatif sur la colonne (NULL = club hors annuaire / legacy)

- [ ] **Task 2 — API search + types** (AC: #3, #4)
  - [ ] Vérifier si `searchClubDirectory(query, limit)` existe dans `@aureak/api-client` — sinon ajouter dans `admin/club-directory.ts` :
    - [ ] `searchClubDirectory({ query, limit = 15 })` : `ilike('nom', '%q%')` OR `ilike('matricule', '%q%')` filtré `deleted_at IS NULL`, retourne `Pick<ClubDirectoryEntry, 'id'|'nom'|'matricule'|'ville'|'province'|'logoPath'>[]`
  - [ ] Mettre à jour `ClubProspect` type : ajouter `clubDirectoryId: string | null`
  - [ ] Mettre à jour `CreateClubProspectParams` : ajouter `clubDirectoryId?: string`
  - [ ] Mettre à jour `listClubProspects` + `getClubProspect` pour joindre (ou lookup side-car) `club_directory` et retourner `directory?: { nom, matricule, ville, province, logoPath }`

- [ ] **Task 3 — Composant `ClubDirectoryAutocomplete`** (AC: #3, #4)
  - [ ] Créer `aureak/apps/web/components/admin/prospection/ClubDirectoryAutocomplete.tsx`
  - [ ] Input + dropdown résultats (Pressable list), debounce 250ms via `useEffect` + `setTimeout`
  - [ ] État local : `query`, `results`, `loading`, `selected`
  - [ ] Props : `onSelect(clubDirectoryEntry | null)`, `disabled`
  - [ ] Fallback : bouton "Créer un club absent de l'annuaire" sous les résultats (ou si résultats vides après recherche)
  - [ ] Style : même tokens que les autres modales prospection (`colors`, `space`, `radius`)

- [ ] **Task 4 — Refonte `CreateProspectModal`** (AC: #3, #5, #6, #9)
  - [ ] Remplacer le `TextInput clubName` par `ClubDirectoryAutocomplete`
  - [ ] Mode "rattaché" (par défaut) : champs `clubName` + `city` en lecture seule, remplis automatiquement
  - [ ] Mode "manuel" (après clic sur "Créer un club absent de l'annuaire") : champs `clubName` + `city` éditables + banner warning gold
  - [ ] Schema Zod ajusté : soit `clubDirectoryId` présent, soit `clubName` + mode manuel — XOR
  - [ ] Gestion erreur 409 / duplicate depuis l'API → affichage en bas de modale

- [ ] **Task 5 — Gestion doublon côté API** (AC: #9)
  - [ ] Dans `createClubProspect` : si `clubDirectoryId` fourni, check pré-insert s'il existe déjà un prospect actif pour ce tenant+club_directory_id. Si oui, throw `Error` avec message explicite
  - [ ] Le unique index DB est la safety net mais le check applicatif donne un meilleur UX

- [ ] **Task 6 — UI fiche détail prospect** (AC: #7, #8)
  - [ ] `clubs/[prospectId]/page.tsx` : bloc supplémentaire "Annuaire" sous le titre si `directory` présent (matricule · ville · province + logo si `logoPath`)
  - [ ] Lien "Voir dans l'annuaire" → `/academie/clubs/[directory.id]` (vérifier si la route existe, sinon placeholder disabled)
  - [ ] Si `clubDirectoryId === null` : afficher "⚠ Club hors annuaire" en caption muted

- [ ] **Task 7 — UI tableau pipeline** (AC: #8)
  - [ ] `ProspectTable.tsx` : badge "Non lié" discret dans la colonne CLUB si `clubDirectoryId === null`
  - [ ] Style badge : fond `colors.status.amberText + '22'`, texte `colors.status.amberText`, très petit (11px), à droite du nom de club

## Dev Notes

### Contraintes Stack

- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens
- Routing Expo Router inchangé
- Try/finally obligatoire sur state setters de chargement
- Console guards obligatoires
- Accès Supabase UNIQUEMENT via `@aureak/api-client`
- Snake_case → camelCase mapping explicite côté API
- **RLS** : la migration utilise `current_tenant_id_with_fallback()` / `current_user_role_with_fallback()` (pattern Epic 88, memory `project_rls_fallback_helpers.md`) — pas besoin de nouvelles policies, la colonne hérite des policies existantes

### Architecture

- `club_directory` = annuaire officiel tenant-scope (678 clubs Notion + enrichissement RBFA)
- `club_prospects.club_directory_id` = lien optionnel (NULL autorisé pour les clubs hors annuaire, ex. nouveau club pas encore référencé côté Notion)
- Le unique index partiel empêche deux prospects actifs sur le même club tout en autorisant les historiques (convertis/perdus) et les reprises après échec
- Pas de ON DELETE CASCADE : si un club de l'annuaire disparaît, les prospects restent avec `club_directory_id = NULL` (perte de lien mais pas de données)

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00166_club_prospects_directory_link.sql` | CRÉER | Colonne FK + 2 indexes |
| `aureak/packages/api-client/src/admin/club-directory.ts` | MODIFIER | Ajouter `searchClubDirectory` si absent |
| `aureak/packages/api-client/src/admin/prospection.ts` | MODIFIER | Support `clubDirectoryId` + join directory dans list/get + check doublon dans create |
| `aureak/packages/types/src/entities.ts` | MODIFIER | `ClubProspect.clubDirectoryId`, `ClubProspectWithContacts.directory`, `CreateClubProspectParams.clubDirectoryId` |
| `aureak/apps/web/components/admin/prospection/ClubDirectoryAutocomplete.tsx` | CRÉER | Autocomplete standalone réutilisable |
| `aureak/apps/web/components/admin/prospection/CreateProspectModal.tsx` | MODIFIER | Autocomplete + mode manuel fallback |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/page.tsx` | MODIFIER | Bloc "Annuaire" |
| `aureak/apps/web/components/admin/prospection/ProspectTable.tsx` | MODIFIER | Badge "Non lié" |

### Fichiers à NE PAS modifier

- `supabase/migrations/00161_create_club_prospects_pipeline.sql` — migration epic 88, ne pas toucher
- `supabase/migrations/00033_create_club_directory.sql` — annuaire de référence
- `club_directory` lui-même : aucune colonne ajoutée, aucune policy modifiée

### Dépendances

- Epic 88 entier mergé (stories 88.1 à 88.6 done) ✅
- `club_directory` + `listClubDirectory` fonctionnels (epic 23) ✅
- Pattern `current_tenant_id_with_fallback()` disponible (migration 00162) ✅

### Hors scope (parking pour plus tard)

- **Rétro-backfill** des prospects existants créés avant 00166 — si besoin, story 96.2 avec UI "Associer à un club de l'annuaire"
- **Création d'un club dans l'annuaire depuis la modale** — pour l'instant, le mode manuel crée un prospect `club_directory_id = NULL`. L'ajout au directory doit passer par `/academie/clubs/new` (ou équivalent)
- **Vue inverse** : afficher depuis la fiche club de l'annuaire s'il est en prospection, par qui, à quel statut — idéal mais hors scope V1
