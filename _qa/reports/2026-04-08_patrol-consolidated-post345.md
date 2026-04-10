# Patrol Consolidé — 2026-04-08 (post-story 34.5)

## Statut app : non démarrée (agents analyse statique uniquement)

> Delta calculé vs `2026-04-08_patrol-consolidated-post343.md`
> Stories livrées depuis : **story-34-4** (Page Programmes liste + migration 00142) + **story-34-5** (Programme création, détail, duplication)
> Ces deux stories créent de nouvelles pages sans modifier le code existant → aucun nouveau BLOCKER ni régression attendue.

---

## 🔴 CRITIQUES (action immédiate)

- [DESIGN BLOCKER] Badge violet `#6366F1` (statut 'essai') anti-pattern absolu — `seances/[sessionId]/page.tsx:694`
- [DESIGN BLOCKER] Police Manrope (violation Story 45.1, 4 occurrences) — `activites/evaluations/page.tsx:139,759,794,800`
- [DESIGN BLOCKER] Badge `#7C3AED` violet hardcodé anti-pattern absolu — `activites/evaluations/page.tsx:387`
- [DESIGN BLOCKER] Card "Tendance Globale" fond dark dans zone light — `activites/presences/page.tsx:154,184-185`
- [DESIGN BLOCKER] Heatmap présences 5 hex hardcodées — `activites/presences/page.tsx:67-71`

## 🟠 IMPORTANTS (cette semaine)

- [DESIGN BLOCKER] 6 BLOCKERs supplémentaires : dashboard cards dark en zone light (page.tsx:179,842), `#FFFFFF` inline (l.3142,3145), header `#1A1A1A` fiche séance (seances/[sessionId]/page.tsx:56), `#6e5d14` presences (page.tsx:205-207) — voir `2026-04-08_design-patrol.md`
- [BUG HIGH] `listAttendancesByChild` colonne `session_date` inexistante → 400 — `api-client/src/sessions/attendances.ts:804-818`
- [BUG HIGH] `checkAcademyMilestones` profil absent → 406 à chaque chargement dashboard — `api-client/src/gamification/milestones.ts:50-58`
- [UX P1] Wizard séance 6 étapes — max 3 clics violé d'un facteur 4-6 — `/seances/new`
- [UX P1] Stages absent de la sidebar — `/_layout.tsx:125-128`
- [UX P1] Suppression bloc/journée stage sans ConfirmDialog — `/stages/[stageId]/page.tsx:100-103,885`
- [UX P1] État vide séances absent sur vues Mois/Année — `seances/page.tsx:808`

## ✨ OPPORTUNITÉS (quand disponible)

- FR24 → "Vue coach résultats quiz groupe dans fiche séance : `listGroupQuizResults(sessionId, groupId)`, tableau joueurs × score + taux maîtrise par thème"
- FR10 → "Dashboard coach terrain `/coach/home` : séances du jour filtrées sur coach_id via `session_coaches JOIN sessions`"
- FR34/FR35 → "Board parent onglet Évaluations : `listEvaluationsByChild` attitude+effort+commentaire coach par séance"

## 📊 Évolution (delta vs post-343)

- = Identique : 0 nouvelle régression introduite par stories 34-4 et 34-5
- = Design : 11 BLOCKERs stables (nouvelles pages programmes suivent les patterns corrects)
- = Bugs : 2 HIGH stables (non touchés par stories 34-4/34-5)
- = UX : 4 P1 stables
- = Feature Scout : 84% couverture, 10 FRs Phase 1 manquants

> Stories 34-4 et 34-5 sont Phase 2 (Méthodologie Programmes) — ne débloquent aucun FR Phase 1.

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 11 BLOCKERs | 11 WARNINGs | — |
| Bug Crawler | 0 CRITICAL | 2 HIGH | — |
| UX Inspector | 4 P1 | 5 P2 | — |
| Feature Scout | 10 manquants | — | 84% couverture |

---

## Fichiers rapports de référence

- `_qa/reports/2026-04-08_design-patrol.md`
- `_qa/reports/2026-04-08_bug-crawler.md`
- `_qa/reports/2026-04-08_ux-inspector.md`
- `_qa/reports/2026-04-08_feature-scout.md`
