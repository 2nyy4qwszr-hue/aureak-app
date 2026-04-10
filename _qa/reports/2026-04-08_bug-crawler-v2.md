# Bug Crawler — 2026-04-08 (v2 — périmètre élargi)

> Analyse statique multi-fichiers post-sprint Epic 73/74.
> Périmètre élargi par rapport au rapport v1 du matin.

---

## Périmètre

Fichiers inspectés :
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx`
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
- `aureak/apps/web/app/(admin)/activites/page.tsx`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` (partiel)
- `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx`
- `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx`
- `aureak/packages/api-client/src/sessions/attendances.ts`
- `aureak/packages/api-client/src/sessions/presences.ts`
- `aureak/packages/api-client/src/admin/dashboard.ts`
- `aureak/packages/business-logic/src/groups/generateGroupName.ts`
- `aureak/packages/types/src/enums.ts` + `entities.ts`

Bugs connus dans summary.md (non re-signalés) :
- B-PATROL-01, B-PATROL-02, B-PATROL-03, B-CRAWLER-04, B-CRAWLER-06, B-DESIGN-02, B-BUG-C3

---

## CRITICAL (0)

Aucun.

---

## HIGH (3)

[HIGH] `completionStatus` jamais `'complete'` dans `listSessionsWithAttendance` — condition `s.status === 'fermée'` dead code — `aureak/packages/api-client/src/sessions/attendances.ts:94`

**Détail :** La logique `s.status === 'fermée' ? 'complete' : 'partial'` ne sera jamais vraie. Les statuts réels utilisés dans les migrations sont `'réalisée'` et `'terminée'` (confirmé dans 00064, 00100, 00116). Le statut `'fermée'` n'existe pas dans le schéma DB. Conséquence : `completionStatus` est systématiquement `'partial'` pour toutes les séances clôturées, jamais `'complete'`. La colonne ÉVALS COMPLÉTÉES de StatCards.tsx (qui utilise `completionStatus === 'complete'`) affiche toujours 0%.
**Fix :** `s.status === 'réalisée' || s.status === 'terminée' ? 'complete' : 'partial'`

---

[HIGH] Double guard `NODE_ENV` — console non émis en développement — `aureak/packages/api-client/src/admin/dashboard.ts:36-37, 82-83, 137-142, 352-353`

**Détail :** Plusieurs blocs ont une double condition imbriquée :
```typescript
if ((process.env.NODE_ENV as string) !== 'production')
  if ((process.env.NODE_ENV as string) !== 'production') console.error(...)
```
La condition intérieure est toujours vraie si la condition extérieure l'est, donc le `console.error` n'est pas silencieux en prod — mais le pattern est cassé syntaxiquement car la ligne du `console.error` n'est que dans le second `if`. Autrement dit, le `console.error` fonctionne correctement en pratique (jamais émis en prod), mais le code est trompeur et difficile à maintenir. Les occurrences : lignes 36-37, 82-83, 137-138, 141-142, 352-353.
**Fix :** Supprimer l'enveloppement externe redondant — garder un seul `if ((process.env.NODE_ENV as string) !== 'production') console.error(...)`.

---

[HIGH] `contact.tsx` — `setLoadingHistory` et `setSending` sans `try/finally` — `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx:26-45`

**Détail :**
- `loadHistory()` (ligne 26-31) : `setLoadingHistory(true)` sans bloc `try/finally`. Si `listAdminMessages` rejette, `setLoadingHistory(false)` n'est jamais appelé → spinner infini.
- `handleSend()` (ligne 35-46) : `setSending(true)` sans `try/finally`. Si `sendAdminMessage` rejette ou si `loadHistory()` appelé en ligne 43 échoue, `setSending(false)` n'est jamais appelé → bouton Envoyer bloqué définitivement.
**Fix :** Envelopper les deux fonctions dans `try/finally`.

---

## MEDIUM (2)

[MEDIUM] `generateGroupName.ts` — `GroupMethod` local incomplet et couleurs hardcodées — `aureak/packages/business-logic/src/groups/generateGroupName.ts:5,34-40`

