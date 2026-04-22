# Story 100.3 — Topbar mobile compact (burger + logo + search + profil)

Status: done

## Metadata

- **Epic** : 100 — Mobile navigation (fondations)
- **Story ID** : 100.3
- **Story key** : `100-3-topbar-mobile-compact`
- **Priorité** : P0 (contient le burger, prérequis 100.1)
- **Dépendances** : aucune ; **bloque 100.1 partiellement** (topbar déclenche drawer)
- **Source** : Décision produit 2026-04-22, mobile-first admin.
- **Effort estimé** : M (~1j — refonte responsive AdminTopbar existant)

## Story

As an admin sur mobile,
I want un topbar compact — burger icon à gauche, logo Aureak centré, search icon + avatar profil à droite —,
So that je dispose d'un header léger qui laisse le maximum d'espace au contenu principal sans perdre l'accès à la nav, la recherche et mon profil.

## Contexte

### État actuel

`AdminTopbar.tsx` (composant existant) affiche sur desktop : breadcrumbs, notifications, paramètres, export, CTA principal. Trop chargé pour mobile.

### Design cible mobile (< 640px)

```
┌─────────────────────────────────────────────────┐
│ [☰]        AUREAK Admin              [🔍] [👤] │
└─────────────────────────────────────────────────┘
```

- Burger (gauche) → ouvre sidebar drawer (via Context)
- Logo centré ou aligné gauche (choix design)
- Search icon → ouvre search overlay full-screen (réutiliser `GlobalSearch` existant)
- Avatar profil → ouvre menu (Mon profil / Administration / Déconnexion)

### Design tablette (640-1024px)

Topbar desktop simplifié : pas de breadcrumbs longs, actions essentielles (notifications + profil), pas de burger (sidebar rail visible).

### Design desktop (> 1024px)

Topbar actuel inchangé.

## Acceptance Criteria

1. **Composant `<AdminTopbar />`** refactoré pour détecter breakpoint via `useWindowDimensions` et rendre 3 variantes :
   - `width < 640` → variant mobile
   - `640 ≤ width < 1024` → variant tablette
   - `width ≥ 1024` → variant desktop (actuel)

2. **Variant mobile** :
   - Hauteur compacte (~56px)
   - Burger icon à gauche (hamburger 3 lignes), tap → `sidebarContext.open()`
   - Logo "AUREAK" (texte ou svg) centré ou gauche
   - Search icon (loupe) à droite — tap → ouvre search overlay
   - Avatar profil à droite (initiale ou photo) — tap → menu dropdown (Mon profil / Administration / Déconnexion)

3. **SidebarContext** :
   - Créer `aureak/apps/web/contexts/admin/SidebarContext.tsx` si non existant
   - Expose `{ isOpen, open, close, toggle }`
   - Provider au niveau `(admin)/_layout.tsx`

4. **Search overlay** :
   - Tap search icon → overlay full-screen
   - Réutiliser `GlobalSearch` component existant (voir `components/GlobalSearch.tsx`)
   - Bouton fermer (X) en haut à droite

5. **Menu profil dropdown** :
   - Liste : Mon profil, Administration, Déconnexion
   - Tap item → navigation (`/administration/utilisateurs/profile` post-99.2, `/administration`, logout)
   - Fermeture au tap outside ou escape

6. **Variant tablette** :
   - Pas de burger (sidebar rail visible déjà)
   - Logo + breadcrumb compact (dernier niveau seulement)
   - Actions : notifications + avatar profil
   - Search icon présent

7. **Variant desktop** :
   - Comportement actuel inchangé
   - Backward compat obligatoire

8. **Tokens `@aureak/theme` uniquement** :
   - Fond topbar : `colors.surface.elevated` ou équivalent
   - Icônes : `colors.text.subtle`
   - Avatar : ring `colors.accent.gold` si pattern

9. **Conformité CLAUDE.md** :
   - `tsc --noEmit` EXIT 0
   - try/finally sur state (menus, overlays)
   - Console guards

10. **Test Playwright** :
    - Viewport 375×667 : topbar compact visible, burger + logo + search + avatar
    - Tap burger → drawer ouvre (dépend 100.1)
    - Tap search → overlay
    - Tap avatar → menu dropdown, tap "Mon profil" → navigate
    - Viewport 1440×900 : topbar desktop inchangé

11. **Non-goals** :
    - **Pas de modification `GlobalSearch`** (réutilisé tel quel)
    - **Pas de nouvelle fonctionnalité** notifications/export/CTA — simplification uniquement
    - **Pas de mise à jour nav-config**

## Tasks / Subtasks

- [x] **T1 — SidebarContext** (AC #3)
  - [x] Créer context + Provider
  - [x] Wrapper `(admin)/_layout.tsx`

- [x] **T2 — Refactor `AdminTopbar.tsx`** (AC #1, #2, #6, #7)
  - [x] Détection breakpoint (640 / 1024)
  - [x] 3 variants render
  - [x] Burger + logo + search + avatar mobile

- [x] **T3 — Search overlay** (AC #4)
  - [x] State isSearchOpen
  - [x] `<Modal>` overlay plein écran contenant `GlobalSearch`

- [x] **T4 — Menu profil dropdown** (AC #5)
  - [x] State isMenuOpen
  - [x] Positionné ancré top-right sous topbar
  - [x] Items + navigation (Mon profil / Administration / Déconnexion)

- [x] **T5 — Tokens** (AC #8)
  - [x] Tokens @aureak/theme uniquement (rgba n'existe que dans boxShadow web-only cosmetic, pattern pré-existant)

- [x] **T6 — QA** (AC #9, #10)
  - [x] `tsc --noEmit` EXIT 0
  - [x] Playwright 3 viewports (375 mobile, 800 tablet, 1440 desktop)

## Completion Notes

- **SidebarContext** ajouté `aureak/apps/web/contexts/admin/SidebarContext.tsx` — remplace `mobileOpen` local state dans `_layout.tsx`. Préparation pour Story 100.1 (drawer consommera le même Context).
- **AdminTopbar** refactoré : 3 variants dispatch par breakpoint. Le variant desktop préserve le comportement 93.7 (uniquement hubs `/activites`/`/methodologie`/`/academie`). Mobile + tablet rendent toujours.
- **Inline mobile XStack** supprimé de `_layout.tsx` (lignes ~1014-1058) — remplacé par `<AdminTopbar />` unconditional.
- **Breadcrumb fallback desktop** : condition `!isMobile` → `width >= 1024` pour éviter double render au niveau tablet.
- **Search overlay** utilise `react-native` `Modal` transparent avec `GlobalSearch` réutilisé tel quel.
- **Profile menu** : `Modal` + backdrop pressable. Positionné via `position: fixed` (web-only) top/right.
- **Playwright validation** : burger → drawer ouvre, search icon → overlay, avatar → menu profil. Zéro erreur console.

## Dev Notes

### Context sidebar — pattern

```tsx
// contexts/admin/SidebarContext.tsx
export const SidebarContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
```

### Hauteur topbar

Material Design : 56dp mobile, 64dp desktop. Respecter pour cohérence tactile.

### Avatar photo vs initiale

Si `profile.avatar_url` présent → image. Sinon initiale du prénom sur fond gold. Pattern à réutiliser (probablement déjà dans l'app).

### References

- Topbar actuel : `aureak/apps/web/components/admin/AdminTopbar.tsx`
- GlobalSearch : `components/GlobalSearch.tsx`
- Post-99.2 : route profil = `/administration/utilisateurs/profile`
- Post-99.1 : route hub admin = `/administration`
- Story 100.1 (drawer) — consomme le Context
