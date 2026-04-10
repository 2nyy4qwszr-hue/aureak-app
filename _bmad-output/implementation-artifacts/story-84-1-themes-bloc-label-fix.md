# Story 84.1 : Thèmes — Renommer "THÈME ▾" → "BLOC ▾" dans la filtresRow

Status: done

## Story

En tant qu'admin consultant la page Thèmes,
je veux que le pill dropdown de filtre s'appelle "BLOC ▾" (et non "THÈME ▾"),
afin que le libellé reflète exactement ce qu'il filtre (les blocs/ThemeGroups, pas les thèmes eux-mêmes).

## Context

Dans `themes/index.tsx` (story 83.2), la filtresRow contient :
- Pill GLOBAL
- Pill **THÈME ▾** → dropdown listant les ThemeGroups (= blocs)

Le label "THÈME ▾" est trompeur car le dropdown liste des **blocs** (ThemeGroups), pas des thèmes individuels.
Il doit s'appeler **"BLOC ▾"**.

## Fix

Dans `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` :

```tsx
// Avant
{isGlobal ? 'THÈME ▾' : `${selectedGroup?.name ?? 'THÈME'} ▾`}

// Après
{isGlobal ? 'BLOC ▾' : `${selectedGroup?.name ?? 'BLOC'} ▾`}
```

Une seule ligne à modifier dans le JSX de la filtresRow.

## Acceptance Criteria

1. Le pill dropdown affiche "BLOC ▾" quand aucun bloc n'est sélectionné (état GLOBAL).
2. Quand un bloc est sélectionné, le pill affiche le nom du bloc suivi de "▾" (inchangé).
3. Aucune autre modification — styles, logique, état inchangés.

## Tasks / Subtasks

- [x] T1 — Modifier le label du pill dans `themes/index.tsx` : `'THÈME ▾'` → `'BLOC ▾'` (et fallback)

## Files to Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Changer label pill THÈME → BLOC |

## Commit

```
fix(epic-84): story 84.1 — Thèmes filtresRow THÈME ▾ → BLOC ▾
```
