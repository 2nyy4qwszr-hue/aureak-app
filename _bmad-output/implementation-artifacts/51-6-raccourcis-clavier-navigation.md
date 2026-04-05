# Story 51.6 : Raccourcis clavier navigation

Status: done

## Story

En tant qu'administrateur power user,
Je veux naviguer rapidement entre les sections de l'app via des raccourcis clavier de type "chord" (style Linear),
Afin d'opérer l'interface admin sans lever les mains du clavier et d'atteindre n'importe quelle section en 2 frappes.

## Contexte & Décisions de Design

### Pattern "chord" (style Linear)
Un chord est une séquence de 2 touches : appuyer sur une lettre (mode "préfixe"), puis immédiatement une autre lettre (action). Exemples Linear : `G I` → Inbox, `G P` → Projects.

Pour Aureak :
- `G` est la "touche préfixe" (Go to…)
- `N` est la "touche création" (New…)
- `?` affiche l'overlay d'aide

### Liste des raccourcis

| Chord | Destination |
|-------|-------------|
| `G J` | `/children` (Joueurs) |
| `G S` | `/seances` (Séances) |
| `G C` | `/clubs` (Clubs) |
| `G P` | `/presences` (Présences) |
| `G E` | `/evaluations` (Évaluations) |
| `G M` | `/methodologie` (Méthodologie) |
| `G T` | `/stages` (sTages) |
| `G D` | `/dashboard` (Dashboard) |
| `N S` | `/seances/new` (Nouvelle Séance) |
| `N J` | `/children/new` (Nouveau Joueur) |
| `N C` | `/clubs/new` (Nouveau Club) |
| `?`   | Overlay aide raccourcis |

### Fenêtre chord
Après la première touche préfixe (`G` ou `N`), une fenêtre de 1 seconde attend la seconde touche. Passé 1 seconde → état réinitialisé.

### Désactivation dans les inputs
Les raccourcis sont désactivés si le focus est sur un `input`, `textarea`, ou `contentEditable` pour éviter les conflits de saisie.

### Hook existant
Le hook `useKeyboardShortcuts` existe déjà dans `aureak/apps/web/app/hooks/useKeyboardShortcuts.ts`. Cette story l'enrichit ou le remplace par une version complète.

### Overlay d'aide
Touche `?` → modal overlay listant tous les raccourcis groupés par catégorie. Même style visuel que la command palette (fond dark, radius 16, shadow gold).

## Acceptance Criteria

**AC1 — Raccourcis chord `G X` fonctionnels**
- **Given** l'admin est sur une page et son focus n'est PAS dans un input
- **When** il appuie sur `G` puis sur `J` dans la seconde qui suit
- **Then** la navigation se déclenche vers `/children`
- **And** un feedback visuel discret indique que le préfixe `G` est actif (ex: toast 500ms "G…")

**AC2 — Raccourcis chord `N X` fonctionnels**
- **Given** l'admin appuie sur `N` puis `S`
- **When** la seconde touche est enregistrée dans la fenêtre d'1 seconde
- **Then** la navigation va vers `/seances/new`

**AC3 — Désactivation dans les champs de saisie**
- **Given** l'admin est en train de taper dans un input, textarea, ou champ search
- **When** il appuie sur `G` ou `N`
- **Then** le raccourci n'est PAS déclenché (la frappe est transmise normalement au champ)

**AC4 — Reset automatique après 1 seconde**
- **Given** l'admin appuie sur `G`
- **When** il n'appuie pas de seconde touche pendant 1 seconde
- **Then** l'état chord est réinitialisé silencieusement
- **And** aucune navigation ne se produit

**AC5 — Overlay d'aide via `?`**
- **Given** l'admin appuie sur `?` (hors input)
- **When** le modal s'ouvre
- **Then** un overlay liste tous les raccourcis groupés : "Naviguer (G)" et "Créer (N)"
- **And** Escape ferme l'overlay
- **And** cliquer outside ferme l'overlay

