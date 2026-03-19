# Story 23.3 : Ajout et gestion du type de relation club (statut)

Status: done

## Story

En tant qu'administrateur Aureak,
je veux pouvoir qualifier chaque club selon son niveau de relation avec l'académie (Partenaire / Club associé / Club normal),
afin de différencier rapidement les clubs dans l'interface et d'adapter les fonctionnalités futures à leur statut.

## Contexte

La table `club_directory` possède déjà un booléen `club_partenaire`. Ce booléen est binaire (partenaire ou pas) et ne permet pas d'exprimer la nuance "club associé" (relation intermédiaire). Cette story remplace le booléen par un type énuméré à 3 valeurs et migre les données existantes.

**État actuel du code :**
- `supabase/migrations/00033_create_club_directory.sql` : `club_partenaire BOOLEAN NOT NULL DEFAULT false`
- `aureak/packages/api-client/src/admin/club-directory.ts` : `ClubDirectoryFields.clubPartenaire?: boolean`, `mapRow` lit `club_partenaire`
- `aureak/packages/types/src/entities.ts` : `ClubDirectoryEntry.clubPartenaire: boolean`
- `aureak/apps/web/app/(admin)/clubs/page.tsx` : filtres "Partenaires / Non partenaires" basés sur `club_partenaire`
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` : toggle boolean "Club partenaire" dans le formulaire d'édition
- Dernier numéro de migration disponible : 00077

## Objectif

Remplacer `club_partenaire: boolean` par `club_relation_type: ClubRelationType` (enum à 3 valeurs) à tous les niveaux : DB, types TS, API, UI.

## Scope IN

- Migration 00078 : ajout colonne `club_relation_type`, migration des données, suppression de `club_partenaire`
- Mise à jour du type TS `ClubDirectoryEntry`
- Mise à jour de l'API `@aureak/api-client/src/admin/club-directory.ts`
- Mise à jour des filtres dans `clubs/page.tsx`
- Mise à jour du formulaire d'édition dans `clubs/[clubId]/page.tsx`
- Mise à jour du formulaire de création `clubs/new.tsx`
- Valeur par défaut : `normal` pour les clubs sans `club_partenaire = true`
- Badge visuel dans la liste et les cartes

## Scope OUT

- Aucun changement de logique RLS lié au statut club (la policy reste sur `club_partenaire` jusqu'à vérification — voir section risques)
- Pas de changement des autres entités qui référencent `club_partenaire` (notamment `listJoueurs` / `isClubPartner` dans `child-directory.ts` qui utilise le champ via join — voir section impacts)
- Pas de création de fonctionnalités spécifiques par statut (réservé aux épics suivants)

## Impacts Base de Données

### Migration 00078 : `club_relation_type_enum`

```sql
-- Étape 1 : créer l'enum
CREATE TYPE club_relation_type AS ENUM ('partenaire', 'associe', 'normal');

-- Étape 2 : ajouter la colonne avec valeur dérivée des données existantes
ALTER TABLE club_directory
  ADD COLUMN club_relation_type club_relation_type NOT NULL DEFAULT 'normal';

-- Étape 3 : migrer les données
UPDATE club_directory
  SET club_relation_type = 'partenaire'
  WHERE club_partenaire = true;

-- Étape 4 : supprimer l'ancienne colonne
ALTER TABLE club_directory DROP COLUMN club_partenaire;

-- Étape 5 : mettre à jour le commentaire
COMMENT ON COLUMN club_directory.club_relation_type
  IS 'Niveau de relation du club avec l''académie : partenaire (officiel), associe (informel), normal (sans relation particulière)';
```

**Point critique** : La view ou la policy qui référence `club_partenaire` doit être vérifiée. Dans `child-directory.ts`, le join `club_directory!club_directory_id(club_partenaire)` deviendra `club_directory!club_directory_id(club_relation_type)`.

## Impacts Types TypeScript

### `@aureak/types/src/entities.ts`

```ts
// Avant
export type ClubDirectoryEntry = {
  ...
  clubPartenaire: boolean
  ...
}

