# Story 50.6 : Dashboard — Forme du moment tile

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un widget "Forme du moment" affichant les 3 joueurs avec la plus longue streak de présences consécutives,
Afin d'identifier rapidement les joueurs les plus assidus et de les valoriser.

## Acceptance Criteria

**AC1 — Tile "Forme du moment" présente**
- **Given** l'admin charge le dashboard
- **When** la page se rend
- **Then** une card "Forme du moment 🔥" s'affiche dans la grille bento (taille `medium`)
- **And** elle affiche les 3 joueurs avec le plus grand nombre de présences consécutives (streak)

**AC2 — Critère d'éligibilité**
- **And** seuls les joueurs avec 5 présences consécutives ou plus sont affichés
- **And** si aucun joueur n'atteint 5 présences consécutives, la card affiche "Aucune streak active" avec sous-texte "Les streaks apparaissent après 5 présences consécutives"

**AC3 — Affichage par joueur**
- **And** chaque ligne joueur affiche : avatar initiales (cercle), prénom + nom, nombre de séances consécutives, emoji fire (🔥) si streak ≥ 10

**AC4 — Avatar initiales**
- **And** l'avatar initiales prend les 2 premières lettres du display_name en Montserrat 700 taille 13, fond `colors.accent.gold` (streak #1) / `colors.text.secondary` teinte (streaks #2 et #3), texte blanc/sombre selon contraste

**AC5 — API `getTopStreakPlayers`**
- **And** une fonction `getTopStreakPlayers(limit?: number)` est créée dans `@aureak/api-client/src/dashboard.ts` (fichier à créer si absent)
- **And** elle calcule la streak via requête SQL : pour chaque enfant, compter le nombre de séances consécutives les plus récentes avec `status = 'present'`
- **And** la fonction suit le pattern `{ data, error }` standard

**AC6 — Podium visuel**
- **And** le premier joueur est légèrement mis en valeur : badge "#1" en or à côté de son nom, taille de texte 14 vs 13 pour les suivants

**AC7 — Loading et empty states**
- **And** pendant le chargement, 3 skeleton lines de 40px
- **And** si erreur API, message "Données indisponibles" sans crash

## Tasks / Subtasks

