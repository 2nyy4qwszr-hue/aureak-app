# Story 56.4 : Groupes — Drag-drop transfer joueur entre groupes

Status: done

## Story

En tant qu'administrateur ou coach,
Je veux pouvoir glisser-déposer un joueur d'un groupe vers un autre,
Afin de réorganiser les groupes rapidement et intuitivement sans passer par des menus multiples.

## Contexte & Décisions de Design

### Interaction drag-drop (web)
Sur desktop : `onDragStart`, `onDragOver`, `onDrop` HTML5 standard (via `draggable` attribute). Le joueur draggé est représenté par un ghost semi-transparent.
Sur mobile : alternative bouton "Transférer" (les APIs drag-drop HTML5 ne sont pas fiables sur mobile web).

### Flux de transfert
1. L'utilisateur drag un avatar joueur (dans la liste d'un groupe ouvert)
2. Il le dépose sur la `GroupCard` d'un autre groupe (zone de drop mise en évidence en vert)
3. Une modale de confirmation s'ouvre : "Transférer [Nom] du groupe [A] vers le groupe [B] ?"
4. Confirmation → appel API `transferGroupMember(childId, fromGroupId, toGroupId)`
5. Mise à jour optimiste des listes (enlever du groupe A, ajouter au groupe B)

### API `transferGroupMember`
Opération atomique : DELETE de `group_members` WHERE group_id=fromGroupId AND child_id + INSERT dans `group_members` WHERE group_id=toGroupId. Soft-delete existant si applicable.

### Mise en évidence zone de drop
Quand le drag est actif : les autres `GroupCard` affichent un fond légèrement vert (`#10B981` opacité 0.1) et une bordure verte pointillée pour indiquer qu'elles acceptent le drop.

## Acceptance Criteria

**AC1 — Drag d'un joueur depuis un groupe**
- **Given** la page groupes avec un groupe ouvert/étendu montrant ses membres
- **When** l'admin drag un joueur
- **Then** un ghost semi-transparent suit le curseur
- **And** les autres GroupCards s'illuminent en vert pour indiquer les zones de drop acceptables

**AC2 — Drop sur un groupe cible**
- **Given** un joueur en cours de drag
- **When** l'admin drop sur une autre GroupCard
- **Then** la zone de drop cesse de s'illuminer
- **And** une modale de confirmation s'ouvre avec les noms du joueur, groupe source et groupe cible

**AC3 — Confirmation et transfert**
- **Given** la modale de confirmation ouverte
- **When** l'admin clique "Confirmer le transfert"
- **Then** `transferGroupMember(childId, fromGroupId, toGroupId)` est appelé
- **And** le joueur disparaît du groupe source et apparaît dans le groupe cible (mise à jour optimiste)
- **And** la modale se ferme

**AC4 — Annulation du transfert**
- **Given** la modale de confirmation ouverte
- **When** l'admin clique "Annuler"
- **Then** la modale se ferme sans modification
- **And** le joueur reste dans son groupe d'origine

**AC5 — API `transferGroupMember` atomique**
- **Given** un appel à `transferGroupMember(childId, fromGroupId, toGroupId)`
- **When** l'opération est exécutée
- **Then** le joueur est retiré de `fromGroupId` ET ajouté à `toGroupId` en une transaction
- **And** en cas d'erreur, aucune modification partielle n'est persistée (rollback)

**AC6 — Alternative mobile (bouton Transférer)**
- **Given** un utilisateur sur mobile ou appareil tactile
- **When** il ouvre la fiche d'un membre dans le groupe
- **Then** un bouton "Transférer vers un autre groupe" est visible
- **And** il ouvre un sélecteur de groupe cible puis la même modale de confirmation

## Tasks

- [x] Ajouter `transferGroupMember(childId, fromGroupId, toGroupId, tenantId)` dans `@aureak/api-client/src/sessions/implantations.ts`
- [x] Implémenter DELETE + INSERT avec rollback DB si insert échoue
- [x] Ajouter attributs `draggable` sur les items joueurs dans `groups/[groupId]/page.tsx`
- [x] Implémenter `onDragStart`, `onDragOver`, `onDrop` sur `GroupCard` dans `groups/index.tsx`
- [x] Mise en évidence zone de drop (fond vert, bordure verte) pendant le drag via `isDragOver`
- [x] Modale de confirmation de transfert
- [x] Mise à jour optimiste des listes (enlever/ajouter localement avant confirmation serveur)
- [x] Bouton "Transférer" alternatif pour mobile dans la fiche membre (JoueursTab)
- [x] Gestion d'erreur : rollback optimiste si l'API échoue, message d'erreur affiché
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : simuler drag-drop, vérifier modale, confirmer — skipped (app non démarrée)

## Fichiers concernés

- `aureak/packages/api-client/src/sessions/implantations.ts` (transferGroupMember)
- `aureak/apps/web/app/(admin)/groups/index.tsx` (drag-drop, zones de drop)
- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` (draggable items, bouton mobile)
- `aureak/packages/ui/src/GroupCard.tsx` (zones de drop onDragOver/onDrop)

## Dépendances

- Story 56-1 (GroupCard) — requis (zone de drop s'intègre dans GroupCard)
- Story 56-3 (PlayerAvatarGrid) recommandée mais non bloquante

## Notes techniques

- HTML5 Drag and Drop : `dataTransfer.setData('childId', childId)` au drag start, `dataTransfer.getData('childId')` au drop
- La transaction SQL peut utiliser `supabase.rpc('transfer_group_member', {...})` si une transaction est requise, sinon deux appels séquentiels (delete puis insert) avec rollback manuel en JS
- Rollback optimiste : sauvegarder l'état avant modification, restaurer si erreur API
