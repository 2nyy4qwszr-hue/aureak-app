# Story 62.1 : Polish — Micro-interactions système check/save/error

Status: done

## Story

En tant qu'utilisateur de l'app Aureak,
Je veux que chaque action (cocher une présence, sauvegarder, erreur) déclanche une micro-animation distincte et satisfaisante,
Afin de ressentir un feedback immédiat et de qualité premium à chaque interaction.

## Acceptance Criteria

**AC1 — Présence cochée = animation rebond spring**
- **Given** le coach coche la présence d'un joueur
- **When** le statut passe à "présent"
- **Then** la checkbox ou le toggle effectue une animation "spring bounce" : scale 1→1.3→1 en 150ms avec timing spring (`cubic-bezier(0.36, 0.07, 0.19, 0.97)`)

**AC2 — Sauvegarde = flash vert**
- **And** quand un formulaire est sauvegardé avec succès (évaluation, notes, séance), le bouton "Enregistrer" effectue un flash vert : fond `colors.status.success`, icône ✓, durée 200ms puis retour à l'état normal

**AC3 — Erreur = animation shake**
- **And** quand une action échoue (API error, validation), le composant concerné (bouton, champ, card) effectue une animation "shake" horizontale : ±8px × 3 oscillations en 300ms

**AC4 — Hook `useMicroInteraction`**
- **And** un hook `useMicroInteraction()` est créé dans `@aureak/ui` et expose :
  - `{ triggerBounce, triggerFlash, triggerShake, animatedStyle }`
  - `animatedStyle` contient les styles d'animation à appliquer via `StyleSheet` ou CSS

**AC5 — Intégré dans `AttendanceToggle`**
- **And** le composant de toggle présence (existant ou à identifier) utilise `triggerBounce()` à chaque activation
- **And** l'animation ne bloque pas les interactions suivantes (pas de `pointer-events: none` pendant l'animation)

**AC6 — Intégré dans `AureakButton`** (ou composant Button existant)
- **And** `AureakButton` avec `variant="save"` déclenche `triggerFlash()` quand la prop `success: boolean` passe à `true`
- **And** `AureakButton` avec `variant="danger"` ou en état d'erreur déclenche `triggerShake()` quand la prop `error: boolean` passe à `true`

**AC7 — `prefers-reduced-motion` respecté**
- **And** si `window.matchMedia('(prefers-reduced-motion: reduce)').matches` est vrai, les animations sont désactivées silencieusement

## Tasks / Subtasks

- [ ] Task 1 — Créer hook `useMicroInteraction` dans `@aureak/ui` (AC: #4, #7)
  - [ ] 1.1 Créer `aureak/packages/ui/src/hooks/useMicroInteraction.ts`
  - [ ] 1.2 `triggerBounce()` : CSS class toggle `mi-bounce` avec `@keyframes mi-bounce`
  - [ ] 1.3 `triggerFlash(color?)` : CSS class toggle `mi-flash-green` avec `@keyframes mi-flash`
  - [ ] 1.4 `triggerShake()` : CSS class toggle `mi-shake` avec `@keyframes mi-shake`
  - [ ] 1.5 Chaque animation : setTimeout pour retirer la classe après la durée (150ms, 200ms, 300ms)
  - [ ] 1.6 Guard `prefers-reduced-motion` — retourner no-op si activé
  - [ ] 1.7 Exporter depuis `@aureak/ui`

- [ ] Task 2 — Définir les `@keyframes` CSS (AC: #1, #2, #3)
  - [ ] 2.1 Créer `aureak/packages/ui/src/microInteractions.css` (ou inline dans un composant wrapper)
  - [ ] 2.2 `@keyframes mi-bounce` : `scale(1) → scale(1.3) → scale(1)`, timing spring
  - [ ] 2.3 `@keyframes mi-flash` : `background → green → original`, 200ms
  - [ ] 2.4 `@keyframes mi-shake` : `translateX(0 → 8px → -8px → 4px → -4px → 0)`, 300ms

- [ ] Task 3 — Intégrer dans le composant `AttendanceToggle` (AC: #5)
  - [ ] 3.1 Identifier le composant toggle présence dans `seances/[sessionId]/page.tsx`
  - [ ] 3.2 Appeler `triggerBounce()` dans le handler de toggle à chaque activation
  - [ ] 3.3 Appliquer `animatedStyle` au container du toggle

- [ ] Task 4 — Intégrer dans `Button.tsx` de `@aureak/ui` (AC: #6)
  - [ ] 4.1 Ajouter props `success?: boolean` et `error?: boolean` à `Button`
  - [ ] 4.2 `useEffect` sur `success` → `triggerFlash()`
  - [ ] 4.3 `useEffect` sur `error` → `triggerShake()`

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier que les setTimeout sont nettoyés si le composant se démonte pendant l'animation
  - [ ] 5.2 Vérifier le guard `prefers-reduced-motion`

## Dev Notes

### Keyframes CSS (à injecter via `<style>` ou fichier CSS importé)

```css
@keyframes mi-bounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes mi-flash {
  0%, 100% { background-color: inherit; }
  50%       { background-color: #10B981; }  /* colors.status.success */
}
@keyframes mi-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
```

### Implémentation hook (CSS class toggle)

```typescript
// useMicroInteraction.ts
export function useMicroInteraction() {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  function trigger(className: string, durationMs: number) {
    if (prefersReduced || !ref.current) return
    ref.current.classList.add(className)
    setTimeout(() => ref.current?.classList.remove(className), durationMs)
  }

  return {
    ref,
    triggerBounce: () => trigger('mi-bounce', 150),
    triggerFlash : () => trigger('mi-flash',  200),
    triggerShake : () => trigger('mi-shake',  300),
  }
}
```

## File List

- `aureak/packages/ui/src/hooks/useMicroInteraction.ts` — créer
- `aureak/packages/ui/src/microInteractions.css` — créer (ou styles inline)
- `aureak/packages/ui/src/index.ts` — modifier (export useMicroInteraction)
- `aureak/packages/ui/src/Button.tsx` — modifier (props success/error + trigger)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — modifier (triggerBounce sur toggle présence)
