# Story TBD : Activités Hub — Aligner `/activites` sur admin-page-template

**Status:** todo
**Epic:** Admin UI — cohérence template
**Source:** `docs/admin-page-template.md` (source de vérité = `/activites/presences`)
**Deps:** aucune
**Branche suggérée:** `feat/activites-hub-align-template`

---

## Contexte

`docs/admin-page-template.md` a été extrait de `/activites/presences` et sert désormais de **gabarit officiel** pour toutes les pages admin (layout, specs visuelles, checklist, gotchas).

La page `/activites` (onglet Séances) — fichier `aureak/apps/web/app/(admin)/activites/page.tsx` — a dérivé du gabarit avant que celui-ci ne soit formalisé. Elle doit être ré-alignée pour :
1. Cohérence visuelle 1:1 avec `/activites/presences` et `/activites/evaluations`.
2. Respect des règles du template (pas de `maxWidth`, `zIndex: 9999` sur filtres, tokens `@aureak/theme` uniquement, etc.).
3. Servir d'exemple fiable pour les futures pages admin (si la page référence dérive, le template perd toute valeur).

**Écarts déjà identifiés** (audit rapide) :
- ❌ `scrollContent` utilise `maxWidth: 1200, alignSelf: 'center', width: '100%'` → interdit par le template (§5 gotcha 7 : « pas de maxWidth sur le contenu »). Doit être supprimé au profit de `paddingHorizontal: space.lg`.
- ❌ `filtresRow` n'a pas `zIndex: 9999` → les dropdowns filtres peuvent passer sous le contenu (§5 gotcha 5).
- ⚠️ Commentaire en tête `// Story 65-1` obsolète (référence à une ancienne story, à supprimer — règle CLAUDE.md "pas de commentaires non-pérennes").
- ⚠️ Vérifier que `StatCards`, `TableauSeances`, `FiltresScope`, `PseudoFiltresTemporels` appliquent les bonnes valeurs (dimensions KPI `281×162`, gap `16`, radius `16`, border `#E8E4DC` via token, etc.). Si divergence → fix.

---

## Description

Refactoriser `aureak/apps/web/app/(admin)/activites/page.tsx` et ses sous-composants (`./components/*`) pour qu'ils respectent strictement `docs/admin-page-template.md`. Aucune nouvelle fonctionnalité. Aucun changement de logique métier / API. C'est un alignement visuel et structurel.

**Règle d'or** : le rendu final de `/activites` doit être **visuellement indiscernable** de `/activites/presences` au niveau structure (header, 4 cartes KPI, ligne filtres, content area) — seuls les labels, KPI et contenu du tableau changent.

---

## Acceptance Criteria

- **AC1 — Layout global conforme.** Le `scrollContent` n'a **ni** `maxWidth` **ni** `alignSelf`. Le contenu s'étale sur `calc(100vw - 220px)` comme sur `/activites/presences`. Padding horizontal = `space.lg` (24px).

- **AC2 — `zIndex: 9999` sur `filtresRow`.** Les dropdowns `FiltresScope` passent au-dessus du tableau (tester en ouvrant Implantation/Groupe/Joueur).

- **AC3 — KPI cards conformes au template.** Les 4 cartes rendues par `StatCards` respectent :
  - Dimensions : `281×162` (flexibles, `minWidth: 240, maxWidth: 300, height: 162`)
  - Gap horizontal : `16px` (`space.md`)
  - Background `colors.light.surface`, radius `16` (`radius.card`), border `1px solid colors.border.divider`
  - Ombre `boxShadow: '0 1px 2px rgba(0,0,0,0.06)'` (avec `// @ts-ignore — web shadow`)
  - Contenu : picto+label (Montserrat 10/700 uppercase `colors.text.muted`, letterSpacing 1) / valeur (Montserrat 28/900 `colors.text.dark`) / caption (Geist 12/400 `colors.text.subtle`)
  - 1 carte peut être en état `highlight` (border `colors.accent.gold`)

- **AC4 — Filtres pills & segmented toggle conformes.** `FiltresScope` (pills radius `999`, gap `8`, active gold) et `PseudoFiltresTemporels` (border `#E5E7EB`, radius `6`, actif gold) respectent les specs §2 du template. Si valeurs hardcodées → remplacer par tokens.

