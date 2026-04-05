# Story 49-2 — UX : Blocs thèmes éditables depuis la fiche séance

**Epic** : 49 — Bugfix + UX batch avril 2026 #2
**Status** : done
**Priority** : P2 — UX bloquant (édition post-création impossible)
**Créée le** : 2026-04-04

---

## Contexte

Sur la fiche d'une séance existante (`(admin)/seances/[sessionId]`), la section
"Thèmes pédagogiques" affiche "Aucun thème associé" avec **aucun moyen d'en ajouter**.
Les blocs thème ne peuvent être ajoutés/supprimés que pendant la création de la séance.

Ce bug UX empêche les coachs de corriger ou compléter les thèmes pédagogiques d'une séance
après sa création, ce qui est un cas d'usage courant (séance planifiée à l'avance, thème
confirmé le jour-même).

---

## User Story

**En tant qu'** admin ou coach,
**je veux** pouvoir ajouter et supprimer des thèmes pédagogiques directement depuis la fiche
d'une séance existante,
**afin de** maintenir les informations pédagogiques à jour sans avoir à recréer la séance.

---

## Acceptance Criteria

### AC1 — Bouton d'ajout visible
- Un bouton "+ Ajouter un thème" est visible dans la section "Thèmes pédagogiques" de la fiche
  séance (`[sessionId]/page.tsx`)
- Le bouton est affiché qu'il y ait 0 ou N thèmes déjà associés

### AC2 — Picker inline fonctionnel
- Cliquer sur "+ Ajouter un thème" affiche un picker inline (dropdown ou modal léger)
- Le picker liste les thèmes de la bibliothèque méthodologie (table `methodology_themes`,
  actifs uniquement, triés par titre)
- Les thèmes déjà associés à la séance sont visuellement désactivés ou exclus de la liste
- Le picker affiche le titre du thème et, si disponible, la méthode associée (badge coloré)

### AC3 — Ajout d'un bloc thème
- Sélectionner un thème dans le picker crée un `session_theme_block` via
  `addSessionThemeBlock()` de `@aureak/api-client`
- La liste des thèmes se rafraîchit **sans rechargement de page** (mise à jour du state local)
- Le `sort_order` du nouveau bloc = longueur actuelle de `themeBlocks` (append en fin de liste)
- Un état de chargement (spinner ou désactivation du bouton) est visible pendant l'appel API
- En cas d'erreur API, un message d'erreur inline est affiché sous le picker

### AC4 — Suppression d'un bloc thème
- Chaque thème affiché dans la liste comporte un bouton de suppression (croix ou "Retirer")
- Cliquer sur "Retirer" affiche une confirmation inline simple ("Retirer ce thème ?")
  [Confirmer] [Annuler] — pas de modal plein écran
- Confirmer appelle `removeSessionThemeBlock(blockId)` de `@aureak/api-client`
- La liste se met à jour localement sans rechargement de page (retrait optimistic)
- En cas d'erreur API lors de la suppression, le thème est remis dans la liste + message d'erreur

### AC5 — Persistance vérifiable
- Après ajout d'un thème, recharger la page (`F5`) — le thème est toujours présent
- Après suppression d'un thème, recharger la page — le thème est bien absent

### AC6 — Règles de code respectées
- `try/finally` obligatoire sur tous les state setters de chargement (`setAddingTheme`,
  `setRemovingThemeId`)
