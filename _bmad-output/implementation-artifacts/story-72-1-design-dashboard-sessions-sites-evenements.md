# Story 72.1 : Dashboard — Sessions du jour + Performance Sites + Prochains événements

Status: done

## Story

En tant qu'admin, je veux voir dans le dashboard trois sections alignées sur la maquette Figma qui me font défaut aujourd'hui :
1. La liste complète des séances du jour (colonne gauche "La Journée") avec heure, groupe, avatar coach et badge statut — pour savoir en un coup d'oeil ce qui se passe.
2. Le tableau "Performance Sites" (colonne centre "L'Académie") enrichi de la colonne Maîtrise% — pour comparer les implantations sur deux axes.
3. La liste des prochains stages/événements (colonne centre, sous Performance Sites) avec date gold, nom et nombre d'inscrits — pour anticiper la charge à venir.

## Acceptance Criteria

- AC1 — "Sessions du jour" : la colonne gauche affiche, sous le bloc "Urgences & Anomalies" (ou au-dessus, selon position dans la maquette), une card blanche contenant toutes les séances dont `scheduled_at` est dans la journée courante (00:00–23:59 locale). Chaque ligne affiche : heure HH:MM en Geist Mono Bold 14px, nom du groupe en Manrope Bold 14px, avatar cercle 24px avec initiales du coach, badge statut (`À VENIR` bleu / `EN COURS` vert / `CLÔTURÉE` gris).
- AC2 — La séance dont le statut est `en_cours` est visuellement distinguée : fond `colors.status.successBg` et bordure gauche verte (`colors.status.present`).
- AC3 — Si aucune séance n'est planifiée pour aujourd'hui, la card affiche "Aucune séance aujourd'hui" en italique.
- AC4 — Une nouvelle fonction `listTodaySessionsForDashboard` est créée dans `@aureak/api-client/src/sessions/sessions.ts` et exportée depuis l'index. Elle retourne toutes les sessions du jour courant avec leurs coachs et groupes associés.
- AC5 — "Performance Sites" : le tableau existant est conservé mais la colonne Maîtrise% affiche `mastery_rate_pct` depuis `ImplantationStats` (déjà présent dans le type), avec `—` si null, coloré via `rateColor()`.
- AC6 — "Prochains événements" : une nouvelle card est ajoutée dans la colonne centre, sous "Performance Sites", affichant les stages dont `startDate >= today` et `status !== 'annulé'` (max 5), triés par `startDate` ascendant. Chaque ligne affiche : boîte date gold (fond `colors.accent.gold`, texte blanc, format `JJ/MM`), nom du stage, badge type "STAGE" (fond `colors.border.light`), nombre d'inscrits (`participantCount`).
- AC7 — Si aucun événement à venir, la card affiche "Aucun événement prévu" en italique.
- AC8 — L'import de `listStages` (déjà exporté par `@aureak/api-client`) est ajouté dans le dashboard et les stages sont chargés au montage avec try/finally et console guard.
- AC9 — Aucune migration DB n'est nécessaire — tout repose sur des APIs et types existants.
- AC10 — Tous les nouveaux state setters de loading respectent le pattern try/finally obligatoire.

## Tasks / Subtasks

### Task 1 — Nouvelle API `listTodaySessionsForDashboard`
- [x] Créer le type `TodaySessionRow` dans `@aureak/api-client/src/sessions/sessions.ts` :
  - Champs : `id`, `groupName`, `scheduledAt` (ISO), `status` (SessionStatus), `coachName` (string | null), `coachInitials` (string)
- [x] Implémenter `listTodaySessionsForDashboard()` : sélection `sessions` + `groups(name)` + `session_coaches(coach_id, role)` + profiles via join, filtrée sur `scheduled_at` entre minuit et 23h59 du jour courant, triée par `scheduled_at` ASC, `is_transient=false`, `deleted_at IS NULL`
- [x] Exporter `TodaySessionRow` et `listTodaySessionsForDashboard` depuis `@aureak/api-client/src/index.ts`

