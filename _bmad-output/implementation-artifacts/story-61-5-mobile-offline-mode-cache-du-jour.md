# Story 61.5 : Mobile — Offline mode basique cache du jour

Status: done

## Story

En tant que coach utilisant l'app sur mobile dans un gymnase ou terrain sans réseau fiable,
Je veux que l'app mette en cache les données nécessaires du jour (séances et joueurs du groupe),
Afin de pouvoir prendre les présences et voir les fiches joueurs même hors connexion.

## Acceptance Criteria

**AC1 — Données du jour cachées automatiquement**
- **Given** le coach ouvre l'app avec une connexion disponible
- **When** il accède à `/seances` ou démarre une séance du jour
- **Then** les données suivantes sont mises en cache dans `AsyncStorage` : séances du jour, liste des joueurs de chaque groupe du jour, fiches simplifiées des joueurs

**AC2 — Mode offline détecté**
- **And** l'app détecte l'absence de réseau via `NetInfo` (React Native) ou `navigator.onLine` (web)
- **And** un banner "● Mode hors-ligne — données du [date]" s'affiche en haut de l'écran quand offline

**AC3 — Navigation hors-ligne**
- **And** en mode offline, les pages `/seances`, `/seances/[sessionId]` et les fiches joueurs du jour fonctionnent depuis le cache
- **And** les actions d'écriture (marquer présent/absent) sont mises en file d'attente (`offlineQueue`) et synchronisées à la reconnexion

**AC4 — Queue de synchronisation**
- **And** chaque action offline est stockée comme `OfflineQueueItem { id: UUID, type: 'update_attendance', payload, timestamp }` dans `AsyncStorage`
- **And** à la reconnexion, les items de la queue sont traités dans l'ordre chronologique
- **And** après sync réussie, l'item est retiré de la queue

**AC5 — Feedback de sync**
- **And** à la reconnexion, un toast "Synchronisation de X actions..." s'affiche pendant la sync
- **And** après sync réussie, un toast "Tout est à jour ✓" s'affiche
- **And** en cas d'échec partiel, un toast "X actions non synchronisées" avec lien vers le détail

**AC6 — Fraîcheur du cache**
- **And** le cache est automatiquement invalidé et rechargé à minuit ou quand le cache a > 4h
- **And** un indicateur "Données de [HH:MM]" est affiché dans le banner offline pour informer l'utilisateur

**AC7 — Scope limité au jour courant**
- **And** seules les données du jour courant sont cachées (pas d'historique, pas de données admin)
- **And** la taille maximale du cache est limitée à 500 joueurs et 10 séances (protection AsyncStorage)

## Tasks / Subtasks

- [ ] Task 1 — Créer `@aureak/api-client/src/offline/` (AC: #1, #3, #4)
  - [ ] 1.1 `offlineCache.ts` : `setCacheItem(key, data, ttlMs)`, `getCacheItem(key)`, `invalidateCache(key)` via `AsyncStorage`
  - [ ] 1.2 `offlineQueue.ts` : `enqueueAction(item)`, `getQueue()`, `dequeueAction(id)`, `processQueue(apiClient)` — traitement séquentiel
  - [ ] 1.3 `useOfflineCache.ts` hook : détecte `navigator.onLine`, expose `isOnline`, `cacheAge`, triggère sync à la reconnexion

- [ ] Task 2 — Pré-chargement cache au démarrage (AC: #1)
  - [ ] 2.1 Dans `useOfflineCache`, au montage si online : appeler `prefetchTodayData()` — fetch séances du jour + joueurs → `AsyncStorage`
  - [ ] 2.2 `prefetchTodayData` = `getSessionsToday()` + `getGroupMembersForSessions(sessionIds)` depuis `@aureak/api-client`

- [ ] Task 3 — Banner offline (AC: #2, #6)
  - [ ] 3.1 Créer `OfflineBanner.tsx` dans `@aureak/ui`
  - [ ] 3.2 Props : `isOnline: boolean`, `cacheTimestamp: Date | null`
  - [ ] 3.3 Afficher "● Mode hors-ligne — données du [HH:MM]" + fond ambre dégradé
  - [ ] 3.4 Exporter depuis `@aureak/ui`

- [ ] Task 4 — Intégrer dans `_layout.tsx` (AC: #2, #5)
  - [ ] 4.1 `useOfflineCache()` dans le layout
  - [ ] 4.2 Afficher `<OfflineBanner>` conditionnellement
  - [ ] 4.3 Toast de sync à la reconnexion

- [ ] Task 5 — Queue dans les actions présences (AC: #3, #4)
  - [ ] 5.1 Dans `seances/[sessionId]/page.tsx` : si offline, `enqueueAction({ type: 'update_attendance', payload: { sessionId, childId, status } })` au lieu de l'appel API direct

- [ ] Task 6 — QA scan
  - [ ] 6.1 Vérifier que la queue ne croît pas indéfiniment (limite 100 items)
  - [ ] 6.2 Vérifier console guards dans `offlineCache.ts` et `offlineQueue.ts`

## Dev Notes

### Clés AsyncStorage

```typescript
const CACHE_KEYS = {
  todaySessions : 'cache:sessions:today',
  groupMembers  : (groupId: string) => `cache:members:${groupId}`,
  offlineQueue  : 'offline:queue',
  cacheTimestamp: 'cache:timestamp',
}
```

### Structure OfflineQueueItem

```typescript
export interface OfflineQueueItem {
  id        : string     // UUID v4
  type      : 'update_attendance' | 'create_attendance'
  payload   : Record<string, unknown>
  timestamp : number     // Date.now()
  retryCount: number
}
```

### Détection online/offline web

```typescript
const [isOnline, setIsOnline] = useState(() => navigator.onLine)
useEffect(() => {
  const onOnline  = () => { setIsOnline(true);  processQueue() }
  const onOffline = () => setIsOnline(false)
  window.addEventListener('online',  onOnline)
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online',  onOnline)
    window.removeEventListener('offline', onOffline)
  }
}, [])
```

### Notes QA
- `removeEventListener` online/offline OBLIGATOIRE — BLOCKER
- Accès Supabase dans `processQueue` UNIQUEMENT via `@aureak/api-client` — jamais direct

## File List

- `aureak/packages/api-client/src/offline/offlineCache.ts` — créer
- `aureak/packages/api-client/src/offline/offlineQueue.ts` — créer
- `aureak/packages/api-client/src/offline/useOfflineCache.ts` — créer
- `aureak/packages/api-client/src/offline/index.ts` — créer (exports)
- `aureak/packages/ui/src/OfflineBanner.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export OfflineBanner)
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (useOfflineCache + OfflineBanner)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — modifier (enqueueAction si offline)
