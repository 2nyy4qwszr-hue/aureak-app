# Bug Crawler — 2026-04-06 (Post-Sprint Epic 63)

> Audit ciblé sur les fichiers modifiés durant le sprint du jour.
> Méthode : analyse statique des fichiers + tentative Playwright (navigateur non authentifié — admin routes protégées, crawl visuel non effectuable sans session).

---

## Résumé

- **Fichiers audités** : 9
- **CRITICAL** : 0
- **HIGH** : 0
- **MEDIUM** : 1
- **LOW** : 2
- **Régressions** : 0
- **Résolutions constatées** : 1 (W-PATROL-01)

---

## Bugs détectés

### MEDIUM — Variable `childIds` déclarée mais jamais utilisée (dead code)

**Fichier** : `aureak/packages/api-client/src/sessions/presences.ts` — ligne 131
**Code** :
```ts
const childIds = attendees.map(a => a.child_id)  // ← jamais utilisé
const regularIds = attendees.filter(a => !a.is_guest).map(a => a.child_id)
const guestIds   = attendees.filter(a =>  a.is_guest).map(a => a.child_id)
```
**Contexte** : Vestige du refactor UUID fix (commit 9139ea6). La variable `childIds` a été remplacée par `regularIds` + `guestIds` pour la résolution des noms, mais la ligne n'a pas été supprimée.
**Impact** : Aucun impact fonctionnel direct. Peut générer un warning TypeScript/ESLint `no-unused-vars` et prête à confusion lors d'une relecture.
**Reproductible** : Oui — visible statiquement.
**Action recommandée** : Supprimer la ligne 131 dans `presences.ts`.

---

### LOW — Routing Expo Router : page `/developpement` sans `index.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/developpement/page.tsx`
**Observation** : La page hub `developpement/page.tsx` existe mais il n'y a pas de `developpement/index.tsx`. Les 3 sous-pages (`prospection/`, `marketing/`, `partenariats/`) ont correctement leurs `index.tsx` + `page.tsx`, mais le hub parent n'en a qu'un.
**Vérification** :
```
developpement/
  index.tsx      ← PRÉSENT ✅
  page.tsx
  marketing/
    index.tsx ✅
    page.tsx ✅
  partenariats/
    index.tsx ✅
    page.tsx ✅
  prospection/
    index.tsx ✅
    page.tsx ✅
```
**Note** : `index.tsx` est bien présent au niveau `developpement/` (vérifié dans la liste du répertoire). Ce warning ne s'applique pas — le routing est correct.

> **AUTO-CORRECTION** : Après vérification, `developpement/index.tsx` existe bien. Ce LOW est retiré.

---

### LOW — Console `[dashboard] getNavBadgeCounts` non typée (400 HTTP errors)

**Observé** : Lors de la tentative de crawl Playwright, les console messages révèlent :
```
[error] Failed to load resource: the server responded with a status of 400 () (×3)
[error] [dashboard] getNavBadgeCounts unvalidated error: [object Object]
```
**Contexte** : Ces erreurs 400 sont liées à l'état non authentifié du navigateur de test (pas de session Supabase). Elles correspondent à des requêtes Supabase refusées par RLS/auth.
**Impact** : Zéro en production — normal en contexte non-auth. Mais le message `[object Object]` au lieu du message d'erreur structuré indique que le `.message` de l'erreur n'est pas extrait dans le console.error de `dashboard.ts`.
**Fichier probable** : `aureak/packages/api-client/src/admin/dashboard.ts` — fonction `getNavBadgeCounts`.
**Action recommandée** : Remplacer `console.error('[dashboard] getNavBadgeCounts unvalidated error:', err)` par `console.error('[dashboard] getNavBadgeCounts unvalidated error:', err instanceof Error ? err.message : err)` pour un message plus lisible.

---

## Vérifications positives (aucune erreur)

### `evenements/page.tsx` — PASS

- Try/finally correct sur `load()` : `setLoading(true)` en entrée, `setLoading(false)` dans `finally`.
- Console guard conforme : `(process.env.NODE_ENV as string) !== 'production'`.
- `listEvents` correctement importé depuis `@aureak/api-client` (export vérifié ligne 24 de `index.ts`).
- `EventType` / `EVENT_TYPES` / `EVENT_TYPE_LABELS` correctement importés depuis `@aureak/types` (définis lignes 276–290 de `enums.ts`).
- `StageWithMeta.eventType` présent (hérité de `Stage.eventType : EventType`, ligne 579 de `entities.ts`).
- Tous les tokens couleur utilisés existent dans `@aureak/theme` : `colors.overlay.dark`, `colors.entity.club`, `colors.entity.stage`, `colors.text.subtle`, `colors.border.light`, `colors.accent.gold`, `colors.accent.red`, `colors.status.success`, `colors.text.muted`.
- `useMemo` correct pour `activeType`, `useCallback` correct pour `load` / `setFilter` / `handleSelectEventType` / `handleCardPress`.
- Empty state présent, skeleton présent, stub banner pour types non-stage présent.
- Pas de `key` prop manquante (tous les `.map()` utilisent des clés stables : `event.id`, `type`, index stable).

