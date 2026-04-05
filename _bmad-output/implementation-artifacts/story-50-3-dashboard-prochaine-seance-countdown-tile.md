# Story 50.3 : Dashboard — Prochaine séance countdown tile

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir une card "prochaine séance" qui affiche un countdown et les informations de la séance imminente,
Afin de ne jamais rater une séance à venir dans les prochaines 24 heures.

## Acceptance Criteria

**AC1 — Tile "Prochaine séance" visible quand une séance existe dans les 24h**
- **Given** une séance est planifiée dans les 24 prochaines heures
- **When** l'admin charge le dashboard
- **Then** une card "Prochaine séance" s'affiche dans la grille bento avec fond doré dégradé et countdown H:MM:SS mis à jour chaque seconde

**AC2 — Affichage vide quand aucune séance dans les 24h**
- **Given** aucune séance n'est planifiée dans les 24 prochaines heures
- **When** l'admin charge le dashboard
- **Then** la card affiche "Aucune séance dans les 24h" avec un sous-texte "Tout est calme ✓" en gris

**AC3 — Informations de la séance**
- **And** la card affiche : nom du groupe, heure de début (format HH:MM), terrain/lieu si disponible
- **And** un bouton "→ Voir la séance" navigue vers `/seances/[sessionId]`

**AC4 — Countdown précis**
- **And** le countdown affiche `H:MM:SS` (ex: "2:34:07") et se décrémente chaque seconde via `setInterval(1000)`
- **And** quand le countdown atteint 0, la card affiche "En cours" avec un badge vert pulsant
- **And** le `setInterval` est nettoyé dans le `return` du `useEffect`

**AC5 — API `listUpcomingSessions`**
- **And** une fonction `listUpcomingSessions(hoursAhead?: number)` est créée dans `@aureak/api-client/src/sessions.ts` (ou le fichier sessions existant)
- **And** elle retourne les séances dont `scheduled_at` est dans `[NOW, NOW + hoursAhead * 3600s]`, triées par `scheduled_at ASC`, limit 1
- **And** la fonction suit le pattern `{ data, error }` standard de l'api-client

**AC6 — Style premium**
- **And** la card a un dégradé de fond `linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)` avec bordure top `colors.accent.gold` 3px
- **And** le countdown est en Geist Mono 900 taille 36, couleur `colors.accent.gold`

**AC7 — Loading state**
- **And** pendant le chargement, la card affiche un skeleton `SkeletonBlock h={120}`

## Tasks / Subtasks

