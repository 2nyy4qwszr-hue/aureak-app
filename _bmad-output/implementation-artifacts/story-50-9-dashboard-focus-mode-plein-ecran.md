# Story 50.9 : Dashboard — Focus mode plein écran

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux pouvoir basculer le dashboard en mode plein écran immersif qui masque la sidebar et la topbar,
Afin de visualiser les KPIs et données sans distraction lors de présentations ou de revues d'équipe.

## Acceptance Criteria

**AC1 — Bouton d'activation Focus Mode**
- **Given** l'admin est sur le dashboard
- **When** il regarde l'interface
- **Then** un bouton ⛶ (ou icône expand) est visible en haut à droite du dashboard (dans le Hero Band si implémenté, sinon en top-right du container)
- **And** le bouton a un tooltip "Mode plein écran" au hover

**AC2 — Activation du Focus Mode**
- **When** l'admin clique sur ⛶
- **Then** le dashboard bascule en `position: fixed; inset: 0; zIndex: 500; background: colors.light.primary; overflow-y: auto`
- **And** la sidebar et la topbar sont masquées (pas de suppression du DOM — uniquement `display: none` ou `visibility: hidden` via la classe CSS `focus-mode-active` sur le `<body>`)

**AC3 — Quitter le Focus Mode**
- **When** l'admin appuie sur `Escape` ou clique le bouton ✕ qui apparaît en haut à droite
- **Then** le Focus Mode se désactive, la sidebar et topbar réapparaissent, le dashboard revient au layout normal

**AC4 — Transition fluide**
- **And** le passage en Focus Mode est animé avec `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (token `transitions.slow`)
- **And** la classe `focus-mode-enter` pendant 300ms après activation produit une légère animation fade-in

**AC5 — Badge Focus Mode actif**
- **And** en Focus Mode, un badge discret "🎯 Focus" s'affiche en haut à gauche du dashboard avec fond semi-transparent, taille 11, pour signaler le mode

**AC6 — Pas de régression layout**
- **And** en sortant du Focus Mode, le layout est identique à avant l'activation (vérifier que les `className` sur `<body>` sont bien nettoyés)
- **And** la scroll position est préservée lors de l'activation/désactivation

**AC7 — Event listener Escape**
- **And** un `keydown` listener est attaché sur `document` en Focus Mode et retiré à la désactivation
- **And** le cleanup est dans le `return` du `useEffect`

## Tasks / Subtasks

- [x] Task 1 — Ajouter le state `focusMode` dans `DashboardPage` (AC: #2, #3)
  - [x] 1.1 `const [focusMode, setFocusMode] = useState(false)`
  - [x] 1.2 `useEffect` sur `focusMode` pour ajouter/retirer la classe `focus-mode-active` sur `document.body`
  - [x] 1.3 Cleanup : retirer la classe dans le `return` du useEffect et au démontage

- [x] Task 2 — Écouter la touche Escape (AC: #3, #7)
  - [x] 2.1 `useEffect` sur `focusMode` : si `focusMode === true`, attacher `keydown` listener pour `Escape → setFocusMode(false)`
  - [x] 2.2 Retirer le listener dans le `return` du useEffect

- [x] Task 3 — Style CSS Focus Mode (AC: #2, #4)
  - [x] 3.1 `containerStyle` inline en `position:fixed; inset:0; z-index:500; overflowY:auto` via `{ ...S.container, position:'fixed', ... }`
  - [x] 3.2 Styles globaux injectés via `document.createElement('style')` dans useEffect
  - [x] 3.3 Animation fade-in `@keyframes focus-enter` dans le bloc `<style>`

- [x] Task 4 — Modifier le rendu du container principal (AC: #2, #5, #6)
  - [x] 4.1 `<div style={containerStyle} className={focusMode ? 'focus-mode-enter' : undefined}>`
  - [x] 4.2 Badge "🎯 Focus" en `position:fixed; top:12; left:12; zIndex:501`
  - [x] 4.3 Bouton "✕ Quitter" en `position:fixed; top:12; right:12; zIndex:501`

- [x] Task 5 — Bouton ⛶ dans le Hero Band ou header (AC: #1)
  - [x] 5.1 Story 50-1 implémentée : bouton ⛶ ajouté dans HeroBand (prop `onEnterFocusMode`)

- [x] Task 6 — Vérifier les attributs data sur sidebar/topbar (AC: #2)
  - [x] 6.1 Sidebar et topbar identifiées dans `_layout.tsx`
  - [x] 6.2 Aucun attribut `data-*` pré-existant
  - [x] 6.3 `data-sidebar="true"` et `data-topbar="true"` ajoutés dans `_layout.tsx`

- [x] Task 7 — QA scan
  - [x] 7.1 Classe retirée dans `return` du useEffect — cleanup confirmé
  - [x] 7.2 `overflowY: 'auto'` sur container fixed — scroll OK
  - [x] 7.3 Focus Mode zIndex 500 < Anomaly Modal 1000 — aucune régression

## Dev Notes

### Styles Focus Mode container

```typescript
// Dans le rendu DashboardPage :
const containerStyle = focusMode
  ? {
      ...S.container,
      position  : 'fixed' as const,
      inset     : 0,
      zIndex    : 500,
      background: colors.light.primary,
      overflowY : 'auto' as const,
      padding   : 24,
      animation : 'focus-enter 0.3s ease',
    }
  : S.container
