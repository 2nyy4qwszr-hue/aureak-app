# Story 29.1 : Enrichissement matricules clubs — Stockage et backfill depuis RBFA

Status: done

---

## Story

En tant qu'administrateur Aureak,
je veux que le matricule officiel RBFA de chaque club soit automatiquement stocké dans la base de données lors du matching RBFA (auto ou manuel), et que les clubs déjà matchés soient enrichis via une migration de backfill,
afin que le champ `matricule` de chaque club soit fiable et exploitable pour les filtrages, tris, et affiliations joueurs.

---

## Contexte & Diagnostic

Le champ `club_directory.matricule` (TEXT nullable, migration 00033) existe depuis la création de l'annuaire. L'API RBFA retourne déjà `registrationNumber` (parsé en `matricule` dans `rbfa-parser.ts`). Ce matricule est utilisé dans l'algorithme de matching (scoring 60 pts), mais il **n'est jamais écrit** dans `club_directory.matricule` lors du processus de sync :

- `rbfa-sync.ts` ligne ~178 : `updatePayload` ne contient pas `matricule`
- Confirmation review manuelle : ne propage pas non plus le matricule
- Résultat : des clubs ont `matricule = NULL` meme apres un matching RBFA reussi

---

## Acceptance Criteria

### AC1 — Fix `processClub()` — propagation automatique (high confidence)
- Dans `aureak/packages/api-client/src/admin/rbfa-sync.ts`, `updatePayload` inclut `matricule` pour tous les clubs auto-matchés (confidence = 'high')
- Si `candidate.matricule` est non-null et non vide, `club_directory.matricule` est mis a jour
- Ne pas ecraser une valeur manuelle existante : inclure le matricule RBFA uniquement si `candidate.matricule` est truthy

### AC2 — Fix confirmation review manuelle — propagation matricule
- Dans `aureak/packages/api-client/src/admin/club-match-reviews.ts`, la fonction de confirmation propage le matricule depuis `rbfa_candidate.matricule` vers `club_directory.matricule`
- Meme regle que AC1 : ne pas ecraser si le candidat n'a pas de matricule

### AC3 — Migration backfill — clubs deja matches sans matricule
- Creer deux fichiers migration (verifier les numeros disponibles dans chaque dossier avant) :
  - `aureak/supabase/migrations/` — dernier = `00082`, donc utiliser `00089` (vérifier)
  - `supabase/migrations/` — dernier = `00087`, donc utiliser `00088` (vérifier)
- UPDATE `club_directory.matricule` depuis `club_match_reviews.rbfa_candidate->>'matricule'`
- Conditions : `rbfa_status = 'matched'` AND `matricule IS NULL` AND candidat a un matricule non vide
- Migration idempotente

### AC4 — Badge matricule sur la carte club
- Sur le composant carte club (grille `/clubs`), si `club.matricule` non-null : afficher un badge discret `# {matricule}`
- Style : `colors.text.muted`, fontSize 10
- Ne pas afficher si matricule null

### AC5 — Fiche club (deja implemente — verification uniquement)
- La fiche `/clubs/[clubId]` affiche et permet l'edition du matricule (code existant lignes 560-563 et 722)
- Aucune modification attendue, verifier uniquement

---

## Tasks / Subtasks

- [x] Task 1 — Verifier numeros migration disponibles (AC3)
  - [x] `ls aureak/supabase/migrations/ | tail -5` pour confirmer le dernier numero
  - [x] `ls supabase/migrations/ | tail -5` pour confirmer le dernier numero
  - [x] Creer les deux fichiers avec les bons numeros

- [x] Task 2 — Fix `rbfa-sync.ts` : ajouter matricule dans updatePayload (AC1)
  - [x] Lire `aureak/packages/api-client/src/admin/rbfa-sync.ts` lignes 178-186
  - [x] Ajouter `if (candidate.matricule) updatePayload.matricule = candidate.matricule` dans updatePayload

- [x] Task 3 — Fix `club-match-reviews.ts` : propager matricule sur confirmation (AC2)
  - [x] Lire `aureak/packages/api-client/src/admin/club-match-reviews.ts`
  - [x] Identifier la fonction de confirmation de review (`confirmMatchReview`)
  - [x] Ajouter propagation `matricule` depuis `rbfa_candidate`

