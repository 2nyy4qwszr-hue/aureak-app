# Patrol Consolidé — 2026-04-08 (post-queue 9 stories)

## Statut app : non-démarrée (analyse statique uniquement)

---

## 🔴 CRITIQUES (action immédiate)

- [BUG CRITICAL] Vue `session_evaluations_merged` absente des migrations actives → évaluations parent jamais chargées — `api-client/src/parent/childProfile.ts`
- [DESIGN BLOCKER] Couleur bleue `#3B82F6` hors palette (anti-pattern absolu) — `analytics/page.tsx`
- [DESIGN BLOCKER] Dégradé vert `#1a472a` + `#FFFFFF` hardcodés — `implantations/index.tsx`

## 🟠 IMPORTANTS (cette semaine)

- [DESIGN BLOCKER] Dashboard bento hero tile absente — layout non conforme au prototype validé — `dashboard/page.tsx`
- [BUG HIGH] `evalMap.get(scheduled_at)` clé UUID vs string date → évaluations jamais affichées fiche enfant parent — `parent/children/[childId]/index.tsx:290`
- [BUG HIGH] `TYPE_COLOR` + `methodColor()` manquent entrée `'performance'` → séances Performance gold au lieu de teal — `seances/_components/constants.ts` + `dashboard/seances/page.tsx:67`
- [UX P1] Recherche joueurs non live — validation manuelle requise — `/children`
- [UX P1] Champs date stages en texte libre (ISO non natif) — `/stages/new`, `/stages/[stageId]`

## ✨ OPPORTUNITÉS (quand disponible)

- FR-22/FR-23 → "Vue quiz QCM depuis board parent `/parent/children/[childId]/quiz/[sessionId]` — 5 questions, soumission, correction + badge"
- FR-42 → "Widget dashboard admin coachs inactifs >7j — `detectInactiveCoaches()` api-client"
- FR-31/FR-32 → "Module tickets parent — migration `parent_tickets` + `ticket_replies` + API CRUD + pages `/parent/tickets` + admin `/tickets`"

## 📊 Évolution (delta vs post-345)

- ✅ 8 résolus (design) : badge violet essai #6366F1, Manrope ×4, badge #7C3AED, card Tendance dark, heatmap hex presences, #FFFFFF dashboard inline, header #1A1A1A fiche séance, #6e5d14 presences
- ✅ 3 résolus (UX) : Stages absent sidebar (story-66-2), suppression bloc/journée sans confirm (story-69-11), empty state Mois/Année (story-76-2)
- ✅ 1 résolu (bug) : listAttendancesByChild session_date → 400 (story-76-1)
- 🆕 3 nouveaux BLOCKERs design : #3B82F6 analytics, #1a472a implantations, dashboard bento layout
- 🆕 1 CRITICAL : session_evaluations_merged absente migrations (migration 00140 non appliquée en local — anciennement HIGH)
- 🆕 2 nouvelles frictions UX P1 : recherche joueurs non live, dates stages texte libre
- ↗ Bug aggravé : evalMap + TYPE_COLOR/performance — persistants non résolus
- = Feature Scout stable : 84%, 10 FRs manquants

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 3 BLOCKERs | 5 WARNINGs | — |
| Bug Crawler | 1 CRITICAL | 4 HIGH | — |
| UX Inspector | 3 P1 | 4 P2 | — |
| Feature Scout | 10 manquants | — | 84% couverture |

---

## Fichiers rapports

- `_qa/reports/2026-04-08_design-patrol-post-queue.md`
- `_qa/reports/2026-04-08_bug-crawler-post-queue.md`
- `_qa/reports/2026-04-08_ux-inspector-post-queue.md`
- `_qa/reports/2026-04-08_feature-scout-post-queue.md`
