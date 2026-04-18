# Story 87.1 : Page Académie > Commerciaux — LayoutActivités

Status: done

## Story

En tant qu'admin,
je veux une page Académie > Commerciaux qui liste tous les commerciaux avec le LayoutActivités,
afin de gérer les membres de l'équipe commerciale depuis un endroit centralisé.

## Acceptance Criteria

1. Un nouvel onglet "Commerciaux" apparaît dans la `AcademieNavBar` (après Managers)
2. La page `/academie/commerciaux` affiche la liste des profils avec `role = 'commercial'`
3. Le layout suit le template LayoutActivités :
   - **headerBlock** : titre `COMMERCIAUX` 24/700 Montserrat + bouton `+ Nouveau commercial` gold
   - **StatCards** : 4 cards (📊 COMMERCIAUX total, 🏆 CLUBS CONVERTIS, 📞 CONTACTS CE MOIS, ⭐ TAUX CONVERSION)
   - **FiltresRow** : pill TOUS + filtres pertinents
   - **Tableau** : colonnes STATUT/PHOTO/NOM/PRÉNOM/CLUBS ASSIGNÉS/CONTACTS/CONVERSIONS
4. Clic sur un commercial → fiche détail avec onglets Profil / Accès / Activité
5. Lien "Voir activité prospection →" dans l'onglet Activité renvoie vers Prospection filtré sur ce commercial

## Tasks / Subtasks

- [x] Task 1 — AcademieNavBar (AC: #1)
  - [x] Ajouter onglet "Commerciaux" dans les pages académie (joueurs, coachs, commerciaux)
  - [x] Route `/academie/commerciaux`
- [x] Task 2 — Page liste (AC: #2, #3)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx` (re-export)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/commerciaux/page.tsx` avec LayoutActivités
  - [x] API : `listCommercials()` dans `@aureak/api-client/src/admin/commercials.ts`
- [x] Task 3 — Fiche détail (AC: #4, #5)
  - [x] Créer `aureak/apps/web/app/(admin)/academie/commerciaux/[commercialId]/page.tsx`
  - [x] Onglets Profil / Accès / Activité
  - [x] Lien vers Prospection filtré dans onglet Activité

## Dev Notes

- Pattern exact de `academie/coachs/index.tsx` (story 82-1) — même LayoutActivités
- Les stat cards affichent des compteurs basés sur les données de prospection (epic 88)
- En attendant l'epic 88, les stats peuvent afficher "—" pour les données non encore disponibles
- La `AcademieNavBar` existe déjà dans `academie/_layout.tsx`

### Project Structure Notes

- Pages dans `aureak/apps/web/app/(admin)/academie/commerciaux/`
- API dans `aureak/packages/api-client/src/admin/commercials.ts`
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export

### References

- [Source: aureak/apps/web/app/(admin)/academie/coachs/ — pattern de référence LayoutActivités]
- [Source: aureak/apps/web/app/(admin)/academie/_layout.tsx — AcademieNavBar]
- [Brainstorming: idées #37, #38 Académie — annuaire complet]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List
- Stats CLUBS CONVERTIS, CONTACTS CE MOIS, TAUX CONVERSION affichent "—" (epic 88 requis)
- ACADEMIE_TABS mis à jour dans joueurs + coachs + commerciaux (scouts/managers/clubs/implantations sont des stubs/redirects sans tabs)

### File List
- `aureak/packages/api-client/src/admin/commercials.ts` (NEW)
- `aureak/packages/api-client/src/index.ts` (MODIFIED — exports)
- `aureak/apps/web/app/(admin)/academie/commerciaux/page.tsx` (NEW)
- `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx` (NEW)
- `aureak/apps/web/app/(admin)/academie/commerciaux/[commercialId]/page.tsx` (NEW)
- `aureak/apps/web/app/(admin)/academie/commerciaux/[commercialId]/index.tsx` (NEW)
- `aureak/apps/web/app/(admin)/academie/joueurs/index.tsx` (MODIFIED — ACADEMIE_TABS)
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (MODIFIED — ACADEMIE_TABS)