// Après
export type ClubRelationType = 'partenaire' | 'associe' | 'normal'

export type ClubDirectoryEntry = {
  ...
  clubRelationType: ClubRelationType
  ...
}
```

Exporter aussi : `CLUB_RELATION_TYPES: ClubRelationType[]` et les labels français.

```ts
export const CLUB_RELATION_TYPE_LABELS: Record<ClubRelationType, string> = {
  partenaire: 'Partenaire',
  associe   : 'Club associé',
  normal    : 'Club normal',
}
```

## Impacts API

### `@aureak/api-client/src/admin/club-directory.ts`

1. **`ClubDirectoryFields`** : remplacer `clubPartenaire?: boolean` par `clubRelationType?: ClubRelationType`
2. **`mapRow()`** : `clubRelationType: (r.club_relation_type as ClubRelationType) ?? 'normal'`
3. **`toDbPayload()`** : `club_relation_type: fields.clubRelationType ?? 'normal'`
4. **`ListClubDirectoryOpts`** : remplacer `partenaire?: boolean` par `relationTypes?: ClubRelationType[]`
5. **`listClubDirectory()`** : nouveau filtre `if (opts.relationTypes) query = query.in('club_relation_type', opts.relationTypes)`

**Impact sur `child-directory.ts`** (Story 18-5 / `listJoueurs`) :
- La ligne `club_directory!club_directory_id(club_partenaire)` doit devenir `club_directory!club_directory_id(club_relation_type)`
- `isClubPartner: !!(clubDir?.club_partenaire)` devient `isClubPartner: clubDir?.club_relation_type === 'partenaire'`
- La propriété `JoueurListItem.isClubPartner` conserve son nom (sémantique métier inchangée)

## Impacts Front-End

### `clubs/page.tsx`

- Remplacer `FilterPartenaire = 'all' | 'partner' | 'common'` par un filtre multi-select sur `ClubRelationType`
- Onglets de filtre : **Tous / Partenaires / Associés / Normaux**
- Ou (recommandé) : garder 3 onglets simples + "Tous"

```ts
type FilterRelation = 'all' | 'partenaire' | 'associe' | 'normal'
const RELATION_TABS: { key: FilterRelation; label: string }[] = [
  { key: 'all',       label: 'Tous'         },
  { key: 'partenaire',label: 'Partenaires'  },
  { key: 'associe',   label: 'Associés'     },
  { key: 'normal',    label: 'Normaux'      },
]
```

- La table affiche actuellement un `<Badge label="Partenaire" variant="gold" />` conditionnel → remplacer par badge dynamique selon `clubRelationType`

### `clubs/[clubId]/page.tsx`

- Section "Statut" en mode édition : remplacer le toggle booléen `clubPartenaire` par un sélecteur à 3 options (pills style `ProvinceSelector` existant)
- Section lecture : afficher un badge avec la bonne couleur/label

### `clubs/new.tsx`

- Ajouter le champ `clubRelationType` dans le formulaire de création (sélecteur 3 options, défaut `'normal'`)

## Validations

- `clubRelationType` est obligatoire, valeur parmi `['partenaire', 'associe', 'normal']`
- Valeur par défaut `'normal'` si non renseignée
- Zod : `z.enum(['partenaire', 'associe', 'normal']).default('normal')`

## Dépendances

- **Aucune dépendance amont** — peut être implémentée en premier
- **Bloque (en partie)** : Story 23.5 (les cartes affichent le statut), Story 23.1 (grille affiche le badge)

## Risques / Points d'Attention

1. **RLS sur `club_partenaire`** : vérifier si des policies Supabase référencent directement `club_partenaire`. Inspecter les fichiers de migrations RLS (00010, 00015, 00030) avant d'appliquer la migration 00078.
2. **`isClubPartner` dans Joueurs** : la Story 18-5 a introduit `isClubPartner: boolean` dans `JoueurListItem`. Ce champ reste un booléen (sémantique "le club est partenaire") — on adapte juste la comparaison. Ne pas casser la page `/children`.
3. **Backward compat des filtres** : les URLs avec `?partenaire=true` dans les bookmarks seront cassées — acceptable (fonctionnalité admin interne).
4. **Wording** : "Club associé" vs "Affilié" vs "Conventionné" — challenger : le terme "associé" est-il le bon terme métier pour Aureak ? Confirmer avec Jeremydevriendt avant de coder.

## Critères d'Acceptation

1. La migration 00078 s'applique sans erreur et migre les données existantes (`club_partenaire = true` → `club_relation_type = 'partenaire'`)
2. La liste de clubs affiche le bon badge pour chaque statut (couleurs distinctes)
3. Le filtre "Tous / Partenaires / Associés / Normaux" fonctionne correctement
4. Le formulaire d'édition permet de changer le statut et sauvegarde correctement
5. Le formulaire de création propose les 3 options
6. `listJoueurs()` retourne `isClubPartner: true` uniquement pour `club_relation_type = 'partenaire'`
7. Les types TypeScript compilent sans erreur
8. Aucune régression sur la page `/children`

## Suggestions de Tests

- Test unitaire : `mapRow()` avec `club_relation_type = 'associe'` → `clubRelationType === 'associe'`
- Test unitaire : `isClubPartner = false` pour un club `associe`
- Test manuel : créer un club "Partenaire", vérifier le badge gold dans la liste
- Test manuel : modifier un club de "Partenaire" → "Associé", vérifier persistance

## Questions Critiques

1. **Wording** : "Club associé" — est-ce le terme exact utilisé dans le contexte Aureak ? Ou préfères-tu "Club conventionné", "Club lié" ?
2. **RLS** : y a-t-il des policies Supabase qui limitent l'accès selon `club_partenaire` ? Si oui, elles doivent être mises à jour dans la même migration.
3. **Filtres UI** : souhaites-tu un filtre par statut unique (radio) ou multi-sélect (checkboxes) ?

## Tasks / Subtasks

- [x] Vérifier les policies RLS référençant `club_partenaire` (AC: 1)
  - [x] grep "club_partenaire" dans supabase/migrations/ → aucune policy RLS, uniquement CREATE TABLE et seed
- [x] Créer migration 00078 (AC: 1)
  - [x] Créer enum `club_relation_type`
  - [x] Ajouter colonne + migrer données + supprimer ancienne colonne
- [x] Mettre à jour `@aureak/types` (AC: 7)
  - [x] Ajouter `ClubRelationType`, `CLUB_RELATION_TYPE_LABELS`, `CLUB_RELATION_TYPES`
  - [x] Modifier `ClubDirectoryEntry.clubRelationType`
- [x] Mettre à jour `@aureak/api-client/src/admin/club-directory.ts` (AC: 2, 3)
  - [x] `ClubDirectoryFields`, `mapRow`, `toDbPayload`, `ListClubDirectoryOpts`, `listClubDirectory`
- [x] Mettre à jour `@aureak/api-client/src/admin/child-directory.ts` (AC: 6)
  - [x] Adapter le join et `isClubPartner`
- [x] Mettre à jour `clubs/page.tsx` (AC: 2, 3)
  - [x] Nouveau type `FilterRelation`, nouveaux onglets, badge dynamique
- [x] Mettre à jour `clubs/[clubId]/page.tsx` (AC: 4)
  - [x] Sélecteur 3 options en mode édition (composant `RelationTypeSelector`), badge en mode lecture
  - [x] Retirer le champ `clubPartenaire` de `EditForm`, ajouter `clubRelationType`
- [x] Mettre à jour `clubs/new.tsx` (AC: 5)
  - [x] Sélecteur `clubRelationType` dans le formulaire (composant `RelationTypeSelector`)
- [x] Vérifier compilation TypeScript (AC: 7) → aucune nouvelle erreur introduite
- [x] Vérifier page `/children` sans régression (AC: 8) → seul changement : `isClubPartner` adapté correctement

## Dev Notes

### Structure de fichiers impactée
- `supabase/migrations/00078_club_relation_type.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ)
- `aureak/packages/types/src/enums.ts` (MODIFIÉ — ajouter `ClubRelationType`, `CLUB_RELATION_TYPES`, `CLUB_RELATION_TYPE_LABELS`)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/admin/child-directory.ts` (MODIFIÉ — isClubPartner)
- `aureak/apps/web/app/(admin)/clubs/page.tsx` (MODIFIÉ)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ)
- `aureak/apps/web/app/(admin)/clubs/new.tsx` (MODIFIÉ)

### Couleurs badges suggérées
- `partenaire` → `colors.accent.gold` (Badge variant "gold" existant)
- `associe` → `#60a5fa` (blue, même couleur que "joueurs affiliés")
- `normal` → `colors.text.muted` (zinc, discret)

