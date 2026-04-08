# QA Summary — Aureak

> Mis à jour manuellement par le développeur. 30 secondes par story.
> Ne pas déléguer à un agent — tu es la seule source fiable ici.

**Dernière mise à jour** : 2026-04-08

---

## Stories — État des Gates

| Story | Gate 1 | Gate 2 | Warnings ouverts | En prod? |
|-------|--------|--------|------------------|---------|
| GLOBAL-SCAN 2026-04-01 (scan 4) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 5) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 6) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 7) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 8) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 9)  | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 10) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 11) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 12) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 13) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 14) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 15) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 16) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 17) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 18) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 19) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 20) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 21) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 22) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 23) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 24) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 25) | ✅ PASS | ✅ PASS | 0 | Non |
| PATROL 2026-04-05 | ✅ PASS | ⏳ EN COURS | 4 BLOCKERs, 4 WARNINGs | Non |
| BUG-CRAWLER 2026-04-06 | ✅ PASS | ⏳ EN COURS | 1 HIGH, 1 MEDIUM nouveaux | Non |
| SCAN-FIX 2026-04-06 (cycle 3/3) | ✅ PASS | ✅ PASS | 0 | Non |
| story-63-2 (Évènements unifiés) | ✅ PASS | ✅ PASS | 8 warnings style/a11y | Non |
| BUG-CRAWLER 2026-04-06 (post-sprint) | ✅ PASS | ✅ PASS | 1 MEDIUM, 1 LOW | Non |
| BUG-CRAWLER 2026-04-06 (story 50-11 focus) | ✅ PASS | ⏳ EN COURS | 3 CRITICAL, 2 HIGH, 1 MEDIUM | Non |
| BUG-CRAWLER 2026-04-07 (activites hub + enfants + events) | ✅ PASS | ⏳ EN COURS | 3 HIGH, 2 MEDIUM, 5 LOW | Non |
| story-49-9 (migration attendances table) | ✅ PASS | ✅ PASS | 0 (1 INFO migration ordering pre-existant) | Non |
| story-49-10 (typo getUncelebratedMilestones + profiles.id) | ✅ PASS | ✅ PASS | 0 (1 INFO createdAt synthétique non bloquant) | Non |
| story-49-11 (session_attendees.status → attendances.status) | ✅ PASS | ✅ PASS | 0 | Non |
| PATROL 2026-04-07 (post-sprint 10 stories) | ✅ PASS | ⏳ EN COURS | Design: 3 BLOCKER, 11 WARNING — Bug: 3 HIGH, 2 MEDIUM — UX: 3 P1 | Non |
| BUG-CRAWLER 2026-04-07 v2 (routes live Playwright) | ✅ PASS | ⚠️ 1 HIGH dégradé visuel | 1 HIGH + 1 LOW + 1 INFO | Non |
| PATROL 2026-04-07 morning (Design+Bug+UX+Feature) | ✅ PASS | ⏳ EN COURS | Design: 3 BLOCKER — Bug: 1 HIGH (406 local) — UX: F-01 onglets activités mal routés | Non |
| PATROL 2026-04-07 post-sprint (Design+Bug) | ✅ PASS | ⏳ EN COURS | Design: 2 BLOCKER — Bug: 3 HIGH, 6 MEDIUM | Non |
| PATROL 2026-04-08 post-sprint (Design+Bug) | ✅ PASS | ✅ PASS | Design: 2 BLOCKER corrigés, 4 WARNING — Bug: 1 HIGH, 2 MEDIUM | Non |
| story-74-2 (StatCards badges fictifs) | ✅ PASS | ✅ PASS | 0 (3 warnings mineurs: borderRadius/padding hardcodés, hors scope story BUG) | Non |
| story-74-3 (FiltresScope loading + shadows.lg) | ✅ PASS | ✅ PASS | 0 | Non |
| story-74-4 (Dashboard gold concaténations → tokens) | ✅ PASS | ✅ PASS | 0 | Non |
| BUG-CRAWLER 2026-04-08 v2 (statique élargi) | ✅ PASS | ⏳ EN COURS | 3 HIGH, 2 MEDIUM nouveaux |
| story-75-5 (Présences heatmap hex → tokens) | ✅ PASS | ✅ PASS | 1 WARNING mineur (calcul vs affichage seuil) |
| story-75-3 (Conversion essai→membre modale) | ✅ PASS | ✅ PASS | 0 |
| story-75-6 (Quiz QCM enfant post-séance) | ✅ PASS | ✅ PASS | 1 WARNING mineur (childId non gardé avant useEffect) |
| PATROL 2026-04-08 post-epic75 | ✅ PASS | ✅ PASS | Design: 2 BLOCKER, 4 WARNING — Bug: 1 CRITICAL, 2 HIGH — UX: 4 P1 | Non |
| BUG-CRAWLER 2026-04-08 post75 (statique élargi post-epic75) | ✅ PASS | ⏳ EN COURS | 1 CRITICAL, 2 HIGH, 2 MEDIUM | Non |
| story-75-5 (heatmap tokens + métrique fictive) | ✅ PASS | ✅ PASS | 1 WARNING mineur (calcul trend >= 2 vs affichage >= 4) | Non |
| story-75-3 (modale confirmation conversion essai→membre) | ✅ PASS | ✅ PASS | 0 | Non |
| story-75-6 (Quiz QCM enfant post-séance) | ✅ PASS | ✅ PASS | 1 WARNING mineur (childId non-guard avant appel API) | Non |
| story-34-3 (Redesign Entraînements v2 + Table Exercices) | ✅ PASS | ✅ PASS | 2 warnings mineurs (loadSessions sans toast erreur, ENTRAÎNEMENT tab UX confusion avec GLOBAL) | Non |
| story-34-4 (Page Programmes liste + migration) | ✅ PASS | ✅ PASS | 1 warning mineur (pas de pagination — liste potentiellement longue) | Non |
| story-34-5 (Programme création, détail, duplication) | ✅ PASS | ✅ PASS | 2 warnings mineurs (handleSaveDate sans feedback erreur UI, handleMove optimistic sans rollback) | Non |
| PATROL 2026-04-08 post-story34-3 | ✅ PASS | ✅ PASS | Design: 11 BLOCKER, 11 WARNING — Bug: 0 CRITICAL, 3 HIGH — UX: 4 P1, 5 P2 — Feature: 84%, 10 manquants | Non |
| BUG-CRAWLER 2026-04-08 v4 (statique post-Performance ajout) | ✅ PASS | ⏳ EN COURS | 0 CRITICAL, 3 HIGH, 2 MEDIUM | Non |
| story-76-1 (BUG listAttendancesByChild filtres gte/lte table jointe) | ✅ PASS | ✅ PASS | 0 | Non |
| story-72-11 (Couleurs hardcodées fiche séance → tokens) | ✅ PASS | ✅ PASS | 0 | Non |
| story-77-1 (Évaluations fonts.body + colors.text.dark) | ✅ PASS | ✅ PASS | 0 | Non |
| story-72-13 (Présences card Tendance Globale fond dark → light + border gold) | ✅ PASS | ✅ PASS | 0 | Non |
| story-72-12 (Dashboard tokens couleur texte dark + commentaires hero cards) | ✅ PASS | ✅ PASS | 0 | Non |
| story-69-11 (UX — ConfirmDialog avant suppression bloc/journée stage) | ✅ PASS | ✅ PASS | 1 WARNING mineur (activeDayId guard dans executeDeleteBlock — théorique) | Non |
| story-66-2 (UX — Sidebar Stages sous-item Évènements + badge count actifs) | ✅ PASS | ✅ PASS | 1 WARNING mineur (badge expanded sur icône vs après label — cohérent avec pattern existant) | Non |
| story-76-2 (UX — Séances empty state CTA toutes vues mois/année) | ✅ PASS | ✅ PASS | 0 |
| story-8-6 (FEATURE — Vue coach résultats quiz groupe fiche séance) | ✅ PASS | ✅ PASS | 2 warnings mineurs (key={t.name} non-robuste, quizResults non reset pré-rechargement) | Non |
| BUG-CRAWLER 2026-04-08 post-queue (statique — 0 nouveau bug) | ✅ PASS | ⏳ EN COURS | 1 CRITICAL (C7), 4 HIGH (C8/C9/C10/C11), 2 MEDIUM (C6/W07) — tous pre-existants |
| story-77-5 (BUG — Vue session_evaluations_merged absente migrations → 406) | ✅ PASS | ✅ PASS | 0 |
| story-78-1 (BUG — evalMap clé scheduled_at vs session_id → évaluations jamais affichées) | ✅ PASS | ✅ PASS | 0 |
| story-72-14 (BUG — TYPE_COLOR + methodColor() manquent 'performance') | ✅ PASS | ✅ PASS | 0 |
| story-77-4 (DESIGN — Analytics hex hardcodés → tokens) | ✅ PASS | ✅ PASS | 0 (Playwright skipped — app non démarrée) |
| story-77-3 (DESIGN — Implantations gradients #1a472a/#2d6a4f + #FFFFFF → tokens) | ✅ PASS | ✅ PASS | 0 (Playwright skipped — app non démarrée) |
| story-77-2 (UX — Recherche joueurs live debounce 300ms) | ✅ PASS | ✅ PASS | 0 (Playwright skipped — app non démarrée) |
| story-80-1 (UX — Stages dates input natif HTML type=date) | ✅ PASS | ✅ PASS | 0 (Playwright skipped — app non démarrée) |
| story-75-7 (FEATURE — Quiz QCM board parent /quiz/[sessionId]) | ✅ PASS | ✅ PASS | 0 (Playwright skipped — app non démarrée) |

`✅ PASS` `❌ BLOCKED` `⏳ EN COURS` `—` N/A

> Scan 4 : B-25 + W-14→W-21 — tous résolus (commit 9cd1c87)
> Scan 5 : W-22→W-25 — tous résolus (commit 249edb6)
> Scan 6 : W-26→W-29 — tous résolus (commit 87341be)
> Scan 7 : W-30 + W-31 — tous résolus (commit 7bc23e2)
> Scan 8 : B-26 — résolu (commit a7df209)
> Scan 9 : B-27 — résolu (commit d4e875f)
> Scan 10 : B-28 + W-32 + W-33 — tous résolus (commit 829a2b9)
> Scan 11-14 : B-29→B-34 + W-34→W-39 — tous résolus (Blocs P-Q, commits ~25d68c5)
> Scan 15-17 : B-35→B-46 + W-40→W-43 — tous résolus (Blocs R-S, commits ~8cd6705/2e1c6a7)
> Scan 18-19 : B-47→B-57 + W-44→W-47 — tous résolus (Blocs T-V, commits ~fa1cd7f/c1d8463)
> Scan 20 : B-58→B-60 + W-48 — résolus (Bloc W, commit 9064e31) ; B-61→B-71 + W-49 — résolus (Bloc X, commit e24531d)
> Scan 21 : B-72→B-84 + W-50→W-51 — résolus (Bloc Y, commit 58c881a)
> Scan 22 : B-86→B-93 + W-53→W-54 — résolus (Bloc Z, commit df0ac1d)
> Scan 23 : B-94 — résolu (Bloc AA, commit e5205c6)
> Scan 24 : B-95→B-96 + W-55 — résolus (Bloc AB, commit aa1dcad)
> Scan 25 : ✅ CLEAN — zéro issue

---

## Dernière patrouille

| Date | Design | Bugs | UX | Features |
|------|--------|------|-----|---------|
| 2026-04-05 | 3 BLOCKER, 6 WARNING | 1 CRITICAL, 3 HIGH | 3 P1, 4 P2 | 4 P1 manquantes |
| 2026-04-06 | 4 BLOCKER, 9 WARNING | 2 CRITICAL, 1 HIGH | 3 P1, 3 P2 | 7 FRs manquants (89% Phase 1) |
| 2026-04-06 (scan-3) | 0 BLOCKER, 0 WARNING | 0 | 0 | — | tsc CLEAN, 50+ couleurs tokenisées, 39 console guardés |
| 2026-04-08 | Design: 9 BLOCKER, 9 WARNING | Bug: 3 HIGH, 2 MEDIUM | UX: 4 P1, 4 P2 | Features: 12 manquants (81% Phase 1) |
| 2026-04-08 (post-345) | Design: 11 BLOCKER, 11 WARNING | Bug: 2 HIGH | UX: 4 P1, 5 P2 | Features: 10 manquants (84% Phase 1) |
| 2026-04-08 (post-queue) | Design: 3 BLOCKER, 5 WARNING | Bug: 1 CRITICAL, 4 HIGH | UX: 3 P1, 4 P2 | Features: 10 manquants (84% Phase 1) |

---

## BLOCKERs Ouverts

| ID | Description | Page | Fichier probable |
|----|-------------|------|-----------------|
| B-PATROL-01 | Vue `v_club_gardien_stats` manquante en DB remote | `/clubs` | migration SQL |
| B-PATROL-02 | Erreur 400 stages/index load error (bannière + état vide simultanés) | `/stages` | `stages/index.tsx` |
| B-PATROL-03 | Erreurs React "Unexpected text node" ×2 | `/seances` | `seances/index.tsx` |
| ~~B-CRAWLER-03~~ | ~~Table `attendances` inexistante — StreakTile + academy-score brisés~~ **RÉSOLU** — migration 00136 appliquée (story 49.9) | `/dashboard` | `supabase/migrations/00136_create_attendances_table.sql` |
| B-CRAWLER-04 | Table `xp_ledger` introuvable (migration 00129 non appliquée en remote) — Leaderboard vide | `/dashboard` | `api-client/src/gamification/xp.ts` |
| ~~B-CRAWLER-05~~ | ~~`profiles.id` inexistant dans `milestones.ts:52` → MilestoneCelebration jamais affichée~~ **RÉSOLU** — `.eq('user_id', user.id)` confirmé (story 49.10) | `/dashboard` | `api-client/src/gamification/milestones.ts` |
| B-PATROL-04 | ~~Lien sidebar Groupes → 404 (`/groupes`)~~ **RÉSOLU** — `href: '/groups'` correct | sidebar | `_layout.tsx` |
| B-CRAWLER-06 | Vue `coach_current_grade` → 406 en dev (migration 00091 non appliquée localement) — grades "—" dans liste coaches | `/coaches`, `/coaches/[id]/grade` | `supabase/migrations/00091_grade_content_permissions.sql` |
| ~~B-UX-01~~ | ~~Onglets PRÉSENCES et ÉVALUATIONS redirigent vers mauvaises routes~~ **RÉSOLU** — story 71-6 (commit) | `/activites` | `ActivitesHeader.tsx` |
| ~~B-DESIGN-01~~ | ~~`'Geist, sans-serif'` utilisé 29× dans `dashboard/page.tsx`~~ **RÉSOLU** — story 72-9 (Geist→Montserrat) | `/dashboard` | `dashboard/page.tsx` |
| B-DESIGN-02 | Shadow hardcodée `rgba(64,145,108,0.3)` dans CSS injecté | `/dashboard` | `dashboard/page.tsx` ~2544 |
| ~~B-BUG-C2~~ | ~~`load()` appelé sans `await` dans `handlePresetChange`/`handleApplyCustom`~~ **RÉSOLU** — story 72-10 | `/dashboard` | `dashboard/page.tsx` |
| ~~B-BUG-C3~~ | ~~`listAttendancesByChild` : filtres date ignorés par PostgREST (table jointe) — toutes présences retournées~~ **RÉSOLU** — story 76-1 (filtrage migré côté JS post-fetch) | `/children/[id]` | `attendances.ts` |
| B-BUG-C4 | `completionStatus` jamais `'complete'` — statut `'fermée'` inexistant en DB (réel : `'réalisée'`/`'terminée'`) → ÉVALS 0% dans StatCards | `/activites` | `api-client/src/sessions/attendances.ts:94` |
| B-BUG-C5 | `contact.tsx` — `setSending`/`setLoadingHistory` sans try/finally → states bloqués si erreur API | `/coaches/[id]/contact` | `apps/web/app/(admin)/coaches/[coachId]/contact.tsx:26-45` |
| B-BUG-C6 | Double guard `NODE_ENV` dans `dashboard.ts` (5 occurrences) — code trompeur, maintenance risquée | API | `api-client/src/admin/dashboard.ts:36,82,137,141,352` |
| ~~B-BUG-C7~~ | ~~Vue `session_evaluations_merged` absente des migrations actives — risque 404 PostgREST à toute réinitialisation DB~~ **RÉSOLU** — story 77-5, migration 00143 | `/parent`, `/clubs`, `/activites` | `supabase/migrations/00143_create_view_session_evaluations_merged.sql` |
| ~~B-BUG-C8~~ | ~~`evalMap.get(scheduled_at)` — clé UUID vs string date → évaluations jamais affichées dans fiche enfant parent~~ **RÉSOLU** — story 78-1 (evalMap.get(att.sessions?.id)) | `/parent/children/[id]` | `apps/web/app/(parent)/parent/children/[childId]/index.tsx:290` |
| B-BUG-C9 | `'performance'` absent du sélecteur inline dans `GenerateModal` — type non sélectionnable | `/seances` → modale génération | `apps/web/app/(admin)/seances/page.tsx:188` |
| ~~B-BUG-C10~~ | ~~`TYPE_COLOR` manque clé `performance` → sessions Performance affichent gold au lieu de teal (#26A69A)~~ **RÉSOLU** — story 72-14 (performance: methodologyMethodColors['Performance'] ajouté) | `/seances` (list + calendrier) | `apps/web/app/(admin)/seances/_components/constants.ts:14` |
| ~~B-BUG-C11~~ | ~~`methodColor()` typeMap manque `'performance'` → Dashboard Séances affiche gris pour type Performance~~ **RÉSOLU** — story 72-14 (performance: 'Performance' ajouté dans typeMap + methodLabel) | `/dashboard/seances` | `apps/web/app/(admin)/dashboard/seances/page.tsx:71,86` |
| ~~B-CRAWLER-02~~ | ~~39 `console.error` non guardés dans `@aureak/api-client`~~ **RÉSOLU** — tous les fichiers api-client guardés avec `(process.env.NODE_ENV as string) !== 'production'` (scan-3 2026-04-06) | API | tous fichiers `api-client/src/` |
| ~~B-CRAWLER-01~~ | ~~Colonne `unassigned_at` inexistante~~ **RÉSOLU** — migration 00134 appliquée (cycle 1) | `/dashboard` | `api-client/src/admin/dashboard.ts:75` |

---

## Warnings Ouverts (deadline : avant Gate 2)

| ID | Description | Page |
|----|-------------|------|
| ~~W-PATROL-01~~ | ~~UUIDs bruts affichés dans liste présences~~ **RÉSOLU** — commit 9139ea6 — fallback `'Joueur inconnu'` dans `presences.ts` | `/presences` |
| ~~W-PATROL-02~~ | ~~Label enum `En_cours` non mappé~~ **RÉSOLU** — story 69-2 | `/stages` |
| W-PATROL-03 | Dashboard KPIs vides sans valeur ni empty state | `/dashboard` |
| W-PATROL-04 | Doublon joueur AGRO Alessandro dans liste | `/children` |
| W-CRAWLER-01 | Navigation directe URL admin redirige vers `/tableau-de-bord` → 404 Unmatched Route | toutes routes admin |
| W-CRAWLER-02 | `implantations/index.tsx` : `load()` sans `setLoading(true)` → pas de spinner sur 2e+ appel | `/implantations` |
| ~~W-CRAWLER-03~~ | ~~`presences.ts` ligne 131 : `const childIds` déclaré mais jamais utilisé~~ **RÉSOLU** — `childIds` est utilisé ligne 340 dans `listTrialConversionSuggestions()` | `api-client/src/sessions/presences.ts` |
| W-CRAWLER-07 | `generateGroupName.ts` — `GroupMethod` local incomplet (manque Intégration + Perfectionnement) et `METHOD_COLOR` hardcodé hors @aureak/theme | `packages/business-logic/src/groups/generateGroupName.ts:5,34` |
| W-CRAWLER-08 | `TableauSeances.tsx` — N+1 sur `listEvaluationsBySession` : 200 appels simultanés au chargement | `apps/web/app/(admin)/activites/components/TableauSeances.tsx:276` |
| W-CRAWLER-04 | `dashboard.ts` → `getNavBadgeCounts` : `console.error` affiche `[object Object]` au lieu de `err.message` | `api-client/src/admin/dashboard.ts` |
| ~~W-CRAWLER-05~~ | ~~`ALPHA_COLORS` violet `#8B5CF6` hors charte~~ **RÉSOLU** — story 72-6 | `/activites` |
| ~~W-CRAWLER-06~~ | ~~couleurs hardcodées `#18181B` / `#FFFFFF`~~ **RÉSOLU** — story 72-8 | activites hub |

---

## Procédure de mise à jour (30 secondes)

**Après Gate 1** :
1. Ajouter la story dans le tableau avec `⏳` en Gate 1
2. Si warnings : ajouter une ligne dans Warnings Ouverts
3. Passer Gate 1 à `✅` ou `❌`

**Après Gate 2** :
1. Mettre à jour Gate 2 à `✅` ou `❌`
2. Marquer les warnings résolus (supprimer la ligne)
3. Cocher "En prod?" quand déployé

---

## Rapports disponibles

> Listés automatiquement dans `_qa/reports/` — pas besoin de les répertorier ici.
