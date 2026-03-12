# Story 21.3 : Training Builder — Système Ateliers (Workshops)

Status: done

## Story

En tant qu'admin/coach,
je veux pouvoir définir jusqu'à 4 ateliers par séance, chacun ayant un titre, une page PDF et une carte associée,
afin que la séance terrain soit complètement structurée avec les exercices pratiques organisés en ateliers et que les coaches disposent de toutes les références matérielles nécessaires.

## Acceptance Criteria

1. Une nouvelle table `session_workshops` est créée en DB avec les colonnes : `id`, `tenant_id`, `session_id`, `title`, `sort_order`, `pdf_url`, `card_label`, `card_url`, `notes`, `created_at`.
2. L'API expose des fonctions `listSessionWorkshops`, `addSessionWorkshop`, `updateSessionWorkshop`, `removeSessionWorkshop`.
3. Une nouvelle étape **Ateliers** est ajoutée dans le formulaire de création après Thèmes pédagogiques (Step 4 si Story 21-2 est déjà implémentée, sinon Step 3). Les steps suivants sont décalés en conséquence.
4. L'étape Ateliers permet d'ajouter de 0 à 4 blocs d'atelier. Chaque bloc contient :
   - Un champ **Titre** (texte libre, ex: "Atelier 1 – Frappe", pré-rempli "Atelier {N}")
   - Un champ **Page PDF** (upload vers Supabase Storage bucket `session-workshops`, retourne une URL) OU saisie d'une URL externe
   - Un champ **Carte** (texte libre pour le label de la carte + upload optionnel d'image vers Storage)
   - Un champ **Notes** (texte optionnel, max 200 chars)
5. L'étape Ateliers est toujours valide (non bloquante — 0 ateliers est permis).
6. Les ateliers sont persistés après création de la séance (appel API post-`createSession`), dans l'ordre d'affichage (sort_order 0-3).
7. Sur la page détail de la séance, une section **Ateliers** affiche les ateliers triés avec titre, PDF (lien cliquable) et carte.
8. Sur la page d'édition de la séance (`seances/[sessionId]/edit.tsx`), les ateliers existants sont chargeables et modifiables (ajout, suppression, mise à jour, réordonnancement via flèches).

## Tasks / Subtasks

- [x] Bucket Supabase Storage `session-workshops` (AC: #4)
  - [x] Créé via migration 00076 (INSERT INTO storage.buckets, public=true, ON CONFLICT DO NOTHING)
  - [x] Politique d'upload/update/delete : `user_role = 'admin'` (colonne `profiles.user_role`, non `role`)
  - [x] Politique DELETE ajoutée (code review M2)

- [x] Migration DB — table `session_workshops` (AC: #1)
  - [x] Migration `00076_session_workshops.sql` (00074 = fix_session_theme_blocks_unique, 00075 = child_directory_nom_prenom)
  - [x] Schéma avec NOT NULL created_at/updated_at, trigger update_updated_at, RLS admin+coach
  - [x] `update_updated_at()` créée dans la migration (absente des fondations, CREATE OR REPLACE)
  - [x] Trigger rendu idempotent : DROP TRIGGER IF EXISTS avant CREATE TRIGGER (code review H2)

- [x] Types TypeScript (AC: #1, #2)
  - [x] `SessionWorkshop` et `SessionWorkshopDraft` ajoutés dans `entities.ts`
  - [x] `SessionWorkshopDraft.id?: string` ajouté (non présent dans spec) pour tracking edit mode
  - [x] `pdfFile: File | null` et `cardFile: File | null` ajoutés (code review H1 — upload différé création)

- [x] API Client — `session-workshops.ts` (AC: #2, #6)
  - [x] Créé `aureak/packages/api-client/src/sessions/session-workshops.ts`
  - [x] Exporté depuis `aureak/packages/api-client/src/index.ts`

- [x] API Client — Upload Storage (AC: #4)
  - [x] `uploadWorkshopPdf` et `uploadWorkshopCard` dans session-workshops.ts
  - [x] Bucket public → getPublicUrl après upload

- [x] Composant `WorkshopBlockEditor` (AC: #3, #4)
  - [x] Créé `aureak/apps/web/app/(admin)/seances/_components/WorkshopBlockEditor.tsx`
  - [x] Max 4 blocs, boutons ↑↓ (masqués si 1 seul bloc), upload immédiat si sessionId connu

- [x] Intégration dans `seances/new.tsx` — Nouveau Step 4 Ateliers (AC: #3, #5, #6)
  - [x] 6 steps : Contexte, Détails, Thèmes, Ateliers, Date, Résumé
  - [x] `workshops: SessionWorkshopDraft[]` state (init `[]`)
  - [x] Bouton "Créer" désactivé si upload en cours (uploads.some(w => w.pdfUploading || w.cardUploading))
  - [x] Ateliers persistés post-createSession, skip si upload en cours
  - [x] Fichiers blob: uploadés vers Storage après createSession() via pdfFile/cardFile (code review H1)

- [x] Page détail `seances/[sessionId]/page.tsx` — Section Ateliers (AC: #7)
  - [x] `listSessionWorkshops` dans Promise.all
  - [x] Section masquée si workshops.length === 0 (pas de "Aucun atelier")

- [x] Page édition `seances/[sessionId]/edit.tsx` — Ateliers éditables (AC: #8)
  - [x] `listSessionWorkshops` dans Promise.all, mapper vers SessionWorkshopDraft[]
  - [x] Diff remove→update→add dans handleSave
  - [x] WorkshopBlockEditor avec sessionId pour uploads immédiats
  - [x] Erreurs d'ateliers surfacées via setSaveError (code review M3 — plus de .catch silencieux)

- [x] Tests manuels (tous AC)
  - [x] Créer séance avec 3 ateliers dont 2 avec PDF uploadé → vérifier persistance + affichage
  - [x] Créer séance sans ateliers → vérifier que la création fonctionne toujours
  - [x] Éditer une séance existante → ajouter un atelier, modifier un titre → vérifier save
  - [x] Vérifier que 5e atelier est impossible (bouton désactivé)
  - [x] Tester l'upload PDF (fichier > 10Mo : vérifier feedback erreur)

## Dev Notes

### Wizard Steps — Position et dépendance Story 21-2

Ce fichier assume que Story 21-2 (blocs thèmes) a été implémentée et que le wizard a déjà 5 steps. Avec cette story, le wizard passe à 6 steps :

1. Contexte (Story 21-1)
2. Méthodologie
3. Thèmes pédagogiques (Story 21-2)
4. **Ateliers ← nouveau**
5. Dates & Durée
6. Récapitulatif

Si Story 21-2 n'est pas encore intégrée au moment de développer cette story, adapter les indices en conséquence (Step 3 Ateliers, Step 4 Dates, Step 5 Summary = 5 steps).

### Upload Storage — Pattern existant à réutiliser

L'application utilise déjà Supabase Storage pour les photos de profil (Story 18-2) et les images de thèmes (Story 20-2). Vérifier le pattern d'upload dans :
- `aureak/packages/api-client/src/` — chercher `storage.from(` pour trouver les fonctions upload existantes
- Réutiliser le même pattern (getPublicUrl après upload)

Chemin recommandé pour les fichiers workshop :
```
session-workshops/{tenant_id}/{session_id}/pdf_{Date.now()}.pdf
session-workshops/{tenant_id}/{session_id}/card_{Date.now()}.{ext}
```

### Contrainte 4 ateliers maximum

La limite de 4 est une règle UX (pas une contrainte DB). La DB n'a pas de constraint `CHECK (sort_order < 4)`. Le frontend doit :
1. Désactiver le bouton "+ Ajouter" quand `workshops.length >= 4`
2. Afficher un tooltip "Maximum 4 ateliers par séance"

### Gestion des uploads en cours pendant la création

Si l'user clique "Créer" pendant qu'un PDF est en cours d'upload (`pdfUploading === true`), deux options :
1. **Recommandé** : désactiver le bouton "Créer" si un upload est actif (vérifier `workshops.some(w => w.pdfUploading || w.cardUploading)`)
2. Fallback : afficher un toast d'erreur explicite

Choisir l'option 1 pour une meilleure UX.

### Update_updated_at trigger

Vérifier si la fonction `update_updated_at()` existe en DB (elle devrait être dans les migrations fondation). Si elle n'existe pas, la créer dans la migration 00072 :
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Session edit page — Stratégie de save des ateliers

La page `seances/[sessionId]/edit.tsx` a déjà un pattern de save global. Intégrer les ateliers dans ce save pattern :
- Collecter les ateliers modifiés (`dirty`)
- Collecter les nouveaux ateliers (sans `id`)
- Collecter les ateliers supprimés (présents au chargement mais absents au save)
- Appeler les API correspondantes dans l'ordre : remove deleted → update dirty → add new

Ne pas faire un "delete all + re-insert" — trop destructif et perd les IDs Supabase.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement (ESLint rule). Pas d'import direct de `supabase` depuis les composants web.

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00072_session_workshops.sql` | Créer (+ bucket policy) |
| `aureak/packages/types/src/entities.ts` | Ajouter `SessionWorkshop`, `SessionWorkshopDraft` |
| `aureak/packages/api-client/src/sessions/session-workshops.ts` | Créer |
| `aureak/packages/api-client/src/index.ts` | Exporter |
| `aureak/apps/web/app/(admin)/seances/_components/WorkshopBlockEditor.tsx` | Créer |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Modifier (Step Ateliers + renumérotation) |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier (section Ateliers) |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx` | Modifier (ateliers éditables) |

### References

- [Source: aureak/apps/web/app/(admin)/seances/new.tsx] — wizard à étendre, pattern handleCreate
- [Source: aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx] — pattern d'édition existant à suivre
- [Source: aureak/packages/api-client/src/sessions/sessions.ts] — pattern createSession, uploadPhoto (à chercher pour Storage pattern)
- [Source: aureak/packages/types/src/entities.ts#Session] — structure session, methodologySessionId
- [Source: _bmad-output/planning-artifacts/architecture.md] — RLS policy pattern, Supabase Storage conventions
- [Source: _bmad-output/implementation-artifacts/18-2-joueurs-refonte-ui-photos.md] — pattern upload Storage (Story 18-2 déjà implémentée)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migration numérotée 00076 (00074 = fix_session_theme_blocks_unique, 00075 = child_directory_nom_prenom)
- `update_updated_at()` créée dans la migration (pas dans les fondations, CREATE OR REPLACE)
- `role = 'admin'` corrigé en `user_role = 'admin'` dans les policies RLS (colonne réelle sur `profiles`)
- `SessionWorkshopDraft.id?: string` ajouté pour tracking edit mode (non présent dans la spec)
- Bouton "Créer" bloqué si upload en cours (workshops.some(w => w.pdfUploading || w.cardUploading))
- Blob URLs (mode création sans sessionId) ignorées lors de la persistance (skip pdfUrl/cardUrl)
- Section Ateliers dans page.tsx masquée si workshops.length === 0 (même pattern que 21.2 pour Thèmes)
- Edit page : diff strategy remove→update→add dans handleSave (pas de delete-all+re-insert)
- Wizard 6 steps confirmés (Story 21.2 déjà présente) : Contexte, Détails, Thèmes, Ateliers, Date, Résumé

### File List

- `supabase/migrations/00076_session_workshops.sql`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/sessions/session-workshops.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(admin)/seances/_components/WorkshopBlockEditor.tsx`
- `aureak/apps/web/app/(admin)/seances/new.tsx`
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
- `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
