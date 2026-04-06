# Patrol Consolidé — 2026-04-05 09:00

## Statut app : running (http://localhost:8082) ✅

Authentification : admin@test.com / Test1234! — accès admin complet confirmé.
Pages crawlées : 9 routes admin (dashboard, joueurs, fiche joueur, séances, nouvelle séance, stages, clubs, méthodologie, groupes).

---

## 🔴 CRITIQUES (action immédiate)

- **[BUG CRITICAL]** Vue SQL `v_club_gardien_stats` manquante en DB remote — `/clubs` — toutes les stats gardiens par club sont vides, la vue est requêtée à chaque chargement et échoue silencieusement
- **[BUG HIGH]** Erreur 400 + `[stages/index] load error` — `/stages` — page affiche bannière rouge d'erreur + état vide simultanément — inopérable si RLS ou table manquante
- **[BUG HIGH]** Erreur 400 + `[dashboard] getImplantationStats error` — `/dashboard` — tiles KPI vides sans explication utilisateur
- **[BUG HIGH]** Erreurs React "Unexpected text node" ×2 — `/seances` — nœuds texte orphelins dans View, crash potentiel sur mobile

---

## 🟠 IMPORTANTS (cette semaine)

- **[UX P1]** Présences affiche les UUIDs bruts comme titres de séances — `/presences` — page totalement illisible pour un admin non-technique
- **[UX P1]** Lien "Groupes" dans la sidebar navigue vers `/groupes` (404) — correction 1 ligne dans `_layout.tsx`
- **[FEATURE P1]** Epic 44-1 : bug création coach via Edge Function — aucun nouveau coach ne peut être invité
- **[FEATURE P1]** Epic 44-2 : bug filtre saison actuelle joueurs — filtre "2025-2026" dans la liste joueurs potentiellement défectueux
- **[DESIGN]** Dashboard non-conforme au prototype bento validé — grille uniforme au lieu du layout asymétrique DLS + hero tile `#2A2827`

---

## ✨ OPPORTUNITÉS (quand disponible)

- **Epic 45-1** → story "Implémenter story 45-1 : migrer typographie vers Montserrat + tokens gamification dans @aureak/theme/tokens.ts" — débloque les redesigns 42/43/44
- **Epic 42-1** → story "Implémenter story 42-1 : redesign dashboard admin avec bento asymétrique, tile hero, layout 3 colonnes — référence desktop-admin-bento-v2.html"
- **Quick win** → story "Corriger href Groupes dans _layout.tsx : `/groupes` → `/groups`" — 1 ligne, impact immédiat

---

## Chiffres clés

| Agent | BLOCKER/CRITICAL | WARNING/HIGH | OK |
|-------|-----------------|-------------|-----|
| Design Patrol | 3 BLOCKER | 6 WARNING | 3 pages |
| Bug Crawler | 1 CRITICAL | 3 HIGH | 5 pages |
| UX Inspector | 3 P1 | 4 P2 | — |
| Feature Scout | 4 stories P1 manquantes | 2 Phase 2 débloquées | ~70% couverture backlog |

---

## Points notables additionnels

- **Doublon joueur** : "AGRO Alessandro" apparaît deux fois dans la liste joueurs — investiguer la source (import Notion ou jointure)
- **Label enum** : `En_cours` avec underscore visible dans les filtres stages — mapping manquant
- **Favicon 404** : ressource statique manquante sur toutes les navigations — bruit en console
- **DB Baseline Recovery** : ~30 tables remote sans migration dans le repo — chantier ouvert, bloquant pour production

---

## Fichiers rapports

- `_qa/reports/2026-04-05_design-patrol.md`
- `_qa/reports/2026-04-05_bug-crawler.md`
- `_qa/reports/2026-04-05_ux-inspector.md`
- `_qa/reports/2026-04-05_feature-scout.md`
