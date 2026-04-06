# Bug Hunter — Story 63.2
Date : 2026-04-06
Story : `story-63-2-evenements-unifies-vue-filtree.md`
Fichiers analysés :
- `aureak/apps/web/app/(admin)/evenements/page.tsx`
- `aureak/packages/api-client/src/admin/stages.ts`
- `aureak/packages/api-client/src/academy/academyStatus.ts`
- `aureak/packages/types/src/enums.ts`
- `aureak/packages/types/src/entities.ts`

---

## STOP — 5 points critiques

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 1 | `.data.field` sans optional chaining | ✅ PASS | `listEvents()` utilise `(data ?? []).map(...)` — pas d'accès direct sur `data.field`. `getStage()` utilise `(data as Record<string, unknown>)` avec cast — pas de `.field` direct non chaîné. |
| 2 | Double-soumission possible | ✅ PASS | Le bouton "Nouvel évènement" ouvre un modal, pas de mutation API. Le bouton "Continuer" du modal est `disabled={!selected}`. Pas de route de double-submit. |
| 3 | try/catch silencieux | ✅ PASS | `catch(err)` : console.error guardé + `setError(message)` — feedback utilisateur présent |
| 4 | Erreur Supabase ignorée | ✅ PASS | `const { data, error } = await q; if (error) throw error` — pattern correct dans `listEvents()` et `listStages()` |
| 5 | Mutation sans invalidation | N/A | Pas de TanStack Query dans cette page — `useState` + `useCallback` direct |

---

## Analyse complète

### Null / Undefined non gérés

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 1 | Retour API `null`/`undefined` | ✅ | `listEvents()` retourne `(data ?? []).map(...)` — jamais `null`. |
| 2 | Accès objets `undefined` | ✅ | `event.implantationName` est protégé par `&&` (ligne 87). `event.eventType` a le fallback `?? 'stage'` dans `mapStage()`. |
| 3 | Arrays vides — `[0]` | ✅ | Pas d'accès par index `[0]` sur les données événements. |
| 4 | Paramètres de route `undefined` | ✅ | `useLocalSearchParams<{ type?: string }>()` — `type` est optionnel. La validation `(EVENT_TYPES as readonly string[]).includes(params.type)` évite les valeurs inconnues. `activeType` tombe sur `null` si type invalide. |
| 5 | `.data` Supabase peut être `null` | ✅ | `const { data, error } = await q; if (error) throw error; return (data ?? [])` — géré. |

### Race conditions et état asynchrone

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 6 | Composant démonté pendant `await` | ⚠️ WARNING | `load()` dans `useCallback` + `useEffect` — si la page se démonte pendant le chargement, `setEvents`, `setError`, `setLoading` seront appelés sur un composant démonté. React 18 supprime le warning "can't perform a state update on an unmounted component" mais c'est un pattern à nettoyer. Risque réel faible (navigation rapide). |
| 7 | Double-soumission formulaire | ✅ | Pas de formulaire de mutation. |
| 8 | Optimistic update non annulée | N/A | Pas d'optimistic update. |
| 9 | TanStack Query invalidation | N/A | Pas de TanStack Query. |
| 10 | Zustand non réinitialisé | N/A | Pas de store Zustand dans cette page. |

### Gestion des erreurs

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 11 | try/catch silencieux | ✅ | `console.error` guardé + `setError` — voir STOP |
| 12 | Erreurs Supabase non vérifiées | ✅ | `if (error) throw error` dans `listEvents()` |
| 13 | Edge Functions statuts non-200 | N/A | Pas d'Edge Function dans ce flow |
| 14 | Erreurs Zod remontées | N/A | Pas de validation Zod sur cette page |

### Edge cases métier

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 15 | Joueur sans club associé | N/A | Page événements, pas de joueur |
| 16 | Saison non définie | N/A | Les stages ne sont pas filtrés par saison sur cette page |
| 17 | Parent avec plusieurs enfants | N/A | Page admin uniquement |
| 18 | Données dans ordre inattendu | ✅ | `listEvents()` utilise `.order('start_date', { ascending: false })` — tri stable |
| 19 | Refresh au milieu d'opération | ✅ | L'URL query param `?type=` est lu à chaque chargement via `useLocalSearchParams` — le filtre est restauré après refresh. |

