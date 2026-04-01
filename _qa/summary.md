# QA Summary — Aureak

> Mis à jour manuellement par le développeur. 30 secondes par story.
> Ne pas déléguer à un agent — tu es la seule source fiable ici.

**Dernière mise à jour** : 2026-04-01

---

## Stories — État des Gates

| Story | Gate 1 | Gate 2 | Warnings ouverts | En prod? |
|-------|--------|--------|------------------|---------|
| GLOBAL-SCAN 2026-04-01 (scan 4) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 5) | ✅ PASS | ✅ PASS | 0 | Non |
| GLOBAL-SCAN 2026-04-01 (scan 6) | ✅ PASS | ✅ PASS | 0 | Non |

`✅ PASS` `❌ BLOCKED` `⏳ EN COURS` `—` N/A

> Scan 4 : B-25 + W-14→W-21 — tous résolus (commit 9cd1c87)
> Scan 5 : W-22→W-25 — tous résolus (commit 249edb6)
> Scan 6 : W-26→W-29 — tous résolus (commit 87341be)

---

## BLOCKERs Ouverts

_Aucun._

---

## Warnings Ouverts (deadline : avant Gate 2)

_Aucun._

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
