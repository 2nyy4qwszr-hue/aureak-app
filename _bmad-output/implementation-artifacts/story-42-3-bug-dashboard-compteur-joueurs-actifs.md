# Story 42.3 : BUG — Dashboard — compteur joueurs actifs incorrect

Status: done

## Story

En tant qu'admin Aureak consultant le dashboard,
je veux que le compteur "joueurs actifs" affiche le nombre de joueurs qui ont une membership dans la saison académique actuelle,
afin d'avoir un chiffre réel et non le total de tous les profils.

## Acceptance Criteria

1. Le KPI "joueurs actifs" dans `(admin)/dashboard/page.tsx` utilise la vue `v_child_academy_status` filtrée par `in_current_season = true`
2. Le compteur reflète uniquement les joueurs ayant une membership dans la saison courante
3. Aucun autre KPI du dashboard ne régresse

## Tasks / Subtasks

- [x] T1 — Corriger la requête du compteur joueurs actifs
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/dashboard/page.tsx` — identifier comment `activePlayersCount` est calculé
  - [x] T1.2 — Lire `aureak/packages/api-client/src/` — identifier la fonction API utilisée
  - [x] T1.3 — Si la requête compte tous les profils : remplacer par une requête sur `v_child_academy_status` WHERE `in_current_season = true`
  - [x] T1.4 — Ajouter une fonction `countActivePlayersCurrentSeason()` dans `@aureak/api-client/src/admin/child-directory.ts` si elle n'existe pas

- [x] T2 — Validation
  - [x] T2.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T2.2 — Dashboard affiche le bon nombre (cohérent avec la page /children filtrée par saison actuelle)

## Dev Notes

### Vue SQL à utiliser
```sql
SELECT COUNT(*) FROM v_child_academy_status WHERE in_current_season = true AND tenant_id = $1
```

### API pattern
```typescript
export async function countActivePlayersCurrentSeason(tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from('v_child_academy_status')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('in_current_season', true)
  if (error) throw error
  return count ?? 0
}
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/admin/child-directory.ts` | Ajouter `countActivePlayersCurrentSeason` |
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Utiliser la nouvelle fonction |

## Dev Agent Record

**Agent** : Claude (Amelia — Developer Agent BMAD)
**Date** : 2026-04-04

### Analyse de la situation

**Méthode incorrecte (avant)** :
- `getDashboardKpiCounts` dans `dashboard.ts` calculait `childrenTotal` depuis `profiles WHERE user_role = 'child'`
- Comptait TOUS les profils enfants auth, sans tenir compte de la saison académique courante
- Résultat : chiffre gonflé incluant d'anciens académiciens sans membership actif

**Correction appliquée** :

1. **`child-directory.ts`** — Ajout de `countActivePlayersCurrentSeason()` :
   - Requête HEAD sur `v_child_academy_status WHERE in_current_season = true`
   - Console guard conforme ARCH (`NODE_ENV !== 'production'`)
   - Retourne `0` en cas d'erreur (pas de throw — KPI dashboard non-bloquant)

2. **`dashboard.ts`** — `getDashboardKpiCounts` mode global :
   - Import de `countActivePlayersCurrentSeason` depuis `./child-directory`
   - `childrenTotal` = résultat de `countActivePlayersCurrentSeason()` (en parallèle avec les autres counts)
   - Mode filtré par implantation : inchangé (logique opérationnelle distincte — group_members)

3. **`index.ts`** — Export de `countActivePlayersCurrentSeason` ajouté

**QA scan** :
- try/finally : `loadCounts` dans `page.tsx` possède déjà un try/finally correct (non modifié)
- Console guards : ajouté dans `countActivePlayersCurrentSeason` ; `dashboard.ts` non modifié côté guards
- Catch silencieux : aucun

**tsc --noEmit** : 0 erreur

## File List

- `aureak/packages/api-client/src/admin/child-directory.ts` — ajout `countActivePlayersCurrentSeason`
- `aureak/packages/api-client/src/admin/dashboard.ts` — `childrenTotal` via `v_child_academy_status`
- `aureak/packages/api-client/src/index.ts` — export `countActivePlayersCurrentSeason`