- **AC5 — Tokens `@aureak/theme` uniquement.** `rg -n "#[0-9a-fA-F]{3,6}|fontFamily:\s*['\"]" aureak/apps/web/app/\(admin\)/activites/page.tsx aureak/apps/web/app/\(admin\)/activites/components/` retourne 0 match (hors `boxShadow` toléré).

- **AC6 — Commentaire obsolète retiré.** Plus de `// Story 65-1 — ...` en tête de `page.tsx`.

- **AC7 — Règles CLAUDE.md respectées.** Aucun `createClient` / `supabase.from(...)` direct (règle 1). Tout setter loading/saving dans `try/finally` (règle 3). Console guards `NODE_ENV !== 'production'` (règle 4). Checklist §3 CLAUDE.md exécutée sur fichiers modifiés.

- **AC8 — Parité visuelle.** Screenshot Playwright de `/activites` et `/activites/presences` à 1440×900, même header, même disposition KPI, même ligne filtres, même zone content. Aucune erreur console JS.

- **AC9 — Typecheck vert.** `cd aureak && npx tsc --noEmit` passe sans nouvelle erreur.

- **AC10 — Commit message.** `refactor(activites): align hub page on admin-page-template`

---

## Tasks

- [ ] **T1 — Audit précis des écarts.** Ouvrir `/activites` en local (http://localhost:8081/activites) + DevTools, comparer aux specs §2 du template. Lister les écarts réels (dimensions, couleurs, typos, spacings) dans un commentaire de PR.
- [ ] **T2 — Refactor `page.tsx`.** Supprimer `maxWidth`/`alignSelf`, ajouter `zIndex: 9999` à `filtresRow`, retirer commentaire Story 65-1, s'assurer que `paddingHorizontal: space.lg` est bien présent.
- [ ] **T3 — Refactor `StatCards.tsx`.** Aligner sur la spec KpiCard du template (dimensions, tokens, hiérarchie picto/label/valeur/caption). Supporter prop `highlight` si besoin produit.
- [ ] **T4 — Vérifier `FiltresScope.tsx` + `PseudoFiltresTemporels.tsx`.** Remplacer tout hex/px hardcodé par tokens. Ne PAS casser l'API publique (ces composants sont réutilisés par `/presences` et `/evaluations`).
- [ ] **T5 — Vérifier `TableauSeances.tsx`.** S'assurer que l'état vide suit le pattern template (`emptyTitle` + `emptyHint`, centré, `paddingVertical: 64`). Loading et data states cohérents.
- [ ] **T6 — QA post-edit (§3 CLAUDE.md).** Script grep sur fichiers modifiés. Fix tout BLOCKER.
- [ ] **T7 — Playwright.** Screenshot `/activites` @ 1440×900 → comparer visuellement à `/activites/presences`. Console messages = 0 erreur. 1 interaction (clic onglet présences → retour) sans erreur.
- [ ] **T8 — Typecheck + lint.** `cd aureak && npx tsc --noEmit`. Fix erreurs.
- [ ] **T9 — Commit + PR.** Branche dédiée, PR vers `main`.

---

## Notes

- **Ne PAS toucher** aux composants partagés (`FiltresScope`, `PseudoFiltresTemporels`) sans vérifier leur impact sur `/presences` et `/evaluations`. Toute modification doit être rétro-compatible.
- **Ne PAS modifier** `ActivitesHeader` — il est déjà cité comme source de vérité dans le template.
- **Ne PAS ajouter** de nouveau contenu, nouvelle KPI, nouveau filtre — c'est un alignement, pas une évolution produit.
- Si un écart entre la page et le template révèle que **le template est faux** (ex: specs extraites à la mauvaise résolution), **mettre à jour le template** plutôt que la page, et documenter dans la PR.
- Si `StatCards` expose déjà les bons visuels mais avec une API différente de la spec `KpiCard` du template → garder l'API actuelle, juste aligner les valeurs.

---

## Definition of Done

- [ ] Tous les AC ci-dessus cochés
- [ ] QA grep propre (0 BLOCKER, warnings documentés)
- [ ] Playwright screenshot archivé dans `_qa/reports/` ou joint à la PR
- [ ] PR ouverte, CI verte, review demandée
- [ ] Story status → `done` une fois mergée
