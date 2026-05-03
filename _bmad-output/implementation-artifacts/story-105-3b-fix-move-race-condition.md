# Story 105.3.b : Fix race condition move kanban stage groupes

Status: done

Dépend de : 105.3 (feature livrée)

## Story

En tant qu'**admin**,
je veux **que le 1er clic sur "Déplacer ↔ → Groupe X" persiste systématiquement le gardien dans le nouveau groupe**,
afin de **ne pas avoir à re-cliquer après un échec silencieux qui crée de la confusion**.

## Contexte — bug observé

Validation runtime du 2026-05-03 sur `/evenements/stages/{id}/groupes` :
1. Click "↔" sur la card de Tom Lamiroy → menu apparaît
2. Click "→ U10 Avancé" → handleMove appelé
3. UI re-render mais Tom reste visuellement dans Groupe 1
4. Vérification DB : `stage_group_id` = `NULL` (move pas persisté)

Tests suivants (autre gardien, ou même gardien après reload) : OK.

Code suspect (`groupes/page.tsx` ligne ~115) :

```tsx
const handleMove = async (childId: string, targetGroupId: string) => {
  if (!stageId || typeof stageId !== 'string') return
  setMovingChildId(null)              // ← ferme le menu immédiatement
  try {
    await moveChildToGroup(stageId, childId, targetGroupId)
    await load()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] move error:', err)
  }
}
```

```tsx
{showMenu && (
  <View style={s.moveMenu}>
    {otherGroups.map(g => (
      <Pressable key={g.id} onPress={() => handleMove(child.id, g.id)} style={s.moveOption}>
        <AureakText style={s.moveOptionLabel}>→ {g.name}</AureakText>
      </Pressable>
    ))}
  </View>
)}
```

Hypothèses :
1. `setMovingChildId(null)` au début de `handleMove` démonte le menu via re-render React, ce qui interrompt le Pressable child onPress sur RN-web (touch/click bubbling cassé).
2. La Pressable RN-web a un comportement particulier où l'onPress nécessite que le composant existe encore au release pour fire complètement.
3. Le silent fail (pas d'erreur dans la console) suggère que la requête HTTP n'a même pas été envoyée.

## Acceptance Criteria

- **AC1 — Reproduction** : reproduire le bug à froid (page reload, 1er click sur 1er gardien) → confirmer.
- **AC2 — Fix** : appliquer le fix le plus simple qui résout :
  - Option A : déplacer `setMovingChildId(null)` APRÈS `await moveChildToGroup` (laisse le menu visible pendant la requête)
  - Option B : utiliser un setTimeout 0 ou requestAnimationFrame pour différer le close de menu
  - Option C : factoriser le menu dans un composant qui ne se démonte pas via portal/sheet
- **AC3 — Pas de régression** : create/rename/delete-with-reassignment fonctionnent toujours.
- **AC4 — Test runtime** : 5 moves successifs depuis l'UI sans reload entre chaque → tous persistés en DB.
- **AC5 — Conformité** : try/finally OK, console guards OK, tokens theme OK.

## Tasks / Subtasks

- [ ] T1 — Reproduire le bug en local
- [ ] T2 — Appliquer Option A en priorité (le plus simple) :
  ```tsx
  const handleMove = async (childId: string, targetGroupId: string) => {
    if (!stageId || typeof stageId !== 'string') return
    try {
      await moveChildToGroup(stageId, childId, targetGroupId)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] move error:', err)
    } finally {
      setMovingChildId(null)
    }
  }
  ```
- [ ] T3 — Si Option A insuffisante : essayer Option B (setTimeout)
- [ ] T4 — Si bug persiste : escalader en Option C (refacto menu en portal)
- [ ] T5 — Test runtime via Chrome devtools MCP : 5 moves consécutifs → DB confirms tous
- [ ] T6 — `cd aureak && npx tsc --noEmit`

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/evenements/stages/[stageId]/groupes/page.tsx` (handleMove order)

## Notes

- Bug observé une seule fois en validation runtime — peut être intermittent. Forcer la reproduction à froid.
- Si Option A résout : impacter aussi handleRename et handleDelete s'ils ont la même structure (close UI state avant await).
- Pas de changement DB / migration / API client.
- Aucune nouvelle dépendance.