### Limites et volumes

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 20 | Listes sans pagination | ⚠️ WARNING | `listEvents()` n'a pas de `.limit()` ni pagination. Si les stages sont nombreux (100+), tout sera chargé et rendu en DOM. Acceptable à court terme (l'académie n'a pas encore de volumes critiques), mais à anticiper. |
| 21 | Limites champs texte | N/A | Pas de formulaire de création sur cette page |
| 22 | Uploads taille vérifiée | N/A | Pas d'upload |

### Permissions et accès

| # | Check | Résultat | Détail |
|---|-------|----------|--------|
| 23 | Route admin protégée | ✅ | La route est sous `(admin)/` — le layout admin gère l'authentification. RLS Supabase filtre par `tenant_id`. |
| 24 | Fuite données autre tenant | ✅ | RLS existant sur `stages` — `tenant_id` filtre automatiquement. `listEvents()` ne bypasse pas RLS. |

### Bug spécifique identifié — `STATUS_COLORS` et `StageStatus`

| Sévérité | Description | Localisation |
|----------|-------------|--------------|
| ⚠️ WARNING | `STATUS_COLORS` est un `Record<StageStatus, string>` avec 4 valeurs (`planifié`, `en_cours`, `terminé`, `annulé`). Si la DB retourne un statut inattendu (données corrompues ou nouvelle valeur d'enum non mirrée), `STATUS_COLORS[event.status]` retourne `undefined`, et `color + '20'` donne `'undefined20'` — couleur invalide. Pas de fallback. | `page.tsx:27-32` et `page.tsx:58` |

**Impact** : Visuel uniquement — la card s'affiche sans couleur de statut. Non bloquant (les valeurs DB sont contraintes par l'enum PostgreSQL).

---

## Warnings non résolus des agents précédents

| Agent | Warning | Résolu? | Action requise |
|-------|---------|---------|----------------|
| Gate 1 code-review | `StatusBadge` styles inline hardcodés (`paddingHorizontal: 9`, `borderRadius: 20`, suffixe `'20'` au lieu de `'1f'`) | ❌ | Refactoring style dans prochaine itération |
| Gate 1 code-review | Multiples `fontSize`, `paddingHorizontal`, `gap` hardcodés (layout tokens manquants) | ❌ | Dette de style — traiter dans story dédiée |
| Gate 1 code-review | `academyStatus.ts` contient une `listStages()` interne non exportée avec signature différente | ❌ | Renommage en `listAcademyStages()` — dette technique lisibilité |
| Gate 1 code-review | AC6 stub affiché sur page au lieu du modal | ❌ | UX acceptabl — comportement documenté, envisager amelioration future |
| UX Auditor Gate 2 | Composants locaux (`StatusBadge`, `EventTypePill`) au lieu de `@aureak/ui` | ❌ | Cohérence design system à terme |
| UX Auditor Gate 2 | `Pressable` sans `accessibilityRole`/`accessibilityLabel` | ❌ | Accessibilité — story dédiée |
| UX Auditor Gate 2 | Pas de pagination sur `listEvents()` | ❌ | Performance — à anticiper si volume > 50 events |
| Design Critic Gate 2 | `borderRadius: 10` au lieu de `radius.card` (16) pour `EventCard` | ❌ | Cohérence design |

---

## Verdict Final Story 63.2

Gate 1 : ✅ PASS (1 BLOCKER corrigé automatiquement — `mapStage` fallback `'draft'` → `'planifié'`)
Gate 2 : ✅ PASS
Warnings actifs : 8 (tous non bloquants — style, accessibilité, pagination future)

**Bugs réels bloquants** : 0
**Régressions certaines** : 0
**Régressions possibles** : 0

Recommandation : **PRÊT POUR PRODUCTION**

Les 8 warnings sont des dettes de style et d'accessibilité à traiter dans une story dédiée (style tokens, `@aureak/ui` alignment, pagination) — aucun ne bloque le merge ni l'usage en production.
