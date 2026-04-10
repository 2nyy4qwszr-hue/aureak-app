# Bug Crawler — 2026-04-08 (post-epic 75 — mode statique)

> Analyse statique sur les fichiers modifiés par les stories 75.3, 75.5, 75.6 et le fix patrol.
> Playwright non utilisé — mode analyse code uniquement.
> Bugs connus dans `summary.md` non re-signalés : B-PATROL-01/02/03, B-CRAWLER-04/06, B-BUG-C3/C5/C6.

---

## Résumé

- Fichiers analysés : 12
- CRITICAL : 1
- HIGH : 2
- MEDIUM : 2
- LOW : 1

---

## Bugs détectés

### 🔴 CRITICAL — Vue `session_evaluations_merged` absente des migrations actives

**Page :** toutes les pages utilisant des évaluations (`/parent/children/[id]`, `/clubs/[id]/goalkeepers/[id]`, `/activites/evaluations`)
**Message probable :** `relation "session_evaluations_merged" does not exist` (PostgREST 404/400)
**Fichiers sources :**
- `aureak/packages/api-client/src/parent/childProfile.ts:28`
- `aureak/packages/api-client/src/club/clubData.ts:117`
- `aureak/packages/api-client/src/club/goalkeeperDetail.ts:60`
- `aureak/packages/api-client/src/evaluations/evaluations.ts:75,271`
- `aureak/packages/api-client/src/admin/playerProfile.ts:157`

**Détail :** La vue `session_evaluations_merged` n'existe dans aucun fichier SQL du dossier `supabase/migrations/` (le seul dossier actif). Elle est définie uniquement dans `aureak/supabase/_archive/migrations/00023_evaluations.sql`. Si la base de données locale est réinitialisée via `supabase db push`, la vue sera absente et toutes les requêtes échoueront avec une erreur PostgREST.

La vue est actuellement disponible en DB uniquement parce qu'elle a été appliquée historiquement avant la migration vers le nouveau dossier actif. Toute réinitialisation ou nouvel environnement (staging, CI) cassera le feature.

**Reproductible :** `supabase db reset` → `supabase db push` → naviguer vers `/parent/children/[id]` → erreur d'évaluations.

**Fix recommandé :** Créer la migration `00140_create_session_evaluations_merged_view.sql` reprenant la définition de la vue depuis `_archive/migrations/00023`.

---

### 🟠 HIGH — `evalMap` clé erronée : UUID vs date string

**Page :** `/parent/children/[childId]` (fiche enfant parent)
**Fichier :** `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx:186,290`
**Observation :** Les évaluations de séance ne s'affichent jamais dans la liste des présences de la fiche enfant.
**Détail :**
```typescript
// Ligne 186 — Map construite avec session_id (UUID)
const evalMap = new Map(evaluations.map(e => [e.session_id, e]))

// Ligne 290 — Lookup avec scheduled_at (date ISO string)
const ev = evalMap.get(att.sessions?.scheduled_at ?? '')
```
La clé de construction (`e.session_id`, type UUID) et la clé de lookup (`att.sessions?.scheduled_at`, type `string | undefined`) sont de types incompatibles — la lookup renvoie toujours `undefined`. Résultat : les signaux d'évaluation (réceptivité, effort, attitude, top séance) ne s'affichent jamais pour aucune séance dans la fiche enfant côté parent.

**Comparer avec** `parent/children/[childId]/sessions/index.tsx:108,115` où la Map est correctement construite et lookée par `sessions.id`.

**Fix :** Remplacer ligne 290 `evalMap.get(att.sessions?.scheduled_at ?? '')` par `evalMap.get((att.sessions as { id?: string })?.id ?? '')` — et adapter la structure `AttendanceRow` (ligne 12) pour inclure `id` dans le sous-type `sessions`.

---

### 🟠 HIGH — `'performance'` absent du sélecteur de type pédagogique dans la modale génération séances

**Page :** `/seances` → modale "Générer les séances"
**Fichier :** `aureak/apps/web/app/(admin)/seances/page.tsx:188`
**Observation :** Le type pédagogique `'performance'` (ajouté dans les enums par les stories 75.x + migration 00139) ne peut pas être sélectionné lors de la génération de séances planifiées.
**Détail :** Le tableau inline des types disponibles dans la modale est hardcodé :
```typescript
(['goal_and_player','technique','situationnel','decisionnel','perfectionnement','integration','equipe'] as const)
```
Il manque `'performance'` qui a pourtant été ajouté dans `SESSION_TYPES` (`@aureak/types/enums.ts`) et dans `TYPE_COLOR` (constants). La nouvelle méthode est donc invisible pour l'admin lors de la planification.