### Task 2 — Dashboard : chargement des données nouveaux blocs
- [x] Dans `page.tsx`, ajouter les imports : `listTodaySessionsForDashboard`, `TodaySessionRow` depuis `@aureak/api-client` ; `listStages` depuis `@aureak/api-client` ; `StageWithMeta` depuis `@aureak/types`
- [x] Ajouter states : `todaySessions: TodaySessionRow[]`, `loadingTodaySessions: boolean`, `upcomingStages: StageWithMeta[]`, `loadingStages: boolean`
- [x] Ajouter dans le `useEffect` de chargement initial (ou hook séparé) :
  - Appel `listTodaySessionsForDashboard()` avec try/finally + console guard
  - Appel `listStages({ status: 'all' })` filtré post-fetch sur `startDate >= today && status !== 'annulé'`, trié par date ASC, limité à 5 items, avec try/finally + console guard

### Task 3 — Bloc "Sessions du jour" (colonne gauche)
- [x] Créer le sous-composant inline `SessionsDuJourCard` (voir Dev Notes pour snippet)
- [x] Insérer `<SessionsDuJourCard />` dans la colonne gauche, après le compteur de séances et le bouton "Voir le planning", avant "Urgences & Anomalies"
- [x] Skeleton : 2 blocs `a-skel` h=56 pendant `loadingTodaySessions`
- [x] Badge statut : utiliser `sessionStatusLabel()` et `sessionStatusColor()` helpers locaux (voir Dev Notes)

### Task 4 — Bloc "Performance Sites" : ajout colonne Maîtrise
- [x] Vérifier que la colonne `mastery_rate_pct` du tableau Performance Sites est bien raccordée (AC5 — déjà présent ligne ~2992 dans page.tsx, à confirmer visuellement)
- [x] Si la colonne Maîtrise affichait des `—` systématiques faute de données, documenter comme normal (données calculées en DB)

### Task 5 — Bloc "Prochains événements" (colonne centre)
- [x] Créer le sous-composant inline `ProchainsEvenementsCard` (voir Dev Notes pour snippet)
- [x] Insérer `<ProchainsEvenementsCard />` dans la colonne centre après `{visibleStats.length > 0 && (...)}` (bloc Performance Sites)
- [x] Skeleton : 3 blocs `a-skel` h=48 pendant `loadingStages`

### Task 6 — QA & vérification
- [x] Grep try/finally sur tous les nouveaux state setters
- [x] Grep console guard sur tous les nouveaux console.error
- [x] Vérifier TypeScript : `cd aureak && npx tsc --noEmit`
- [x] Cocher les tasks dans ce fichier
- [x] Mettre `Status: done`

## Dev Notes

### Nouveau type et fonction API — `sessions.ts`

```typescript
// ─── Dashboard "Sessions du jour" (Story 72.1) ─────────────────────────────

export type TodaySessionRow = {
  id          : string
  groupName   : string
  scheduledAt : string        // ISO
  status      : string        // 'planifiée' | 'en_cours' | 'terminée' | 'réalisée' | 'annulée' | 'reportée'
  coachName   : string | null // premier coach assigné
  coachInitials: string       // ex: "JD" depuis coachName
}

export async function listTodaySessionsForDashboard(): Promise<{ data: TodaySessionRow[]; error: unknown }> {
  const now     = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      status,
      groups ( name, is_transient ),
      session_coaches ( coach_id, role, profiles ( display_name ) )
    `)
    .gte('scheduled_at', todayStart)
    .lte('scheduled_at', todayEnd)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  if (error) return { data: [], error }

  const rows: TodaySessionRow[] = (data ?? [])
    .filter((row: Record<string, unknown>) => {
      const g = row['groups'] as { is_transient?: boolean } | null
      return !g?.is_transient
    })
    .map((row: Record<string, unknown>) => {
      const group   = row['groups'] as { name?: string } | null
      const coaches = (row['session_coaches'] as Array<{ coach_id: string; role: string; profiles?: { display_name?: string } | null }>) ?? []
      // Premier coach principal, sinon premier assistant
      const principal = coaches.find(c => c.role === 'principal') ?? coaches[0] ?? null
      const coachName = principal?.profiles?.display_name ?? null
      const initials  = coachName
        ? coachName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
        : '?'
      return {
        id           : row['id']           as string,
        groupName    : group?.name         ?? '—',
        scheduledAt  : row['scheduled_at'] as string,
        status       : (row['status']      as string) ?? 'planifiée',
        coachName,
        coachInitials: initials,
      }
    })

  return { data: rows, error: null }
}
```

### Helpers de couleur/label statut — à ajouter dans `page.tsx` (section helpers locaux, après `rateColor`)

```typescript
function sessionStatusLabel(status: string): string {
  const MAP: Record<string, string> = {
    planifiée : 'À VENIR',
    en_cours  : 'EN COURS',
    terminée  : 'CLÔTURÉE',
    réalisée  : 'CLÔTURÉE',
    annulée   : 'ANNULÉE',
    reportée  : 'REPORTÉE',
  }
  return MAP[status] ?? status.toUpperCase()
}

function sessionStatusColor(status: string): string {
  if (status === 'en_cours')              return colors.status.present   // vert
  if (status === 'planifiée')             return colors.status.info      // bleu
  if (status === 'terminée' || status === 'réalisée') return colors.text.muted    // gris
  if (status === 'annulée')               return colors.status.absent    // rouge
  return colors.text.muted
}
```

### Composant "Sessions du jour" — inline dans `page.tsx`

Insérer juste avant le bouton "Voir le planning →" dans la colonne gauche, ou après selon l'ordre voulu. Si la col gauche a déjà un titre de section, ajouter un sous-titre séparé.

```tsx
{/* ── Sessions du jour ── */}
<div style={{ fontSize: 10, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 }}>
  Sessions du jour
</div>

{loadingTodaySessions ? (
  <>
    <div className="a-skel" style={{ height: 56, borderRadius: radius.card, marginBottom: 6 }} />
    <div className="a-skel" style={{ height: 56, borderRadius: radius.card, marginBottom: 6 }} />
  </>
) : todaySessions.length === 0 ? (
  <div style={{
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '12px 14px',
    marginBottom   : 8,
    boxShadow      : shadows.sm,
    border         : `1px solid ${colors.border.light}`,
    fontSize       : 12,
    color          : colors.text.muted,
    fontStyle      : 'italic',
    fontFamily     : 'Geist, sans-serif',
  }}>
    Aucune séance aujourd'hui
  </div>
) : (
  todaySessions.map(session => {
    const isEnCours  = session.status === 'en_cours'
    const statusColor = sessionStatusColor(session.status)
    const formatTime  = (iso: string) =>
      new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })

    return (
      <div
        key={session.id}
        style={{
          backgroundColor: isEnCours ? colors.status.successBg : colors.light.surface,
          borderRadius   : radius.card,
          padding        : '10px 12px',
          marginBottom   : 6,
          boxShadow      : shadows.sm,
          border         : `1px solid ${isEnCours ? colors.status.present + '40' : colors.border.light}`,
          borderLeft     : `3px solid ${isEnCours ? colors.status.present : colors.border.divider}`,
          display        : 'flex',
          alignItems     : 'center',
          gap            : 10,
        }}
      >
        {/* Heure */}
        <div style={{
          fontFamily : 'Geist Mono, monospace',
          fontWeight : 700,
          fontSize   : 14,
          color      : isEnCours ? colors.status.successText : colors.text.dark,
          flexShrink : 0,
          minWidth   : 42,
        }}>
          {formatTime(session.scheduledAt)}
        </div>

        {/* Nom groupe */}
        <div style={{
          fontFamily   : 'Manrope, Montserrat, sans-serif',
          fontWeight   : 700,
          fontSize     : 13,
          color        : colors.text.dark,
          flex         : 1,
          overflow     : 'hidden',
          textOverflow : 'ellipsis',
          whiteSpace   : 'nowrap',
        }}>
          {session.groupName}
        </div>

        {/* Avatar coach */}
        <div style={{
          width          : 24,
          height         : 24,
          borderRadius   : '50%',
          backgroundColor: colors.accent.goldLight + '33',
          border         : `1px solid ${colors.accent.goldLight}`,
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'center',
          fontSize       : 9,
          fontWeight     : 700,
          color          : colors.accent.gold,
          flexShrink     : 0,
          fontFamily     : 'Geist Mono, monospace',
        }}>
          {session.coachInitials}
        </div>

        {/* Badge statut */}
        <div style={{
          backgroundColor: statusColor + '1a',
          border         : `1px solid ${statusColor + '40'}`,
          borderRadius   : radius.badge,
          paddingLeft    : 6,
          paddingRight   : 6,
          paddingTop     : 2,
          paddingBottom  : 2,
          fontSize       : 9,
          fontWeight     : 700,
          color          : statusColor,
          fontFamily     : 'Montserrat, sans-serif',
          letterSpacing  : 0.4,
          flexShrink     : 0,
          whiteSpace     : 'nowrap',
        }}>
          {sessionStatusLabel(session.status)}
        </div>
      </div>
    )
  })
)}
```

### Composant "Prochains événements" — inline dans `page.tsx`

À insérer dans la colonne centre, après le bloc `{visibleStats.length > 0 && (...)}` (Performance Sites).

```tsx
{/* ── Prochains événements ── */}
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : '16px 20px',
}}>
  <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
    Prochains événements
  </div>

  {loadingStages ? (
    <>
      {[0,1,2].map(i => (
        <div key={i} className="a-skel" style={{ height: 48, borderRadius: radius.xs, marginBottom: 8 }} />
      ))}
    </>
  ) : upcomingStages.length === 0 ? (
    <div style={{ fontSize: 12, color: colors.text.muted, fontStyle: 'italic', fontFamily: 'Geist, sans-serif' }}>
      Aucun événement prévu
    </div>
  ) : (
    upcomingStages.map(stage => {
      const d     = new Date(stage.startDate)
      const day   = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')

      return (
        <div
          key={stage.id}
          style={{
            display      : 'flex',
            alignItems   : 'center',
            gap          : 12,
            paddingTop   : 8,
            paddingBottom: 8,
            borderBottom : `1px solid ${colors.border.divider}`,
          }}
        >
          {/* Boîte date gold */}
          <div style={{
            width          : 40,
            height         : 40,
            borderRadius   : radius.xs,
            backgroundColor: colors.accent.gold,
            display        : 'flex',
            flexDirection  : 'column',
            alignItems     : 'center',
            justifyContent : 'center',
            flexShrink     : 0,
            gap            : 0,
          }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 900, fontSize: 15, color: '#FFFFFF', lineHeight: 1.1 }}>
              {day}
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 600, fontSize: 10, color: '#FFFFFF', lineHeight: 1.1, opacity: 0.85 }}>
              /{month}
            </div>
          </div>

          {/* Nom + badge type */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize    : 13,
              fontWeight  : 600,
              color       : colors.text.dark,
              fontFamily  : 'Geist, sans-serif',
              overflow    : 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace  : 'nowrap',
            }}>
              {stage.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <div style={{
                backgroundColor: colors.border.light,
                border         : `1px solid ${colors.border.divider}`,
                borderRadius   : radius.badge,
                paddingLeft    : 6,
                paddingRight   : 6,
                paddingTop     : 1,
                paddingBottom  : 1,
                fontSize       : 9,
                fontWeight     : 700,
                color          : colors.text.muted,
                fontFamily     : 'Montserrat, sans-serif',
                letterSpacing  : 0.5,
              }}>
                STAGE
              </div>
              <div style={{ fontSize: 11, color: colors.text.subtle, fontFamily: 'Geist, sans-serif' }}>
                {stage.participantCount} inscrit{stage.participantCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )
    })
  )}
