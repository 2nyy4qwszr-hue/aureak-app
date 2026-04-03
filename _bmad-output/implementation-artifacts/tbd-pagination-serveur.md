# Story: Pagination serveur pour les listes

**ID:** tbd-pagination-serveur
**Status:** done
**Source:** new
**Epic:** TBD — Performance

## Description
Vérifier et activer la pagination serveur pour `listChildDirectory` et `listClubDirectory`.

## Résultat audit
Les deux APIs et leurs pages UI disposent déjà d'une pagination serveur complète :

**`listChildDirectory`** (`admin/child-directory.ts`) :
- Params : `page`, `pageSize` avec `.range(page * pageSize, (page + 1) * pageSize - 1)`
- Retourne `{ data, count }` avec `count: 'exact'`

**`listClubDirectory`** (`admin/club-directory.ts`) :
- Mêmes params et comportement

**UI `children/index.tsx`** et **`clubs/page.tsx`** :
- Composant `PaginationBar` avec ← / → et compteur
- State `page` réinitialisé sur changement de filtre

Aucun développement supplémentaire requis. Story validée comme déjà implémentée.

## Commit
`feat(pagination): vérification pagination serveur — déjà implémentée`