**Détail :**
1. Le type `GroupMethod` local définit 5 valeurs (`Goal and Player | Technique | Situationnel | Performance | Décisionnel`) tandis que `@aureak/types/enums.ts` en définit 7 (manquent `Intégration` et `Perfectionnement`). Cette divergence crée une incohérence entre le business logic et les types officiels.
2. Les couleurs `METHOD_COLOR` sont hardcodées (`'#FFB800'`, `'#4FC3F7'`, etc.) au lieu d'utiliser `methodologyMethodColors` de `@aureak/theme` — violation de la règle "styles UNIQUEMENT via @aureak/theme tokens".
**Fix :** Supprimer le type `GroupMethod` local, importer depuis `@aureak/types`. Supprimer `METHOD_COLOR`, utiliser `methodologyMethodColors` depuis `@aureak/theme`.

---

[MEDIUM] `TableauSeances.tsx` — N+1 sur `listEvaluationsBySession` — `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx:276-289`

**Détail :** Pour chaque séance de la page (max 20), un appel `listEvaluationsBySession(s.sessionId)` est lancé en parallèle via `Promise.all`. Avec une limite de 200 séances chargées et pagination côté JS, les 200 séances déclenchent 200 appels simultanés à l'initialisation. En conditions normales (20 séances/page), c'est gérable, mais l'`useEffect` charge toutes les 200 séances en une fois. Ce pattern est un N+1 masqué.
**Note :** Non bloquant fonctionnellement, mais provoquera des ralentissements visibles avec beaucoup de données et saturera les connexions Supabase.

---

## PASS — Fichiers conformes

- `StatCards.tsx` — try/finally ✓ (lignes 79-94), console guard ✓ (ligne 90), pas de `as any` ✓
- `FiltresScope.tsx` — try/finally ✓ sur les 3 useEffect, console guards ✓, pas de catch silencieux ✓
- `activites/page.tsx` — composant orchestrateur pur, aucune logique async ✓
- `grade.tsx` — try/finally ✓ sur `load()` (ligne 28-43) et `handleAward` (ligne 47-73), console guards ✓
- `attendances.ts` — try/finally ✓ sur `recordAttendance`, `listAttendancesByChild`, `getGroupMembersRecentStreaks`, console guards ✓
- `presences.ts` — try/finally ✓ sur toutes les fonctions, console guards ✓, dead code W-CRAWLER-03 confirmé résolu (childIds est utilisé ligne 340)
- `dashboard.ts` — console guards présents (double-guarded mais fonctionnels en prod), pas de `as any` ✓

---

## Vérification bugs connus summary.md

| ID | Statut | Résultat vérification |
|----|--------|-----------------------|
| B-BUG-C3 | Toujours ouvert | Confirmé : `listAttendancesByChild` lignes 818-819 utilisent `.gte('sessions.scheduled_at', ...)` — filtre sur table jointe ignoré par PostgREST. Les données retournées ne sont pas filtrées par date. |
| B-DESIGN-02 | Toujours ouvert | Confirmé : `dashboard/page.tsx:2613` — `box-shadow: 0 4px 20px rgba(64,145,108,0.3)` hardcodé dans CSS injecté. |
| W-CRAWLER-03 | **RÉSOLU** | `childIds` utilisé ligne 340 de `presences.ts` — dead code n'existe plus. |
| W-CRAWLER-04 | Toujours ouvert | Dashboard.ts lignes 293-298 affichent `.message ?? error` — si `error` est un objet, le log affiche `[object Object]`. |

---

## Résumé final

- Nb CRITICAL : **0**
- Nb HIGH : **3**
- Top 3 bugs critiques :
  1. **[HIGH]** `completionStatus` jamais `'complete'` → colonne ÉVALS du dashboard activités toujours à 0% — `attendances.ts:94`
  2. **[HIGH]** `contact.tsx` — `setSending` / `setLoadingHistory` sans try/finally → states bloqués en cas d'erreur — `contact.tsx:26-45`
  3. **[HIGH]** Double guard NODE_ENV dans `dashboard.ts` — code trompeur (5 occurrences) — `dashboard.ts:36-37,82-83,137-142,352-353`