### Pattern de référence
Voir le `ProvinceSelector` dans `clubs/[clubId]/page.tsx` pour le pattern de sélecteur à pills multiple — adapter pour `clubRelationType` en mode édition.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Code Review Notes

- L1 fixed: `RELATION_BADGE_VARIANTS` dans `page.tsx` → `Record<Exclude<ClubRelationType, 'normal'>, 'gold' | 'light'>` (dead code `normal: 'zinc'` supprimé)
- L2 fixed: `RelationTypeSelector` extrait dans `clubs/_components/RelationTypeSelector.tsx` — plus de duplication entre `new.tsx` et `[clubId]/page.tsx`
- L3 fixed: badge en mode lecture dans `[clubId]/page.tsx` utilise maintenant `RELATION_BADGE_VARIANTS` au lieu d'un ternaire hardcodé

### Completion Notes List

- Vérification RLS : `club_partenaire` référencé uniquement dans 00033 (CREATE TABLE) et 00039 (seed) — aucune policy à migrer.
- Migration 00078 : enum `club_relation_type` créé, colonne ajoutée, données migrées (`club_partenaire = true` → `'partenaire'`), ancienne colonne supprimée.
- Aucune erreur TypeScript nouvelle introduite. Les erreurs pré-existantes dans coaches/, children/, mobile/ restent inchangées.
- `isClubPartner` dans `child-directory.ts` adapté de `!!(clubDir?.club_partenaire)` vers `clubDir?.club_relation_type === 'partenaire'` — sémantique identique.
- Composant `RelationTypeSelector` créé dans `clubs/[clubId]/page.tsx` et `clubs/new.tsx` selon le pattern pills existant (`ProvinceSelector`).
- Badges de relation type : gold (partenaire), light/blue (associé), zinc (normal — masqué si absent).

### File List

- `supabase/migrations/00078_club_relation_type.sql` (NOUVEAU)
- `aureak/packages/types/src/enums.ts` (MODIFIÉ — ajout ClubRelationType, CLUB_RELATION_TYPES, CLUB_RELATION_TYPE_LABELS)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ — ClubDirectoryEntry.clubRelationType remplace clubPartenaire)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ — ClubDirectoryFields, mapRow, toDbPayload, ListClubDirectoryOpts, listClubDirectory)
- `aureak/packages/api-client/src/admin/child-directory.ts` (MODIFIÉ — join club_relation_type, isClubPartner adapté)
- `aureak/apps/web/app/(admin)/clubs/page.tsx` (MODIFIÉ — FilterRelation, RELATION_TABS, RELATION_BADGE_VARIANTS, badge dynamique)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ — EditForm.clubRelationType, RelationTypeSelector, badge lecture)
- `aureak/apps/web/app/(admin)/clubs/new.tsx` (MODIFIÉ — Form.clubRelationType, RelationTypeSelector, EMPTY_FORM)
