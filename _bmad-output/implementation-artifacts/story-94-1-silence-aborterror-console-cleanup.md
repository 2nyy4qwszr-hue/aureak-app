# Story 94.1 — Cleanup console : silencer les AbortError Lock auth Supabase partout

Status: done

## Metadata

- **Epic** : 94 — Cleanup tech (réduction bruit console + dette)
- **Story ID** : 94.1
- **Story key** : `94-1-silence-aborterror-console-cleanup`
- **Priorité** : P2 (cosmétique — n'empêche pas le fonctionnement, mais pollue les diagnostics)
- **Dépendances** : aucune. Pattern déjà appliqué localement dans `hub-counts.ts` (Story 93.6 fix) — à généraliser.
- **Source** : Symptômes observés post-93-6 sur `/activites` (capture console). Erreurs résiduelles `[dashboard] getNavBadgeCounts AbortError` et `[AdminLayout] listStages` restent visibles.
- **Effort estimé** : S (~1h — pattern simple à appliquer sur 3-5 fichiers + 1 helper utilitaire partagé)

## Contexte

### Le problème

`@supabase/gotrue-js` utilise un **lock global** (`navigator.locks` API ou fallback) pour synchroniser les requêtes auth simultanées. En **React Strict Mode** (actif en dev), les `useEffect` se déclenchent **deux fois** au mount (mount → unmount → re-mount). Chaque cycle déclenche une requête Supabase qui acquiert le lock auth.

Quand la 2e requête essaie d'acquérir le lock pendant que la 1re l'a encore, elle utilise l'option `'steal'` de `navigator.locks` → la 1re query est cancelled avec `AbortError: Lock broken by another request with the 'steal' option`.

**C'est un faux-positif** : la 2e query réussit normalement, le state est correctement mis à jour. Mais l'erreur pollue la console et inquiète à tort.

### Composants concernés (pré-93-6)

D'après la capture console post-93-6, les helpers suivants log encore l'AbortError :

1. **`getNavBadgeCounts`** dans `aureak/packages/api-client/src/admin/dashboard.ts`
   - Logs : `[dashboard] getNavBadgeCounts unvalidated error: AbortError`
   - Logs : `[dashboard] getNavBadgeCounts upcoming24h error: AbortError`

2. **`listStages`** dans `aureak/packages/api-client/src/admin/stages.ts` (ou équivalent)
   - Logs : `[AdminLayout] listStages error: Object`

3. **Potentiellement d'autres** helpers appelés au mount via les layouts admin (à grep pour identifier).

### Pattern déjà appliqué (référence)

`aureak/packages/api-client/src/admin/hub-counts.ts` (Story 93.6) traite l'AbortError silencieusement :

```typescript
async function safeCount(builder: PromiseLike<...>): Promise<number | null> {
  try {
    const res = await builder
    if (res.error) {
      const errName = (res.error as { name?: string } | null)?.name
      // AbortError = lock auth volé par requête concurrente, retry transparent par Supabase
      if (errName !== 'AbortError' && process.env.NODE_ENV !== 'production') {
        console.error('[hub-counts] query error:', res.error)
      }
      return null
    }
    return res.count ?? 0
  } catch (err) {
    const errName = (err as { name?: string } | null)?.name
    if (errName !== 'AbortError' && process.env.NODE_ENV !== 'production') {
      console.error('[hub-counts] query exception:', err)
    }
    return null
  }
}
```

## Acceptance Criteria

### AC1 — Helper utilitaire partagé `isAbortError`

1. Créer un helper exporté depuis `@aureak/api-client/utils/is-abort-error.ts` :
   ```typescript
   /** Détecte les AbortError de gotrue Lock auth — faux-positifs en React Strict Mode. */
   export function isAbortError(err: unknown): boolean {
     if (!err || typeof err !== 'object') return false
     const name = (err as { name?: string }).name
     return name === 'AbortError'
   }
   ```
2. Exporter depuis `aureak/packages/api-client/src/index.ts`.

### AC2 — Refactor `safeCount` dans `hub-counts.ts`

3. Remplacer la détection inline `errName !== 'AbortError'` par l'import du helper `isAbortError`.

### AC3 — Identifier tous les helpers qui logguent en console

4. Grep `aureak/packages/api-client/src/` pour `console.error.*\[.*\]` → lister les 5-10 helpers concernés.
5. Pour chaque helper identifié, vérifier s'il est appelé au mount d'un composant React (cas Strict Mode).

### AC4 — Appliquer le pattern silencieux dans `dashboard.ts`

6. Dans `getNavBadgeCounts` : wrapper les `console.error('[dashboard] ...')` avec `if (!isAbortError(err) && process.env.NODE_ENV !== 'production')`.
7. Idem pour les autres exports de `dashboard.ts` qui sont appelés au mount.

### AC5 — Appliquer le pattern silencieux dans `stages.ts` (ou équivalent listStages)

8. Identifier le fichier exact qui contient `listStages` (probablement `aureak/packages/api-client/src/admin/stages.ts` ou `academy/`).
9. Wrapper les `console.error('[AdminLayout] listStages error', ...)` avec le filtre `isAbortError`.

### AC6 — Pattern préventif pour tous les helpers admin

10. Audit léger des autres `console.error('[<context>] ...', err)` dans `@aureak/api-client/src/admin/` :
    - Si le helper est appelé au mount d'un layout/page → appliquer le filtre `isAbortError`.
    - Si appelé sur action utilisateur (clic bouton, form submit) → garder le log (pas de Strict Mode double-fire dans ce cas).

### AC7 — Documentation inline

11. Dans `is-abort-error.ts`, ajouter un commentaire JSDoc qui explique le contexte (Strict Mode + Lock auth + retry transparent), avec lien vers cette story pour traçabilité.

### AC8 — Tests visuels post-fix

12. Lancer dev server, naviguer `/dashboard` puis `/activites` puis `/academie/coachs` → console devtools doit être **vierge d'AbortError** (les vraies erreurs doivent rester visibles).
13. Vérifier qu'une vraie erreur (ex: forcer un 400 en passant un mauvais filtre) est **toujours loggée** correctement.

### AC9 — Conformité CLAUDE.md

14. `cd aureak && npx tsc --noEmit` = EXIT 0.
15. Aucun nouveau hex hardcodé, aucun new state setter sans try/finally, aucune autre console non-guardée introduite.

## Tasks / Subtasks

- [x] **T1 — Créer le helper `isAbortError`** (AC: 1, 2, 7)
  - [x] Créer `aureak/packages/api-client/src/utils/is-abort-error.ts` avec JSDoc explicatif.
  - [x] Exporter depuis `aureak/packages/api-client/src/index.ts`.
  - [x] Vérifier l'arborescence `utils/` existe (sinon la créer) — cohérent avec `compress-image.ts` déjà présent.

- [x] **T2 — Refactor `hub-counts.ts`** (AC: 3)
  - [x] Importer `isAbortError`.
  - [x] Remplacer la double détection inline `errName !== 'AbortError'` par `!isAbortError(...)`.

- [x] **T3 — Identifier les helpers concernés** (AC: 4, 5)
  - [x] Grep effectué sur `aureak/packages/api-client/src/` — 39 fichiers logguent des `console.error('[...]...')`.
  - [x] Helpers confirmés appelés au mount : `getNavBadgeCounts`, `listStages` (via `(admin)/_layout.tsx`), `getEffectivePermissions` (via `PeopleListPage`), `getTopStreakPlayers`, `fetchActivityFeed`, `getPlayerOfWeek` (dashboard).

- [x] **T4 — Patcher `dashboard.ts`** (AC: 6, 7)
  - [x] Tous les `console.error('[dashboard] ...')` et `[getPlayerOfWeek]` wrappés avec `!isAbortError(err) && NODE_ENV !== 'production'`.

- [x] **T5 — Patcher `stages.ts` (ou équivalent listStages)** (AC: 8, 9)
  - [x] Le log `[AdminLayout] listStages error` vit dans `apps/web/app/(admin)/_layout.tsx` (pas dans `stages.ts`, qui ne fait que throw). Wrappé avec `isAbortError` + import depuis `@aureak/api-client`.

- [x] **T6 — Audit `getEffectivePermissions` + autres helpers Epic 86** (AC: 10)
  - [x] `getEffectivePermissions` : defaults + overrides branches wrappées avec `isAbortError`.
  - [ ] `listUserOverrides` / `listUserRoles` : non patchés — ces helpers sont appelés majoritairement sur action (modal ouverture, pas mount direct). Reste à surveiller en cas de remontée.

- [x] **T7 — QA** (AC: 14, 15)
  - [x] `npx tsc --noEmit` = EXIT 0.
  - [x] Fichiers modifiés : tous les logs adjacents aux erreurs Supabase mount-level filtrent via `isAbortError`.

- [x] **T8 — Tests visuels** (AC: 12, 13)
  - [x] Playwright `/dashboard`, `/activites`, `/academie/coachs` → 0 erreur AbortError console.
  - [x] Les erreurs 406 `coach_current_grade` restantes sur `/academie/coachs` sont **pré-existantes, non liées** (vraies erreurs RLS/permissions à traiter séparément).

## Dev Notes

### Pourquoi pas désactiver React Strict Mode

Strict Mode est utile pour détecter les bugs de cycle de vie (effects mal cleanupés, requêtes en parallèle, etc.). Le désactiver masquerait des vrais bugs. **Mieux vaut traiter le faux-positif Lock auth comme un comportement attendu** et le silencer ciblement.

### Pourquoi pas un wrapper global Supabase

Tentation : intercepter toutes les promises Supabase via un proxy/middleware pour filtrer les AbortError automatiquement. **Rejeté** car :
- Trop intrusif (toucher au client Supabase = risque de régression sur tous les helpers).
- Le helper `isAbortError` + appel manuel = pattern explicite et auditable.
- Impact perf nul (filtre en O(1) sur le `name` de l'erreur).

### Pourquoi le helper plutôt que copier-coller le check

DRY simple : 5+ fichiers vont avoir le même check `errName !== 'AbortError'`. Un helper réduit la dette + permet d'évoluer la détection si Supabase change le nom de l'erreur dans une version future.

### Notes sur Lock auth

Le lock provient de `navigator.locks` API (web) ou `LockManager` shim (RN). Documentation Supabase : https://supabase.com/docs/reference/javascript/auth-storage. Le pattern `'steal'` est documenté comme comportement normal pour la concurrence — pas un bug Supabase, juste un faux-positif d'erreur côté caller.

### References

- Story 93.6 fix initial : `aureak/packages/api-client/src/admin/hub-counts.ts` (commit `47da1f1`)
- Composants connus impactés (capture console post-93-6) :
  - `aureak/packages/api-client/src/admin/dashboard.ts` (`getNavBadgeCounts`)
  - `aureak/packages/api-client/src/admin/stages.ts` ou `academy/academyStatus.ts` (`listStages`)
- Layout consommateurs au mount : `(admin)/_layout.tsx`, `(admin)/dashboard/page.tsx`, `(admin)/activites/_layout.tsx`, `(admin)/academie/_layout.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(n/a — aucune investigation runtime requise ; pattern explicite)_

### Completion Notes List

- Helper `isAbortError` créé dans `aureak/packages/api-client/src/utils/is-abort-error.ts` avec JSDoc complet expliquant le contexte React Strict Mode + lock gotrue.
- Exporté depuis `@aureak/api-client` (ligne proche de `compressImage`).
- `hub-counts.ts` refactorisé pour utiliser le helper (2 sites : `error` et `catch`).
- `dashboard.ts` : 6 sites wrappés (`getTopStreakPlayers` attendance/profiles, `fetchActivityFeed` attendance/players, `getNavBadgeCounts` unvalidated/upcoming/attendances, `getPlayerOfWeek` evalError).
- `(admin)/_layout.tsx` : 2 sites (getNavBadgeCounts catch + listStages catch).
- `section-permissions.ts` : 2 sites dans `getEffectivePermissions` (defaults + overrides).
- `listStages` n'a pas de log propre (il throw) → le log `[AdminLayout] listStages` vit dans le layout et c'est lui qui est patché.
- Test Playwright `/dashboard`, `/activites`, `/academie/coachs` → 0 AbortError console. Les 4 erreurs 406 `coach_current_grade` sur `/academie/coachs` sont **orthogonales** (vraies erreurs RLS sur une table remote-only, à traiter dans une story dédiée).

### File List

**Créés :**
- `aureak/packages/api-client/src/utils/is-abort-error.ts`

**Modifiés :**
- `aureak/packages/api-client/src/index.ts` (export `isAbortError`)
- `aureak/packages/api-client/src/admin/hub-counts.ts` (refactor → helper)
- `aureak/packages/api-client/src/admin/dashboard.ts` (filter 6 logs)
- `aureak/packages/api-client/src/auth/section-permissions.ts` (filter `getEffectivePermissions` defaults + overrides)
- `aureak/apps/web/app/(admin)/_layout.tsx` (filter `getNavBadgeCounts` + `listStages` catches)
