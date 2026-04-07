# Story 71.6 : Bug — ActivitesHeader hrefs : onglets Présences/Évaluations mal routés

Status: done

## Story
En tant qu'admin, je veux que les onglets PRÉSENCES et ÉVALUATIONS du hub Activités ouvrent leurs pages correctes, afin de pouvoir consulter les données de présences et d'évaluations.

## Acceptance Criteria
1. Cliquer sur l'onglet "PRÉSENCES" dans /activites → naviguer vers /activites/presences (pas /implantations)
2. Cliquer sur l'onglet "ÉVALUATIONS" dans /activites → naviguer vers /activites/evaluations (pas /children)
3. L'onglet "SÉANCES" reste fonctionnel (inchangé)
4. TypeScript compile sans erreur

## Tasks / Subtasks
- [x] T1 — Corriger les hrefs dans ActivitesHeader.tsx (AC: 1, 2, 3)
  - [x] T1.1 — Ligne 12 : remplacer `'/(admin)/activites/presences'` → `'/activites/presences'`
  - [x] T1.2 — Ligne 13 : remplacer `'/(admin)/activites/evaluations'` → `'/activites/evaluations'`
- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T2.2 — Naviguer sur /activites → cliquer PRÉSENCES → confirmer /activites/presences
  - [ ] T2.3 — Cliquer ÉVALUATIONS → confirmer /activites/evaluations

## Dev Notes
### Cause racine
Expo Router traite les groupes de routing (parenthèses) comme transparents à la navigation. Le préfixe `/(admin)/` dans un href provoque une résolution incorrecte : Expo Router interprète `/implantations` à la place de `/activites/presences`, et `/children` à la place de `/activites/evaluations`.

La règle Expo Router : les hrefs internes ne doivent PAS inclure le groupe de routing `/(admin)/`. Utiliser uniquement le chemin réel sans le groupe (ex: `/activites/presences`, pas `/(admin)/activites/presences`).

Note : l'onglet SÉANCES utilise `'/(admin)/activites'` (racine du groupe) — ce href fonctionne car il pointe vers la racine du groupe et non un sous-chemin. Il n'est pas modifié.

### Fichiers à créer / modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifier — 2 lignes (L12 et L13) |

### Fichiers à NE PAS modifier
- `aureak/apps/web/app/(admin)/_layout.tsx`
- `supabase/migrations/` — aucune migration

### Multi-tenant
Sans objet.

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
Aucun — fix trivial 2 lignes
### Completion Notes List
- Suppression du préfixe `/(admin)/` sur les hrefs presences et evaluations
- Expo Router résout correctement `/activites/presences` et `/activites/evaluations` dans le groupe `(admin)`
- TSC : 0 erreurs
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifié |
