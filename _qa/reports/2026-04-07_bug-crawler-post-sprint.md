# Bug Crawler — Post-Sprint 2026-04-07

**Fichiers analysés :**
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx`
- `aureak/packages/api-client/src/sessions/attendances.ts`
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` (fichier introuvable — non créé)

---

## 🔴 CRITICAL / HIGH

### C1 — `setLoading(true)` sans `finally` dans PresencesPage — vue groupe (presences/page.tsx:1119)
Le `useEffect` du chargement membres+attendances (scope `groupe`) appelle `setLoading(true)` avant le try, mais le `finally` est présent. **CEPENDANT** : c'est le même flag `loading` que l'effet sessions (ligne 1049). Les deux effets partagent le même state `loading`. Si l'effet sessions se déclenche pendant que celui du groupe tourne, le `setLoading(false)` du premier écrase celui du second, causant un état loading incohérent (spinner disparu avant fin de chargement groupe). **Race condition réelle si `scope` change pendant le chargement.**

### C2 — `load()` du dashboard appelé sans `await` dans les handlers (dashboard/page.tsx:2279, 2285)
`handlePresetChange` et `handleApplyCustom` appellent `load(f, t)` sans `await`. La fonction `load` est async. Si l'utilisateur clique plusieurs fois rapidement, plusieurs appels concurrents tournent en parallèle — les `setStats`, `setAnomalies`, etc. s'exécutent dans un ordre non déterministe. **Double-soumission possible → état final imprévisible.**

### C3 — `listAttendancesByChild` filtre via `gte/lte` sur table jointe (attendances.ts:818–819)
PostgREST ne supporte pas les filtres sur colonnes de tables jointes via `.gte('sessions.scheduled_at', ...)`. Ces filtres sont silencieusement ignorés — la requête retourne TOUTES les présences du joueur sans filtre de date, puis le tri JS s'applique sur un dataset complet. Sur un joueur actif depuis plusieurs années, cela peut retourner 500+ lignes inutilement, sans pagination côté serveur. **Edge case volume : données non bornées.**

### C4 — `data[0]` dans `checkAcademyMilestones` sans vérification `data.length` (dashboard/page.tsx:2439)
`data[0]` est accédé sur le tableau retourné. La condition `data.length > 0` est bien présente mais `data[0]` TypeScript type est `AcademyMilestone | undefined`. Si la réponse API retourne un tableau vide malgré `data.length > 0` (cas théorique d'un bug API), un crash silencieux se produirait. Risque faible mais pattern à surveiller.

---

## 🟠 MEDIUM

### M1 — `StatCards.tsx` non créé mais référencé (activites/components/)
Le ticket demandait l'analyse de `StatCards.tsx` mais ce fichier n'existe pas à l'emplacement attendu. Le composant `StatCardsPresences` est défini inline dans `presences/page.tsx`. Si une story future extrait ce composant, un import cassé est possible. **Cohérence d'architecture à surveiller.**

### M2 — `listEvaluationsAdmin` : erreur Supabase non propagée en UI (evaluations/page.tsx:207)
`const { data } = await listEvaluationsAdmin(from, to)` — si `data` est null (erreur Supabase upstream), `(data ?? [])` produit silencieusement un tableau vide. Aucun feedback utilisateur n'est affiché (pas de `error` state visible). L'utilisateur voit une page vide sans indication d'erreur réseau.

### M3 — `listSessionsWithAttendance` limite hardcodée à 200 (attendances.ts:47)
`.limit(200)` côté API. Sans filtre de date actif (la fonction accepte `params.from?`), un `listSessionsWithAttendance()` sans arguments retourne les 200 dernières séances. `TableauSeances` l'appelle sans paramètres de date — avec une académie active depuis 2 ans, certaines séances récentes peuvent être exclues silencieusement.

### M4 — Race condition `useEffect` groupe dépend de `sessions` (presences/page.tsx:1141)
Le 3ème `useEffect` a comme dépendances `[scope, sessions]`. Quand `scope` change vers `groupe`, deux effets se déclenchent quasi-simultanément : l'effet sessions (qui met à jour `sessions`) et l'effet groupe (qui lit `sessions`). Si l'effet groupe s'exécute avant que les nouvelles sessions soient chargées, `sessions.slice(0, 5)` retourne les sessions du scope précédent.

### M5 — `Promise.all` non limité pour l'enrichissement séances (TableauSeances.tsx:266)
`await Promise.all(sessData.map(...))` lance autant de requêtes parallèles qu'il y a de séances (jusqu'à 200). Chaque séance déclenche 1 appel `listEvaluationsBySession` + 1 appel `listActiveAbsenceAlerts`. Soit potentiellement 400 requêtes simultanées. Peut saturer le connection pool Supabase et déclencher des rate limits.