- `console.error` avec guard `NODE_ENV !== 'production'` sur toutes les erreurs catchées
- Accès Supabase uniquement via `@aureak/api-client` (pas d'import direct de supabase)
- Styles uniquement via tokens `@aureak/theme`

---

## Technical Notes

### API disponible — aucune migration nécessaire

La table `session_theme_blocks` existe (migration 00072). Les trois fonctions API nécessaires
sont déjà exportées depuis `@aureak/api-client/src/sessions/session-theme-blocks.ts` :

| Fonction | Signature | Usage |
|----------|-----------|-------|
| `listSessionThemeBlocks(sessionId)` | `Promise<SessionThemeBlock[]>` | Déjà appelée au chargement |
| `addSessionThemeBlock(params)` | `Promise<{data, error}>` | Ajout d'un bloc |
| `removeSessionThemeBlock(blockId)` | `Promise<{error}>` | Suppression d'un bloc |

La liste des thèmes de la bibliothèque est disponible via :
```typescript
import { listMethodologyThemes } from '@aureak/api-client'
// Retourne MethodologyTheme[] (actifs, triés par titre)
await listMethodologyThemes({ activeOnly: true })
```

`MethodologyTheme` expose : `id`, `title`, `method` (nullable), `bloc` (nullable).

### Fichier à modifier

Un seul fichier UI à modifier :
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### État à ajouter

```typescript
// Picker thème
const [showThemePicker, setShowThemePicker] = useState(false)
const [availableThemes, setAvailableThemes] = useState<MethodologyTheme[]>([])
const [addingTheme,     setAddingTheme]     = useState(false)
const [themeAddError,   setThemeAddError]   = useState<string | null>(null)
// Suppression
const [removingThemeId, setRemovingThemeId] = useState<string | null>(null)
const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
```

### Chargement des thèmes disponibles

Charger `availableThemes` à l'ouverture du picker (lazy) ou au montage si préféré.
Exclure de la liste les thèmes dont l'`id` est déjà dans `themeBlocks.map(b => b.themeId)`.

### Logique d'ajout

```typescript
async function handleAddTheme(themeId: string) {
  if (!session || !sessionId) return
  setAddingTheme(true)
  setThemeAddError(null)
  try {
    const { data, error } = await addSessionThemeBlock({
      sessionId,
      tenantId : session.tenantId,
      themeId,
      sortOrder: themeBlocks.length,
    })
    if (error || !data) {
      setThemeAddError(error ?? 'Erreur inconnue')
      return
    }
    // Enrichir avec le nom du thème pour l'affichage immédiat
    const theme = availableThemes.find(t => t.id === themeId)
    setThemeBlocks(prev => [...prev, { ...data, themeName: theme?.title }])
    setShowThemePicker(false)
  } finally {
    setAddingTheme(false)
  }
}
```

### Logique de suppression

```typescript
async function handleRemoveTheme(blockId: string) {
  setRemovingThemeId(blockId)
  const snapshot = themeBlocks // sauvegarde pour rollback
  setThemeBlocks(prev => prev.filter(b => b.id !== blockId)) // optimistic
  try {
    const { error } = await removeSessionThemeBlock(blockId)
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] removeThemeBlock error:', error)
      setThemeBlocks(snapshot) // rollback
    }
  } finally {
    setRemovingThemeId(null)
    setConfirmRemoveId(null)
  }
}
```

### Import à ajouter

```typescript
import { ..., addSessionThemeBlock, removeSessionThemeBlock, listMethodologyThemes } from '@aureak/api-client'
import type { ..., MethodologyTheme } from '@aureak/types'
```

### Rendu de la section thèmes (ligne ~499)

Remplacer le bloc actuel (lignes 499–526) par une version incluant :
1. Header de section avec le bouton "+ Ajouter un thème" à droite
2. Liste des blocs existants avec bouton "Retirer" par item
3. Confirmation inline (row) quand `confirmRemoveId === b.id`
4. Picker inline (liste scrollable) sous le bouton quand `showThemePicker === true`
5. Message d'erreur `themeAddError` sous le picker

---

## Tasks

- [x] T1 — Vérification API (lecture seule, pas de code à écrire)
  - Confirmer que `addSessionThemeBlock`, `removeSessionThemeBlock`, `listMethodologyThemes`
    sont bien exportés depuis `@aureak/api-client` (index.ts ou re-exports)
  - Vérifier que `MethodologyTheme` est bien dans `@aureak/types`

- [x] T2 — UI : bouton d'ajout + picker inline
  - Ajouter les states `showThemePicker`, `availableThemes`, `addingTheme`, `themeAddError`
  - Ajouter les imports manquants dans `page.tsx`
  - Modifier le header de la section "Thèmes pédagogiques" pour inclure le bouton "+ Ajouter"
  - Implémenter le picker inline : chargement `listMethodologyThemes`, filtrage des déjà
    associés, affichage liste, sélection → `handleAddTheme()`
  - Respecter les tokens de thème (`colors.light.*`, `colors.border.*`, `shadows.sm`)

- [x] T3 — UI : suppression d'un bloc existant
  - Ajouter les states `removingThemeId`, `confirmRemoveId`
  - Ajouter bouton "Retirer" sur chaque item de la liste des thèmes
  - Afficher la ligne de confirmation inline quand `confirmRemoveId === b.id`
  - Implémenter `handleRemoveTheme()` avec optimistic update + rollback

- [x] T4 — QA scan
  - Vérifier `try/finally` sur `setAddingTheme` et `setRemovingThemeId`
  - Vérifier `console.error` avec guard `NODE_ENV !== 'production'`
  - Test manuel : ajouter un thème → recharger → thème persisté ✓
  - Test manuel : supprimer un thème → recharger → thème absent ✓

---

## Dependencies

- **Aucune story bloquante** — les tables et APIs sont déjà en place
- Migration 00072 (`session_theme_blocks`) : existante
- `@aureak/api-client/src/sessions/session-theme-blocks.ts` : existant, toutes fonctions présentes
- `@aureak/api-client/src/methodology.ts` : `listMethodologyThemes()` existante
- `MethodologyTheme` dans `@aureak/types` : existant

---

## Files to Modify

```
aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx   ← modification UI principale
```

Aucun nouveau fichier à créer. Aucune migration nécessaire.

---

## Out of Scope

- Réordonner les blocs thème (drag-and-drop) — non demandé
- Ajouter des séquences ou ressources depuis la fiche — non demandé
- Modifier un bloc thème existant (changer de thème) — non demandé
- Ateliers (workshops) — section séparée, non concernée par cette story