- [x] Task 1 — Créer `@aureak/api-client/src/dashboard.ts` si absent (AC: #5)
  - [x] 1.1 Vérifier si un fichier `dashboard.ts` existe déjà dans `aureak/packages/api-client/src/`
  - [x] 1.2 Si absent, créer avec la fonction `getTopStreakPlayers` (fichier existait dans admin/ — ajout dans ce fichier)
  - [x] 1.3 Exporter depuis `aureak/packages/api-client/src/index.ts`

- [x] Task 2 — Implémenter `getTopStreakPlayers` (AC: #5)
  - [x] 2.1 Query : récupérer les attendance_records récents (last 90 jours) avec `status IN ('present', 'absent')`
  - [x] 2.2 Calculer la streak côté JS : grouper par child_id, sort DESC date, compter présences jusqu'au premier absent
  - [x] 2.3 Filtrer `streak >= 5`, trier DESC (égalités résolues par childId lexicographique), prendre `limit` (défaut 3)
  - [x] 2.4 Joindre le nom du joueur depuis `profiles`

- [x] Task 3 — Composant `StreakTile` dans `dashboard/page.tsx` (AC: #1, #2, #3, #4, #6)
  - [x] 3.1 Props : `players: StreakPlayer[]`, `loading: boolean`
  - [x] 3.2 Composant `InitialsAvatar` : 36px cercle, couleur selon rang
  - [x] 3.3 Afficher badge "#1" en or pour le 1er
  - [x] 3.4 Afficher "🔥" quand streak >= 10

- [x] Task 4 — Intégration dans `DashboardPage` (AC: #7)
  - [x] 4.1 Ajouter state `streakPlayers` + `loadingStreaks`
  - [x] 4.2 Appeler `getTopStreakPlayers(3)` dans `useEffect` initial
  - [x] 4.3 Placer `<StreakTile>` dans la grille bento (taille `medium`)

- [x] Task 5 — QA scan
  - [x] 5.1 Vérifier try/finally sur `loadingStreaks` — PASS
  - [x] 5.2 Vérifier guard console.error avec NODE_ENV — PASS

## Dev Notes

### Type StreakPlayer

```typescript
type StreakPlayer = {
  childId    : string
  displayName: string
  streak     : number  // nombre de présences consécutives
}
```

### Calcul de streak côté JS

```typescript
export async function getTopStreakPlayers(limit = 3) {
  // Récupérer les 90 derniers jours d'attendance
  const since = new Date(Date.now() - 90 * 24 * 3600_000).toISOString()

  const { data, error } = await supabase
    .from('attendance_records')
    .select('child_id, status, sessions(scheduled_at)')
    .gte('sessions.scheduled_at', since)
    .in('status', ['present', 'absent'])
    .order('child_id')
    .order('sessions.scheduled_at', { ascending: false })

  if (error) return { data: null, error }

  // Grouper par child_id
  const byChild = new Map<string, { status: string; date: string }[]>()
  for (const row of data ?? []) {
    const childId = (row as any).child_id
    const arr = byChild.get(childId) ?? []
    arr.push({ status: row.status, date: (row as any).sessions?.scheduled_at ?? '' })
    byChild.set(childId, arr)
  }

  // Calculer streak pour chaque enfant
  const streaks: Array<{ childId: string; streak: number }> = []
  for (const [childId, records] of byChild.entries()) {
    const sorted = records.sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    for (const r of sorted) {
      if (r.status === 'present') streak++
      else break
    }
    if (streak >= 5) streaks.push({ childId, streak })
  }

  streaks.sort((a, b) => b.streak - a.streak)
  const top = streaks.slice(0, limit)

  if (top.length === 0) return { data: [], error: null }

  // Récupérer les noms
  const ids = top.map(t => t.childId)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)

  const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  return {
    data: top.map(t => ({
      childId    : t.childId,
      displayName: nameMap.get(t.childId) ?? 'Joueur',
      streak     : t.streak,
    })),
    error: null,
  }
}
```

### Composant StreakTile

```typescript
function InitialsAvatar({ name, rank }: { name: string; rank: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bg = rank === 1 ? colors.accent.gold : rank === 2 ? colors.text.secondary : colors.border.dark

  return (
    <div style={{
      width           : 36,
      height          : 36,
      borderRadius    : radius.badge,
      backgroundColor : bg,
      display         : 'flex',
      alignItems      : 'center',
      justifyContent  : 'center',
      fontFamily      : 'Montserrat',
      fontWeight      : '700',
      fontSize        : 13,
      color           : rank === 1 ? '#1A1A1A' : '#FFFFFF',
      flexShrink      : 0,
    }}>
      {initials}
    </div>
  )
}

function StreakTile({ players, loading }: { players: StreakPlayer[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="aureak-card" style={S.kpiCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.muted, marginBottom: 12 }}>Forme du moment 🔥</div>
        {[0,1,2].map(i => <SkeletonBlock key={i} h={40} r={8} />)}
      </div>
    )
  }

  return (
    <div className="aureak-card" style={{ ...S.kpiCard, borderTop: `3px solid ${colors.accent.gold}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
        Forme du moment 🔥
      </div>

      {players.length === 0 ? (
        <div>
          <div style={{ fontSize: 14, color: colors.text.dark }}>Aucune streak active</div>
          <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 4 }}>
            Les streaks apparaissent après 5 présences consécutives
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {players.map((p, i) => (
            <div key={p.childId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <InitialsAvatar name={p.displayName} rank={i + 1} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize    : i === 0 ? 14 : 13,
                  fontWeight  : i === 0 ? 700 : 500,
                  color       : colors.text.dark,
                  overflow    : 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace  : 'nowrap',
                }}>
                  {i === 0 && <span style={{ color: colors.accent.gold, marginRight: 4 }}>#1</span>}
                  {p.displayName}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.text.muted, fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
                {p.streak}{p.streak >= 10 ? ' 🔥' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## File List

- `aureak/packages/api-client/src/dashboard.ts` — nouveau fichier avec `getTopStreakPlayers`
- `aureak/packages/api-client/src/index.ts` — export `getTopStreakPlayers`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — `StreakTile`, `InitialsAvatar`, state `streakPlayers`
