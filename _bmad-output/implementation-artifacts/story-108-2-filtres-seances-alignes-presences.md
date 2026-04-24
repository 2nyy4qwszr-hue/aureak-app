# Story 108.2 : Vue d'ensemble sans filtres + Séances avec filtres alignés Présences

Status: review

## Story

En tant qu'**admin**,
je veux **une vue d'ensemble Activités sans filtres parasites, et une page Séances avec les mêmes filtres que Présences et un tableau paginé**,
afin de **retrouver les infos rapidement sans réapprendre un jeu de contrôles différent par onglet et sans toolbar de filtrage qui ne servait à rien sur la vue d'ensemble**.

## Contexte

Story 108.1 a fait de `/activites` un hub 100% cartes (4 KPIs + 3 mini-widgets) et a déplacé le tableau séances vers `/activites/seances`. Deux problèmes restent :

1. **Vue d'ensemble** (`/activites/page.tsx`) conserve encore une `ActivitesToolbar` (chips scope global/implantation/groupe + segmented today/upcoming/past) **et** un bouton période « avril 2026 » dans l'`AdminPageHeader`. Les widgets ne bougent quasi pas avec ces filtres, l'UI ment plus qu'elle ne filtre.
2. **Page Séances** (`/activites/seances/page.tsx`) est un calendrier Jour/Semaine/Mois/Année avec présets sauvegardables, toggle « Mes séances », bouton Planner, export PDF et génération automatique. Trop riche pour le cas nominal admin. Incohérent avec `/presences` qui propose juste jour/semaine/mois + implantation + groupe.

