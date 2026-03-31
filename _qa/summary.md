# QA Summary — Aureak

> Mis à jour manuellement par le développeur. 30 secondes par story.
> Ne pas déléguer à un agent — tu es la seule source fiable ici.

**Dernière mise à jour** : 2026-04-01

---

## Stories — État des Gates

| Story | Gate 1 | Gate 2 | Warnings ouverts | En prod? |
|-------|--------|--------|------------------|---------|
| GLOBAL-SCAN 2026-04-01 | ❌ BLOCKED | ❌ BLOCKED | 7 | Non |

`✅ PASS` `❌ BLOCKED` `⏳ EN COURS` `—` N/A

> Rapport complet : `_qa/reports/2026-04-01_global_bugs.md` — 15 P0 blockers, 7 P1 warnings

---

## Warnings Ouverts (non corrigés)

> Rappel : warning du Gate 1 non traité = BLOCKER automatique au Gate 2.

| Story | Warning | Fichier:ligne | Deadline correction |
|-------|---------|---------------|---------------------|
| GLOBAL | W-01 : null non gardé setExceptions | seances/page.tsx:114 | Avant Gate 2 |
| GLOBAL | W-02 : error ignorée listMethodologyThemes | methodology.ts:96 | Avant Gate 2 |
| GLOBAL | W-03 : saveOne/saveAll sans try/catch | coach/evaluations/index.tsx | Avant Gate 2 |
| GLOBAL | W-04 : stale closure wsConnected | useSessionValidation.ts | Story suivante |
| GLOBAL | W-05 : handleAnswer sans try/catch | child/quiz/[themeId]/index.tsx | Story suivante |
| GLOBAL | W-06 : result.data non null-gardé | partnerships/index.tsx:33 | Avant Gate 2 |
| GLOBAL | W-07 : DELETE physique school-calendar à vérifier | school-calendar/page.tsx:67 | À évaluer |

---

## Procédure de mise à jour (30 secondes)

**Après Gate 1** :
1. Ajouter la story dans le tableau avec `⏳` en Gate 1
2. Si warnings : ajouter une ligne dans Warnings Ouverts
3. Passer Gate 1 à `✅` ou `❌`

**Après Gate 2** :
1. Mettre à jour Gate 2 à `✅` ou `❌`
2. Marquer les warnings résolus (supprimer la ligne)
3. Cocher "En prod?" quand déployé

---

## Rapports disponibles

> Listés automatiquement dans `_qa/reports/` — pas besoin de les répertorier ici.
