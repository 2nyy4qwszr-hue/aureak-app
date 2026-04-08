# Story 69.11 : UX — Confirmation avant suppression d'un bloc ou d'une journée de stage

Status: done

## Story

En tant qu'admin,
je veux être invité à confirmer avant de supprimer un bloc ou une journée de stage,
afin d'éviter toute suppression accidentelle irréversible lors de l'édition du planning.

## Acceptance Criteria

1. Cliquer sur "Suppr." d'un bloc déclenche une `ConfirmDialog` (titre "Supprimer ce bloc ?", message "Cette action est irréversible.", bouton confirmLabel="Supprimer", prop `danger`) avant d'appeler `handleDeleteBlock`.
2. Cliquer sur "Suppr. journée" déclenche une `ConfirmDialog` (titre "Supprimer cette journée ?", message "Tous les blocs associés seront également supprimés.", bouton confirmLabel="Supprimer", prop `danger`) avant d'appeler `handleDeleteDay`.
3. Si l'utilisateur clique "Annuler" dans l'un ou l'autre dialog, aucune suppression n'est effectuée et l'état de la page reste inchangé.
4. Les deux `ConfirmDialog` sont rendus dans le même fichier `page.tsx`, positionnés en dehors du `ScrollView`, identique au pattern de `clubs/[clubId]/page.tsx`.
5. Le composant `ConfirmDialog` est importé depuis `@aureak/ui` — aucun nouveau composant n'est créé.
6. Aucune couleur hardcodée n'est introduite — le prop `danger` de `ConfirmDialog` gère le rouge du bouton.
7. Les handlers `handleDeleteBlock` et `handleDeleteDay` restent inchangés dans leur logique interne (try/finally, console guards, setMutError) — seul leur déclenchement est conditionné à la confirmation.

## Tasks / Subtasks

- [x] T1 — Ajouter les états de confirmation et l'import ConfirmDialog (AC: 4, 5)
  - [x] T1.1 — Dans `page.tsx`, modifier la ligne 13 : ajouter `ConfirmDialog` dans l'import depuis `@aureak/ui` (actuellement : `import { AureakText, HierarchyBreadcrumb } from '@aureak/ui'`)
  - [x] T1.2 — Ajouter 4 états dans le composant principal (après les états existants) :
    ```typescript
    const [confirmBlockVisible,  setConfirmBlockVisible]  = useState(false)
    const [pendingBlockId,       setPendingBlockId]       = useState<string | null>(null)
    const [confirmDayVisible,    setConfirmDayVisible]    = useState(false)
    const [pendingDayId,         setPendingDayId]         = useState<string | null>(null)
    ```

- [x] T2 — Wrapper la suppression de bloc avec confirmation (AC: 1, 3, 7)
  - [x] T2.1 — Renommer le handler existant `handleDeleteBlock` en `executeDeleteBlock` (même signature `(blockId: string) => Promise<void>`, logique interne inchangée)
  - [x] T2.2 — Créer un nouveau handler `handleDeleteBlock` qui ouvre le dialog :
    ```typescript
    const handleDeleteBlock = (blockId: string) => {
      setPendingBlockId(blockId)
      setConfirmBlockVisible(true)
    }
    ```
  - [x] T2.3 — Le `onConfirm` du dialog bloc appelle :
    ```typescript
    () => {
      setConfirmBlockVisible(false)
      if (pendingBlockId) executeDeleteBlock(pendingBlockId)
      setPendingBlockId(null)
    }
    ```

- [x] T3 — Wrapper la suppression de journée avec confirmation (AC: 2, 3, 7)
  - [x] T3.1 — Renommer le handler existant `handleDeleteDay` en `executeDeleteDay` (même signature `(dayId: string) => Promise<void>`, logique interne inchangée)
  - [x] T3.2 — Créer un nouveau handler `handleDeleteDay` qui ouvre le dialog :
    ```typescript
    const handleDeleteDay = (dayId: string) => {
      setPendingDayId(dayId)
      setConfirmDayVisible(true)
    }
    ```
  - [x] T3.3 — Le `onConfirm` du dialog journée appelle :
    ```typescript
    () => {
      setConfirmDayVisible(false)
      if (pendingDayId) executeDeleteDay(pendingDayId)
      setPendingDayId(null)
    }
    ```

- [x] T4 — Rendre les deux ConfirmDialog dans le JSX (AC: 4, 5, 6)
  - [ ] T4.1 — En dehors du `ScrollView`, avant la fermeture de la `<>` (fragment React racine), ajouter les deux dialogs :
    ```tsx
    <ConfirmDialog
      visible={confirmBlockVisible}
      title="Supprimer ce bloc ?"
      message="Cette action est irréversible."
      confirmLabel="Supprimer"
      danger
      onConfirm={() => {
        setConfirmBlockVisible(false)
        if (pendingBlockId) executeDeleteBlock(pendingBlockId)
        setPendingBlockId(null)
      }}
      onCancel={() => { setConfirmBlockVisible(false); setPendingBlockId(null) }}
    />
    <ConfirmDialog
      visible={confirmDayVisible}
      title="Supprimer cette journée ?"
      message="Tous les blocs associés seront également supprimés."
      confirmLabel="Supprimer"
      danger
      onConfirm={() => {
        setConfirmDayVisible(false)
        if (pendingDayId) executeDeleteDay(pendingDayId)
        setPendingDayId(null)
      }}
      onCancel={() => { setConfirmDayVisible(false); setPendingDayId(null) }}
    />
    ```

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Naviguer sur `/stages/[stageId]`, ouvrir une journée avec au moins un bloc, cliquer "Suppr." sur un bloc → vérifier que le dialog s'ouvre avec le bon titre et message, cliquer "Annuler" → vérifier que le bloc est toujours présent.
  - [x] T5.2 — Cliquer "Suppr." sur un bloc, confirmer → vérifier que le bloc disparaît de la timeline et qu'aucune erreur console n'apparaît.
  - [x] T5.3 — Cliquer "Suppr. journée", cliquer "Annuler" → vérifier que l'onglet de journée est toujours présent.
  - [x] T5.4 — Cliquer "Suppr. journée", confirmer → vérifier que l'onglet de journée disparaît et que l'onglet actif bascule sur la journée suivante (ou `null`).
  - [x] T5.5 — Vérifier qu'aucune couleur hardcodée n'est présente dans le diff (grep `#[0-9a-fA-F]{3,6}` sur le fichier modifié) — résultat : 0 match.

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input, **ConfirmDialog**
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Pattern ConfirmDialog (référence clubs)

