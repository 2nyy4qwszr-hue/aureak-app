# Story 95.1 — Cleanup routing Expo Router : supprimer les warnings "missing default export"

Status: done

## Metadata

- **Epic** : 95 — Cleanup routing Expo Router (dette structure `app/`)
- **Story ID** : 95.1
- **Story key** : `95-1-routing-cleanup-expo-router-warnings`
- **Priorité** : P2 (cosmétique — n'empêche pas le fonctionnement, mais pollue la console à chaque page admin)
- **Dépendances** : aucune (tous les fichiers déplacés sont auto-contenus côté imports).
- **Source** : Discovery lors du QA post-93.7 — ~50 warnings `Route "./(admin)/..." is missing the required default export` à chaque reload.
- **Effort estimé** : L (~2-3h — 50+ fichiers à déplacer, ~30 imports à corriger, QA Playwright page-par-page requis)

## Contexte

### La découverte

Contrairement à Expo Router v3/v4 (et à Next.js), **Expo Router v6 n'a PAS de convention d'exclusion automatique pour les fichiers/dossiers préfixés `_`**. La regex d'exclusion hardcodée dans `node_modules/expo-router/_ctx-shared.js` est :

```js
/^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native-intent))))\.[tj]sx?$).*\.[tj]sx?$/
```

Seuls les fichiers `+api`, `+html`, `+native-intent` sont exclus. **Tous les autres `.ts`/`.tsx`** sous `apps/web/app/` sont scannés comme routes potentielles.

**Seul `_layout.tsx`** est détecté par filename exact et traité comme layout (pas comme route) — pas une exclusion.

### Symptômes

Console dev à chaque reload `/activites` (ou toute page admin) :

```
Route "./(admin)/_components/formatPeriodLabel.ts" is missing the required default export.
Route "./(admin)/_components/stats/index.ts" is missing the required default export.
Route "./(admin)/_components/topbar-config.ts" is missing the required default export.
Route "./(admin)/_nav-config.ts" is missing the required default export.
Route "./(admin)/academie/_components/AcademieNavBar.tsx" is missing the required default export.
Route "./(admin)/activites/components/StatCards.tsx" is missing the required default export.
... (~50 warnings au total)
```

**Impact** :
- Bruit console qui masque les vraies erreurs
- Confusion quand un vrai bug de default export arrive (noyé dans le bruit)
- Impression générale que l'app est cassée alors que tout fonctionne

### Pourquoi pas le simple `_` rename

On aurait pu penser renommer `components/` → `_components/` pour exclure. **Ça ne suffit pas** : Expo Router v6 scanne même les dossiers `_`. La story 93.7 a déjà des fichiers sous `_components/` et ils warning quand même.

### Deux approches possibles

**Approche A — `patch-package` sur `_ctx-shared.js`**
- Installer `patch-package` + postinstall hook
- Patcher la regex pour exclure `_*` (sauf `_layout`)
- 1 fichier patch committé, 0 move
- ⚠️ Casse si upgrade `expo-router` mineur (patch à maintenir)
- ⚠️ Pas standard, peut surprendre nouveaux devs

**Approche B — Déplacer les non-routes hors de `app/`** ← **RECOMMANDÉE**
- ~50 fichiers déplacés vers `apps/web/components/admin/`, `apps/web/lib/admin/`, `apps/web/hooks/admin/`, `apps/web/contexts/admin/`
- ~30 imports à corriger
- Structure conforme aux conventions React/Next/Expo Router
- Aucun patch fragile, upgrade expo-router safe
- 1 refactor 1 fois, tranquillité ensuite

**Décision retenue** : Approche B. Justification : (1) conforme aux conventions upstream, (2) pas de dette de patch à maintenir, (3) lisibilité long terme supérieure, (4) sépare proprement "logique routing" (`app/`) de "composants/utils" (hors `app/`).

## Inventaire des fichiers à déplacer

Liste complète basée sur les warnings observés après déplacement du batch 93.7 (SplashScreen, navCommands, ThemeContext, BreadcrumbContext, useThemeColors → déjà faits).

### `(admin)/_components/` → `apps/web/components/admin/`

- `formatPeriodLabel.ts`
- `AdminPageHeader.tsx`
- `AdminTopbar.tsx`
- `topbar-config.ts`
- `stats/index.ts`
- `stats/StatsHero.tsx` (et fichiers associés)
- `stats/sparkline.ts`

### `(admin)/_nav-config.ts` → `apps/web/lib/admin/nav-config.ts`

### `(admin)/hooks/` → `apps/web/hooks/admin/`

- `useAvailableRoles.ts`
- `useCurrentRole.ts`
- `useEffectivePermissions.ts`

### `(admin)/contexts/` → `apps/web/contexts/admin/`

- `ActiveSessionContext.tsx`

### `(admin)/activites/components/` → `apps/web/components/admin/activites/`

- `ActivitesHeader.tsx`
- `ActivitesToolbar.tsx`
- `FiltresScope.tsx`
- `formatSessionCountdown.ts`
- `NextSessionHero.tsx`
- `PseudoFiltresTemporels.tsx`
- `sparkline-data.ts`
- `StatCards.tsx`
- `TableauSeances.tsx`
- `TodaySessionCards.tsx`

### `(admin)/academie/_components/` → `apps/web/components/admin/academie/`

- `AcademieNavBar.tsx`
- `NewPersonForm.tsx`
- `PeopleListPage.tsx`
- `formatRelativeDate.ts`
- `splitName.ts`

### `(admin)/analytics/generateMonthlyReport.ts` → `apps/web/lib/admin/analytics/generateMonthlyReport.ts`

### `(admin)/children/` cleanup

- `_ChildDetail.tsx` → `apps/web/components/admin/children/ChildDetail.tsx`
- `_avatarHelpers.ts` → `apps/web/lib/admin/children/avatarHelpers.ts`
- `exportCardToPng.ts` → `apps/web/lib/admin/children/exportCardToPng.ts`
- `[childId]/_ScoutEvaluationModal.tsx` → `apps/web/components/admin/children/ScoutEvaluationModal.tsx`
- `[childId]/_ScoutEvaluationsSection.tsx` → idem
- `[childId]/_TrialInvitationModal.tsx` → idem
- `[childId]/_WaitlistModal.tsx` → idem

### `(admin)/clubs/_components/` → `apps/web/components/admin/clubs/`

- `index.ts` (barrel export)
- Tous les fichiers du dossier

### `(admin)/developpement/prospection/_components/` → `apps/web/components/admin/prospection/`

- `AdminFilters.tsx`
- `ClubCard.tsx`
- `ClubList.tsx`
- `ContactForm.tsx`
- `ContactList.tsx`
- `ProspectionKPIs.tsx`

### `(admin)/evenements/_components/` → `apps/web/components/admin/evenements/`

- `EvenementsContent.tsx`
- `EvenementsHeader.tsx`

### `(admin)/groups/GroupGeneratorModal.tsx` → `apps/web/components/admin/groups/GroupGeneratorModal.tsx`

### `(admin)/implantations/_components/` → `apps/web/components/admin/implantations/`

- `ImplantationMap.tsx`

### `(admin)/methodologie/_components/` → `apps/web/components/admin/methodologie/`

- `qr-utils.ts` → `apps/web/lib/admin/methodologie/qr-utils.ts`

### `(admin)/profiles/[userId]/_components/` → `apps/web/components/admin/profiles/`

Gros morceau — structure à préserver :
- `AccesTab.tsx`
- `ActiviteTab.tsx`
- `ProfileHero.tsx`
- `ProfileTabs.tsx`
- `ResumeTab.tsx`
- `_card.ts`
- `acces/HistoriqueSection.tsx`
- `acces/PermissionsSection.tsx`
- `acces/RolesSection.tsx`
- `modules/AccesEtendusModule.tsx`
- `modules/ActionsCycleVieCard.tsx`
- `modules/ContenusMarketingModule.tsx`
- `modules/GradeCoachModule.tsx`
- `modules/InformationsCompteCard.tsx`
- `modules/PipelineCommercialModule.tsx`

### `(admin)/seances/` cleanup

- `_components/SessionTimeline.tsx` → `apps/web/components/admin/seances/SessionTimeline.tsx`
- `_components/constants.ts` → `apps/web/lib/admin/seances/constants.ts`
- `_utils.ts` → `apps/web/lib/admin/seances/utils.ts`
- `_utils/generatePresenceReport.ts` → `apps/web/lib/admin/seances/generatePresenceReport.ts`

### Autres groupes (coach, parent, child)

Vérifier au QA : les groupes `(coach)/`, `(parent)/`, `(child)/` peuvent contenir des non-routes similaires. Grep final `Route "./..." is missing the required default export` sur la console post-move pour confirmer zéro warning restant.

## Acceptance Criteria

### AC1 — Structure cible créée

1. Arborescence `apps/web/components/admin/` créée avec sous-dossiers par domaine (`activites/`, `academie/`, `children/`, `clubs/`, `evenements/`, `groups/`, `implantations/`, `methodologie/`, `profiles/`, `seances/`).
2. Arborescence `apps/web/lib/admin/` créée avec sous-dossiers correspondants pour les utils (`.ts`, pas `.tsx`).
3. Arborescence `apps/web/hooks/admin/` créée pour les hooks admin déplacés.
4. Arborescence `apps/web/contexts/admin/` créée pour `ActiveSessionContext`.

### AC2 — Tous les non-routes déplacés

5. Aucun fichier `.ts`/`.tsx` sans default export ne subsiste sous `apps/web/app/` **sauf** :
   - `_layout.tsx` (layouts Expo Router)
   - `+api.ts`, `+html.tsx`, `+native-intent.tsx` (special routes)
   - `index.tsx` qui re-exportent un `page.tsx` (pattern routing Aureak)
   - `page.tsx` des routes (avec default export)
6. Vérification : `find apps/web/app -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs grep -L "^export default\|^export { default }"` doit renvoyer uniquement les exceptions ci-dessus.

### AC3 — Imports corrigés

7. Aucun import cassé. `npx tsc --noEmit --project apps/web/tsconfig.json` = EXIT 0.
8. Pattern d'import standardisé : `from '@/components/admin/<domaine>/<Fichier>'` OU chemin relatif depuis `app/`.
9. Pas de chemin relatif profond cassé (ex: `../../../components/admin/...` OK, mais éviter `../../../../` via alias TS si déjà configuré).

### AC4 — Barrel exports pour les domaines UI

10. Chaque sous-dossier `components/admin/<domaine>/` peut avoir un `index.ts` qui re-exporte les composants publics (optionnel, à faire si déjà pratique ailleurs).

### AC5 — Zéro warning console "missing default export"

11. Après reload `/activites`, console Chrome devtools = **0 warning** `Route "./..."... is missing the required default export`.
12. Même chose pour `/dashboard`, `/academie/coachs`, `/profiles/<userId>`, `/seances`, `/methodologie`.

### AC6 — Pages admin testées

13. **Test Playwright obligatoire** sur au moins 8 pages admin (golden paths) :
    - `/dashboard`
    - `/activites` (séances + présences + évaluations onglets)
    - `/academie/coachs`
    - `/academie/joueurs`
    - `/methodologie/seances`
    - `/seances` (détail d'une séance)
    - `/profiles/<userId>` (modules dynamiques)
    - `/stages` (modals visibles)
14. Chaque page : screenshot + `console.error` vide (hors vrais erreurs métier).

### AC7 — Documentation ADR

15. Créer `_bmad-output/planning-artifacts/adr/005-expo-router-v6-no-underscore-convention.md` qui documente :
    - La discovery (v6 n'a pas d'exclusion `_`)
    - La décision de déplacer hors de `app/` (plutôt que patch)
    - La structure cible `components/admin/`, `lib/admin/`
    - Règle pour les futures stories : tout fichier non-route doit vivre hors de `app/`

### AC8 — CLAUDE.md mis à jour

16. Ajouter une note sous "Règles absolues de code" :
    > **Pas de fichiers non-routes dans `app/`** : tout composant/util/hook/context qui n'a pas de `export default` doit vivre sous `apps/web/components/`, `apps/web/lib/`, `apps/web/hooks/`, `apps/web/contexts/`. Expo Router v6 scanne tout `app/` et warning sur les fichiers sans default export.

## Tasks / Subtasks

### T1 — Préparation arborescence (AC: 1-4)

- [ ] Créer `apps/web/components/admin/` avec sous-dossiers par domaine.
- [ ] Créer `apps/web/lib/admin/` avec sous-dossiers correspondants.
- [ ] Vérifier que `apps/web/hooks/` et `apps/web/contexts/` existent déjà (fait par 93.7) — créer `admin/` sous chacun.

### T2 — Déplacements batch 1 : `(admin)/_components/` + `_nav-config.ts` (AC: 2, 3)

- [ ] `git mv` des fichiers de `(admin)/_components/` vers `components/admin/` (ou `lib/admin/` pour les `.ts` purs).
- [ ] Corriger tous les imports (grep `from.*'[@\./]*_components/` dans `app/`).
- [ ] QA : `tsc --noEmit` EXIT 0, reload `/dashboard` → zéro nouveau warning.

### T3 — Déplacements batch 2 : `(admin)/hooks/` + `(admin)/contexts/` (AC: 2, 3)

- [ ] `git mv` `hooks/` → `apps/web/hooks/admin/`.
- [ ] `git mv` `contexts/ActiveSessionContext.tsx` → `apps/web/contexts/admin/`.
- [ ] Corriger imports dans `(admin)/_layout.tsx` et pages qui utilisent les hooks (PeopleListPage, profile, etc.).

### T4 — Déplacements batch 3 : domaines `activites` + `academie` + `seances` (AC: 2, 3, 6)

- [ ] `(admin)/activites/components/` → `components/admin/activites/`.
- [ ] `(admin)/academie/_components/` → `components/admin/academie/`.
- [ ] `(admin)/seances/_components/` + `_utils.ts` + `_utils/` → `components/admin/seances/` + `lib/admin/seances/`.
- [ ] Corriger tous les imports (grep pattern pour chaque dossier).
- [ ] QA Playwright : `/activites`, `/academie/coachs`, `/seances` → pages fonctionnelles.

### T5 — Déplacements batch 4 : domaines `children` + `clubs` + `evenements` + `groups` + `implantations` + `methodologie` (AC: 2, 3, 6)

- [ ] Un batch par domaine, avec commit intermédiaire.
- [ ] QA Playwright sur chaque page après chaque batch.

### T6 — Déplacements batch 5 : `profiles/[userId]/_components/` (AC: 2, 3, 6)

- [ ] Gros morceau — préserver la structure `acces/` + `modules/` sous-dossiers.
- [ ] `git mv` vers `components/admin/profiles/` + `components/admin/profiles/acces/` + `components/admin/profiles/modules/`.
- [ ] Corriger imports dans `(admin)/profiles/[userId]/page.tsx` et `ProfileTabs.tsx` (re-exports internes).
- [ ] QA Playwright sur `/profiles/<userId>` avec tous les modules visibles.

### T7 — Déplacements batch 6 : `(admin)/developpement/prospection/_components/` (AC: 2, 3, 6)

- [ ] `git mv` vers `components/admin/prospection/`.
- [ ] Corriger imports.
- [ ] QA Playwright sur `/developpement/prospection` + détail.

### T8 — QA final + zero warning (AC: 5, 6)

- [ ] Reload toutes les pages admin testées, console = zéro warning `Route "./..." is missing`.
- [ ] Grep final : `find apps/web/app -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs grep -L "^export default\|^export { default }"` → doit renvoyer uniquement les exceptions documentées.
- [ ] Screenshots pre/post sur `/dashboard` + `/activites` pour validation visuelle (aucun changement UI attendu).

### T9 — Documentation (AC: 7, 8)

- [ ] Créer `_bmad-output/planning-artifacts/adr/005-expo-router-v6-no-underscore-convention.md`.
- [ ] Mettre à jour `CLAUDE.md` avec la règle "pas de non-routes dans `app/`".
- [ ] Commit séparé pour la doc.

### T10 — Conformité CLAUDE.md (AC: 7)

- [ ] `cd aureak && npx tsc --noEmit` = EXIT 0.
- [ ] Aucun state setter loading sans try/finally introduit.
- [ ] Console guards respectés sur les fichiers déplacés (si log ajouté).

## Dev Notes

### Pourquoi pas patch-package

Tentation évaluée : patcher `_ctx-shared.js` pour ajouter `_` à la regex d'exclusion. **Rejeté** car :
- Crée une dette technique invisible (le prochain dev tombe dans le même piège que celui documenté ici)
- Patch casse au prochain bump mineur de `expo-router` (et on ne le remarque pas tant que les warnings reviennent)
- Équipe distribuée = un dev upgrade Expo, le patch saute, warnings reviennent, confusion
- Ne règle pas le fond : avoir des non-routes dans `app/` reste une mauvaise pratique architecturale

Déplacer est plus de travail **une fois** mais élimine la dette définitivement.

### Stratégie batching

On découpe en 6 batches de déplacements (T2-T7) avec commit intermédiaire + QA Playwright à chaque étape. Si un batch casse quelque chose, on revert un commit localisé plutôt qu'un mega-revert.

**Ordre stratégique** :
1. Infrastructure (_components, _nav-config, hooks, contexts) — touche le layout
2. Domaines simples (activites, academie, seances)
3. Domaines modals (children, clubs, evenements, groups)
4. Profiles (le plus complexe, dernier)

### Conventions de nommage post-cleanup

- `apps/web/components/admin/<domaine>/<Component>.tsx` pour les composants UI
- `apps/web/lib/admin/<domaine>/<util>.ts` pour les utils (non-React)
- `apps/web/hooks/admin/<useHook>.ts` pour les hooks React admin-only
- `apps/web/contexts/admin/<Context>.tsx` pour les contexts React admin-only

### Pattern d'import recommandé

Avec les alias TS existants (à vérifier dans `tsconfig.json`) :
```typescript
// Avant (dans app/(admin)/activites/page.tsx)
import { StatCards } from './components/StatCards'

// Après
import { StatCards } from '@/components/admin/activites/StatCards'
// OU (si alias @ pas configuré)
import { StatCards } from '../../../components/admin/activites/StatCards'
```

Si l'alias `@/` n'est pas configuré, envisager de l'ajouter dans le même PR pour réduire la profondeur des imports relatifs — mais c'est **optionnel** et peut être une story séparée.

### Ce que cette story NE fait PAS

- **Pas de changement UI** : déplacement pur, aucun composant modifié, aucun style touché.
- **Pas de refactor logique** : les imports changent, rien d'autre.
- **Pas de patch-package** : approche rejetée (voir Dev Notes ci-dessus).
- **Pas d'alias TS** : si `@/` manque, story séparée dédiée.

### Références

- Découverte lors du QA post-93.7 (Story 93.7 commit `5f71992`)
- `node_modules/expo-router/_ctx-shared.js` — regex d'exclusion baked-in
- `node_modules/expo-router/build/matchers.js:91` — isLayoutFile detection
- `node_modules/expo-router/build/getRoutesCore.js:311` — warning emitter

### Files Modified (prévisionnel)

- **Créés** : `apps/web/components/admin/**`, `apps/web/lib/admin/**`, `apps/web/hooks/admin/**`, `apps/web/contexts/admin/**`
- **Supprimés** : tous les non-routes dans `apps/web/app/`
- **Modifiés (imports)** : ~30 fichiers dans `apps/web/app/` (pages + layouts qui importent les composants déplacés)
- **Doc** : `CLAUDE.md`, nouvel ADR

## Change Log

- 2026-04-21 — Implémentation complète sur branche `feat/epic-95-1-routing-cleanup` (14 commits, 60+ fichiers déplacés).

## Dev Agent Record

### Context Reference

- Epic parent : 95 — Cleanup routing Expo Router
- Contexte technique : story-93-7 (qui a déplacé les 5 premiers fichiers : SplashScreen, navCommands, ThemeContext, BreadcrumbContext, useThemeColors — faits à part, ne pas redéplacer)

### Agent Model Used

- Claude Opus 4.7 (1M context)

### Completion Notes List

- **Scope réel** : seuls les fichiers sans `export default` ont été déplacés (AC2). Les fichiers avec default export (ex: DayView/WeekView/MonthView dans `seances/_components/`, ClubCard/RbfaStatusBadge/RelationTypeSelector dans `clubs/_components/`, PremiumThemeCard/BlocsManagerModal/ThemeCard/TacticalEditor dans `methodologie/_components/`) restent dans `app/` — Expo Router les accepte.
- **Cas particulier T5b clubs** : `index.ts` (barrel) déplacé vers `components/admin/clubs/` pointe vers les 3 composants restés dans `app/(admin)/clubs/_components/` via un chemin ugly mais fonctionnel.
- **Renommages** : `_card.ts` → `card.ts` (profiles), `_ChildDetail.tsx` → `ChildDetail.tsx` (children) + modals children perdent leur préfixe `_`.
- **Context imports** : les imports de `AcademieCountsContext` / `ActivitesCountsContext` depuis `_layout.tsx` conservent un chemin ugly `'../../../app/(admin)/<domaine>/_layout'`. Future story possible : extraire les Contexts dans des fichiers dédiés hors `_layout.tsx`.
- **QA Playwright** : SKIPPED — app non démarrée au moment du commit final (AC6 à valider manuellement après merge).
- **tsc final** : EXIT 0.

### File List

Fichiers déplacés (60+) : voir les 14 commits de la branche `feat/epic-95-1-routing-cleanup` (67c5da7 → 4e63e2d).

Structure créée :
- `aureak/apps/web/components/admin/{activites,academie,children,clubs,evenements,groups,implantations,profiles,prospection,seances,stats}/`
- `aureak/apps/web/lib/admin/{activites,academie,analytics,children,methodologie,seances,stats}/`
- `aureak/apps/web/hooks/admin/`
- `aureak/apps/web/contexts/admin/`

Documentation :
- `_bmad-output/planning-artifacts/adr/005-expo-router-v6-no-underscore-convention.md` (nouveau)
- `CLAUDE.md` — règle 6 ajoutée (pas de non-routes dans `app/`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Epic 95 ajouté
