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
| B-BUG-C3 | `listAttendancesByChild` : filtres date ignorés par PostgREST (table jointe) — toutes présences retournées | `/children/[id]` | `attendances.ts` |
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
| W-CRAWLER-03 | `presences.ts` ligne 131 : `const childIds` déclaré mais jamais utilisé (dead code post-UUID-fix) | `api-client/src/sessions/presences.ts` |
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
