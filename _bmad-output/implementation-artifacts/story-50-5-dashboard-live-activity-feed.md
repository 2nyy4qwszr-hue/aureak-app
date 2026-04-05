# Story 50.5 : Dashboard — Live activity feed

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un flux d'activité en temps réel dans une colonne latérale du dashboard qui liste les dernières présences validées, nouveaux joueurs et badges débloqués,
Afin d'avoir un sentiment de vie de l'académie sans rafraîchir la page.

## Acceptance Criteria

**AC1 — Colonne Activity Feed présente**
- **Given** l'admin charge le dashboard
- **When** la page se rend
- **Then** une colonne "Activité récente" de ~280px de large s'affiche à droite du contenu principal dans un layout 2 colonnes (main + aside)
- **And** sur mobile (< 1024px), la colonne passe en bas de page (colonne unique)

**AC2 — Événements initiaux chargés**
- **And** au chargement, les 10 derniers événements d'activité sont chargés depuis Supabase (table `attendance_records` + `profiles` join pour les présences validées, et table `child_directory` pour les nouveaux joueurs)
- **And** chaque événement affiche : type icône, nom du joueur, description courte, timestamp relatif (ex: "il y a 5 min")

**AC3 — Types d'événements**
- **And** les types d'événements supportés sont :
  - `presence` : "✅ [Nom] — présent à [groupe]" (depuis `attendance_records` où `status = 'present'`)
  - `new_player` : "👤 [Nom] — nouveau joueur inscrit" (depuis `child_directory` ORDER BY `created_at DESC`)
  - `badge` : "🏅 [Nom] — badge débloqué" (depuis table `badge_awards` si elle existe, sinon type ignoré)

**AC4 — Realtime Supabase channel**
- **And** un channel Supabase Realtime est souscrit sur `attendance_records` (`INSERT` events)
- **And** chaque nouvel INSERT de présence ajoute l'événement en tête du feed (prepend) avec animation de slide-in
- **And** le feed est limité aux 20 derniers événements (supprimer les plus anciens)
- **And** la souscription est nettoyée dans le `useEffect` return (`.unsubscribe()`)

**AC5 — Timestamp relatif**
- **And** les timestamps sont affichés en format relatif : "À l'instant", "il y a 2 min", "il y a 1h", "il y a 3j"
- **And** les timestamps se recalculent chaque minute (pas de setInterval propre — utiliser le même timer que le HeroBand ou un nouveau)

**AC6 — Style feed**
- **And** chaque item du feed est une ligne avec icône à gauche, texte au centre, timestamp à droite
- **And** les nouveaux items (< 5s) ont un fond `rgba(193,172,92,0.08)` en surbrillance qui disparaît progressivement
- **And** la scrollbar du feed est masquée (custom scrollbar `none`)

**AC7 — Fallback si Realtime indisponible**
- **And** si le channel Realtime échoue à se connecter (erreur CHANNEL_ERROR), le feed affiche uniquement les données statiques chargées initialement sans crasher

## Tasks / Subtasks

