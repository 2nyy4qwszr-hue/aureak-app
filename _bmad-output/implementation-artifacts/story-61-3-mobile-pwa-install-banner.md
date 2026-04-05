# Story 61.3 : Mobile — PWA install prompt banner

Status: done

## Story

En tant qu'utilisateur accédant à Aureak depuis un navigateur mobile,
Je veux voir un banner discret proposant d'installer l'app sur mon écran d'accueil,
Afin d'accéder rapidement à l'app comme une application native sans passer par le navigateur.

## Acceptance Criteria

**AC1 — Banner affiché sur mobile**
- **Given** un utilisateur accède à l'app depuis Safari iOS ou Chrome Android sur mobile
- **When** l'event `beforeinstallprompt` est détecté (Chrome) ou le user-agent mobile est détecté (Safari)
- **Then** un banner s'affiche en bas de l'écran : "📱 Installer l'app Aureak sur votre écran d'accueil"

**AC2 — Actions du banner**
- **And** le banner affiche deux boutons : "Installer" (primaire, or) et "Plus tard" (secondaire, texte gris)
- **And** cliquer "Installer" sur Chrome déclenche `promptEvent.prompt()` et ferme le banner
- **And** cliquer "Installer" sur Safari affiche une instruction contextuelle : "Appuyez sur [icône partage] puis 'Sur l'écran d'accueil'"

**AC3 — Fermeture et non-réapparition**
- **And** cliquer "Plus tard" ferme le banner pour la session courante
- **And** si l'utilisateur a déjà installé l'app (mode standalone détecté via `display-mode: standalone`), le banner n'est jamais affiché
- **And** si l'utilisateur a refusé 2 fois, le banner n'est plus affiché (stocké dans `localStorage`)

**AC4 — Design du banner**
- **And** le banner est positionné en `position: fixed; bottom: 0; left: 0; right: 0`
- **And** il a un fond `colors.dark.surface`, bordure top gold 2px, hauteur 64px
- **And** une animation slide-up de 300ms apparaît à l'affichage (`transform: translateY(64px)` → `translateY(0)`)

**AC5 — Instructions Safari**
- **And** le popover d'instructions Safari affiche une image/SVG de l'icône de partage iOS avec le texte explicatif
- **And** le popover est fermable via un bouton ×

**AC6 — Pas affiché sur desktop**
- **And** le composant vérifie `window.innerWidth < 768` avant d'afficher le banner
- **And** sur desktop, aucun DOM n'est rendu

**AC7 — Accessibilité**
- **And** le banner a un `role="banner"` et les boutons ont des labels `aria-label` explicites
- **And** le banner est ignoré par les screen readers si déjà installé

## Tasks / Subtasks

- [ ] Task 1 — Composant `PWAInstallBanner.tsx` dans `@aureak/ui` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 1.1 State : `show: boolean`, `promptEvent: BeforeInstallPromptEvent | null`, `isSafari: boolean`
  - [ ] 1.2 `useEffect` : écoute `beforeinstallprompt`, détecte mode standalone, vérifie localStorage counter
  - [ ] 1.3 Handler `handleInstall` : `promptEvent.prompt()` (Chrome) ou affiche popover Safari
  - [ ] 1.4 Handler `handleDismiss` : ferme + incrément counter localStorage
  - [ ] 1.5 Vérification viewport `window.innerWidth < 768` avant rendu
  - [ ] 1.6 Animation slide-up CSS keyframes
  - [ ] 1.7 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 2 — Popover instructions Safari (AC: #5)
  - [ ] 2.1 State `showSafariPopover: boolean`
  - [ ] 2.2 Rendu conditionnel avec SVG icône partage iOS inline
  - [ ] 2.3 Bouton fermeture ×

- [ ] Task 3 — Intégrer dans `_layout.tsx` (AC: #1)
  - [ ] 3.1 Ajouter `<PWAInstallBanner />` en dehors du scroll principal (après `<Slot />`)
  - [ ] 3.2 Conditionnel web uniquement (`Platform.OS === 'web'`)

- [ ] Task 4 — QA scan
  - [ ] 4.1 Vérifier cleanup `removeEventListener` sur `beforeinstallprompt`
  - [ ] 4.2 Vérifier aucune erreur si `window` non disponible (SSR guard)

## Dev Notes

### Event type BeforeInstallPromptEvent

```typescript
// Types non inclus dans TypeScript par défaut
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
```

### Détection Safari iOS

```typescript
const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
```

### Clé localStorage

```typescript
const DISMISS_COUNT_KEY = 'aureak_pwa_dismiss_count'
const MAX_DISMISSALS = 2
```

### Animation CSS

```css
@keyframes slide-up-banner {
  from { transform: translateY(64px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

### Notes QA
- Guard SSR : `typeof window !== 'undefined'` avant tout accès `window.*`
- `removeEventListener` sur `beforeinstallprompt` dans cleanup useEffect

## File List

- `aureak/packages/ui/src/PWAInstallBanner.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export PWAInstallBanner)
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (intégrer PWAInstallBanner)