- [x] Task 4 — Migration backfill (AC3)
  - [x] Creer migration dans `aureak/supabase/migrations/00089_backfill_club_matricules.sql`
  - [x] Creer migration dans `supabase/migrations/00088_backfill_club_matricules.sql`
  - [x] Tester idempotence (condition IS NULL garantit l'idempotence)

- [x] Task 5 — Badge matricule sur ClubCard (AC4)
  - [x] Localiser composant carte club : `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`
  - [x] Ajouter badge `# {matricule}` conditionnel (top-left, miroir du badge relation top-right)
  - [x] Utiliser `colors.text.muted` + fontSize 10 + backgroundColor rgba(255,255,255,0.85)

- [x] Task 6 — Verification AC5 (deja implemente)
  - [x] Confirme : fiche club affiche et permet l'edition du matricule (lignes 560-563 et 722) — aucun changement

---

## Dev Notes

### Gap identifie — source du probleme

Fichier `aureak/packages/api-client/src/admin/rbfa-sync.ts`, fonction `processClub()`, lignes ~178-186 :

```ts
const updatePayload: Record<string, unknown> = {
  rbfa_id         : candidate.rbfaId,
  rbfa_url        : candidate.rbfaUrl,
  rbfa_logo_url   : resolvedLogoUrl ?? candidate.logoUrl,
  rbfa_confidence : score.total,
  rbfa_status     : 'matched',
  last_verified_at: new Date().toISOString(),
  // MANQUANT : matricule: candidate.matricule
}
```

`candidate` est de type `RbfaClubResult` qui possede `matricule: string | null`.

### Fix recommande pour AC1 et AC2

```ts
// Inclure uniquement si le candidat a un matricule (preserve les valeurs manuelles)
...(candidate.matricule ? { matricule: candidate.matricule } : {})
```

### Pattern migration backfill (AC3)

```sql
-- Migration backfill matricules depuis club_match_reviews
UPDATE club_directory cd
SET    matricule  = cmr.rbfa_candidate->>'matricule',
       updated_at = now()
FROM   club_match_reviews cmr
WHERE  cd.id              = cmr.club_directory_id
  AND  cd.rbfa_status     = 'matched'
  AND  cd.matricule       IS NULL
  AND  cmr.status         IN ('confirmed', 'pending')
  AND  cmr.rbfa_candidate->>'matricule' IS NOT NULL
  AND  cmr.rbfa_candidate->>'matricule' != '';
```

Note : certains clubs auto-matches (high confidence) n'ont pas de review dans `club_match_reviews`. Pour ceux-la, le matricule sera rempli au prochain passage de `syncMissingClubLogos` grace au fix de Task 2.

### ClubCard — composant a localiser

La grille clubs est rendue dans `aureak/apps/web/app/(admin)/clubs/page.tsx`. Chercher le composant carte (peut etre inline ou importe). Le type `ClubDirectoryEntry` possede deja `matricule: string | null` — pas de changement de type necessaire.

### Stack technique (rappel)
- **Web admin** : Expo Router + Tamagui/custom UI
- **Styles** : `colors.*` depuis `@aureak/theme/tokens` — utiliser `colors.text.muted`
- **API** : `@aureak/api-client` uniquement
- **DB** : migrations dans `aureak/supabase/migrations/` ET `supabase/migrations/` (les deux dossiers)

### Fichiers cles
| Fichier | Action |
|---|---|
| `aureak/packages/api-client/src/admin/rbfa-sync.ts` | Ajouter matricule dans updatePayload (~ligne 186) |
| `aureak/packages/api-client/src/admin/club-match-reviews.ts` | Propager matricule sur confirmation |
| `aureak/supabase/migrations/0008X_backfill_club_matricules.sql` | Migration backfill (numero a verifier) |
| `supabase/migrations/0008X_backfill_club_matricules.sql` | Idem, dossier prod |
| Composant carte club (dans `clubs/page.tsx`) | Badge matricule conditionnel |

### References
- updatePayload sans matricule : `aureak/packages/api-client/src/admin/rbfa-sync.ts:178`
- Type `RbfaClubResult.matricule` : `aureak/packages/types/src/entities.ts:1430`
- Colonne matricule DB : `supabase/migrations/00033_create_club_directory.sql:30`
- Colonnes RBFA ajoutees : `aureak/supabase/migrations/00081_rbfa_enrichment_columns.sql`
- Table `club_match_reviews` : `aureak/supabase/migrations/00082_club_match_reviews.sql`
- Affichage matricule fiche club : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx:560-563` (vue) et `:722` (edition)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage — implémentation directe sur 5 fichiers.

### Completion Notes List

- AC1 ✅ `rbfa-sync.ts` : extraction et export de `buildMatchedClubPayload()` (pure function testable). Inclut matricule si truthy. Règle preserve : n'écrase pas une valeur manuelle si le candidat n'a pas de matricule.
- AC2 ✅ `club-match-reviews.ts` : `confirmMatchReview()` utilise `buildMatchedClubPayload()` — propagation automatique du matricule.
- AC3 ✅ Deux migrations créées avec DISTINCT ON pour déterminisme (fix M2/M3 code review) : `aureak/supabase/migrations/00089_backfill_club_matricules.sql` et `supabase/migrations/00088_backfill_club_matricules.sql`. Idempotentes via condition `matricule IS NULL`.
- AC4 ✅ `ClubCard.tsx` : badge `#{matricule}` en haut-gauche (miroir symétrique du badge relation haut-droit). Style discret : Montserrat-Regular, fontSize 10, colors.text.muted, background rgba(255,255,255,0.85).
- AC5 ✅ Confirmé sans modification : fiche club affiche et édite déjà le matricule.
- Tests ✅ 10/10 tests vitest passent (`rbfa-matricule.test.ts`). Tests importent la vraie fonction production. Erreurs TS pré-existantes confirmées (non introduites).
- Code Review ✅ Issues H1 (tests sur copie locale), M2 (UPDATE non-déterministe migration 00089), M3 (idem 00088), M1 (File List) — toutes résolues.

### File List

- `aureak/packages/api-client/src/admin/rbfa-sync.ts` — extraction + export `buildMatchedClubPayload()`, ajout matricule dans payload
- `aureak/packages/api-client/src/admin/club-match-reviews.ts` — utilise `buildMatchedClubPayload()`, propagation matricule sur confirmation
- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` — badge matricule top-left
- `aureak/supabase/migrations/00089_backfill_club_matricules.sql` — migration backfill avec DISTINCT ON (nouveau)
- `supabase/migrations/00088_backfill_club_matricules.sql` — migration backfill prod avec DISTINCT ON (nouveau)
- `aureak/packages/api-client/src/admin/__tests__/rbfa-matricule.test.ts` — 10 tests unitaires import réel production (nouveau)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — NON MODIFIÉ (AC5 vérification uniquement — code existant)
