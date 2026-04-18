# Story 87.2 : Page Académie > Marketeurs — LayoutActivités

Status: done

## Story

En tant qu'admin,
je veux une page Académie > Marketeurs qui liste tous les marketeurs avec le LayoutActivités,
afin de gérer les membres de l'équipe marketing depuis un endroit centralisé.

## Acceptance Criteria

1. Un nouvel onglet "Marketeurs" apparaît dans la `AcademieNavBar` (après Commerciaux)
2. La page `/academie/marketeurs` affiche la liste des profils avec `role = 'marketeur'`
3. Le layout suit le template LayoutActivités :
   - **headerBlock** : titre `MARKETEURS` 24/700 Montserrat + bouton `+ Nouveau marketeur` gold
   - **StatCards** : 4 cards (📱 MARKETEURS total, 📸 MÉDIAS CE MOIS, 📝 POSTS PUBLIÉS, 📈 ENGAGEMENT)
   - **Tableau** : colonnes STATUT/PHOTO/NOM/PRÉNOM/MÉDIAS REÇUS/POSTS
4. Clic sur un marketeur → fiche détail avec onglets Profil / Accès / Activité

## Tasks / Subtasks

- [x] Task 1 — AcademieNavBar (AC: #1)
  - [x] Ajouter onglet "Marketeurs" dans ACADEMIE_TABS (joueurs, coachs, commerciaux, marketeurs)
  - [x] Route `/academie/marketeurs`
- [x] Task 2 — Page liste (AC: #2, #3)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx` (re-export)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/marketeurs/page.tsx` avec LayoutActivités
  - [x] API : `listMarketers()` dans `@aureak/api-client/src/admin/marketers.ts`
- [x] Task 3 — Fiche détail (AC: #4)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/marketeurs/[marketerId]/page.tsx`
  - [x] Onglets Profil / Accès / Activité

## Dev Notes

- Même pattern exact que story 87-1 (Commerciaux) et 82-1 (Coachs)
- Les stat cards marketing afficheront des données réelles avec l'epic 91
- En attendant, afficher "—" pour les métriques non disponibles

### Project Structure Notes

- Pages dans `aureak/apps/web/app/(admin)/academie/marketeurs/`
- API dans `aureak/packages/api-client/src/admin/marketers.ts`

### References

- [Source: aureak/apps/web/app/(admin)/academie/coachs/ — pattern LayoutActivités]
- [Brainstorming: idées #37, #39 Académie — fiche personne universelle]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List
- `aureak/packages/api-client/src/admin/marketers.ts` (new)
- `aureak/packages/api-client/src/index.ts` (export added)
- `aureak/apps/web/app/(admin)/academie/marketeurs/page.tsx` (new)
- `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx` (new)
- `aureak/apps/web/app/(admin)/academie/marketeurs/[marketerId]/page.tsx` (new)
- `aureak/apps/web/app/(admin)/academie/marketeurs/[marketerId]/index.tsx` (new)
- `aureak/apps/web/app/(admin)/academie/joueurs/index.tsx` (MARKETEURS tab added)
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (MARKETEURS tab added)
- `aureak/apps/web/app/(admin)/academie/commerciaux/page.tsx` (MARKETEURS tab added)
