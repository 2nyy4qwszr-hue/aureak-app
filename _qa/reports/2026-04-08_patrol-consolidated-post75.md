# Patrol Consolidé — 2026-04-08 (post-epic 75)

## Statut app : running (HTTP 200 — port 8082)

---

## 🔴 CRITIQUES (action immédiate)

- [BUG CRITICAL] Vue `session_evaluations_merged` absente des migrations actives → appels parent + activites échouent — `api-client/src/parent/childProfile.ts:28`
- [BUG HIGH] `evalMap.get(scheduled_at)` utilise clé UUID au lieu de string → évaluations jamais affichées dans profil enfant — `parent/children/[childId]/index.tsx:290`
- [DESIGN BLOCKER] Hero tile bento absente sur dashboard — `app/(admin)/dashboard/index.tsx`
- [DESIGN BLOCKER] Page 404 fond noir pur (DARK DOMINANT) — Expo Router `+not-found` non personnalisé

## 🟠 IMPORTANTS (cette semaine)

- [BUG HIGH] `'performance'` absent du sélecteur `GenerateModal` → méthode non sélectionnable — `seances/page.tsx:188`
- [DESIGN WARNING] Couleurs hardcodées massives (HEADER_BG `#1A1A1A` + 12+ hex) — `seances/[sessionId]/page.tsx` + `edit.tsx`
- [UX P1] Recherche joueurs non live — validation manuelle requise — `/children`
- [UX P1] Champs date stages `TextInput AAAA-MM-JJ` vs `input type=date` — `/stages/new` + `/stages/[stageId]`

## ✨ OPPORTUNITÉS (quand disponible)

- FR24 → "Vue coach résultats quiz groupe dans fiche séance : tableau joueurs × score + taux maîtrise thème"
- FR70/FR71 → "Admin CRUD questions quiz par thème dans /methodologie/themes/[themeId]"
- FR34/FR35 → "Board parent onglet Évaluations : attitude+effort+commentaire coach"

## 📊 Évolution (delta vs patrol 2026-04-08 07:55)

- ✅ 5 résolus : BLOCKER evaluations Manrope+violet (75-4), BLOCKER presences heatmap hex (75-5), BUG HIGH completionStatus 'fermée' (75-1), BUG HIGH contact try/finally (75-2), UX P1 conversion essai silencieuse (75-3)
- 🆕 4 nouveaux : CRITICAL session_evaluations_merged absente, HIGH evalMap UUID/string, BLOCKER hero tile bento, BLOCKER page 404 dark
- ↗ 0 aggravés

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 2 BLOCKERs | 4 WARNINGs | — |
| Bug Crawler | 1 CRITICAL | 2 HIGH | — |
| UX Inspector | 4 P1 | 4 P2 | — |
| Feature Scout | 10 manquants | — | 84% couverture |

---

## Fichiers rapports

- `_qa/reports/2026-04-08_design-patrol-post75.md`
- `_qa/reports/2026-04-08_bug-crawler-post75.md`
- `_qa/reports/2026-04-08_ux-inspector-post75.md`
- `_qa/reports/2026-04-08_feature-scout-post75.md`
