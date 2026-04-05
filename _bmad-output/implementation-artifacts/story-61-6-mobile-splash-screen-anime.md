# Story 61.6 : Mobile — Splash screen animé logo + terrain

Status: done

## Story

En tant qu'utilisateur ouvrant l'app Aureak,
Je veux voir un écran de chargement animé avec le logo et un terrain SVG,
Afin de vivre une expérience de marque premium dès le premier contact avec l'application.

## Acceptance Criteria

**AC1 — Splash screen affiché au chargement initial**
- **Given** l'utilisateur navigue vers l'app (ou la rouvre)
- **When** l'app charge les données initiales (auth session, config)
- **Then** un écran plein écran s'affiche avec fond `#0F0F0F` (noir), logo AUREAK centré et animation SVG de terrain de football

**AC2 — Animation logo**
- **And** le logo "AUREAK" (texte Montserrat Black 900, taille 40, couleur `colors.accent.gold`) apparaît en fade-in de 0 à 1 en 600ms
- **And** le sous-titre "Académie de gardiens" (Montserrat 400, taille 14, letterspacing 3, or clair) apparaît en slide-up 200ms après le logo

**AC3 — Animation terrain SVG**
- **And** un SVG de terrain de football (cercle central, surface de réparation, ligne médiane) s'affiche en dessous du logo en `opacity: 0.15`
- **And** le SVG apparaît en draw animation (stroke-dashoffset de 100% à 0% en 800ms, délai 400ms)

**AC4 — Barre de progression**
- **And** une barre de progression fine (2px, couleur gold) s'anime de gauche à droite en 1.5s en bas du splash
- **And** la barre reflète la progression réelle du chargement si possible (auth → config → prefetch), sinon animation indéterminée

**AC5 — Transition vers l'app**
- **And** quand le chargement est terminé, le splash fait un fade-out en 300ms et l'app apparaît
- **And** la transition est visible et douce (pas de clignottement)

**AC6 — Durée minimale**
- **And** le splash est affiché au minimum 1.5s même si le chargement est plus rapide (expérience brand)
- **And** en cas d'erreur de chargement, le splash laisse place à un écran d'erreur après 5s maximum

**AC7 — Web uniquement pour ce fichier**
- **And** le composant est implémenté dans `apps/web/app/(admin)/_layout.tsx` via un state `isAppReady`
- **And** sur mobile natif (iOS/Android), le splash natif Expo prend le relais (hors scope de cette story)

## Tasks / Subtasks

- [ ] Task 1 — Créer composant `SplashScreen.tsx` dans `apps/web/app/(admin)/` (AC: #1, #2, #3, #4, #5)
  - [ ] 1.1 Fond `#0F0F0F` plein écran, `position: fixed, zIndex: 9999`
  - [ ] 1.2 Logo AUREAK : fade-in via `@keyframes fadeIn 600ms`
  - [ ] 1.3 Sous-titre : slide-up via `@keyframes slideUp 400ms` avec délai 200ms
  - [ ] 1.4 SVG terrain : composant `TerrainSVG` inline avec stroke-dashoffset animation
  - [ ] 1.5 Barre de progression : `@keyframes progress-bar 1.5s linear` sur `width: 0% → 100%`
  - [ ] 1.6 Fade-out au dismiss via CSS class toggle

- [ ] Task 2 — SVG terrain animé (AC: #3)
  - [ ] 2.1 SVG avec `<circle>` (cercle central), `<rect>` (surface de réparation), `<line>` (ligne médiane)
  - [ ] 2.2 `stroke-dasharray: 1000`, `stroke-dashoffset: 1000 → 0` en animation CSS
  - [ ] 2.3 Couleur stroke `colors.accent.gold`, opacity 0.15

- [ ] Task 3 — Intégrer dans `_layout.tsx` (AC: #1, #5, #6, #7)
  - [ ] 3.1 State `isAppReady: boolean` (false par défaut)
  - [ ] 3.2 `useEffect` au montage : délai 1.5s minimum + attendre la session auth
  - [ ] 3.3 `setIsAppReady(true)` après le délai minimum
  - [ ] 3.4 Rendu : `{!isAppReady && <SplashScreen />}` + `<Slot />`

- [ ] Task 4 — Gestion erreur (AC: #6)
  - [ ] 4.1 Timeout 5s : si `isAppReady` toujours false → force dismiss + afficher erreur

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier cleanup du timeout dans le return du useEffect
  - [ ] 5.2 Vérifier que les constantes `#0F0F0F` sont déclarées comme `const SPLASH_BG = '#0F0F0F'`

## Dev Notes

### Animations CSS (inline dans SplashScreen.tsx via `<style>`)

```css
@keyframes aureak-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes aureak-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aureak-draw {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0; }
}
@keyframes aureak-progress {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes aureak-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

### SVG terrain minimal

```svg
<svg viewBox="0 0 300 200" style="opacity:0.15; animation: aureak-draw 800ms 400ms forwards">
  <circle cx="150" cy="100" r="40" fill="none" stroke="gold" strokeWidth="1.5" />
  <line x1="150" y1="0" x2="150" y2="200" stroke="gold" strokeWidth="1" />
  <rect x="110" y="60" width="80" height="80" fill="none" stroke="gold" strokeWidth="1.5" />
</svg>
```

### Constantes locales

```typescript
const SPLASH_BG = '#0F0F0F'
const SPLASH_MIN_MS = 1500
const SPLASH_TIMEOUT_MS = 5000
```

## File List

- `aureak/apps/web/app/(admin)/SplashScreen.tsx` — créer
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (state isAppReady + SplashScreen)
