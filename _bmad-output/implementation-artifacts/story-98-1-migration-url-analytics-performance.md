# Story 98.1 — Migrer `/analytics/*` → `/performance/*`

Status: done

## Metadata

- **Epic** : 98 — Performance refonte
- **Story ID** : 98.1
- **Story key** : `98-1-migration-url-analytics-performance`
- **Priorité** : P1 (prérequis de 98.2)
- **Dépendances** : aucune ; **bloque 98.2, 98.3, 98.4**
- **Source** : Audit UI 2026-04-22. La sidebar affiche "Performance" mais l'URL est `/analytics` — incohérence à résoudre.
- **Effort estimé** : M (~4-5h — déplacement 6 pages + imports + redirects + nav-config)

## Story

As an admin,
I want que l'URL de la zone Performance soit `/performance/*` au lieu de `/analytics/*`,
So that l'URL reflète le libellé sidebar "Performance" et que la navigation soit cohérente.

## Contexte

### Pages impactées

- `app/(admin)/analytics/page.tsx` + `index.tsx` — hub
- `app/(admin)/analytics/charge/page.tsx` + `index.tsx`
- `app/(admin)/analytics/clubs/page.tsx` + `index.tsx`
- `app/(admin)/analytics/presences/page.tsx` + `index.tsx`
- `app/(admin)/analytics/progression/page.tsx` + `index.tsx`
- `app/(admin)/analytics/implantation/page.tsx` + `index.tsx`

### Composants et lib

- `aureak/apps/web/lib/admin/analytics/generateMonthlyReport.ts` (déplacé par 95.1) — **renommer** en `aureak/apps/web/lib/admin/performance/generateMonthlyReport.ts` pour cohérence structurelle (optionnel mais recommandé).

### nav-config

Ligne 59 de `nav-config.ts` :
```typescript
performances: { label: 'Performance', href: '/analytics', Icon: BarChartIcon }
```
→ mettre à jour `href: '/performance'` (et Icon = `TrendingUpIcon` après 97.1).

### Grep liens internes

```bash
rg '/analytics' aureak/apps/web/
rg "push\('/analytics" aureak/apps/web/
rg 'href="/analytics' aureak/apps/web/
```

## Acceptance Criteria

1. **Migration dossier** : `git mv app/(admin)/analytics app/(admin)/performance`. Structure préservée.

2. **Ancien dossier supprimé** : plus de `app/(admin)/analytics/` après migration (hors page stub redirect, cf. AC #3).

3. **Redirects 301** : créer des pages stub `<Redirect>` aux anciens chemins pour les 6 URLs principales :
   - `/analytics` → `/performance`
   - `/analytics/charge` → `/performance/charge`
   - `/analytics/clubs` → `/performance/clubs`
   - `/analytics/presences` → `/performance/presences`
   - `/analytics/progression` → `/performance/progression`
   - `/analytics/implantation` → `/performance/implantation`
   - Durée de vie : 1 mois minimum.

4. **Rename du dossier lib** (optionnel mais recommandé) : `git mv lib/admin/analytics lib/admin/performance`. Mettre à jour les imports (`rg 'lib/admin/analytics'`).

5. **Mise à jour `nav-config.ts`** : ligne 59 `href: '/performance'`.

6. **Grep liens internes** : `rg '"/analytics|/analytics"' aureak/apps/web/` → **0 match** hors redirects et commentaires.

7. **Imports relatifs** : après `git mv`, profondeur change → tsc EXIT 0.

8. **Test Playwright** :
   - `/performance` charge le hub
   - Les 5 sous-pages chargent correctement
   - Anciennes URLs `/analytics/*` redirigent vers `/performance/*`
   - Console zéro erreur

9. **Conformité CLAUDE.md** : `page.tsx` + `index.tsx` re-export préservé, tsc OK.

10. **Non-goals explicites** :
    - **Pas de modification UI** (c'est 98.2)
    - **Pas de rapatriement comparaisons** (c'est 98.3)
    - **Pas de refonte hub** (c'est 98.4)

## Tasks / Subtasks

- [ ] **T1 — Inventaire** (AC #6)
  - [ ] Grep tous les refs `/analytics` dans `aureak/apps/web/`
  - [ ] Lister fichiers à mettre à jour

- [ ] **T2 — git mv dossier pages** (AC #1, #2)
  - [ ] `git mv app/(admin)/analytics app/(admin)/performance`

- [ ] **T3 — git mv dossier lib (optionnel)** (AC #4)
  - [ ] `git mv lib/admin/analytics lib/admin/performance` si retenu
  - [ ] Corriger imports

- [ ] **T4 — nav-config** (AC #5)
  - [ ] Ligne 59 href `/performance`

- [ ] **T5 — Mise à jour liens internes** (AC #6)
  - [ ] Corriger hrefs, router.push, breadcrumbs

- [ ] **T6 — Redirects** (AC #3)
  - [ ] Pages stub dans anciens emplacements

- [ ] **T7 — QA** (AC #7, #8, #9)
  - [ ] `tsc --noEmit` EXIT 0
  - [ ] Playwright 6 URLs + 6 redirects

## Dev Notes

### Cohérence nom dossier

Le dossier pages et le dossier lib doivent rester en phase. Si le package `@aureak/api-client` exporte des fonctions namespaced `analytics.*`, elles peuvent rester car l'API peut conserver le nom `analytics` en interne (couche données) tandis que la couche UI utilise `performance` (couche présentation). **Ne pas renommer les fonctions api-client** — scope out.

### Commits recommandés

1. `refactor(epic-98-1): git mv /analytics → /performance + imports` (gros commit)
2. `refactor(epic-98-1): liens internes + nav-config`
3. `feat(epic-98-1): redirects 301 /analytics → /performance`

### References

- Pages source : `app/(admin)/analytics/`
- Pages cible : `app/(admin)/performance/`
- Lib : `lib/admin/analytics/` (→ `performance/` optionnel)
- nav-config : `lib/admin/nav-config.ts:59`
- Story suivante : 98.2 (template)
