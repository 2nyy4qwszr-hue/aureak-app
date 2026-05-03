# Story 105.4 : Drag & drop kanban stage groupes (v1.1)

Status: ready-for-dev

Dépend de : 105.3 (table stage_groups + API + UI kanban menu déplacer)

## Story

En tant qu'**admin**,
je veux **glisser-déposer les cartes gardiens entre colonnes du kanban groupes au lieu de passer par le menu "↔ Déplacer"**,
afin d'**accélérer la répartition (geste naturel sur desktop, alternative au menu déjà existant)**.

## Contexte

Story 105.3 a livré le kanban avec menu "↔ Déplacer" par carte. C'était le scope v1.0 (volontairement simple, sans dépendance npm). v1.1 ajoute le drag & drop natif HTML5 OU via `@dnd-kit/core` (déjà dans Aureak ? à vérifier).

Décision pattern : **HTML5 native drag & drop** suffit pour ce cas (pas besoin de `@dnd-kit` qui ajoute ~30kb au bundle). Web-only (mobile garde le menu existant).

## Acceptance Criteria

- **AC1 — Carte draggable desktop** : sur `/evenements/stages/[stageId]/groupes` desktop (≥ 1024px), chaque `<View>` ChildCard a `draggable={true}` + `onDragStart` qui set le child ID dans `dataTransfer`.
- **AC2 — Colonne droppable desktop** : chaque colonne a `onDragOver={preventDefault}` + `onDrop` qui lit le child ID et appelle `moveChildToGroup(stageId, childId, targetGroupId)`.
- **AC3 — Feedback visuel** : pendant un drag, la colonne survolée a un fond `colors.accent.gold + '10'` + bordure `colors.accent.gold`. Reset au `onDragLeave` + `onDrop`.
- **AC4 — Menu menu "↔ Déplacer" préservé** : sur mobile (< 1024px), le menu existant reste l'unique moyen de déplacer (drag & drop HTML5 ne marche pas sur touch).
- **AC5 — Pas de régression création / renommage / suppression** : les autres actions du kanban fonctionnent toujours.
- **AC6 — Conformité** : pas de nouvelle dépendance npm. Si `@dnd-kit/core` est déjà dans `package.json`, l'utiliser à la place du drag HTML5 natif.

## Tasks / Subtasks

- [ ] T1 — Ajouter `draggable` + `onDragStart`/`onDragEnd` sur ChildCard (groupes/page.tsx)
- [ ] T2 — Ajouter `onDragOver`/`onDrop`/`onDragLeave` sur GroupColumn
- [ ] T3 — État local `hoveredGroupId` pour le feedback visuel
- [ ] T4 — Garde `Platform.OS === 'web'` + `width >= 1024` sinon désactivé
- [ ] T5 — `cd aureak && npx tsc --noEmit`
- [ ] T6 — Test desktop : drag carte de Groupe 1 → Groupe 2 → vérif persistance après refresh

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/evenements/stages/[stageId]/groupes/page.tsx`

## Notes

- HTML5 drag & drop nécessite `<div>` ou attribut `draggable` que React Native View ne supporte pas natif. Sur RN-web, utiliser `{...({ draggable: true, onDragStart: ..., onDrop: ... } as any)}` cast ou wrap en `<div>` HTML.
- Si l'expérience drag est bancale en RN-web, retomber sur `@dnd-kit/core` (mais validation budget bundle requise).
- Aucun changement DB / API client (réutilise `moveChildToGroup` de 105.3).
