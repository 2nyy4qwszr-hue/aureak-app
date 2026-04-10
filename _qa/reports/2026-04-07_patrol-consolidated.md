# Patrol Consolidé — 2026-04-07 15:35 (v2 — post-patrol complet)

## Statut app : running (HTTP 200)

---

## 🔴 CRITIQUES (action immédiate)

- [DESIGN BLOCKER] Avatars coach `ALPHA_COLORS` hardcodées dans `TableauSeances.tsx:133` — inclut violet `#8B5CF6` et bleu `#3B82F6` explicitement exclus de la charte (cf. `_avatarHelpers.ts` créé aujourd'hui)
- [DESIGN BLOCKER] `<Text>` natif React Native à la place de `<AureakText>` dans `evenements/page.tsx` (6 endroits : pills, filtres, icônes empty state) — Montserrat non appliquée
- [DESIGN BLOCKER] Card "Tendance Globale" (présences) et "Top Performer" (évaluations) mélangent dark/light dans une row de stat cards sur fond light — pattern dark intentionnel mais insertion non cohérente
- [BUG HIGH] Couleurs hardcodées `#18181B` / `#FFFFFF` dans `ActivitesHeader.tsx:105` et `presences/page.tsx` — remplacer par `colors.text.dark` / `colors.text.primary`

## 🟠 IMPORTANTS (cette semaine)

- [BUG HIGH] Badges statut "Planifiée" et "En cours" dans `TableauSeances` utilisent des hex directs au lieu des tokens de status
- [UX P1] `FiltresScope` — pill "Groupe" accessible sans implantation sélectionnée, affiche message d'erreur tardif → griser le pill tant qu'aucune implantation n'est active
- [UX P1] Colonnes MÉTHODE et COACH toujours vides dans `TableauSeances` — `listSessionsWithAttendance` ne retourne pas ces champs — impact UX majeur sur le tableau principal
- [UX P1] Redirection silencieuse scope "Joueur" dans Présences → `/children/[id]` sans avertissement, perd le contexte Activités
- [BUG MEDIUM] `PseudoFiltresTemporels.tsx:40` — `'#FFFFFF'` hardcodé au lieu de token
- [BUG MEDIUM] Silent catches sans log dans `children/index.tsx` (lignes 41, 203, 354)

## ✨ OPPORTUNITÉS (quand disponible)

- Export .ics séances (FR38) → story "Export iCalendar séances depuis la fiche séance — 1 bouton, 1 Edge Function"
- Dashboard coach terrain — séances du jour filtrées par coach connecté (FR10) → story "Vue coach terrain : mes séances du jour avec roster"
- Quiz QCM enfant post-séance (FR22/FR23) → story "Module Quiz : questions pédagogiques post-séance enfant" (effort M, différenciateur produit majeur)

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 3 | 11 | 6 pages |
| Bug Crawler | 0 | 3 HIGH + 2 MEDIUM | 0 CRITICAL |
| UX Inspector | 3 P1 | 4 P2 | — |
| Feature Scout | 8 FRs manquants | 6 partiels | ~81% Phase 1 |

---

## Fichiers rapports

- `_qa/reports/2026-04-07_design-patrol.md`
- `_qa/reports/2026-04-07_bug-crawler.md`
- `_qa/reports/2026-04-07_ux-inspector.md`
- `_qa/reports/2026-04-07_feature-scout.md`
