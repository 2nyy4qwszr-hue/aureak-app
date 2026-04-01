# QA Summary — Aureak

> Mis à jour manuellement par le développeur. 30 secondes par story.
> Ne pas déléguer à un agent — tu es la seule source fiable ici.

**Dernière mise à jour** : 2026-04-01

---

## Stories — État des Gates

| Story | Gate 1 | Gate 2 | Warnings ouverts | En prod? |
|-------|--------|--------|------------------|---------|
| GLOBAL-SCAN 2026-04-01 (scan 1) | ❌ BLOCKED | ❌ BLOCKED | 0 (tous résolus) | Non |
| GLOBAL-SCAN 2026-04-01 (scan 2) | ❌ BLOCKED | ❌ BLOCKED | 3 | Non |

`✅ PASS` `❌ BLOCKED` `⏳ EN COURS` `—` N/A

> Rapport complet : `_qa/reports/2026-04-01_global_bugs.md`
> — Scan 1 : 15 P0 blockers, 7 P1 warnings → tous corrigés
> — Scan 2 : 4 nouveaux P0 blockers ARCH-1 (hors-scope initial), 3 P1 warnings

---

## Warnings Ouverts (non corrigés)

> Rappel : warning du Gate 1 non traité = BLOCKER automatique au Gate 2.

| Story | Warning | Fichier:ligne | Deadline correction |
|-------|---------|---------------|---------------------|
| GLOBAL scan 2 | W-08 : null non gardé getDashboardKpiCounts | dashboard/page.tsx:244 | Avant Gate 2 |
| GLOBAL scan 2 | W-09 : error ignorée + ARCH-1 fallback login | login.tsx:100 | Avant Gate 2 |
| GLOBAL scan 2 | W-10 : null non gardé anomalyResult.data | dashboard/page.tsx:219 | Avant Gate 2 |

---

## BLOCKERs Ouverts (scan 2 — à corriger avant tout déploiement)

| ID | Fichier | Description | Effort |
|----|---------|-------------|--------|
| B-16 | child/dashboard/index.tsx | ARCH-1 : 3 × supabase.from() direct | Faible |
| B-17 | coach/sessions/[sessionId]/notes/index.tsx | ARCH-1 : 3 × supabase.from() direct + TODO orphelin | Faible |
| B-18 | parent/notifications/index.tsx | ARCH-1 : 3 × supabase.from() direct | Moyen |
| B-19 | parent/children/[childId]/progress/index.tsx | ARCH-1 : supabase.from('profiles') — getProfileDisplayName() existe déjà | Très faible |

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