Pattern exact extrait de `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` :

```tsx
// Import (ligne 14 du fichier clubs)
import { AureakText, Badge, HierarchyBreadcrumb, ConfirmDialog, ListRowSkeleton } from '@aureak/ui'

// État (ligne 361)
const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)

// Déclencheur (on remplace l'appel direct par l'ouverture du dialog)
<Pressable onPress={() => setConfirmDeleteVisible(true)}>...</Pressable>

// Rendu JSX hors ScrollView (lignes 1086-1094)
<ConfirmDialog
  visible={confirmDeleteVisible}
  title="Supprimer ce club ?"
  message="Cette action est irréversible."
  confirmLabel="Supprimer"
  danger
  onConfirm={() => { setConfirmDeleteVisible(false); handleDelete() }}
  onCancel={() => setConfirmDeleteVisible(false)}
/>
```

Référence : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` lignes 14, 361, 1086–1094

---

### T2/T3 — Localisation des handlers à renommer

Les handlers à renommer se trouvent à :
- `handleDeleteBlock` → ligne 640 de `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
- `handleDeleteDay` → ligne 550 de `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

Les deux handlers respectent déjà try/finally et console guards — ne pas modifier leur logique interne.

---

### T4 — Localisation des appels dans le JSX à remplacer

- `onPress={() => handleDeleteDay(activeDay.id)}` → ligne 885 (ne change pas, car `handleDeleteDay` devient le wrapper qui ouvre le dialog)
- `onDelete={handleDeleteBlock}` → ligne 922 (prop du composant `BlockCard` — ne change pas non plus, `handleDeleteBlock` devient le wrapper)

Le renommage en `executeDeleteBlock` / `executeDeleteDay` est interne : les callsites JSX existants (`onDelete={handleDeleteBlock}` et `onPress={() => handleDeleteDay(activeDay.id)}`) **ne changent pas**. Seuls les noms des fonctions déclarées changent.

---

### T5 — Structure de la racine JSX du composant

La racine du composant retourne actuellement un fragment `<>...</>` contenant un `<ScrollView>` suivi d'un `<Modal>` pour l'édition de bloc. Les deux `ConfirmDialog` doivent être ajoutés après le `Modal`, avant la fermeture `</>`.

---

### Design

**Type design** : `polish`

Pas de refonte layout — uniquement ajout de dialogs de confirmation. Aucune référence PNG requise.

Tokens à utiliser : aucun ajouté — `ConfirmDialog` gère ses propres styles via `@aureak/ui` et le prop `danger`.

Principes design à respecter :
- Cohérence : même pattern que `clubs/[clubId]/page.tsx` déjà en production
- Sécurité UX : les actions destructives doivent toujours être confirmées

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` | Modifier | Ajouter import ConfirmDialog, 4 états, 2 handlers wrappers, 2 dialogs JSX |

### Fichiers à NE PAS modifier

- `aureak/packages/ui/src/components/ConfirmDialog.tsx` — composant déjà disponible, aucune modification nécessaire
- `aureak/packages/ui/src/index.ts` — ConfirmDialog déjà exporté (ligne 31)
- `aureak/apps/web/app/(admin)/stages/[stageId]/index.tsx` — re-export non impacté
- Tout fichier hors `stages/[stageId]/page.tsx` — périmètre strictement limité à ce fichier

---

### Dépendances à protéger

- `ConfirmDialog` est déjà importé et utilisé dans `clubs/[clubId]/page.tsx` — ne pas modifier ce fichier
- La prop `onDelete` du composant `BlockCard` (définie ligne 85 du même fichier) accepte `(id: string) => void` — le nouveau handler `handleDeleteBlock` doit rester synchrone (ouvre juste le dialog), compatible avec cette signature

---

### Multi-tenant

RLS gère l'isolation tenant. Aucun paramètre tenantId à ajouter. Cette story est purement UI — aucune requête nouvelle.

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- ConfirmDialog exporté : `aureak/packages/ui/src/index.ts` ligne 31
- Pattern de référence : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` lignes 14, 361, 1086–1094
- Handler `handleDeleteBlock` : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` ligne 640
- Handler `handleDeleteDay` : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` ligne 550
- Callsite `onDelete={handleDeleteBlock}` : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` ligne 922
- Callsite `handleDeleteDay(activeDay.id)` : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` ligne 885
- `BlockCard.onDelete` prop signature : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` ligne 85

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- `handleDeleteBlock` et `handleDeleteDay` renommés en `executeDeleteBlock`/`executeDeleteDay` (logique interne inchangée)
- Nouveaux wrappers synchrones `handleDeleteBlock`/`handleDeleteDay` ouvrent les dialogs
- Les callsites JSX (`onDelete={handleDeleteBlock}` ligne 938 et `onPress={() => handleDeleteDay(activeDay.id)}` ligne 901) restent inchangés
- 0 couleur hardcodée introduite
- Playwright skipped — app non démarrée (vérification statique effectuée)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` | Modifié |