```

### CSS à ajouter dans le bloc `<style>`

```css
@keyframes focus-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

body.focus-mode-active [data-sidebar] { display: none !important; }
body.focus-mode-active [data-topbar]  { display: none !important; }
```

Note : les styles `body.focus-mode-active ...` doivent être dans un `<style>` injecté dans `<head>` ou dans le CSS global de l'app, pas dans le `<style>` inline de la page (qui ne peut pas cibler des éléments hors du composant). Utiliser `document.createElement('style')` + `document.head.appendChild` dans le useEffect, puis le retirer au cleanup.

```typescript
useEffect(() => {
  if (!focusMode) return
  document.body.classList.add('focus-mode-active')

  // Injecter les styles globaux
  const styleEl = document.createElement('style')
  styleEl.id = 'focus-mode-styles'
  styleEl.textContent = `
    body.focus-mode-active [data-sidebar] { display: none !important; }
    body.focus-mode-active [data-topbar]  { display: none !important; }
  `
  document.head.appendChild(styleEl)

  return () => {
    document.body.classList.remove('focus-mode-active')
    document.getElementById('focus-mode-styles')?.remove()
  }
}, [focusMode])
```

### Event listener Escape

```typescript
useEffect(() => {
  if (!focusMode) return
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setFocusMode(false)
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [focusMode])
```

### Badge Focus + Bouton Quitter

```typescript
{focusMode && (
  <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 501, backgroundColor: 'rgba(0,0,0,0.4)', color: '#FFF', borderRadius: radius.badge, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
    🎯 Focus
  </div>
)}
{focusMode && (
  <button
    onClick={() => setFocusMode(false)}
    style={{ position: 'fixed', top: 12, right: 12, zIndex: 501, backgroundColor: colors.light.surface, border: `1px solid ${colors.border.light}`, borderRadius: radius.badge, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.text.dark, boxShadow: shadows.sm }}
  >
    ✕ Quitter
  </button>
)}
```

### Bouton d'activation ⛶

```typescript
// Dans le Hero Band (story 50-1) ou dans le pageHeader :
<button
  onClick={() => setFocusMode(true)}
  title="Mode plein écran"
  style={{ background: 'none', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: radius.xs, padding: '4px 8px', cursor: 'pointer', fontSize: 16, color: colors.accent.ivory, lineHeight: 1 }}
>
  ⛶
</button>
```

### Note sur les attributs data-sidebar / data-topbar

Vérifier dans `aureak/apps/web/app/(admin)/_layout.tsx` les identifiants existants sur la sidebar et la topbar. Si aucun attribut `data-*` n'est présent, en ajouter un minimal sans changer la structure :
- Sidebar : ajouter `data-sidebar="true"` sur le conteneur racine de la sidebar
- Topbar : ajouter `data-topbar="true"` sur le conteneur racine de la topbar

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — state `focusMode`, useEffects Escape+body class, badge, bouton quitter, bouton ⛶
- `aureak/apps/web/app/(admin)/_layout.tsx` — ajout attributs `data-sidebar` et `data-topbar` si absents
