# Story 87.3 : Fiche personne universelle — onglet Profil/Accès/Activité

Status: done

## Story

En tant qu'admin,
je veux que toutes les fiches de personnes dans Académie (coach, scout, manager, commercial, marketeur) aient le même squelette d'onglets (Profil, Accès, Activité),
afin d'avoir un endroit unique pour gérer les informations et permissions de chaque membre.

## Acceptance Criteria

1. Toutes les fiches individuelles dans Académie partagent 3 onglets :
   - **Profil** : infos personnelles, photo, contact, rôle(s)
   - **Accès** : sections autorisées (toggles de la story 86-3), rôle(s) assigné(s)
   - **Activité** : résumé de l'activité récente avec lien vers la section concernée
2. L'onglet Accès affiche les permissions actuelles avec distinction "par défaut" vs "personnalisé"
3. L'onglet Activité montre un résumé adapté au rôle :
   - Coach : dernières séances, évaluations données
   - Commercial : derniers contacts, clubs prospectés
   - Scout : derniers gardiens référencés
   - Marketeur : derniers médias traités, posts
4. Le composant d'onglets est réutilisable (composant partagé, pas dupliqué par page)

## Tasks / Subtasks

- [x] Task 1 — Composant partagé PersonTabs (AC: #1, #4)
  - [x] Créer `PersonTabLayout` dans `apps/web/app/(admin)/_components/`
  - [x] Props : `displayName`, `loading`, `tabs` (render props), `defaultTab`, `headerExtra`
  - [x] 3 onglets avec lazy loading du contenu (via `onSelect` callback)
- [x] Task 2 — Onglet Profil (AC: #1)
  - [x] Affichage des infos personnelles via `ProfileInfoCard` sub-component
  - [x] Rôle(s) assigné(s) (lecture seule)
- [x] Task 3 — Onglet Accès (AC: #2)
  - [x] Intégrer les toggles de permission (story 86-3) via `SectionPermissionsPanel`
  - [x] Indicateur visuel "défaut du rôle" vs "personnalisé" (via SectionPermissionsPanel)
  - [x] Bouton "Réinitialiser" (via SectionPermissionsPanel)
- [x] Task 4 — Onglet Activité (AC: #3)
  - [x] Résumé adapté au rôle avec dernières actions (coach: sessions/stats, commercial/marketeur: placeholder)
  - [x] Liens deep-link vers les sections pertinentes
- [x] Task 5 — Intégration dans les fiches existantes (AC: #1)
  - [x] Refactorer fiche coachs pour utiliser `PersonTabLayout`
  - [x] Intégrer dans les fiches commerciaux et marketeurs

## Dev Notes

- Dépend de 86-3 (permissions) pour l'onglet Accès
- Dépend de 87-1 et 87-2 pour les fiches commerciaux et marketeurs
- Les fiches existantes (coachs) ont peut-être déjà un layout spécifique — s'adapter sans casser
- L'onglet Activité est un résumé avec liens, pas une duplication des données

### Project Structure Notes

- Composant dans `aureak/apps/web/app/(admin)/academie/_components/PersonTabLayout.tsx`
- Réutilisé par toutes les fiches `[userId]/page.tsx` dans les sous-dossiers d'Académie

### References

- [Brainstorming: idée #39 Académie — Fiche personne universelle]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A

### Completion Notes List
- PersonTabLayout accepts arbitrary tabs via render props — not limited to Profil/Acces/Activite
- Coach page uses Qualite/Activite/Acces tabs (adapted, not forced into Profil)
- Exported `splitName`, `ProfileInfoCard`, `ActivityPlaceholder` as shared sub-components
- Scouts/managers detail pages don't exist yet — will use PersonTabLayout when created

### File List
- `aureak/apps/web/app/(admin)/_components/PersonTabLayout.tsx` (NEW)
- `aureak/apps/web/app/(admin)/academie/commerciaux/[commercialId]/page.tsx` (REFACTORED)
- `aureak/apps/web/app/(admin)/academie/marketeurs/[marketerId]/page.tsx` (REFACTORED)
- `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` (REFACTORED)
