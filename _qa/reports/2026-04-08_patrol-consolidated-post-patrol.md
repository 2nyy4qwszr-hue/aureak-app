# Patrol Consolidé — 2026-04-08 (post-queue finale) — mode complet Playwright

## Statut app : running — http://localhost:8082

---

## 🔴 CRITIQUES (action immédiate)

- [DESIGN BLOCKER] `profiles.avatar_url` inexistante → erreur API à chaque chargement de /profile — `app/(admin)/profile/page.tsx`
- [DESIGN BLOCKER] Dashboard bento : `display:flex` au lieu de CSS grid → layout non conforme au prototype validé — `dashboard/page.tsx`
- [DESIGN BLOCKER] Couleur `#3B82F6` hardcodée hors palette — `analytics/page.tsx`
- [BUG HIGH] `club_directory_child_links` 400 → section joueurs absente sur toutes les fiches club — `api-client/src/admin/club-directory.ts`

## 🟠 IMPORTANTS (cette semaine)

- [BUG HIGH] `'performance'` absent dans `GenerateModal` → crash sélection type séance Performance — `seances/page.tsx:188`
- [BUG HIGH] Deep link `/children/[childId]` redirige vers liste après SplashScreen — `_layout.tsx:460`
- [UX P1] Keyboard shortcuts `End`/`Home` interceptés globalement → navigation involontaire — toutes pages admin
- [UX P1] Wizard nouvelle séance : 6 étapes non skippables + bloqué sans implantation — `/seances/new`
- [UX P1] Erreur 400 `club_directory_child_links` → section joueurs absente fiche club — `/clubs/[clubId]`

## ✨ OPPORTUNITÉS (quand disponible)

- FR-033 push quiz parent post-séance → "Enrichir notify-session-closed pour envoyer push quiz au parent — FR33"
- FR-076 progression thème enfant → "Vue SQL v_child_theme_progress : taux réussite quiz par (child_id, theme_id) — FR76/FR72"
- FR-092/093/094 versioning thèmes → "version INT methodology_themes + snapshot immuable + FK learning_attempts.theme_version_id — FR92-94"

## 📊 Évolution (delta vs patrol précédente)

- ✅ 3 résolus :
  - `session_evaluations_merged` absente (story 77-5 — CRITICAL → 0)
  - `evalMap.get(scheduled_at)` clé erronée (story 78-1 — HIGH résolu)
  - Dégradé vert `#1a472a` implantations (story 77-3 — BLOCKER résolu)
- 🆕 2 nouveaux BLOCKERs :
  - `profiles.avatar_url` inexistante — /profile
  - Keyboard shortcuts End/Home interceptés globalement
- ↗ 2 aggravés :
  - `#3B82F6` analytics — persistant (non adressé)
  - `club_directory_child_links` 400 — HIGH→P1 UX aussi
- = Feature Scout stable : 85%, 10 FRs manquants

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 4 BLOCKERs | 6 WARNINGs | — |
| Bug Crawler | 0 CRITICAL | 2 HIGH | — |
| UX Inspector | 4 P1 | 5 P2 | — |
| Feature Scout | 10 manquants | — | 85% couverture |

---

## Fichiers rapports

- `_qa/reports/2026-04-08_design-patrol-post-queue.md`
- `_qa/reports/2026-04-08_bug-crawler-post-queue.md`
- `_qa/reports/2026-04-08_ux-inspector-post-queue.md`
- `_qa/reports/2026-04-08_feature-scout-post-queue.md`