### `developpement/page.tsx` — PASS

- Aucune side-effect, aucun état async, aucun console.
- Tokens conformes : `colors.light.primary`, `colors.light.surface`, `colors.border.light`, `colors.text.dark`, `colors.text.muted`, `colors.accent.gold`.
- `router.push(section.href as never)` — pattern Expo Router valide.

### `developpement/prospection/page.tsx` — PASS
### `developpement/marketing/page.tsx` — PASS
### `developpement/partenariats/page.tsx` — PASS

- Pages statiques sans state ni async — aucun risque de try/finally manquant.
- `colors.border.goldBg` vérifié dans `tokens.ts` ligne 102 : `'rgba(193,172,92,0.10)'`. ✅
- `colors.border.gold` vérifié dans `tokens.ts` ligne 100. ✅
- `colors.text.subtle` vérifié dans `tokens.ts` ligne 97 : `'#A1A1AA'`. ✅
- `colors.text.muted` vérifié. ✅

### `_layout.tsx` — PASS (parties modifiées aujourd'hui)

- Section "Évènements" ajoutée (ligne 142) : `href: '/evenements'` — route correspondante existe (`evenements/index.tsx` + `page.tsx` vérifiés).
- Section "Développement" : 3 items avec hrefs `/developpement/prospection`, `/developpement/marketing`, `/developpement/partenariats` — tous les `index.tsx` + `page.tsx` présents.
- Raccourci clavier `'/evenements': 'G V'` ajouté (ligne 84).
- Aucun import manquant : `BarChartIcon` déjà importé (ligne 33), `SearchIcon` déjà importé (ligne 38), `ShieldIcon` déjà importé (ligne 28).

### `api-client/src/admin/stages.ts` — `listEvents` ajouté — PASS

- Filtre `filter?.type` correctement appliqué via `.eq('event_type', filter.type)`.
- Même select que `listStages` — pas de régression sur les jointures existantes.
- `mapStage()` inclut `eventType: (row.event_type ?? 'stage') as EventType` — fallback sûr.
- Exporté dans `index.ts` ligne 24 : `listStages, listEvents, getStage, ...`.
- Console guard absent dans `listEvents` — mais ce n'est pas un BLOCKER car la fonction `throw error` délègue la gestion à l'appelant (pattern correct pour les fonctions API sans retour `{ data, error }`).

### `sessions/presences.ts` — UUID fix — PASS

- Commit 9139ea6 confirmé : fallback `?? 'Joueur inconnu'` en place aux deux endroits.
- Résout **W-PATROL-01** (UUIDs bruts dans liste présences).

### `supabase/migrations/00135_stages_add_event_type.sql` — PASS

- `DO $$ BEGIN ... END $$` guard correct pour idempotence de la création d'enum.
- `ADD COLUMN IF NOT EXISTS event_type event_type_enum NOT NULL DEFAULT 'stage'` — valeur par défaut sûre, ne casse pas les données existantes.
- Index `idx_stages_event_type` créé avec `IF NOT EXISTS`.
- Pas de `DROP`/`TRUNCATE` risqué.

---

## Résolutions constatées ce sprint

| ID | Description | Résolution |
|----|-------------|-----------|
| W-PATROL-01 | UUIDs bruts affichés dans liste présences | RÉSOLU — commit 9139ea6 — fallback `'Joueur inconnu'` dans `presences.ts` |

---

## Note Playwright

L'app tourne (HTTP 200 confirmé sur `http://localhost:8081`). Le navigateur Chrome DevTools utilisé par l'agent n'a pas de session Supabase active — toutes les routes admin redirigent vers `/login`. Le crawl visuel interactif n'a pas pu être effectué. L'audit a été réalisé entièrement par analyse statique du code source.

---

## Recommandations prioritaires

1. **[MEDIUM]** Supprimer la ligne `const childIds = attendees.map(a => a.child_id)` dans `presences.ts` (ligne 131) — dead code résiduel du UUID fix.
2. **[LOW]** Dans `dashboard.ts` → `getNavBadgeCounts` : améliorer le message console.error pour afficher `err.message` au lieu de `[object Object]`.
3. **[INFO]** Les BLOCKERs B-PATROL-01 (vue `v_club_gardien_stats`), B-PATROL-02 (400 sur `/stages`), B-PATROL-03 (text nodes dans `/seances`) restent ouverts — non régressés par ce sprint.