**AC6 — Feedback visuel préfixe actif**
- **Given** l'admin appuie sur `G` (sans avoir encore appuyé la seconde touche)
- **When** le mode préfixe est actif
- **Then** une indication discrète apparaît (ex: toast compact ou badge en bas de l'écran) affichant "G…"
- **And** cette indication disparaît après 1 seconde ou après la 2ème frappe

**AC7 — Compatibilité avec ⌘K (Story 51-3)**
- **Given** les deux hooks coexistent
- **When** l'admin appuie sur ⌘K
- **Then** la command palette s'ouvre et les raccourcis chord sont suspendus pendant que la palette est ouverte
- **And** aucun conflit entre les deux systèmes

**AC8 — Affichage dans la sidebar (hint discret)**
- **Given** la sidebar est en mode expanded
- **When** l'admin voit un item nav correspondant à un raccourci
- **Then** un hint discret du raccourci est affiché à droite du label (ex: "G J" en `colors.text.subtle`, fontSize=9)
- **And** les hints ne sont pas visibles en mode collapsed

## Tasks / Subtasks

- [x] Task 1 — Enrichir/refactorer `useKeyboardShortcuts.ts`
  - [x] 1.1 Lire le fichier existant `aureak/apps/web/app/hooks/useKeyboardShortcuts.ts`
  - [x] 1.2 Implémenter la logique chord : state `prefixKey: 'G' | 'N' | null` + timer de reset 1s
  - [x] 1.3 Definir la map `CHORD_MAP: Record<string, Record<string, string>>` :
    ```typescript
    const CHORD_MAP = {
      'G': { 'J': '/children', 'S': '/seances', 'C': '/clubs', 'P': '/presences', 'E': '/evaluations', 'M': '/methodologie', 'T': '/stages', 'D': '/dashboard' },
      'N': { 'S': '/seances/new', 'J': '/children/new', 'C': '/clubs/new' },
    }
    ```
  - [x] 1.4 Guard : si `document.activeElement` est `INPUT`, `TEXTAREA`, `SELECT` ou `contentEditable` → ignorer
  - [x] 1.5 Sur `?` → déclencher `setShortcutsHelpOpen(true)`
  - [x] 1.6 Retourner `{ prefixActive: boolean, shortcutsHelpOpen: boolean, setShortcutsHelpOpen }`

- [x] Task 2 — Composant `ShortcutsHelp.tsx`
  - [x] 2.1 Créer `aureak/apps/web/components/ShortcutsHelp.tsx`
  - [x] 2.2 Overlay modal identique à CommandPalette : fond `colors.overlay.modal`, card dark, radius=16, `shadows.gold`
  - [x] 2.3 Titre "Raccourcis clavier" + sous-titre "Disponibles en dehors des champs de saisie"
  - [x] 2.4 Deux colonnes : "Naviguer (G)" et "Créer (N)"
  - [x] 2.5 Chaque ligne : badge KBD montrant la touche + label de destination
  - [x] 2.6 Section séparée pour `?` (Aide) et `⌘K` (Command palette — lien Story 51-3)
  - [x] 2.7 Fermeture Escape + clic outside

- [x] Task 3 — Feedback visuel préfixe actif
  - [x] 3.1 Créer composant `KeyboardPrefixHint.tsx` : badge compact positionné `fixed` en bas à droite
  - [x] 3.2 Affiché uniquement quand `prefixActive === true`
  - [x] 3.3 Affiche "G…" ou "N…" en `colors.accent.gold`, fond dark, auto-disparu après 1s

- [x] Task 4 — Hints dans la sidebar
  - [x] 4.1 Dans `_layout.tsx`, ajouter dans le rendu des items nav un hint shortcut conditionnel
  - [x] 4.2 Définir `ITEM_SHORTCUTS: Record<string, string>` mappant href → hint (`'/children' → 'G J'`)
  - [x] 4.3 En mode expanded uniquement : afficher le hint en `colors.text.subtle`, `fontSize={9}` à droite du label

- [x] Task 5 — Intégration dans `_layout.tsx` / `KeyboardHandler`
  - [x] 5.1 Vérifier que `KeyboardHandler` appelle le hook enrichi
  - [x] 5.2 Rendre `<ShortcutsHelp />` et `<KeyboardPrefixHint />` dans le layout (au niveau root, comme CommandPalette)

- [x] Task 6 — QA
  - [x] 6.1 `npx tsc --noEmit` sans erreur
  - [x] 6.2 Tester coexistence avec ⌘K : ouvrir palette → chord désactivé

## Dev Notes

### Détection activeElement

```typescript
function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    || (el as HTMLElement).isContentEditable
}
```

### Logique chord complète

```typescript
let chordTimer: ReturnType<typeof setTimeout> | null = null

const handler = (e: KeyboardEvent) => {
  if (isInputFocused()) return
  if (commandPaletteOpen) return  // Story 51-3

  const key = e.key.toUpperCase()

  if (key === '?') {
    setShortcutsHelpOpen(true)
    return
  }

  if (!prefixKey && (key === 'G' || key === 'N')) {
    setPrefixKey(key)
    chordTimer = setTimeout(() => setPrefixKey(null), 1000)
    return
  }

  if (prefixKey && CHORD_MAP[prefixKey]?.[key]) {
    e.preventDefault()
    if (chordTimer) clearTimeout(chordTimer)
    router.push(CHORD_MAP[prefixKey][key] as never)
    setPrefixKey(null)
    return
  }

  // Touche non reconnue → reset préfixe
  if (prefixKey) {
    if (chordTimer) clearTimeout(chordTimer)
    setPrefixKey(null)
  }
}
```

### Badge KBD style

```typescript
// Dans ShortcutsHelp.tsx
const KbdBadge = ({ children }: { children: string }) => (
  <View style={{
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.dark,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  }}>
    <Text fontFamily="$mono" fontSize={11} color={colors.text.secondary}>{children}</Text>
  </View>
)
```

## File List

### New Files
- `aureak/apps/web/app/components/ShortcutsHelp.tsx` — modal overlay liste raccourcis
- `aureak/apps/web/app/components/KeyboardPrefixHint.tsx` — badge préfixe chord actif

### Modified Files
- `aureak/apps/web/app/hooks/useKeyboardShortcuts.ts` — logique chord + `?` + retour `prefixActive` + `shortcutsHelpOpen`
- `aureak/apps/web/app/(admin)/_layout.tsx` — hints sidebar + rendu `<ShortcutsHelp />` + `<KeyboardPrefixHint />`

## Dev Agent Record

- [ ] Story créée le 2026-04-04
- [ ] Dépendances : Story 51-3 (coordination keyboard listeners ⌘K)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
