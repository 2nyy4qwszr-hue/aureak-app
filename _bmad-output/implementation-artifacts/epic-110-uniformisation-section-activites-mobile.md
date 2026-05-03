# Epic 110 — Uniformisation section Activités (mobile + desktop)

Status: ready-for-dev
Date: 2026-05-03

## Contexte

Après les epics 93 (refonte template Activités) et 108 (vue d'ensemble sans filtres + alignement Séances/Présences), la section Activités reste hétérogène entre les 4 onglets et entre mobile/desktop :

- **Vue d'ensemble** affiche un FAB « + Nouvelle séance » sur mobile (pattern correct), mais **Séances/Présences** affichent un bouton pilule « + Nouvelle séance » en haut de page, et **Évaluations** n'a aucune action visible. Trois patterns différents pour la même action sur 4 onglets.
- Le label de l'onglet hub est « Vue d'ensemble » alors que la zone fonctionnelle s'appelle « Activités » dans le menu — confusion utilisateur (l'onglet et la section parente portent le même nom mais l'onglet ne décrit pas ce qu'il contient).
- Le détail d'une séance (`/activites/seances/[sessionId]`) affiche un fil/topbar « Séance » sur mobile pour revenir en arrière. Ce comportement n'existe pas sur desktop. Sur mobile il pollue le top de l'écran sans valeur ajoutée (back navigateur natif / drawer disponible).
- Les filtres de `/activites/seances` (story 108.2) reproduisent ceux de `/activites/presences` mais restent en barre verticalement étalée — sur mobile ils mangent un demi-écran avant le tableau. Un format compact (popover/sheet « Filtres ») est attendu par cohérence.
- Le tableau Séances n'a pas de point d'entrée rapide pour créer une séance depuis le contexte (date/groupe filtré). La création passe systématiquement par `/activites/seances/new` (formulaire complet) — friction pour l'usage courant « ajouter une séance dans ce groupe cette semaine ».
- `/activites/presences` souffre de bugs UX : changer l'implantation reset l'affichage à « aujourd'hui » (perte de contexte), et le tableau de présences en vertical mobile force un scroll horizontal (mauvaise lecture). À traiter.
- `/activites/evaluations` n'a aucune évaluation seed → impossible de valider le rendu mobile/desktop. Bloquant pour la story 110.1 (FAB Évaluations).

## Objectif

Une expérience visuelle et interactive **identique** sur les 4 onglets de la section Activités, sur mobile et desktop, avec les bugs UX présence corrigés et un seed permettant de valider l'onglet Évaluations.

## Périmètre

### Stories

- [ ] **110.1** — FAB unifié + rename « Vue d'ensemble » → « Activités » + suppression back-nav mobile sur détail séance
- [ ] **110.2** — Refonte filtres Séances : popover compact « Filtres » (mobile + desktop), aligné Présences
- [ ] **110.3** — Ligne d'ajout inline dans le tableau Séances (création contextuelle rapide)
- [ ] **110.4** — Fix Présences : bug clic implantation reset à aujourd'hui + refonte affichage tableau présences vertical mobile
- [ ] **110.5** — Seed évaluation démo + audit parcours création depuis le FAB

### Hors scope

- Refonte du tableau Séances lui-même (couvert par epic 109 — design tokens tableaux admin)
- Refonte mobile complète des autres sections (couvert par epic 103)
- Onglets Activités côté Coach/Parent/Club (admin only ici)
- Notifications/temps réel sur les filtres Présences

## Contraintes Aureak

- Composant FAB existant : `aureak/apps/web/components/admin/PrimaryAction.tsx` (Story 101.3, breakpoint < 640 = FAB, ≥ 640 = no-op via `variant='auto'`)
- Le bouton desktop équivalent passe par `<AdminPageHeader actionButton={...}>` (approche B, story 101.3)
- Header tabs : `aureak/apps/web/components/admin/activites/ActivitesHeader.tsx` — TABS array ligne 15
- Pages cibles :
  - `aureak/apps/web/app/(admin)/activites/page.tsx` (hub)
  - `aureak/apps/web/app/(admin)/activites/seances/page.tsx`
  - `aureak/apps/web/app/(admin)/activites/presences/` (alias) ET `aureak/apps/web/app/(admin)/presences/page.tsx` (page principale, 910 lignes)
  - `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
- Règles : Supabase via `@aureak/api-client`, styles via `@aureak/theme` tokens, `try/finally` sur loaders, console guards `NODE_ENV !== 'production'`.

## Dépendances

- **Epic 108** (vue d'ensemble + alignement filtres) — done/review : prérequis pour 110.2 (filtres alignés Présences = base à compacter)
- **Epic 101** (PrimaryAction FAB) — done : composant FAB réutilisé
- **Epic 109** (design tokens tableaux) — concurrent : éviter conflit en touchant le `<select>` natif des filtres ; coordonner si 109.2 démarre avant 110.2

## Risques

- **Stories 110.4 (responsive vertical mobile) et 109 (tableau tokens)** peuvent se chevaucher sur `TableauSeances.tsx` et la page Présences. Faire 110.4 d'abord (UX bug + responsive) si 109 n'est pas encore en cours.
- **110.5 (seed évaluation)** révélera potentiellement des bugs UI du parcours évaluation non couverts par 110.1 → prévoir un suivi sous forme de stories filles.
- Le rename « Vue d'ensemble » → « Activités » casse les éventuels tests Playwright/E2E qui matchent ce label : grep obligatoire avant merge.

## Validation

- QA Playwright sur mobile (390x844) et desktop (1280x800) :
  - 4 onglets affichent un FAB+ identique (mobile) / bouton header identique (desktop)
  - Tab actif s'appelle « ACTIVITÉS » (pas « VUE D'ENSEMBLE »)
  - Clic FAB sur chaque onglet route vers le bon écran de création (séance / saisie présence / saisie évaluation)
  - Détail séance mobile : pas de back-nav « Séance » en haut
  - Filtres Séances mobile : popover « Filtres » se déclenche depuis un seul bouton, ne mange pas l'écran
  - Bug Présences implantation : changer d'implantation conserve le `timeView` et le range courant (pas de reset à `day`/aujourd'hui)
  - Tableau Présences mobile vertical : pas de scroll horizontal, lecture fluide
  - Évaluation seed visible sur `/activites/evaluations` après seed
