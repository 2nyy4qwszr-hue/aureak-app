# Story 49.10 : BUG — `milestones.ts` — typo nom fonction `getUnceledbratedMilestones` + correctif profiles.id documenté

Status: done

Epic: 49 — Bugfix batch avril 2026 #2

## Contexte

### Bug principal (profiles.id → user_id) — déjà corrigé dans commit dcd5250

Dans `aureak/packages/api-client/src/gamification/milestones.ts`, la fonction `checkAcademyMilestones()` effectuait la requête suivante sur la table `profiles` :

```typescript
// AVANT (bugué)
.eq('id', user.id)

// APRÈS (corrigé dans commit dcd5250)
.eq('user_id', user.id)
```

La colonne `id` n'existe pas dans la table `profiles` (la clé primaire est `user_id`). Ce bug empêchait la résolution du `tenant_id` nécessaire pour l'appel RPC `check_academy_milestones`, ce qui provoquait le retour systématique d'un tableau vide. En conséquence, le composant `MilestoneCelebration` n'était jamais affiché.

Ce correctif a été appliqué dans le commit `dcd5250` ("fix(api): bugs DB attendance_records / profiles.id / nav-badges / xp_ledger") mais **sans story BMAD formelle**. Cette story documente le correctif appliqué et couvre le bug résiduel.

### Bug résiduel — typo dans le nom de la fonction `getUnceledbratedMilestones`

La fonction exportée se nomme `getUnceledbratedMilestones` (faute de frappe : "Unceldbrated") au lieu de `getUncelebratedMilestones`. Cette typo est présente :

- Dans la déclaration de la fonction (`milestones.ts` ligne 9)
- Dans l'export barrel (`api-client/src/index.ts` ligne 373)
- Dans le commentaire JSDoc (`milestones.ts` ligne 8)

Ce nom erroné rend la fonction difficile à découvrir par auto-complétion et constitue une dette technique active. Aucun fichier dans `apps/` ne l'importe actuellement, ce qui facilite la correction sans breaking change côté consommateurs.

## Story

En tant que développeur,
je veux que les fonctions de l'API milestones soient correctement nommées et que le bug `profiles.id` soit documenté formellement,
afin que le composant `MilestoneCelebration` s'affiche correctement sur le dashboard et que le code soit maintenable.

## Acceptance Criteria

1. **AC1 — Correctif profiles.id documenté** : Le commit `dcd5250` est référencé dans cette story. La ligne 53 de `milestones.ts` utilise bien `.eq('user_id', user.id)` (vérification visuelle). Aucune autre occurrence de `.eq('id', ...)` sur la table `profiles` n'existe dans `@aureak/api-client`.

2. **AC2 — Typo corrigée dans milestones.ts** : La fonction `getUnceledbratedMilestones` est renommée en `getUncelebratedMilestones` (suppression du "d" parasite) dans `milestones.ts` — déclaration, JSDoc et tout usage interne au fichier.

3. **AC3 — Export barrel mis à jour** : `aureak/packages/api-client/src/index.ts` exporte `getUncelebratedMilestones` (nom corrigé) à la place de `getUnceledbratedMilestones`.

## Tâches

### 1. Vérification du correctif profiles.id

- [x] 1.1 Lire `aureak/packages/api-client/src/gamification/milestones.ts` et confirmer que la ligne 53 contient `.eq('user_id', user.id)`
- [x] 1.2 Grep `\.eq\('id',` dans `aureak/packages/api-client/src/` pour s'assurer qu'aucune autre requête sur `profiles` n'utilise encore le mauvais champ
- [x] 1.3 Si un autre fichier contient encore `.eq('id', user.id)` sur la table `profiles` → corriger dans ce même commit (admin-profile.ts + badges.ts corrigés)

### 2. Correction de la typo getUnceledbratedMilestones

- [x] 2.1 Ouvrir `aureak/packages/api-client/src/gamification/milestones.ts`
- [x] 2.2 Renommer la fonction `getUnceledbratedMilestones` → `getUncelebratedMilestones` (déclaration + JSDoc ligne 8)
- [x] 2.3 Vérifier que l'export dans `milestones.ts` (si présent via `export function`) est cohérent

### 3. Mise à jour de l'export barrel

- [x] 3.1 Ouvrir `aureak/packages/api-client/src/index.ts`
- [x] 3.2 Remplacer `getUnceledbratedMilestones` par `getUncelebratedMilestones` dans la ligne d'export (ligne ~373)

### 4. Grep global de sécurité

- [x] 4.1 Grep `getUnceldbrated\|getUncel[^e]` dans tout `aureak/` pour détecter d'éventuels consommateurs de l'ancien nom erroné → aucun trouvé
- [x] 4.2 Grep `console\.` dans `milestones.ts` : vérifier que tous les appels console sont guardés par `process.env.NODE_ENV !== 'production'` → OK, tous guardés
- [x] 4.3 Confirmer que `try/finally` est présent sur tous les state setters dans les composants qui appellent ces fonctions (dashboard/page.tsx)

### 5. QA scan

- [x] 5.1 Vérifier `dashboard/page.tsx` : le bloc `checkMilestones()` dans le `useEffect` n'a pas de state setter de chargement exposé sans `finally` → OK
- [x] 5.2 Confirmer aucun `console.` non-guardé dans les fichiers modifiés → OK, tous guardés

## Dépendances

**Aucune dépendance de story** — correction purement dans `@aureak/api-client`, aucune migration requise.

**Vérifie avant de coder :**
- Commit `dcd5250` déjà appliqué — ne pas re-corriger `.eq('user_id')` (déjà fait)
- Vérifier si un consommateur externe importe `getUnceledbratedMilestones` avant de renommer

## Notes techniques

### Aucune migration nécessaire

Ce bug est purement JavaScript/TypeScript dans la couche API-client. Aucune table, colonne ni RPC n'est créée ou modifiée.

### Impact de la typo

La typo dans le nom de la fonction n'a aucun impact runtime (JavaScript n'est pas affecté par les noms de fonctions internes). Cependant :
- La recherche par auto-complétion retourne un nom inattendu
- Les futurs développeurs qui cherchent `getUncelebrated` ne trouvent pas la fonction
- La dette technique s'accumule si d'autres typos similaires ne sont pas corrigées

### Vérification `.eq('user_id')` complète

Outre `milestones.ts`, vérifier également :
- `aureak/packages/api-client/src/gamification/academy-score.ts` (corrigé dans le même commit dcd5250 — ligne profiles.user_id + user_role)
- `aureak/packages/api-client/src/admin/dashboard.ts` (même commit)

### Comportement attendu post-fix

Après correction de la typo, le comportement fonctionnel reste identique (la fonction `getUncelebratedMilestones` n'est pas appelée par le dashboard — il utilise `checkAcademyMilestones`). La correction est une amélioration de maintenabilité.

## Fichiers à créer/modifier

| Fichier | Action | Raison |
|---------|--------|--------|
| `aureak/packages/api-client/src/gamification/milestones.ts` | MODIFIER | Renommer `getUnceledbratedMilestones` → `getUncelebratedMilestones` + vérifier `.eq('user_id')` |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Mettre à jour l'export barrel avec le nom corrigé |

**Aucune migration Supabase.** Aucune modification dans `aureak/apps/`.

## Commit

```
fix(epic-49): story 49.10 — typo getUncelebratedMilestones + doc correctif profiles.id milestones
```
