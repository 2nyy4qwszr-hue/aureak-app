# Patrol Consolidé — 2026-04-06 01:00

## Statut app : non démarrée (analyse statique complète)

---

## 🔴 CRITIQUES (action immédiate)

- [BUG] `unassigned_at` colonne inexistante dans `coach_implantation_assignments` — `api-client/src/admin/dashboard.ts:240` — KPIs dashboard toujours à `—`
- [BUG] Erreur 400 stages/index — bannière erreur + empty state simultanés (B-PATROL-02)
- [DESIGN] Avatar couleurs violet `#8B5CF6` + bleu `#3B82F6` — `children/index.tsx:100` — anti-pattern absolu design-vision
- [DESIGN] Accents bleu `#60a5fa` + violet `#a78bfa` en KPI tiles clubs — `clubs/[clubId]/page.tsx:975–1015`
- [DESIGN] Indigo `#6366f1` hardcodé — `methodologie/themes/[themeKey]/sections/SectionCriteres.tsx:69-71`

## 🟠 IMPORTANTS (cette semaine)

- [BUG] 22 `console.error` non guardés par `NODE_ENV` dans `@aureak/api-client` (methodology×8, dashboard×7, notifications×4, evaluations×2, child-directory×1)
- [DESIGN] `fontFamily: 'System'` hardcodé — `clubs/page.tsx:450` (rupture Montserrat)
- [UX] Step 2 création séance — 8-12 interactions dans une étape (règle max 3 clics violée)
- [UX] Double bouton retour fiche séance — breadcrumb + bouton "← Séances" redondants
- [UX] Recherche clubs non temps-réel — bouton "Chercher" obligatoire vs PlayerPicker inline temps-réel (incohérence même flux)

## ✨ OPPORTUNITÉS (quand disponible)

- Supervision coachs (story 41-1 ready-for-dev) → vue `/coaches/supervision` taux check-in
- Export .ics parent → sync Google/Apple Calendar séances enfant
- Sidebar refactoring 63.1 → ready-for-dev, impact immédiat navigation

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 4 BLOCKER | 9 WARNING | 0 pages conformes |
| Bug Crawler | 2 CRITICAL (confirmés) | 1 HIGH (nouveau) | B-PATROL-04 résolu |
| UX Inspector | 3 P1 | 3 P2 | — |
| Feature Scout | 7 FRs manquants | — | 89% Phase 1 |

---

## Fichiers rapports

- `_qa/reports/2026-04-06_design-patrol.md`
- `_qa/reports/2026-04-06_bug-crawler.md`
- `_qa/reports/2026-04-06_ux-inspector.md`
- `_qa/reports/2026-04-06_feature-scout.md`