La story 108.2 aligne l'expérience : vue d'ensemble purement lecture-cartes, page Séances = filtres /presences + tableau paginé (le tableau qui existait sur la vue d'ensemble avant 108.1 est réutilisé).

## Acceptance Criteria

- **AC1 — Vue d'ensemble sans periodButton** : l'`AdminPageHeader` de `/activites` n'affiche plus le bouton « avril 2026 ». Plus aucun appel à `formatPeriodLabel()` dans ce fichier.
- **AC2 — Vue d'ensemble sans toolbar** : `ActivitesToolbar` est retirée de `/activites/page.tsx`. Les 4 KPIs + 3 mini-widgets continuent d'afficher des données en scope figé `{ scope: 'global' }`. Plus d'état `scope`/`temporalFilter` dans la page.
- **AC3 — Séances : filtres identiques /presences** : la page `/activites/seances` affiche :
  - un toggle segmented **Jour / Semaine / Mois** (même mécanique que `/presences` : day/week/month, calcul de range identique) ;
  - un select **Implantation** (option « Toutes » + liste depuis `listImplantations`) ;
  - un select **Groupe** cascade sur implantation (option « Tous » + filtre `g.implantationId === implantationId`).
  - Le changement d'implantation réinitialise le groupe.
- **AC4 — Séances : tableau paginé** : le composant `TableauSeances` est utilisé pour afficher les séances filtrées. API refondue — props désormais `{ from?, to?, implantationId?, groupId? }` (plus de `scope`/`temporalFilter`). Fetch via `listSessionsWithAttendance({ from, to, implantationId, groupId })`.
- **AC5 — Séances : bouton Nouvelle séance** : un seul bouton action « + Nouvelle séance » conservé en haut à droite, navigue vers `/activites/seances/new`.
- **AC6 — Suppressions** : sont retirés de `/activites/seances/page.tsx` :
  - vues calendaires Jour / Semaine / Mois / Année
  - présets sauvegardables + localStorage (`aureak_seances_presets`)
  - toggle « Mes séances » / « Toutes les séances »
  - bouton « 📅 Planner »
  - bouton « ⬇ Exporter PDF » (rapport présences hebdomadaire)
  - bouton « ⚡ Générer les séances » (modal `GenerateYearSessions`)
  - filtre de statut (chips Tous / Planifiée / En cours / Réalisée / Annulée)
- **AC7 — Nettoyage fichiers orphelins** :
  - dossier `_components/` ne garde que ce qui sert à `new.tsx` et `[sessionId]/*` : `CoachDndBoard.tsx`, `WorkshopBlockEditor.tsx`, `ThemeBlockPicker.tsx`. Sont supprimés : `DayView.tsx`, `WeekView.tsx`, `MonthView.tsx`, `YearView.tsx`, `SessionCard.tsx`.
  - dossier `planner/` entier supprimé (route `/activites/seances/planner` n'existe plus).
  - `lib/admin/seances/generatePresenceReport.ts` supprimé (plus d'import).
  - `lib/admin/seances/constants.ts` et `utils.ts` conservés (encore utilisés par `new.tsx` et `[sessionId]/edit.tsx`).
- **AC8 — Rétrocompat composant TableauSeances** : le composant expose désormais `{ from?, to?, implantationId?, groupId? }` et n'a plus qu'un seul appelant (`/activites/seances/page.tsx`). Le mode empty state « today + NextSessionHero » et le fallback `TodaySessionCards` sont retirés du composant (simplification). Les composants orphelins `NextSessionHero.tsx` et `TodaySessionCards.tsx` restent sur disque (à archiver dans une éventuelle story de cleanup ultérieure).
- **AC9 — Respect règles Aureak** :
  - Accès Supabase via `@aureak/api-client` uniquement
  - Styles via `@aureak/theme` tokens
  - Console guards `if (process.env.NODE_ENV !== 'production')`
  - try/finally sur les state setters de chargement (`setLoading` dans `TableauSeances`)
  - `page.tsx` = contenu, `index.tsx` = re-export (inchangé)

## Tasks / Subtasks

### 1. Vue d'ensemble

- [x] `aureak/apps/web/app/(admin)/activites/page.tsx`
  - retirer `periodButton` de `AdminPageHeader`
  - retirer `ActivitesToolbar` (import + rendu)
  - retirer state `scope`/`temporalFilter`
  - passer les widgets (`ActivitesHubKpis`, `ActivitesHubNextSession`, `ActivitesHubRecentEvaluations`, `ActivitesHubAtRiskPlayers`) avec `scope = { scope: 'global' }` constant

### 2. Refactor TableauSeances

- [x] `aureak/apps/web/components/admin/activites/TableauSeances.tsx`
  - remplacer props `{ scope, temporalFilter }` par `{ from?, to?, implantationId?, groupId? }`
  - passer ces 4 paramètres à `listSessionsWithAttendance`
  - retirer `applyTemporalFilter`, le cas `TodaySessionCards`, le `NextSessionHero` empty state, `listNextUpcomingSessionRich`, `nextSession` state
  - garder le reste : badges, avatars coach, barre présence, pagination, rendu mobile stack

### 3. Refonte page /activites/seances

- [x] `aureak/apps/web/app/(admin)/activites/seances/page.tsx`
  - réécrire : `TimeView` (day/week/month) + selects implantation + groupe (cascade)
  - `computeRange(view)` → `{ from: YYYY-MM-DD, to: YYYY-MM-DD }` (aligné sur `/presences`)
  - bouton « + Nouvelle séance » conservé (navigation `/activites/seances/new`)
  - `<TableauSeances from={from} to={to} implantationId={...} groupId={...} />`

### 4. Suppressions

- [x] supprimer `aureak/apps/web/app/(admin)/activites/seances/_components/DayView.tsx`, `WeekView.tsx`, `MonthView.tsx`, `YearView.tsx`, `SessionCard.tsx`
- [x] supprimer dossier `aureak/apps/web/app/(admin)/activites/seances/planner/`
- [x] supprimer `aureak/apps/web/lib/admin/seances/generatePresenceReport.ts`
- [x] restaurer `_components/CoachDndBoard.tsx`, `WorkshopBlockEditor.tsx`, `ThemeBlockPicker.tsx` (utilisés par `new.tsx` + `[sessionId]/`)
- [x] restaurer `lib/admin/seances/utils.ts` et `constants.ts` (utilisés par `new.tsx` + `[sessionId]/edit.tsx`)

### 5. QA

- [x] `npx tsc --noEmit`
- [x] QA patterns (`try/finally`, console guards) sur les 3 fichiers modifiés
- [x] test Playwright : `/activites` + `/activites/seances` (toggle jour/semaine/mois, select implantation, tableau)
- [x] commit `feat(epic-108): story 108.2 — vue d'ensemble sans filtres + séances alignées présences`

## Fichiers touchés

- **Modifiés** :
  - `aureak/apps/web/app/(admin)/activites/page.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/page.tsx`
  - `aureak/apps/web/components/admin/activites/TableauSeances.tsx`
- **Supprimés** :
  - `aureak/apps/web/app/(admin)/activites/seances/_components/DayView.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/_components/WeekView.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/_components/MonthView.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/_components/YearView.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/_components/SessionCard.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/planner/index.tsx`
  - `aureak/apps/web/app/(admin)/activites/seances/planner/page.tsx`
  - `aureak/apps/web/lib/admin/seances/generatePresenceReport.ts`

## Notes

- `ActivitesToolbar.tsx`, `StatCards.tsx`, `NextSessionHero.tsx`, `TodaySessionCards.tsx` deviennent orphelins côté vue d'ensemble mais restent sur disque pour éviter un scope creep sur 108.2. Cleanup possible sur une story ultérieure (ou pendant epic-108 wrap-up).
- Les routes `/activites/seances/new` et `/activites/seances/[sessionId]/*` sont **conservées telles quelles** (hors scope 108.2).
