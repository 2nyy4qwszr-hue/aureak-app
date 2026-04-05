# Story 57-8 — Implantations : Mini-timeline prochaines séances sur card

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Chaque `ImplantationCard` affiche les groupes sous forme de chips. Cette story ajoute une mini-timeline des 3 prochaines séances planifiées sur le site, avec jour, heure et nom du groupe, directement sur la card — sans ouvrir la fiche détail. Un tap sur une séance navigue vers sa fiche.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir les 3 prochaines séances d'une implantation directement sur sa card,
**afin de** planifier mes déplacements et anticiper l'activité sans ouvrir chaque fiche.

---

## Acceptance Criteria

- [ ] AC1 — Une section "Prochaines séances" est affichée en bas de chaque `ImplantationCard` (sous les chips groupes), séparée par un divider `colors.border.divider`
- [ ] AC2 — La fonction API `listUpcomingSessionsByImplantation(implantationId, limit = 3)` retourne les `limit` prochaines séances futures (date ≥ aujourd'hui, non supprimées) pour cette implantation, triées par date ASC
- [ ] AC3 — Chaque séance listée affiche : jour abrégé + date (ex: `Mar 08/04`), heure de début (ex: `17h00`), et nom du groupe (ex: `Goal and Player — Mardi`)
- [ ] AC4 — Un dot de couleur méthode (via `METHOD_COLOR[group.method]`) est affiché à gauche de chaque ligne de séance
- [ ] AC5 — Clic sur une ligne de séance → navigation `router.push('/seances/{sessionId}')` — les séances existantes ont une route détail sous `(admin)/seances/[sessionId]/`
- [ ] AC6 — Si aucune séance future n'existe, afficher "Aucune séance planifiée" en gris muted, sans section
- [ ] AC7 — Les données sont chargées au montage de la page (batch : `Promise.all` sur toutes les implantations visibles) et stockées dans un state `upcomingSessions: Record<string, UpcomingSession[]>`
- [ ] AC8 — Pendant le chargement initial, les lignes séances affichent un skeleton (3 bars gris, hauteur 14px)
- [ ] AC9 — Le type `UpcomingSession` est défini dans `@aureak/types` avec `id`, `date`, `startHour`, `startMinute`, `groupId`, `groupName`, `groupMethod`
- [ ] AC10 — `try/finally` sur `setLoadingUpcoming` ; `console.error` guardé ; zéro hardcode

---

## Tasks

### T1 — Type `UpcomingSession` dans `@aureak/types`

Fichier : `aureak/packages/types/src/entities.ts`

```typescript
export type UpcomingSession = {
  id          : string
  date        : string       // ISO date
  startHour   : number | null
  startMinute : number | null
  groupId     : string
  groupName   : string
  groupMethod : string | null
}
```

- [x] Type ajouté

### T2 — Fonction API `listUpcomingSessionsByImplantation`

Fichier : `aureak/packages/api-client/src/sessions/implantations.ts`

```typescript
export async function listUpcomingSessionsByImplantation(
  implantationId: string,
  limit         = 3,
): Promise<{ data: UpcomingSession[]; error: unknown }> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      start_hour,
      start_minute,
      groups!inner (
        id,
        name,
        method,
        implantation_id
      )
    `)
    .eq('groups.implantation_id', implantationId)
    .gte('date', today)
    .is('deleted_at', null)
    .order('date', { ascending: true })
    .limit(limit)

  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[listUpcomingSessionsByImplantation] error:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map((row: any) => ({
      id         : row.id,
      date       : row.date,
      startHour  : row.start_hour  ?? null,
      startMinute: row.start_minute ?? null,
      groupId    : row.groups.id,
      groupName  : row.groups.name,
      groupMethod: row.groups.method ?? null,
    })),
    error: null,
  }
}
```

- [x] Fonction créée et exportée

### T3 — State et chargement batch dans `index.tsx`

```typescript
const [upcomingSessions,   setUpcomingSessions]   = useState<Record<string, UpcomingSession[]>>({})
const [loadingUpcoming,    setLoadingUpcoming]    = useState(false)

useEffect(() => {
  if (implantations.length === 0) return
  setLoadingUpcoming(true)
  Promise.all(
    implantations.map(impl =>
      listUpcomingSessionsByImplantation(impl.id, 3)
        .then(res => ({ id: impl.id, sessions: res.data }))
    )
  )
    .then(results => {
      const map: Record<string, UpcomingSession[]> = {}
      results.forEach(r => { map[r.id] = r.sessions })
      setUpcomingSessions(map)
    })
    .catch(err => {
      if (process.env.NODE_ENV !== 'production')
        console.error('[Implantations] loadingUpcoming error:', err)
    })
    .finally(() => setLoadingUpcoming(false))
}, [implantations])
```

- [x] State + useEffect ajoutés

### T4 — Section mini-timeline dans `ImplantationCard`

Après les chips groupes, ajouter :
```tsx
{/* ── Mini-timeline séances ── */}
{(upcoming.length > 0 || isLoadingUpcoming) && (
  <>
    <View style={{ height: 1, backgroundColor: colors.border.divider, marginVertical: space.xs }} />
    {isLoadingUpcoming
      ? [0,1,2].map(i => <View key={i} style={styles.upcomingSkeleton} />)
      : upcoming.map(session => (
          <Pressable
            key={session.id}
            style={styles.upcomingRow}
            onPress={() => router.push(`/seances/${session.id}` as never)}
          >
            <View style={[styles.upcomingDot, {
              backgroundColor: session.groupMethod
                ? METHOD_COLOR[session.groupMethod as GroupMethod] ?? colors.accent.gold
                : colors.accent.gold
            }]} />
            <AureakText variant="caption" style={{ flex: 1, color: colors.text.dark }}>
              {formatUpcomingDate(session.date)}{session.startHour !== null ? ` · ${formatTime(session.startHour, session.startMinute ?? 0)}` : ''}
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }} numberOfLines={1}>
              {session.groupName}
            </AureakText>
          </Pressable>
        ))
    }
  </>
)}
```

Helper `formatUpcomingDate` :
```typescript
function formatUpcomingDate(isoDate: string): string {
  const d = new Date(isoDate)
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}
```

Styles :
```typescript
upcomingRow    : { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: 3 },
upcomingDot    : { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
upcomingSkeleton: { height: 14, borderRadius: radius.xs, backgroundColor: colors.border.light, marginVertical: 3 },
```

- [x] Section mini-timeline implémentée
- [x] `formatUpcomingDate` helper ajouté
- [x] Props `upcomingSessions: UpcomingSession[]`, `loadingUpcoming: boolean` passées à `ImplantationCard`

---

## Dépendances

- Story 49-6 `done` — `ImplantationCard` + `listImplantations` existants

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/types/src/entities.ts` | Modifier — `UpcomingSession` |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier — `listUpcomingSessionsByImplantation` |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — state + useEffect + mini-timeline dans card |

---

## QA post-story

```bash
grep -n "setLoadingUpcoming" aureak/apps/web/app/(admin)/implantations/index.tsx
grep -n "finally" aureak/apps/web/app/(admin)/implantations/index.tsx
grep -n "console\." aureak/packages/api-client/src/sessions/implantations.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-57): story 57-8 — implantations mini-timeline 3 prochaines séances sur card
```
