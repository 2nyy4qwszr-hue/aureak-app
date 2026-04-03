# Story 37-1 — UX: confirmations actions destructives

**Epic:** 37
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin, je veux qu'une fenêtre de confirmation apparaisse avant toute action destructive (dissocier un joueur, supprimer un historique) afin d'éviter les suppressions accidentelles.

## Acceptance Criteria
- [ ] AC1: Un composant `ConfirmDialog` existe dans `@aureak/ui` avec props `title`, `message`, `confirmLabel`, `cancelLabel?`, `onConfirm`, `onCancel`, `visible`.
- [ ] AC2: `ConfirmDialog` est centré sur écran avec overlay semi-transparent (`colors.overlay.modal`), fond `colors.light.surface`, bouton "Annuler" (variant ghost) et bouton `confirmLabel` (variant danger).
- [ ] AC3: Avant de dissocier un joueur dans `clubs/[clubId]/page.tsx`, un `ConfirmDialog` s'affiche avec message explicite incluant le nom du joueur.
- [ ] AC4: Avant de dissocier un coach dans `clubs/[clubId]/page.tsx`, un `ConfirmDialog` s'affiche.
- [ ] AC5: Avant de supprimer une entrée d'historique dans `children/[childId]/page.tsx`, un `ConfirmDialog` s'affiche.
- [ ] AC6: Si l'utilisateur clique "Annuler", aucune action n'est effectuée et le dialog se ferme.
- [ ] AC7: `ConfirmDialog` est accessible : focus trap dans le dialog, Escape = annuler.

## Tasks
- [ ] Créer `aureak/packages/ui/src/ConfirmDialog.tsx` avec les props définies en AC1, overlay + modal centrée, boutons via composant `Button` de `@aureak/ui`.
- [ ] Exporter `ConfirmDialog` depuis `aureak/packages/ui/src/index.ts`.
- [ ] Ajouter state local `confirmUnlink: { type: 'player'|'coach', id: string, name: string } | null` dans `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`.
- [ ] Remplacer les appels directs `unlinkChildFromClubDirectory` / `unlinkCoachFromClubDirectory` par l'ouverture du `ConfirmDialog` ; exécuter l'action seulement dans `onConfirm`.
- [ ] Ajouter state local `confirmDeleteHistory: { historyId: string } | null` dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`.
- [ ] Remplacer l'appel direct `deleteHistoryEntry` par ouverture du `ConfirmDialog` ; exécuter dans `onConfirm`.
- [ ] QA scan : vérifier try/finally dans les callbacks `onConfirm` qui appellent des APIs.
- [ ] QA scan : vérifier console guards dans les nouveaux fichiers.

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/ConfirmDialog.tsx` (créer)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Pattern state recommandé :
  ```typescript
  const [confirmAction, setConfirmAction] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null)
  ```
- Focus trap : sur web, utiliser `autoFocus` sur le bouton "Annuler" et `onKeyDown` Escape sur l'overlay
- Pas de migration Supabase nécessaire — feature purement frontend
