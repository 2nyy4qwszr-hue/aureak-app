# Patrol Consolidé — 2026-04-06 (post story 50-11)

## Statut app : running (HTTP 200)

---

## 🔴 CRITIQUES (action immédiate)

- [BUG] `attendance_records` inexistante en DB — `getTopStreakPlayers`, `getAcademyScore`, `liveSessionCounts` échouent PGRST205 — `dashboard.ts`, `academy-score.ts`, `liveSessionCounts.ts`
- [BUG] `xp_ledger` non appliquée en remote (migration 00129) — Leaderboard XP vide, score académie = 0 — `gamification/xp.ts`, `academy-score.ts`
- [BUG] `profiles.id` n'existe pas — `milestones.ts:52` — `.eq('id', ...)` → `.eq('user_id', ...)` — `MilestoneCelebration` jamais affichée
- [DESIGN] Avatars violet (#8B5CF6) / bleu (#3B82F6) sur page Joueurs — anti-pattern absolu — `children/index.tsx:100`
- [UX-P1] Compteur "séances aujourd'hui" dans date card = sessions live (0 le matin) — `dashboard/page.tsx:2534`

## 🟠 IMPORTANTS (cette semaine)

- [UX-P1] Modal Évènements : sélectionner "Tournoi" → dead-end liste vide filtrée sans CTA sortie — `evenements/page.tsx`
- [UX-P1] Sous-pages Développement sans retour vers hub parent — 3 fichiers : `prospection/page.tsx`, `marketing/page.tsx`, `partenariats/page.tsx`
- [DESIGN] Gradients verts terrain hardcodés hors tokens — `dashboard/page.tsx:26,638`
- [BUG] `column session_attendees_1.status` — erreur `getNavBadgeCounts` — badges nav incorrects
- [FEATURE] FR-42 Supervision coachs manquant — story `41-1` ready-for-dev — bloque Journey 4

## ✨ OPPORTUNITÉS (quand disponible)

- Supervision coachs (story 41-1 déjà rédigée) → tableau /coaches/supervision, taux check-in, badge rouge si < 50%
- Export .ics parent → bouton board parent, génération iCal séances du groupe, téléchargement direct sans backend

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 5 | 10 | — |
| Bug Crawler | 3 | 2 | — |
| UX Inspector | 3 P1 | 3 P2 | — |
| Feature Scout | 7 manquants | — | ~89% Phase 1 |

---

## Fichiers rapports

- `_qa/reports/2026-04-06_design-patrol.md`
- `_qa/reports/2026-04-06_bug-crawler.md`
- `_qa/reports/2026-04-06_ux-inspector.md`
- `_qa/reports/2026-04-06_feature-scout.md`
