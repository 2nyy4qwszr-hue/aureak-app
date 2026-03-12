# Story 18.5 : Joueurs — Séparation nom/prénom + badge "Club partenaire"

Status: done

**Dépendances :** Aucune (fondation pour stories 18-6 et 18-7)

## Story

En tant qu'administrateur Aureak,
je veux que les joueurs aient un nom et prénom distincts affichés comme "NOM Prénom", et voir un badge "Club partenaire" sur les joueurs liés à un club partenaire,
afin d'améliorer la lisibilité, la compatibilité avec les formulaires d'inscription, et d'identifier visuellement l'origine des joueurs.

## Acceptance Criteria

1. **Migration DB** — La table `child_directory` possède deux nouvelles colonnes nullable : `nom TEXT` et `prenom TEXT`. La colonne `display_name` est conservée intacte (pas de suppression, pas de renommage). Ces colonnes sont nullable pour tous les enregistrements existants.
2. **Types TypeScript** — `ChildDirectoryEntry` inclut `nom: string | null` et `prenom: string | null`. `JoueurListItem` inclut `nom: string | null`, `prenom: string | null`, et `isClubPartner: boolean`.
3. **Affichage NOM Prénom** — Un helper `formatNomPrenom(nom, prenom, displayName)` est exporté depuis `@aureak/types` ou `@aureak/business-logic`. Règle : si `nom` ET `prenom` sont renseignés → `NOM.toUpperCase() + ' ' + capitalize(prenom)`. Sinon → `displayName` tel quel (fallback).
4. **Initiales** — La fonction `getInitials` dans `children/index.tsx` utilise en priorité `nom` et `prenom` s'ils sont disponibles. Sinon fallback sur `displayName.split(/\s+/)`.
5. **API listJoueurs** — La fonction `listJoueurs` join `club_directory` via `clubDirectoryId` pour récupérer le champ `partenaire` (boolean). Le résultat `JoueurListItem.isClubPartner` vaut `true` si `clubDirectoryId` est renseigné ET `club_directory.partenaire = true`, sinon `false`.
6. **API getChildDirectoryEntry** — Retourne les champs `nom` et `prenom` dans `ChildDirectoryEntry`.
7. **API createChildDirectoryEntry** (mise à jour story 18-4) — Accepte `nom` et `prenom` en plus de `displayName`.
8. **Formulaire édition** — La section "Identité" dans la fiche joueur (`[childId]/page.tsx`) inclut les champs `nom` et `prenom` en édition inline (en plus du `displayName` actuel). Le `displayName` reste pour la lecture des enregistrements Notion importés sans nom/prenom.
9. **Formulaire création** (`children/new.tsx` créé en 18-4) — Remplacer le champ `displayName` par deux champs séparés `Nom` et `Prénom`. Le `displayName` sera auto-calculé lors de la sauvegarde : `nom.trim() + ' ' + prenom.trim()` (ou juste nom si prénom absent).
10. **Badge "Club partenaire"** — Si `item.isClubPartner === true`, la `JoueurCard` affiche un badge/chip `InfoChip` avec le label `"Club partenaire"` en couleur distincte (utiliser `colors.accent.gold` ou une couleur premium).

## Tasks / Subtasks