### M6 — `WeatherWidget` : `setLoadingWeather(false)` non garanti si cache hit (dashboard/page.tsx:1473)
Dans la fonction `load()`, si le cache est valide : `setWeather(cached); return` — le `finally` n'est pas dans un try/finally explicite, le bloc async IIFE se termine directement. Le `setLoadingWeather(false)` dans le `finally` ne s'exécute pas car le `return` prématuré court-circuite le finally. Le spinner reste actif indéfiniment si le cache est présent.

---

## 🟡 LOW / INFO

### L1 — `colors.text.primary` utilisé comme couleur "blanc" sur fond dark (presences/page.tsx:278)
`badgeRedText: { color: colors.text.primary }` dans `cardStyles` — `text.primary` est typiquement la couleur de texte principale (peut être sombre). Si le design system évolue, ce texte sur fond rouge pourrait devenir illisible. Préférer `colors.text.onDark` ou `#FFFFFF` explicite.

### L2 — `boxShadow` dans StyleSheet (presences/page.tsx:927, 969)
`vueJoueurStyles` contient `boxShadow: shadows.sm` directement dans `StyleSheet.create()`. Ce n'est pas une propriété RN valide — seul fonctionne sur web grâce à Expo Router DOM. Peut causer des warnings en mode mobile (si jamais rendu sur native). Pattern déjà documenté avec `@ts-ignore` ailleurs mais non protégé ici.

### L3 — `playerSummaryCard` borderRadius hardcodé (evaluations/page.tsx:847)
`borderRadius: 16` inline dans un style — valeur non tokenisée. Mineur mais contredit la règle "styles via tokens uniquement".

### L4 — `listSessionEvents` : filtre `session_id` côté JS, pas SQL (attendances.ts:544–550)
La fonction récupère TOUS les events de type `attendance` puis filtre côté client. Sur une académie active, `event_log` peut contenir des milliers de lignes. Le filtre `payload->>'session_id'` devrait être en SQL : `.filter('payload->>session_id', 'eq', sessionId)`.

### L5 — Commentaire TODO bloquant dans `getImplantStatus` (dashboard/page.tsx:111)
`// TODO: coaches_count, absences_count, terrain_available à étendre` — les champs `coaches_count` et `absences_count` sont toujours `undefined`, forçant les valeurs par défaut `?? 1` et `?? 0`. Le statut d'implantation sera toujours `ok` ou `warning` (jamais `ko` via coachs), ce qui fausse l'indicateur opérationnel.

---

## ✅ CLEAN

- **try/finally** : tous les state setters de chargement principaux ont leur `finally` (sauf cas notés ci-dessus).
- **Console guards** : `process.env.NODE_ENV !== 'production'` systématiquement présent sur tous les `console.error` analysés.
- **Catch silencieux** : aucun `catch(() => {})` nu — tous les catch loggent en dev ou ont un comportement de fallback documenté.
- **Couleurs hardcodées** : seul `borderRadius: 16` (L3) — aucun `#hex` inline détecté dans les fichiers analysés.
- **Accès Supabase direct** : zéro accès direct dans `apps/` — tout passe par `@aureak/api-client`. Conforme ARCH-1.
- **Erreurs Supabase** : les fonctions API vérifient systématiquement `error` avant de retourner les données.
- `listSessionsWithAttendance` : optional chaining correct sur toutes les relations jointes (`s.groups?.name`, etc.).
- `TableauSeances` : pagination correcte, `enriched` calculé via `useMemo`, pas de mutation d'état inline.

---

## Warnings non résolus des agents précédents

| Agent | Warning | Résolu ? | Action requise |
|-------|---------|----------|----------------|
| — | Aucun rapport précédent disponible pour ce périmètre | — | Premier scan post-sprint |

---

## Verdict Final Post-Sprint 2026-04-07

Gate 1 (bloquants ARCH) : ✅ PASS — aucune violation d'accès direct Supabase, console guards OK
Gate 2 (qualité production) : ⚠️ CONDITIONNEL — C1, C2, C3 à corriger avant deploy

**Corrections requises avant production :**
1. **C2** — Protéger `load()` contre les appels concurrents dans les handlers (flag `isLoading` ou annulation AbortController)
2. **C3** — Déplacer le filtre de date `listAttendancesByChild` en SQL (`.gte('scheduled_at', ...)` sur la table sessions dans la requête jointe) ou ajouter pagination
3. **C1** — Séparer les flags `loading` sessions et `loading` membres dans `PresencesPage`

Warnings actifs : 5 (M1–M6, L1–L5 listés ci-dessus)

Recommandation : **CORRECTIONS REQUISES** sur C1–C3 avant deploy en production.