- [x] Task 1 — Restructurer le layout en 2 colonnes (AC: #1)
  - [x] 1.1 Envelopper le contenu actuel dans une `<div>` `main-col` (flex-grow 1)
  - [x] 1.2 Ajouter une `<div>` `aside-col` (width 280px, flex-shrink 0) à droite
  - [x] 1.3 Wrapper les deux dans un `<div>` `page-layout` (display flex, gap 24px, align-items flex-start)
  - [x] 1.4 Ajouter `@media (max-width: 1024px)` pour passer en colonne unique

- [x] Task 2 — Charger les événements initiaux (AC: #2, #3)
  - [x] 2.1 Créer `fetchActivityFeed()` : query `attendance_records` limit 5 + `child_directory` limit 5 ordered by `created_at DESC`
  - [x] 2.2 Merger et trier les résultats par timestamp DESC, limit 10
  - [x] 2.3 Mapper en type `ActivityEvent { id, type, playerName, description, createdAt }`

- [x] Task 3 — Souscrire au channel Realtime (AC: #4, #7)
  - [x] 3.1 Importer le client Supabase via `@aureak/api-client` (utiliser la fonction exposée pour accéder au client raw si nécessaire)
  - [x] 3.2 Créer `useEffect` avec `supabase.channel('dashboard-activity').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, handler).subscribe()`
  - [x] 3.3 Dans le handler, prepend le nouvel événement et limiter à 20
  - [x] 3.4 Retourner `channel.unsubscribe()` dans le cleanup

- [x] Task 4 — Composant `ActivityFeed` dans `dashboard/page.tsx` (AC: #2, #5, #6)
  - [x] 4.1 Props : `events: ActivityEvent[]`
  - [x] 4.2 Timestamps relatifs via fonction `relativeTime(isoString): string`
  - [x] 4.3 Animation slide-in via CSS `@keyframes feed-slide-in`
  - [x] 4.4 Surbrillance gold pour items récents (< 5s)

- [x] Task 5 — QA scan
  - [x] 5.1 Vérifier `.unsubscribe()` dans le return du useEffect Realtime
  - [x] 5.2 Vérifier que le channel name est unique (`'dashboard-activity'`)
  - [x] 5.3 Vérifier try/finally sur le chargement initial

## Dev Notes

### Accès au client Supabase raw

Le client Supabase brut doit être accessible pour les subscriptions Realtime. Vérifier si `@aureak/api-client` expose déjà le client (ex: export `supabase` depuis `supabase.ts`). Si oui, importer depuis l'api-client. Si non, ajouter l'export.

```typescript
// Dans aureak/packages/api-client/src/supabase.ts
export { supabase }  // s'assurer que le client est exporté
```

### Type ActivityEvent

```typescript
type ActivityEvent = {
  id         : string
  type       : 'presence' | 'new_player' | 'badge'
  playerName : string
  description: string
  createdAt  : string  // ISO
  isNew     ?: boolean // true pendant 5s après réception Realtime
}
```

### Fonction relativeTime

```typescript
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'À l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}
```

### Subscription Realtime

```typescript
useEffect(() => {
  const channel = supabase
    .channel('dashboard-activity')
    .on('postgres_changes', {
      event : 'INSERT',
      schema: 'public',
      table : 'attendance_records',
    }, (payload) => {
      const record = payload.new as any
      const event: ActivityEvent = {
        id         : record.id,
        type       : 'presence',
        playerName : record.child_name ?? 'Joueur',
        description: `Présence validée`,
        createdAt  : record.created_at,
        isNew      : true,
      }
      setActivityEvents(prev => [event, ...prev].slice(0, 20))
      // Retirer le flag isNew après 5s
      setTimeout(() => {
        setActivityEvents(prev =>
          prev.map(e => e.id === event.id ? { ...e, isNew: false } : e)
        )
      }, 5000)
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        if (process.env.NODE_ENV !== 'production')
          console.error('[dashboard] Realtime channel error')
      }
    })

  return () => { channel.unsubscribe() }
}, [])
```

### CSS animations à ajouter dans le bloc `<style>`

```css
@keyframes feed-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.feed-item { animation: feed-slide-in 0.25s ease forwards; }
.feed-item-new { background: rgba(193,172,92,0.08); }
.aside-scroll::-webkit-scrollbar { display: none; }
.aside-scroll { scrollbar-width: none; }
```

### Composant ActivityFeed

```typescript
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const TYPE_ICON: Record<ActivityEvent['type'], string> = {
    presence  : '✅',
    new_player: '👤',
    badge     : '🏅',
  }

  return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      overflow       : 'hidden',
    }}>
      <div style={{
        padding    : '14px 16px',
        borderBottom: `1px solid ${colors.border.divider}`,
        fontSize   : 12,
        fontWeight : 600,
        color      : colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
      }}>
        Activité récente
      </div>

      <div
        className="aside-scroll"
        style={{ maxHeight: 420, overflowY: 'auto' }}
      >
        {events.length === 0 && (
          <div style={{ padding: 20, fontSize: 13, color: colors.text.muted, textAlign: 'center' }}>
            Aucune activité récente
          </div>
        )}
        {events.map(evt => (
          <div
            key={evt.id}
            className={`feed-item${evt.isNew ? ' feed-item-new' : ''}`}
            style={{
              display    : 'flex',
              alignItems : 'flex-start',
              gap        : 10,
              padding    : '10px 16px',
              borderBottom: `1px solid ${colors.border.divider}`,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{TYPE_ICON[evt.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {evt.playerName}
              </div>
              <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 1 }}>
                {evt.description}
              </div>
            </div>
            <div style={{ fontSize: 10, color: colors.text.subtle, flexShrink: 0, marginTop: 2 }}>
              {relativeTime(evt.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — layout 2 colonnes, `ActivityFeed`, subscription Realtime, `relativeTime`
- `aureak/packages/api-client/src/supabase.ts` — vérifier/ajouter export `supabase` client