- [x] Task 1 — API `listNextSessionForDashboard` dans `@aureak/api-client` (AC: #5)
  - [x] 1.1 Localiser le fichier sessions dans `aureak/packages/api-client/src/` → `sessions/sessions.ts`
  - [x] 1.2 Ajouter la fonction `listNextSessionForDashboard(hoursAhead = 24)` avec requête Supabase sur table `sessions` + join `groups(name)` → type `UpcomingSessionRow`
  - [x] 1.3 Filtrer `scheduled_at.gte(now).lte(limit)`, order `scheduled_at.asc()`, limit 1
  - [x] 1.4 Exporter depuis `@aureak/api-client/src/index.ts` (+ type `UpcomingSessionRow`)

- [x] Task 2 — Composant `CountdownTile` dans `dashboard/page.tsx` (AC: #1, #2, #4, #6)
  - [x] 2.1 Props : `session: UpcomingSessionRow | null`, `loading: boolean`, `onNavigate: (id) => void`
  - [x] 2.2 `useEffect` avec `setInterval(1000)` calculant `secondsLeft = Math.max(0, ...)`
  - [x] 2.3 Formatter `secondsLeft` → `H:MM:SS` via `formatCountdown()`
  - [x] 2.4 Afficher état "En cours" quand `secondsLeft === 0` et session non-null
  - [x] 2.5 Bouton "→ Voir la séance" navigue vers `/seances/${session.id}`

- [x] Task 3 — Intégration dans `DashboardPage` (AC: #7)
  - [x] 3.1 Ajouter state `upcomingSession` + `loadingUpcoming`
  - [x] 3.2 Appeler `listNextSessionForDashboard()` dans useEffect dédié
  - [x] 3.3 Placer `<CountdownTile>` dans la grille bento (classe `bento-medium`)

- [x] Task 4 — QA scan
  - [x] 4.1 `clearInterval` dans `return () => clearInterval(timer)` ligne 630
  - [x] 4.2 `try/finally` sur `loadingUpcoming` — `setLoadingUpcoming(false)` dans finally
  - [x] 4.3 `console.error` avec guard `process.env.NODE_ENV !== 'production'`

## Dev Notes

### Localisation du fichier API sessions

Avant d'ajouter la fonction, vérifier :
```bash
ls aureak/packages/api-client/src/
ls aureak/packages/api-client/src/admin/
```
Chercher un fichier `sessions.ts`, `training-sessions.ts` ou similaire. Ajouter dans le fichier existant qui gère les sessions.

### Nom de table sessions

D'après les stories implémentées (Epic 4, 13, 19), la table s'appelle `sessions` avec champ `scheduled_at` ou `date`+`start_time`. Vérifier la définition exacte avant de coder la requête.

Si la table utilise `date DATE` + `start_time TIME` au lieu d'un timestamp, adapter la requête :
```typescript
const nowDate = new Date()
const limitDate = new Date(Date.now() + hoursAhead * 3600_000)
// Filtrer sur date + heure reconstituée
```

### Type UpcomingSession (à déclarer localement dans dashboard/page.tsx)

```typescript
type UpcomingSession = {
  id          : string
  groupName   : string
  scheduledAt : string  // ISO
  location   ?: string
}
```

### Fonction API

```typescript
export async function listUpcomingSessions(hoursAhead = 24) {
  const now   = new Date().toISOString()
  const limit = new Date(Date.now() + hoursAhead * 3600_000).toISOString()

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scheduled_at, location, groups(name)')
    .gte('scheduled_at', now)
    .lte('scheduled_at', limit)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })
    .limit(1)

  if (error) return { data: null, error }

  const session = data?.[0]
  if (!session) return { data: null, error: null }

  return {
    data: {
      id         : session.id,
      groupName  : (session.groups as any)?.name ?? '—',
      scheduledAt: session.scheduled_at,
      location   : session.location ?? undefined,
    } as UpcomingSessionRow,
    error: null,
  }
}
```

### Composant CountdownTile

```typescript
function CountdownTile({ session, loading }: { session: UpcomingSession | null; loading: boolean }) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!session) return
    const calc = () => Math.max(0, Math.floor((new Date(session.scheduledAt).getTime() - Date.now()) / 1000))
    setSecondsLeft(calc())
    const timer = setInterval(() => setSecondsLeft(calc()), 1000)
    return () => clearInterval(timer)
  }, [session?.scheduledAt])

  const formatCountdown = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (loading) return <SkeletonBlock h={120} r={radius.card} />

  return (
    <div className="aureak-card" style={{
      background  : 'linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)',
      borderTop   : `3px solid ${colors.accent.gold}`,
      borderRadius: radius.card,
      padding     : 20,
      minHeight   : 120,
    }}>
      {session ? (
        <>
          <div style={{ fontSize: 11, color: colors.accent.goldLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Prochaine séance
          </div>
          {secondsLeft === 0 ? (
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.status.present }}>
              🟢 En cours
            </div>
          ) : (
            <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: '900', fontSize: 36, color: colors.accent.gold, lineHeight: 1 }}>
              {formatCountdown(secondsLeft)}
            </div>
          )}
          <div style={{ fontSize: 13, color: colors.text.secondary, marginTop: 8 }}>
            {session.groupName}
            {session.location && <span style={{ color: colors.text.muted }}> · {session.location}</span>}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Prochaine séance
          </div>
          <div style={{ fontSize: 16, color: colors.text.secondary }}>Aucune séance dans les 24h</div>
          <div style={{ fontSize: 12, color: colors.status.present, marginTop: 6 }}>Tout est calme ✓</div>
        </>
      )}
    </div>
  )
}
```

### Intégration dans DashboardPage

```typescript
// State à ajouter
const [upcomingSession, setUpcomingSession] = useState<UpcomingSession | null>(null)
const [loadingUpcoming, setLoadingUpcoming] = useState(true)

// Dans le useEffect initial ou dans load()
useEffect(() => {
  const fetchUpcoming = async () => {
    setLoadingUpcoming(true)
    try {
      const { data, error } = await listUpcomingSessions()
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listUpcomingSessions error:', error)
      }
      setUpcomingSession(data ?? null)
    } finally {
      setLoadingUpcoming(false)
    }
  }
  fetchUpcoming()
}, [])
```

## File List

- `aureak/packages/api-client/src/sessions.ts` (ou fichier sessions existant) — ajout `listUpcomingSessions`
- `aureak/packages/api-client/src/index.ts` — export `listUpcomingSessions`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ajout `CountdownTile`, state `upcomingSession`
