# Story 60.8 : Analytics — Live counters séances en cours Realtime

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir sur le dashboard et la page analytics un compteur temps réel des séances actuellement en cours, avec le nombre de présents qui s'incrémente en direct,
Afin de suivre l'activité de l'académie sans avoir à rafraîchir la page.

## Acceptance Criteria

**AC1 — LiveCounter visible sur le dashboard**
- **Given** l'admin est sur `/dashboard`
- **When** une ou plusieurs séances sont en cours (heure actuelle entre start_time et end_time d'une session du jour)
- **Then** un composant `LiveCounter` s'affiche dans le dashboard avec : "X séances en cours", "Y présents / Z inscrits" animé

**AC2 — LiveCounter visible dans Stats Room**
- **And** le même composant `LiveCounter` s'affiche en haut de `/analytics` (sous le header) si des séances sont en cours
- **And** si aucune séance n'est en cours, le composant n'est pas affiché (pas de placeholder vide)

**AC3 — Mise à jour Supabase Realtime**
- **And** le compteur s'abonne au channel Supabase `realtime:attendances` pour les INSERT/UPDATE de présences du jour
- **And** le nombre de présents se met à jour dans les 2 secondes suivant un changement de statut de présence
- **And** au démontage du composant, le channel est unsubscribed pour éviter les memory leaks

**AC4 — Animation du compteur**
- **And** quand la valeur du compteur change, un effet d'animation "flip" (ou slide vertical) de 200ms est déclenché sur le chiffre qui change
- **And** l'animation est implémentée via `Animated.timing` React Native / CSS `@keyframes` pour le web

**AC5 — Indicateur visuel "LIVE"**
- **And** un badge rouge pulsant "● LIVE" s'affiche à côté du titre du compteur
- **And** le badge pulse avec une animation CSS `@keyframes` (opacity 1→0.3→1, période 1.5s)

**AC6 — Fallback polling si Realtime indisponible**
- **And** si le channel Supabase Realtime ne peut pas être établi (timeout 5s), le composant bascule en mode polling toutes les 30s
- **And** un indicateur discret "sync en 30s" remplace le badge LIVE en mode polling

**AC7 — Composant réutilisable**
- **And** `LiveCounter` est exporté depuis `@aureak/ui` avec des props `sessionCount`, `presentCount`, `totalCount` pour le rendu statique (test/storybook)
- **And** le hook `useLiveSessionCounts()` est séparé du composant présentationnel

## Tasks / Subtasks

- [ ] Task 1 — Hook `useLiveSessionCounts` dans `@aureak/api-client` (AC: #3, #6)
  - [ ] 1.1 Créer `aureak/packages/api-client/src/realtime/liveSessionCounts.ts`
  - [ ] 1.2 `getLiveSessionsNow(tenantId)` : requête sessions du jour avec `start_time <= NOW() AND end_time >= NOW()`
  - [ ] 1.3 Abonnement Supabase Realtime channel `attendances:today` avec `on('postgres_changes', ...)`
  - [ ] 1.4 Fallback polling avec `setInterval(30_000)` si channel non connecté dans 5s
  - [ ] 1.5 Cleanup : `supabase.removeChannel(channel)` + `clearInterval` dans le return du useEffect

- [ ] Task 2 — Composant `LiveCounter.tsx` dans `@aureak/ui` (AC: #4, #5, #7)
  - [ ] 2.1 Props : `sessionCount: number`, `presentCount: number`, `totalCount: number`, `isLive?: boolean`
  - [ ] 2.2 Badge "● LIVE" avec animation CSS pulse (keyframes opacity 1→0.3→1, 1.5s infini)
  - [ ] 2.3 Animation flip sur changement de valeur : CSS `transition: transform 200ms` avec classe toggle
  - [ ] 2.4 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 3 — Intégration dans `dashboard/page.tsx` (AC: #1)
  - [ ] 3.1 Appeler `useLiveSessionCounts()` dans `DashboardPage`
  - [ ] 3.2 Afficher `<LiveCounter>` sous le hero band, avant les KPIs — seulement si `sessionCount > 0`

- [ ] Task 4 — Intégration dans `analytics/page.tsx` (AC: #2)
  - [ ] 4.1 Même logique : `useLiveSessionCounts()` + `<LiveCounter>` conditionnel

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier cleanup Realtime channel dans le return du useEffect — BLOCKER si oublié
  - [ ] 5.2 Vérifier cleanup `clearInterval` du fallback polling
  - [ ] 5.3 Vérifier console guards dans `liveSessionCounts.ts`

## Dev Notes

### Hook useLiveSessionCounts

```typescript
// aureak/packages/api-client/src/realtime/liveSessionCounts.ts
export function useLiveSessionCounts() {
  const [counts, setCounts] = useState({ sessionCount: 0, presentCount: 0, totalCount: 0 })
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // 1. Fetch initial
    // 2. Subscribe Realtime
    const channel = supabase
      .channel('live-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => {
        refreshCounts()
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
        if (status !== 'SUBSCRIBED') startPolling()
      })

    return () => { supabase.removeChannel(channel); stopPolling() }
  }, [])

  return { ...counts, isLive }
}
```

### Animation CSS pulse badge LIVE

```css
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
.live-badge { animation: live-pulse 1.5s ease-in-out infinite; }
```

### Notes QA
- `supabase.removeChannel(channel)` OBLIGATOIRE dans le cleanup useEffect — BLOCKER sinon
- `clearInterval` du polling OBLIGATOIRE — BLOCKER sinon
- `LiveCounter` dans `@aureak/ui` : composant purement présentationnel, zéro Supabase direct

## File List

- `aureak/packages/api-client/src/realtime/liveSessionCounts.ts` — créer
- `aureak/packages/ui/src/LiveCounter.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export LiveCounter)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — modifier (intégrer LiveCounter)
- `aureak/apps/web/app/(admin)/analytics/page.tsx` — modifier (intégrer LiveCounter)
