# QA Day Queue — 2026-04-09

| Story | Gate 1 | Gate 2 | Verdict final |
|-------|--------|--------|---------------|
| story-81-1 | skipped | pass | PASS |

---

# QA Day Queue — 2026-04-06

| Story | Gate 1 | Gate 2 | Verdict final |
|-------|--------|--------|---------------|
| story-63-3 | pass | pass | PASS |

---

# QA Day Queue — 2026-04-05

| Story | Gate 1 | Gate 2 | Verdict final |
|-------|--------|--------|---------------|
| story-49-8 | pass | pass | PASS |
| story-49-1 | pass | pass | PASS |
| story-49-2 | pass | pass | PASS |
| story-49-6 | pass | pass | PASS |

---

## Détail story-49-1

**Gate 1** (code review + sécurité) : PASS — 2 blockers corrigés (clubsLoading sans finally + couleurs hardcodées)
**Gate 2** (design + UX + bug hunting) : PASS — 0 blocker, 3 warnings documentés

**Fichiers modifiés** :
- `aureak/packages/api-client/src/admin/profiles.ts`
- `aureak/apps/web/app/(admin)/users/new.tsx`

**Playwright** : Skipped — app non démarrée

**Rapports** :
- `_qa/reports/2026-04-05_story-49-1_gate1.md`
- `_qa/reports/2026-04-05_story-49-1_gate2.md`

---

## Détail story-49-2

**Gate 1** (code review) : PASS — 3 blockers corrigés (couleurs hardcodées confirm-inline + handleOpenThemePicker sans try/catch + AC4 rollback sans message utilisateur)
**Gate 2** (UX audit + bug hunting) : PASS — 0 nouveau blocker, 6 warnings documentés

**Fichiers modifiés** :
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

**Playwright** : Skipped — app non démarrée

**Rapports** :
- `_qa/reports/2026-04-05_story-49-2_gate1.md`
- `_qa/reports/2026-04-05_story-49-2_gate2.md`

---

## Détail story-49-6

**Gate 1** (code review + migration + sécurité) : PASS — 4 blockers corrigés (policies non-idempotentes + auth.role() trop permissif + UPDATE policy manquante pour upsert + bucket sans file_size_limit/mime_types)
**Gate 2** (design + UX + bug hunting) : PASS — 0 blocker, 5 warnings documentés

**Fichiers modifiés** :
- `supabase/migrations/00117_implantations_photo_url.sql` (4 corrections sécurité/idempotence)
- `aureak/packages/types/src/entities.ts` (photoUrl)
- `aureak/packages/api-client/src/sessions/implantations.ts` (map + upload + update)
- `aureak/apps/web/app/(admin)/implantations/index.tsx` (UI photo + détail)

**Playwright** : Skipped — app non démarrée

**Rapports** :
- `_qa/reports/2026-04-05_story-49-6_gate1.md`
- `_qa/reports/2026-04-05_story-49-6_gate2.md`

---

## Détail story-63-3

**Gate 1** (code review + design critic) : PASS — 1 MEDIUM corrigé (rgba hardcodés → token `colors.border.goldBg`)
**Gate 2** (UX audit + regression + bug hunting) : PASS — 0 blocker, 4 warnings non bloquants

**Fichiers modifiés** :
- `aureak/apps/web/app/(admin)/developpement/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx`
- `aureak/packages/theme/src/tokens.ts` (ajout `colors.border.goldBg`)

**Playwright** : Skipped — app non démarrée

**Rapports** :
- `_qa/reports/2026-04-06_story-63-3_gate1.md`
- `_qa/reports/2026-04-06_story-63-3_gate2_ux.md`
- `_qa/reports/2026-04-06_story-63-3_gate2_regression.md`
- `_qa/reports/2026-04-06_story-63-3_gate2_bugs.md`

---

## Détail story-49-8

**Gate 1** (code review + sécurité) : PASS — 2 blockers corrigés (status SQL + tenant isolation)
**Gate 2** (design + UX + bug hunting) : PASS — 1 blocker corrigé (sous-texte card Anomalies)

**Fichiers modifiés** :
- `supabase/migrations/00116_create_fn_get_implantation_stats.sql`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx`

**Playwright** : Skipped — app non démarrée

**Rapports** :
- `_qa/reports/2026-04-05_story-49-8_migration.md`
- `_qa/reports/2026-04-05_story-49-8_code-review.md`
- `_qa/reports/2026-04-05_story-49-8_security.md`
- `_qa/reports/2026-04-05_story-49-8_gate2.md`
