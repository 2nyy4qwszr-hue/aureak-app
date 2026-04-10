# Bug Crawler — 2026-04-08 (v4 — analyse statique post-epic75 + ajout Performance)

## Résumé

- Méthode : analyse statique — APP_STATUS=000 (app non démarrée), PLAYWRIGHT_STATUS=unavailable
- Fichiers analysés : 80+ fichiers tsx/ts dans `apps/web/(admin)`, `packages/api-client`, `packages/types`, `packages/ui`, `packages/theme`, `packages/business-logic`
- TypeScript : `npx tsc --noEmit` → EXIT:0 (aucune erreur de compilation)
- CRITICAL : 0
- HIGH : 3
- MEDIUM : 2
- LOW : 1

---

## Bugs détectés

### 🟠 HIGH — `TYPE_COLOR` manque la clé `'performance'` — sessions sans couleur dans SessionCard et MonthView

**Page :** `/(admin)/seances` (liste + calendrier mensuel)
**Fichier source :** `aureak/apps/web/app/(admin)/seances/_components/constants.ts` ligne 7–14
**Message :** aucune erreur runtime — dégradé silencieux (`TYPE_COLOR['performance']` retourne `undefined` → fallback gold)
**Cause :** La constante `TYPE_COLOR` liste 7 types de session mais omet `performance` qui a été ajouté dans `enums.ts` + `tokens.ts`. L'objet est `Record<string, string>` donc pas d'erreur TS, mais toute session de type `'performance'` affiche la couleur gold générique au lieu de `methodologyMethodColors['Performance']` (`#26A69A` teal).
**Reproductible :** Créer ou visualiser une session avec `session_type = 'performance'` — la chip/bord SessionCard et la cellule MonthView apparaissent gold au lieu de teal.
**Impact :** Incohérence visuelle — la nouvelle méthode "Performance" est indistinguable du fallback gold.
**Fix :** Ajouter `performance: methodologyMethodColors['Performance'],` dans `constants.ts` avant `equipe`.

---

### 🟠 HIGH — `methodColor()` dans `dashboard/seances/page.tsx` manque `'performance'`

**Page :** `/(admin)/dashboard/seances`
**Fichier source :** `aureak/apps/web/app/(admin)/dashboard/seances/page.tsx` ligne 67–76
**Cause :** Le `typeMap` local dans la fonction `methodColor()` mappe les `SessionType` snake_case vers les clés de `methodologyMethodColors`. La clé `'performance'` est absente — toute séance de type `'performance'` retourne `colors.text.muted` (gris).
**Reproductible :** Naviguer vers `/dashboard/seances` — si des séances de type `performance` existent, leur couleur sera grise.
**Impact :** Dégradé visuel silencieux sur la page Dashboard > Séances.
**Fix :** Ajouter `performance : 'Performance',` dans le `typeMap` de la fonction `methodColor`.

---

### 🟠 HIGH — `evalMap.get(scheduled_at)` clé incorrecte — évaluations jamais affichées (connu, toujours ouvert)

**Page :** `/(parent)/parent/children/[childId]`
**Fichier source :** `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` ligne 186 + 290
**Cause :** `evalMap` est construit avec `session_id` comme clé (ligne 186), mais l'accès utilise `att.sessions?.scheduled_at` (ligne 290) — une string date ISO au lieu d'un UUID. La Map retourne toujours `undefined` → aucune évaluation n'est jamais affichée dans la fiche enfant parent.
**Reproductible :** Toujours — ouvrir la fiche d'un enfant en tant que parent → section présences sans évaluations même si des évaluations existent.
**Fix :** `evalMap.get(att.session_id ?? '')` — utiliser `att.session_id` (clé correcte).
**ID registre :** B-BUG-C8 (déjà dans `_qa/summary.md`)

---

### 🟡 MEDIUM — `'performance'` absent du sélecteur de type dans le générateur de séances en masse (connu, toujours ouvert)

**Page :** `/(admin)/seances`
**Fichier source :** `aureak/apps/web/app/(admin)/seances/page.tsx` ligne 188
**Cause :** Le tableau inline `['goal_and_player','technique','situationnel','decisionnel','perfectionnement','integration','equipe']` ne contient pas `'performance'` — il est impossible de générer des séances de type Performance via la modale de génération.
**Impact :** Fonctionnalité partiellement bloquée — le type Performance existe dans la DB et les types TS mais n'est pas sélectionnable.
**Fix :** Ajouter `'performance'` dans le tableau (après `'situationnel'`).
**ID registre :** B-BUG-C9 (déjà dans `_qa/summary.md`)

---

### 🟡 MEDIUM — `W-CRAWLER-07` toujours ouvert — `METHOD_COLOR` hardcodé dans `business-logic`

**Page :** `/(admin)/groups`, `/(admin)/implantations`
**Fichier source :** `aureak/packages/business-logic/src/groups/generateGroupName.ts` ligne 34–42
**Cause :** `METHOD_COLOR` en `business-logic` duplique les couleurs de `@aureak/theme/tokens.ts`. Bien que `Performance` ait été ajouté (couleur correcte `#26A69A`), le fichier reste une source de vérité parallèle qui diverge de `methodologyMethodColors`. La règle ARCH-10 dit que les hex ne doivent exister qu'une seule fois dans tokens.ts.
**Impact :** Risque de divergence future — aucune erreur visible actuellement.
**Fix :** Remplacer `METHOD_COLOR` local par une référence à `methodologyMethodColors` depuis `@aureak/theme`.
**ID registre :** W-CRAWLER-07 (déjà dans `_qa/summary.md`)

---

### 🔵 LOW — `console.log` non guardé (faux positif — correctement guardé)

Aucun `console.log` non guardé détecté.
`aureak/apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx:136` — correctement precédé de `if (process.env.NODE_ENV !== 'production')`.

---

## Pages sans erreur (static analysis) ✅

- `/(admin)/attendance` — try/finally OK
- `/(admin)/dashboard/page.tsx` — try/finally OK, load() awaité correctement (story 72-10 appliquée)
- `/(admin)/coaches/[coachId]/contact.tsx` — setSending/setLoadingHistory dans finally (B-BUG-C5 résolu)
- `/(admin)/coaches/[coachId]/grade.tsx` — try/finally OK
- `/(admin)/stages/index.tsx` — try/finally OK
- `/(admin)/methodologie/seances/index.tsx` — try/finally + delete pattern OK
- `/(admin)/quiz/page.tsx` (parent) — try/finally OK, console guardé
- `aureak/packages/api-client/src/admin/dashboard.ts` — tous console.error guardés NODE_ENV

---

## Recommandations

1. **[HIGH — immédiat]** Ajouter `performance: methodologyMethodColors['Performance']` dans `seances/_components/constants.ts` — 1 ligne, zéro risque de régression.
2. **[HIGH — immédiat]** Ajouter `performance : 'Performance'` dans le `typeMap` de `dashboard/seances/page.tsx` — 1 ligne.
3. **[HIGH — priorité élevée]** Corriger `evalMap.get(att.session_id)` dans `parent/children/[childId]/index.tsx:290` — bug fonctionnel bloquant l'affichage des évaluations.
4. **[MEDIUM]** Ajouter `'performance'` dans le sélecteur de type de la modale de génération `seances/page.tsx:188`.
5. **[MEDIUM]** Unifier `METHOD_COLOR` dans `generateGroupName.ts` vers `@aureak/theme` (ARCH-10).