</div>
```

### Chargement des données dans le `useEffect` principal de `page.tsx`

```typescript
// States à ajouter au composant principal AdminDashboardPage
const [todaySessions,     setTodaySessions]     = useState<TodaySessionRow[]>([])
const [loadingTodaySessions, setLoadingTodaySessions] = useState(true)
const [upcomingStages,    setUpcomingStages]    = useState<StageWithMeta[]>([])
const [loadingStages,     setLoadingStages]     = useState(true)

// Dans le useEffect de chargement (ou un hook dédié) :

// ── Séances du jour ──
setLoadingTodaySessions(true)
try {
  const { data, error } = await listTodaySessionsForDashboard()
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listTodaySessionsForDashboard error:', error)
  } else {
    setTodaySessions(data)
  }
} finally {
  setLoadingTodaySessions(false)
}

// ── Stages à venir ──
setLoadingStages(true)
try {
  const todayIso = new Date().toISOString().slice(0, 10)  // 'YYYY-MM-DD'
  const all = await listStages({ status: 'all' })
  const filtered = all
    .filter(s => s.status !== 'annulé' && s.startDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5)
  setUpcomingStages(filtered)
} catch (err) {
  if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listStages error:', err)
} finally {
  setLoadingStages(false)
}
```

### Imports à ajouter dans `page.tsx`

```typescript
// Lignes import à compléter/ajouter :
import {
  // ... imports existants ...
  listTodaySessionsForDashboard,
  listStages,
} from '@aureak/api-client'
import type {
  // ... types existants ...
  TodaySessionRow,
} from '@aureak/api-client'
import type { StageWithMeta } from '@aureak/types'
```

### Note sur `listStages` — gestion erreur

`listStages` lance (`throw error`) en cas d'erreur Supabase au lieu de retourner `{ error }`. Utiliser un bloc `try/catch/finally` (pas `try/finally`) comme indiqué dans le snippet ci-dessus.

### Positionnement dans la colonne gauche

L'ordre actuel de la colonne gauche dans le rendu (ligne ~2660 à ~2844 de `page.tsx`) :
1. Label "La journée"
2. Bloc séance unique (upcomingSession / loadingUpcoming)  — **remplacer ou compléter par `SessionsDuJourCard`**
3. Bouton "Voir le planning →"
4. Label "Urgences & Anomalies"
5. Liste anomalies

Le bloc "Sessions du jour" remplace ou complète le bloc `upcomingSession` existant (qui n'affiche qu'une seule séance). Si on veut garder la rétro-compatibilité, laisser l'ancien bloc et ajouter le nouveau dessous — mais l'idéal est de remplacer l'ancien bloc par la nouvelle liste complète.

### Colonne centre — Performance Sites (vérification AC5)

Le tableau Performance Sites existe déjà (ligne ~2956). La colonne Maîtrise est déjà raccordée à `mastery_rate_pct` (ligne ~2992). Si les données affichent `—`, c'est normal : la vue SQL calcule la maîtrise depuis les évaluations et peut être vide au départ. Aucune modification de code nécessaire pour AC5 sauf vérification visuelle.

## Dev Agent Record

### Agent Model
claude-sonnet-4-6

### Completion Notes
Story créée le 2026-04-07. Aucune dépendance manquante. Pas de migration DB requise. La story est UI-only + nouvelle fonction API.

### Dependencies
- `@aureak/api-client` : `listNextSessionForDashboard` (existant), `listStages` (existant), nouveau `listTodaySessionsForDashboard` à créer
- `@aureak/types` : `StageWithMeta` (existant), `Stage.startDate` (existant)
- `@aureak/theme` : `colors.status.successBg`, `colors.status.successText`, `colors.status.present`, `colors.status.info`, `colors.accent.gold`, `colors.border.light` (tous existants)
- Pas de migration DB

## File List

### Fichiers à modifier
- `aureak/packages/api-client/src/sessions/sessions.ts` — ajout `TodaySessionRow` + `listTodaySessionsForDashboard`
- `aureak/packages/api-client/src/index.ts` — export `TodaySessionRow` + `listTodaySessionsForDashboard`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — imports, states, useEffect chargement, 3 nouveaux blocs visuels

### Fichiers à lire avant de coder
- `aureak/packages/api-client/src/sessions/sessions.ts` — pour insérer la nouvelle fonction au bon endroit
- `aureak/packages/api-client/src/index.ts` — pour ajouter les exports
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — pour localiser précisément les points d'insertion (col gauche ~L2660, col centre ~L2998)
