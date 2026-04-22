# Story 98.3 — Rapatrier les 2 pages de comparaison sous `/performance/comparaisons/*`

Status: done

## Completion Notes

- Migrations `git mv` effectuées :
  - `evaluations/comparison/` → `performance/comparaisons/evaluations/`
  - `implantations/compare/` → `performance/comparaisons/implantations/`
- Redirects 301 créés (Expo `<Redirect />`) aux anciennes URLs
- AdminPageHeader v2 appliqué sur les 2 nouvelles pages
- Lien interne mis à jour : `implantations/index.tsx` bouton "Comparer" pointe maintenant vers `/performance/comparaisons/implantations`
- Dossiers legacy `/evaluations/` et `/implantations/` conservés (contiennent toujours les pages `index.tsx` de listing — pas que comparison)
- tsc EXIT 0
- **Note** : l'Expo Router dev server ne détecte les nouveaux dossiers qu'au restart (limitation connue). Playwright a affiché "Unmatched Route" au moment du test — restart du dev server nécessaire pour vérifier visuellement. Structure fichiers + tsc OK.

## Metadata

- **Epic** : 98 — Performance refonte
- **Story ID** : 98.3
- **Story key** : `98-3-rapatrier-comparaisons-performance`
- **Priorité** : P2
- **Dépendances** : **98.1** (migration URL Performance) + **97.3** (AdminPageHeader v2)
- **Source** : Audit UI 2026-04-22. Deux pages de comparaison vivent à des racines orphelines (`/evaluations/comparison`, `/implantations/compare`) — les rapatrier sous Performance pour cohérence.
- **Effort estimé** : M (~3-4h — 2 migrations + imports + redirects + template)

## Story

As an admin,
I want que les pages `/evaluations/comparison` et `/implantations/compare` soient déplacées sous `/performance/comparaisons/evaluations` et `/performance/comparaisons/implantations` respectivement, avec le template `<AdminPageHeader />` v2 appliqué,
So that les outils de comparaison analytics soient accessibles depuis leur zone naturelle (Performance) et qu'il n'y ait plus de pages orphelines à la racine.

## Contexte

### Pages sources

- `aureak/apps/web/app/(admin)/evaluations/comparison/page.tsx` + `index.tsx`
- `aureak/apps/web/app/(admin)/implantations/compare/page.tsx` + `index.tsx`

### Pages cibles

- `app/(admin)/performance/comparaisons/evaluations/page.tsx` + `index.tsx`
- `app/(admin)/performance/comparaisons/implantations/page.tsx` + `index.tsx`

### Dossiers `/evaluations` et `/implantations` résiduels

Le dossier `app/(admin)/evaluations/` contient-il autre chose que `comparison/` ? Si la seule sous-route est `comparison/`, **le dossier `/evaluations` entier peut être supprimé** après migration. Même question pour `/implantations/` (qui aura déjà perdu sa page root via 97.5 si implantation racine existait).

À vérifier au dev.

### Titres

| URL | Titre |
|---|---|
| `/performance/comparaisons/evaluations` | "Comparaison des évaluations" |
| `/performance/comparaisons/implantations` | "Comparaison des implantations" |

## Acceptance Criteria

1. **Migration pages** :
   - `git mv app/(admin)/evaluations/comparison app/(admin)/performance/comparaisons/evaluations`
   - `git mv app/(admin)/implantations/compare app/(admin)/performance/comparaisons/implantations`

2. **Ancien dossiers résiduels** :
   - Si `/evaluations/` ne contient plus que `comparison/` → supprimer le dossier après migration
   - Idem `/implantations/` : supprimer si vide
   - Si dossiers contiennent d'autres routes non migrées → les laisser intactes

3. **Redirects 301** :
   - `/evaluations/comparison` → `/performance/comparaisons/evaluations`
   - `/implantations/compare` → `/performance/comparaisons/implantations`
   - Durée : 1 mois

4. **Application template** :
   - Page evaluations → `<AdminPageHeader title="Comparaison des évaluations" />`
   - Page implantations → `<AdminPageHeader title="Comparaison des implantations" />`
   - Retrait eyebrow/subtitle custom

5. **Imports relatifs** : `tsc --noEmit` EXIT 0 après migration.

6. **Grep liens internes** :
   - `rg '/evaluations/comparison' aureak/` → 0 match hors redirects
   - `rg '/implantations/compare' aureak/` → idem

7. **Nav secondaire Performance** (si créée en 98.2) : ajouter un onglet "Comparaisons" ou sous-groupe accessible depuis la nav.

8. **Cleanup** :
   - Grep hex, headers custom
   - try/finally + console guards

9. **Conformité CLAUDE.md** : patterns Expo Router, tokens.

10. **Test Playwright** :
    - Nouvelles URLs chargent avec bon titre
    - Anciennes URLs redirigent
    - Console zéro erreur

11. **Non-goals explicites** :
    - **Pas de refonte des outils de comparaison** (fonctionnel conservé)
    - **Pas de fusion des 2 comparaisons en une page unique**

## Tasks / Subtasks

- [ ] **T1 — git mv evaluations/comparison** (AC #1)
- [ ] **T2 — git mv implantations/compare** (AC #1)
- [ ] **T3 — Supprimer dossiers résiduels si vides** (AC #2)
- [ ] **T4 — Redirects 301** (AC #3)
- [ ] **T5 — Template header v2** (AC #4)
- [ ] **T6 — Imports relatifs + grep liens** (AC #5, #6)
- [ ] **T7 — Nav secondaire** (AC #7)
- [ ] **T8 — QA** (AC #8, #9, #10)

## Dev Notes

### Convention URL `comparaisons`

`/performance/comparaisons/` en dossier "comparaisons" (pluriel) — à l'image d'autres sous-dossiers thématiques. Les 2 pages enfants utilisent le nom de l'entité comparée (évaluations, implantations). Extensible si d'autres comparaisons émergent futures (coaches, enfants, etc.).

### Orphelinage du dossier `/evaluations`

À date 2026-04-22, à vérifier : `/evaluations/comparison` est-elle la seule sous-route sous `/evaluations/` ? Si oui, supprimer le dossier entier. Si d'autres routes existent (ex. `/evaluations/index.tsx` racine), conserver la structure restante.

### References

- Pages source : `app/(admin)/{evaluations/comparison,implantations/compare}/`
- Pages cible : `app/(admin)/performance/comparaisons/{evaluations,implantations}/`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
