# Patrol Consolidé — 2026-04-08 (patrouille complète post-epic 74)

## Statut app : running (HTTP 200)

---

## 🔴 CRITIQUES (action immédiate)

- [DESIGN BLOCKER] `evaluations/page.tsx` — police `Manrope` (4 occurrences l.139, 759, 794, 800) → Montserrat obligatoire
- [DESIGN BLOCKER] `evaluations/page.tsx:387` — `badgeColor="#7C3AED"` violet pur, anti-pattern absolu charte AUREAK
- [DESIGN BLOCKER] `presences/page.tsx:67-71` — heatmap `getCellStyle` : 5 hex hardcodés (`#22c55e`, `#eab308`, `#f97316`, `#ef4444`, `#ffffff`) → `colors.status.*`
- [DESIGN BLOCKER] `presences/page.tsx:205-207` + `evaluations/page.tsx:604` — `backgroundColor: '#6e5d14'` → `colors.accent.goldDark`
- [BUG HIGH] `attendances.ts:94` — `completionStatus` jamais `'complete'` : statut `'fermée'` inexistant en DB (réel : `'réalisée'`/`'terminée'`) → ÉVALS 0% dans StatCards
- [UX P1] `presences/page.tsx:162` + `evaluations/page.tsx:372,385` — données fictives hardcodées ("+12%", "+2.4%", "+15%") affichées comme métriques réelles

## 🟠 IMPORTANTS (cette semaine)

- [BUG HIGH] `contact.tsx:26-45` — `setSending`/`setLoadingHistory` sans try/finally → states bloqués si erreur API
- [BUG HIGH] `dashboard.ts:36,82,137,141,352` — double guard `NODE_ENV` (5 occurrences) — code trompeur
- [DESIGN WARNING] `presences/page.tsx:244,248` — `rgba(193,172,92,0.5)` et `rgba(110,93,20,0.05)` → tokens `border.goldSolid`/`border.goldBg`
- [DESIGN WARNING] `methodologie/seances/index.tsx:454` — shadow inline `rgba(0,0,0,0.10)` → `shadows.lg`
- [UX P1] Onglets "Connaissances" et "Compétences" dans Évaluations cliquables mais vides
- [UX P1] Conversion essai → membre sans confirmation ni sélection de groupe (action destructrice silencieuse)

## ✨ OPPORTUNITÉS (quand disponible)

- Quiz QCM enfant post-séance — backend 100% prêt, UI seulement → story "Quiz QCM enfant : /parent/children/[childId]/quiz, 5 questions depuis thèmes séance"
- Dashboard coach terrain filtré — `coach_id = auth.user` + séances du jour → story "Dashboard coach terrain : /coach/home, séances du jour filtrées"
- Board parent onglet Évaluations — données dispo API → story "Board parent — onglet Évaluations : attitude+effort+commentaires coach"

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 9 BLOCKERs | 9 WARNINGs | 4 fichiers conformes |
| Bug Crawler | 0 CRITICAL | 3 HIGH, 2 MEDIUM | 6 fichiers conformes |
| UX Inspector | 4 P1 | 4 P2 | — |
| Feature Scout | 12 FRs manquants | 6 partiels | 81% Phase 1 |

---

## Fichiers rapports

- `_qa/reports/2026-04-08_design-patrol.md`
- `_qa/reports/2026-04-08_bug-crawler-v2.md`
- `_qa/reports/2026-04-08_ux-inspector.md`
- `_qa/reports/2026-04-08_feature-scout.md`
