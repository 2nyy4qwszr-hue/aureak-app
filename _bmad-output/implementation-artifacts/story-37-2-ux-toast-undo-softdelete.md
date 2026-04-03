# Story 37-2 — UX: toast annuler soft-delete

**Epic:** 37
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux pouvoir annuler une dissociation pendant 5 secondes après qu'elle a été effectuée afin de corriger les erreurs sans naviguer vers une page de confirmation.

## Acceptance Criteria
- [ ] AC1: `ToastContext.tsx` supporte une prop `action?: { label: string; onPress: () => void }` dans son interface de toast.
- [ ] AC2: Un toast avec action affiche le message ET un bouton `action.label` cliquable à droite.
- [ ] AC3: Après dissociation d'un joueur dans `clubs/[clubId]/page.tsx`, un toast "Joueur dissocié" avec bouton "Annuler" apparaît pendant 5 secondes.
- [ ] AC4: Si "Annuler" est pressé dans les 5 secondes, le joueur est re-lié via l'API (appel `linkChildToClubDirectory`) et la liste se met à jour.
- [ ] AC5: Si 5 secondes s'écoulent sans interaction, la dissociation est définitive.
- [ ] AC6: Le bouton "Annuler" du toast ne s'affiche plus après 5 secondes (timer auto-dismiss).

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/_components/ToastContext.tsx` (ou chemin réel) pour comprendre l'interface actuelle.
- [ ] Modifier l'interface `ToastOptions` dans `ToastContext.tsx` : ajouter `action?: { label: string; onPress: () => void }`.
- [ ] Modifier le composant de rendu du toast pour afficher un bouton `action.label` quand `action` est défini.
- [ ] Dans `clubs/[clubId]/page.tsx`, après l'appel `unlinkChildFromClubDirectory` (dans `onConfirm` du ConfirmDialog ou directement), appeler `showToast({ message: 'Joueur dissocié', duration: 5000, action: { label: 'Annuler', onPress: handleUndoUnlink } })`.
- [ ] Implémenter `handleUndoUnlink` : appelle `linkChildToClubDirectory` avec les données du joueur dissocié, met à jour le state local optimiste, gère l'erreur.
- [ ] QA scan : try/finally dans `handleUndoUnlink`.

## Dev Notes
- Fichiers à modifier:
  - `ToastContext.tsx` (chercher avec Glob `**/ToastContext.tsx`)
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
- Le joueur dissocié doit être conservé en mémoire locale le temps du countdown (variable `lastUnlinkedPlayer` dans un `useRef` ou state local).
- Pattern recommandé :
  ```typescript
  const lastUnlinked = useRef<{ childId: string; linkType: ClubChildLinkType; displayName: string } | null>(null)
  // après unlink : lastUnlinked.current = { childId, linkType, displayName }
  // dans handleUndo : appeler linkChildToClubDirectory(clubId, lastUnlinked.current)
  ```
- Cette story est complémentaire à story-37-1 (ConfirmDialog) mais indépendante — peut être implémentée séparément
- Ne faire l'undo que pour la dissociation joueur (pas coach) dans cette story — garder le scope minimal
