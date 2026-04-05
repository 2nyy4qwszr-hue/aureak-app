# Story 61.2 : Mobile — HUD permanent séance active

Status: done

## Story

En tant que coach utilisant l'app sur mobile pendant une séance,
Je veux voir une barre de contexte persistante en haut de l'écran affichant le groupe et le compteur de présents, même quand je navigue dans d'autres sections,
Afin de ne jamais perdre de vue l'état de ma séance en cours.

## Acceptance Criteria

**AC1 — HUD visible pendant une séance active**
- **Given** le coach a créé ou ouvert une séance (session avec `status = 'in_progress'` ou heure comprise entre start/end du jour)
- **When** il navigue vers n'importe quelle route de l'app
- **Then** une barre `ActiveSessionHUD` s'affiche en haut de l'écran (sous la topbar existante) avec : nom du groupe, "X présents / Y inscrits", chronomètre depuis le début de la séance

**AC2 — Disparaît quand pas de séance active**
- **And** si aucune séance n'est en cours pour le coach connecté, le HUD n'est pas affiché (hauteur 0, pas de placeholder)

**AC3 — Lien direct vers la séance**
- **And** cliquer sur le HUD navigue vers `/seances/[sessionId]` (la séance active)

**AC4 — Contexte `ActiveSessionContext`**
- **And** un contexte `ActiveSessionContext` est créé dans `_layout.tsx` et expose `{ activeSession, presentCount, totalCount, startedAt }`
- **And** ce contexte est alimenté par une requête au montage (session en cours du jour pour le rôle connecté) et mis à jour par Supabase Realtime sur les changements de présences

**AC5 — Chronomètre**
- **And** le chronomètre affiche le temps écoulé depuis `session.start_time` au format `HH:MM` ou `MM:SS` si < 1h
- **And** il est mis à jour chaque minute via `setInterval`

**AC6 — Design HUD**
- **And** le HUD a un fond `colors.dark.surface` (ou `#1A1A1A`), hauteur 44px, texte compact
- **And** le compteur de présents est coloré via `getStatColor` selon le taux (ex. 3/10 = rouge, 8/10 = vert)
- **And** un indicateur "● EN COURS" pulse en rouge pour signaler l'activité

**AC7 — Pas affiché sur desktop**
- **And** le HUD n'est affiché que sur viewport < 768px (ou si préférence mobile détectée via `ThemeContext`)

## Tasks / Subtasks

- [ ] Task 1 — Créer `ActiveSessionContext` (AC: #4)
  - [ ] 1.1 Créer `aureak/apps/web/app/(admin)/contexts/ActiveSessionContext.tsx`
  - [ ] 1.2 Au montage : requête `getActiveSessionForCoach(userId)` — session du jour avec status 'in_progress' ou dans les horaires
  - [ ] 1.3 Abonnement Realtime sur `attendances` pour mise à jour `presentCount`
  - [ ] 1.4 Cleanup Realtime au démontage

- [ ] Task 2 — API `getActiveSessionForCoach` (AC: #4)
  - [ ] 2.1 Ajouter dans `@aureak/api-client/src/sessions.ts` (ou `seances.ts`)
  - [ ] 2.2 Requête : session du jour avec `CURRENT_DATE = session_date AND status != 'cancelled'` pour le coach connecté

- [ ] Task 3 — Composant `ActiveSessionHUD.tsx` dans `@aureak/ui` (AC: #1, #3, #5, #6, #7)
  - [ ] 3.1 Props : `session: ActiveSessionInfo`, `presentCount: number`, `totalCount: number`, `onPress: () => void`
  - [ ] 3.2 Chronomètre : state `elapsed` avec `setInterval` 60s
  - [ ] 3.3 Badge pulse "EN COURS" via CSS keyframes
  - [ ] 3.4 `onPress` → navigation vers la séance
  - [ ] 3.5 Rendu conditionnel selon `isMobile` (viewport < 768px)

- [ ] Task 4 — Intégrer dans `_layout.tsx` admin (AC: #1, #2)
  - [ ] 4.1 Envelopper dans `<ActiveSessionProvider>`
  - [ ] 4.2 Afficher `<ActiveSessionHUD>` juste sous la topbar, conditionnel `activeSession != null`

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier cleanup Realtime channel et clearInterval
  - [ ] 5.2 Vérifier console guards

## Dev Notes

### Type ActiveSessionInfo

```typescript
export interface ActiveSessionInfo {
  sessionId : string
  groupName : string
  startTime : string  // ISO
  status    : string
}
```

### Hauteur HUD dans le layout

```typescript
// _layout.tsx
// Ajouter marginTop conditionnel au contenu principal :
const hudHeight = activeSession && isMobile ? 44 : 0
<View style={{ flex: 1, marginTop: hudHeight }}>
  <Slot />
</View>
```

### Notes QA
- Cleanup Realtime OBLIGATOIRE dans `ActiveSessionContext` — BLOCKER
- `clearInterval` chronomètre OBLIGATOIRE — BLOCKER
- `ActiveSessionHUD` : zéro accès Supabase direct — tout via le contexte

## File List

- `aureak/apps/web/app/(admin)/contexts/ActiveSessionContext.tsx` — créer
- `aureak/packages/api-client/src/sessions.ts` — modifier (ajouter getActiveSessionForCoach)
- `aureak/packages/ui/src/ActiveSessionHUD.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export ActiveSessionHUD)
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (ActiveSessionProvider + HUD)