**Fix :** Ajouter `'performance'` dans le tableau, ou mieux — remplacer le tableau hardcodé par `SESSION_TYPES.filter(t => t !== 'equipe')`.

---

### 🟡 MEDIUM — `childId` non-guardé avant l'appel API dans `QuizPage`

**Page :** `/parent/children/[childId]/quiz`
**Fichier :** `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx:105,121`
**Observation :** Warning noté dans QA summary story 75.6 — confirmé ici.
**Détail :** `childId` est extrait via `useLocalSearchParams` et peut être `undefined` au premier render si le param n'est pas encore résolu par Expo Router. L'appel `getLastSessionQuiz(childId)` à la ligne 121 est déclenché immédiatement dans le `useEffect` sans guard. Si `childId` est `undefined`, l'appel est fait avec `undefined` comme paramètre, ce qui génère une requête SQL invalide.
```typescript
const { childId } = useLocalSearchParams<{ childId: string }>()
// ...
const data = await getLastSessionQuiz(childId) // childId peut être undefined
```
**Fix :** Ajouter `if (!childId) return` avant l'appel, et adapter la dépendance du `useEffect`.

---

### 🟡 MEDIUM — `METHOD_COLOR` hardcodé dans `generateGroupName.ts` (étendu avec `'Performance'`)

**Fichier :** `aureak/packages/business-logic/src/groups/generateGroupName.ts:34-40`
**Observation :** Warning W-CRAWLER-07 pré-existant — étendu par la story 75.x qui ajoute `'Performance': '#26A69A'`.
**Détail :** La constante `METHOD_COLOR` continue d'utiliser des couleurs hex hardcodées (`#FFB800`, `#4FC3F7`, `#66BB6A`, `#CE93D8`, `#26A69A`) au lieu des tokens `@aureak/theme`. Le design system impose l'utilisation des tokens uniquement.
**Fix :** Migrer `METHOD_COLOR` vers les tokens `@aureak/theme` (créer `colors.method.*` tokens si nécessaires, ou utiliser les tokens existants les plus proches).

---

### 🔵 LOW — `GROUP_METHODS` dans `generateGroupName.ts` non synchronisé avec `MethodologyMethod`

**Fichier :** `aureak/packages/business-logic/src/groups/generateGroupName.ts:7-13`
**Détail :** `GROUP_METHODS` local n'inclut pas `'Intégration'` et `'Perfectionnement'` qui existent dans `MethodologyMethod` (`@aureak/types/enums.ts`). Le type local `GroupMethod` a été étendu avec `'Performance'` mais reste incomplet. La duplication de ce type local (au lieu d'importer `GroupMethod` depuis `@aureak/types`) est une dette technique.

---

## Pages sans erreur détectée (analyse statique)

- `aureak/packages/api-client/src/child/childQuiz.ts` — try/catch + console guards corrects
- `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` — try/finally loading correct, console guards présents
- `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx` — try/finally loading + saving corrects
- `aureak/apps/web/app/(admin)/presences/page.tsx` — try/finally sur toutes les mutations, modale conversion correcte
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — try/finally corrects, console guards présents
- `aureak/packages/api-client/src/learning/learning.ts` — structure correcte

---

## Recommandations par priorité

1. **[CRITIQUE — avant toute réinitialisation DB]** Créer `supabase/migrations/00140_create_session_evaluations_merged_view.sql` avec la définition de la vue.
2. **[HIGH — régression parent]** Corriger `evalMap.get(att.sessions?.scheduled_at)` → `evalMap.get(att.sessions?.id)` dans `parent/children/[childId]/index.tsx`.
3. **[HIGH — feature incomplète]** Ajouter `'performance'` dans le sélecteur de la modale `GenerateModal` dans `seances/page.tsx`.
4. **[MEDIUM]** Ajouter guard `if (!childId) return` dans `quiz/page.tsx`.
5. **[MEDIUM/WARNING]** Migrer `METHOD_COLOR` vers tokens `@aureak/theme` dans `generateGroupName.ts`.