- [x] **T1** — Migration DB `supabase/migrations/00073_child_directory_nom_prenom.sql` (AC: #1)
  - [x] `ALTER TABLE child_directory ADD COLUMN IF NOT EXISTS nom TEXT;`
  - [x] `ALTER TABLE child_directory ADD COLUMN IF NOT EXISTS prenom TEXT;`
  - [x] Aucun backfill automatique requis (colonnes nullable)
  - [x] Commentaire de migration ajouté

- [x] **T2** — Mise à jour types TS (AC: #2)
  - [x] `packages/types/src/entities.ts` → `nom: string | null` et `prenom: string | null` dans `ChildDirectoryEntry`
  - [x] `packages/api-client/src/admin/child-directory.ts` → `nom`, `prenom`, `isClubPartner` dans `JoueurListItem`

- [x] **T3** — Helper `formatNomPrenom` (AC: #3)
  - [x] `packages/types/src/helpers.ts` créé — `formatNomPrenom` + `capitalize`
  - [x] Règle : `nom && prenom` → `NOM.toUpperCase() + capitalize(prenom)` ; `nom` seul → `NOM` ; sinon → `displayName`
  - [x] Exporté depuis `packages/types/src/index.ts`
  - [x] JSDoc avec règle de fallback documentée

- [x] **T4** — Mise à jour `listJoueurs` API pour join club partenaire (AC: #5)
  - [x] Select Phase 2 inclut `nom, prenom` + join `club_directory!club_directory_id(partenaire)`
  - [x] Mapping : `isClubPartner: !!(clubDir?.partenaire)`, `nom`, `prenom` ajoutés

- [x] **T5** — Mise à jour `getChildDirectoryEntry` API (AC: #6)
  - [x] `toEntry` mapper mis à jour : `nom: row.nom ?? null`, `prenom: row.prenom ?? null`
  - [x] `createChildDirectoryEntry` accepte `nom?` et `prenom?` (AC #7)
  - [x] `updateChildDirectoryEntry` : `UpdateChildDirectoryParams` + handler incluent `nom`, `prenom`

- [x] **T6** — Mise à jour `getInitials` dans `children/index.tsx` (AC: #4)
  - [x] Signature : `getInitials(displayName, nom?, prenom?)` — priorité `nom+prenom`, sinon split
  - [x] `PhotoAvatar` reçoit `nom?` et `prenom?` en props, passe à `getInitials`
  - [x] `JoueurCard` transmet `nom={item.nom}` et `prenom={item.prenom}` à `PhotoAvatar`

- [x] **T7** — Badge "Club partenaire" dans `JoueurCard` (AC: #10)
  - [x] Badge `{item.isClubPartner && <InfoChip label="Club partenaire" color={colors.accent.gold} />}` ajouté
  - [x] Nom affiché via `formatNomPrenom(item.nom, item.prenom, item.displayName)`

- [x] **T8** — Mise à jour formulaire édition fiche joueur (AC: #8)
  - [x] Champs `EditRow` "Nom" et "Prénom" ajoutés dans section identité (en plus de displayName)
  - [x] `saveIdentite` inclut `nom` et `prenom`
  - [x] Mode lecture : `InfoRow "Nom / Prénom"` affiché si `nom` ou `prenom` renseigné
  - [x] Import `formatNomPrenom` depuis `@aureak/types`

- [x] **T9** — Mise à jour formulaire création `children/new/page.tsx` (AC: #9)
  - [x] Champ `displayName` remplacé par `nom` (requis) + `prenom` (optionnel)
  - [x] `displayName = [nom, prenom].filter(Boolean).join(' ')` calculé au submit
  - [x] Validation : `nom.trim()` requis

- [x] **T10** — Exécuter la migration via Supabase CLI (AC: #1)
  - [x] Migration 00073 appliquée via `npx supabase db push` — Finished ✅
  - [x] Note : migration 00072 (story 21.2) avait un bug `role` → `user_role` corrigé au passage

## Dev Notes

### Migration 00070 — Stratégie

```sql
-- supabase/migrations/00070_child_directory_nom_prenom.sql
-- Séparation nom/prénom pour child_directory
-- display_name conservé comme fallback pour les joueurs importés depuis Notion
-- sans nom/prenom séparés.

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS nom    TEXT,
  ADD COLUMN IF NOT EXISTS prenom TEXT;

COMMENT ON COLUMN child_directory.nom    IS 'Nom de famille (MAJUSCULES à l affichage)';
COMMENT ON COLUMN child_directory.prenom IS 'Prénom (première lettre majuscule)';
```

### Join club_directory dans listJoueurs

La table `child_directory` a déjà `club_directory_id UUID FK`. Le join se fait directement en PostgREST :
```typescript
// Dans la phase 2 de listJoueurs, modifier le select :
.select(`
  id, tenant_id, display_name, nom, prenom, birth_date,
  statut, current_club, niveau_club, club_directory_id,
  actif, deleted_at, created_at, updated_at,
  club_directory!club_directory_id ( partenaire )
`)
```
Le champ `club_directory.partenaire` est un boolean dans la table `club_directory` (confirmé en mémoire).

### Règle d'affichage NOM Prénom — exemples

| nom | prenom | displayName | Résultat |
|---|---|---|---|
| "DUPONT" | "Marie" | "DUPONT Marie" | "DUPONT Marie" |
| "dupont" | "MARIE" | "dupont MARIE" | "DUPONT Marie" |
| null | null | "Dupont Marie" | "Dupont Marie" (fallback) |
| "DUPONT" | null | "DUPONT" | "DUPONT" |

### Compatibilité avec les enregistrements Notion existants

Les 678 joueurs importés depuis Notion ont `display_name` renseigné mais `nom = null` et `prenom = null`. Le helper `formatNomPrenom` retourne `displayName` comme fallback → aucune régression visible. Les admins peuvent renseigner nom/prenom manuellement via la fiche joueur (story 18-5 T8).

### Fichiers concernés

**MODIFIER :**
- `supabase/migrations/00070_child_directory_nom_prenom.sql` — nouveau
- `aureak/packages/types/src/entities.ts` — ChildDirectoryEntry : +nom, +prenom
- `aureak/packages/api-client/src/admin/child-directory.ts` — listJoueurs, getChildDirectoryEntry, createChildDirectoryEntry
- `aureak/apps/web/app/(admin)/children/index.tsx` — getInitials, JoueurCard (badge), PhotoAvatar props
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — section identité édition

**CRÉER :**
- `aureak/packages/types/src/helpers.ts` (ou ajouter dans un fichier existant) — `formatNomPrenom`, `capitalize`
- Export depuis `aureak/packages/types/src/index.ts`

### Badge "Club partenaire" — préparation future

La feature clubs (future) viendra enrichir la gestion partenaire/associé. Le badge est actuellement basé sur `club_directory.partenaire = true`. La colonne `is_partner` (future renommage éventuel) doit être compatible. Pour l'instant utiliser `partenaire` tel quel.

### References

- [Source: aureak/packages/types/src/entities.ts#ChildDirectoryEntry] — type à étendre
- [Source: aureak/packages/api-client/src/admin/child-directory.ts#listJoueurs] — join club_directory à ajouter
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L49-L53] — getInitials actuel
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L108-L114] — InfoChip composant
- [Source: MEMORY.md#Annuaire Clubs] — club_directory.partenaire boolean confirmé
- [Source: MEMORY.md#Annuaire Joueurs] — display_name, logique import Notion

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: Migration `00073_child_directory_nom_prenom.sql` créée et appliquée (numéro ajusté 00070→00073 car 00070-00072 déjà pris)
- T2: `ChildDirectoryEntry` +nom/prenom ; `JoueurListItem` +nom, +prenom, +isClubPartner
- T3: `packages/types/src/helpers.ts` créé — `capitalize` + `formatNomPrenom` exportés depuis `index.ts`
- T4: `listJoueurs` Phase 2 join `club_directory!club_directory_id(partenaire)` + mapping isClubPartner, nom, prenom
- T5: `toEntry` mapper +nom/prenom ; `createChildDirectoryEntry` et `updateChildDirectoryEntry` étendus
- T6: `getInitials` signature étendue (nom?, prenom?) ; `PhotoAvatar` reçoit nom/prenom
- T7: Badge `InfoChip label="Club partenaire" color={colors.accent.gold}` ; nom affiché via `formatNomPrenom`
- T8: Section identité fiche joueur : 2 nouveaux EditRow (Nom, Prénom) + saveIdentite étendue + InfoRow vue lecture
- T9: `children/new/page.tsx` : champ displayName → 2 champs `nom` (requis) + `prenom` (optionnel) ; displayName auto-calculé
- T10: `npx supabase db push` — 00073 appliqué ✅ ; bug `role` → `user_role` dans 00072 corrigé au passage
- ESLint: 0 nouvelles erreurs introduites (erreurs pre-existantes hardcoded colors dans avatarBgColor, StatusChip, InfoChip saisons/stages)

### Code Review Fixes (post-review)

- M1/L1: `new/page.tsx` — `fieldError` state scindé en `nomError` + `dateError` distincts ; chaque Input lié à son erreur propre
- L2: JSDoc `helpers.ts` — ajout note explicite `prenom`-only (nom=null) → fallback `displayName`
- L3: `new/page.tsx` prenom `onChangeText` — clearance de `nomError` ajoutée (cohérence UX)
- L1 migration: `00073_child_directory_nom_prenom.sql` L1 commentaire corrigé 00072→00073

### File List

- `supabase/migrations/00073_child_directory_nom_prenom.sql` — nouveau (migration DB)
- `supabase/migrations/00072_session_theme_blocks.sql` — bug fix `role` → `user_role` (story 21.2, bloquait push)
- `aureak/packages/types/src/entities.ts` — +nom, +prenom dans ChildDirectoryEntry
- `aureak/packages/types/src/helpers.ts` — nouveau : capitalize, formatNomPrenom
- `aureak/packages/types/src/index.ts` — +export * from './helpers'
- `aureak/packages/api-client/src/admin/child-directory.ts` — JoueurListItem +nom/prenom/isClubPartner, listJoueurs join club_directory, toEntry +nom/prenom, createChildDirectoryEntry +nom/prenom, updateChildDirectoryEntry +nom/prenom
- `aureak/apps/web/app/(admin)/children/index.tsx` — getInitials étendue, PhotoAvatar +nom/prenom, JoueurCard badge partenaire + formatNomPrenom, import formatNomPrenom
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — section identité +EditRow Nom/Prénom, saveIdentite +nom/prenom, InfoRow vue lecture, import formatNomPrenom
- `aureak/apps/web/app/(admin)/children/new/page.tsx` — champ displayName → nom + prenom (était new.tsx, fichier réel = new/page.tsx)
