# Story 110.10 : Migrer `shadow*` props vers `boxShadow` (RN-web deprecation)

Status: done

## Story

En tant que **dev Aureak**,
je veux **éliminer le warning RN-web `"shadow*" style props are deprecated. Use "boxShadow"`**,
afin de **rester compatible avec les futures versions de RN-web (0.78+) où les props `shadow*` seront retirées**.

## Contexte

Warning runtime (2026-05-03) sur web :
```
"shadow*" style props are deprecated. Use "boxShadow".
```

RN-web déprécie le pattern legacy iOS-style :
```ts
{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
```

au profit de la prop CSS standard :
```ts
{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
```

Aureak utilise déjà `boxShadow` à plusieurs endroits via `Platform.select`, mais 9 fichiers utilisent encore le pattern legacy iOS sur web.

## Périmètre

`grep -rln "shadowColor\|shadowOffset\|shadowOpacity\|shadowRadius" aureak/ --include="*.ts" --include="*.tsx"` retourne 9 fichiers :

- `aureak/packages/ui/src/GroupOfMonthBadge.tsx`
- `aureak/packages/ui/src/BadgeGrid.tsx`
- `aureak/packages/ui/src/components/ConfirmDialog.tsx`
- `aureak/apps/web/components/SkeletonCard.tsx`
- `aureak/apps/web/components/NavTooltip.tsx`
- `aureak/apps/web/components/admin/PrimaryAction.tsx`
- `aureak/apps/web/components/admin/ResponsiveModal.tsx`
- `aureak/apps/web/components/admin/children/ScoutEvaluationModal.tsx`
- `aureak/apps/web/components/admin/children/TrialInvitationModal.tsx`

## Acceptance Criteria

- **AC1 — Web utilise `boxShadow`** : sur web (`Platform.OS === 'web'`), tous les blocs `shadowColor/Offset/Opacity/Radius` sont remplacés par une string `boxShadow` équivalente. Pattern :
  ```ts
  ...Platform.select({
    ios:    { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    android:{ elevation: 4 },
    web:    { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  })
  ```
  Si déjà en `Platform.select` avec `default`, déplacer vers `web:` ou ajouter `web:`.
- **AC2 — iOS/Android préservés** : les blocs `ios:` (shadow*) et `android:` (elevation) restent inchangés (mobile RN natif n'a pas de boxShadow).
- **AC3 — Warning disparu** : ouvrir `localhost:8082`, console DevTools → plus de "shadow* style props are deprecated".
- **AC4 — Visuel identique** : screenshots avant/après sur les composants modifiés (badges, dialog, modal, tooltip, FAB, skeleton) → pas de régression visuelle.
- **AC5 — Tokens centralisés** : si un composant peut utiliser `shadows.sm/md/lg` de `@aureak/theme/tokens.ts` à la place du pattern Platform.select inline, le faire. Vérifier que `shadows.sm` etc. retournent une string boxShadow valide pour web.
- **AC6 — Conformité** : tsc OK, pas de hardcode.

## Tasks / Subtasks

- [ ] **T1 — Audit `@aureak/theme/shadows`** : vérifier ce que retournent `shadows.sm/md/lg/xl` actuellement (probablement déjà des strings boxShadow). Si oui, simplifier les composants en consommant le token.
- [ ] **T2 — Migrer 9 fichiers** : pour chacun, remplacer le bloc shadow* legacy par :
  - `web:` boxShadow équivalent (calculer à partir des shadow* iOS : offset H/V → 1ère paire, radius → blur, color+opacity → rgba)
  - OU consommer `shadows.{level}` du theme si applicable
- [ ] **T3 — Test runtime** : ouvrir chaque page consommatrice (notamment FAB sur /activites/seances, ResponsiveModal, ConfirmDialog) → vérifier visuel + console clean
- [ ] **T4 — `cd aureak && npx tsc --noEmit -p .`**
- [ ] **T5 — Commit** : `chore(theme): migrate shadow* props to boxShadow (RN-web deprecation)`

## Fichiers touchés

### Modifiés (9)
- `aureak/packages/ui/src/GroupOfMonthBadge.tsx`
- `aureak/packages/ui/src/BadgeGrid.tsx`
- `aureak/packages/ui/src/components/ConfirmDialog.tsx`
- `aureak/apps/web/components/SkeletonCard.tsx`
- `aureak/apps/web/components/NavTooltip.tsx`
- `aureak/apps/web/components/admin/PrimaryAction.tsx`
- `aureak/apps/web/components/admin/ResponsiveModal.tsx`
- `aureak/apps/web/components/admin/children/ScoutEvaluationModal.tsx`
- `aureak/apps/web/components/admin/children/TrialInvitationModal.tsx`

### Possiblement modifié
- `aureak/packages/theme/src/tokens.ts` (si refactoring des tokens shadow)

## Notes

- Pas d'impact métier ni DB. Pure dette technique frontend.
- Conversion `shadowOffset { width: 0, height: 2 } + shadowOpacity: 0.1 + shadowRadius: 4 + shadowColor: '#000'` ⇒ `boxShadow: '0 2px 4px rgba(0,0,0,0.1)'`.
- Si visuel diffère (RN-web simulait shadow* différemment), ajuster blur/spread pour matcher.
- Possible follow-up : si `shadows.{sm,md,lg,xl}` ne sont pas déjà des strings boxShadow, créer une story 110.10.b pour les centraliser.
